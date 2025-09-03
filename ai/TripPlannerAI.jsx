
import { InvokeLLM } from '@/api/integrations';
import { SystemSettings } from '@/api/entities';
import { TripComponent } from '@/api/entities';
import { differenceInDays, addDays, format } from 'date-fns';

async function getSystemPrompt() {
  try {
    const settings = await SystemSettings.list();
    return settings[0]?.planningPrompt || `You are a world-class AI travel planner. 

**CRITICAL MISSION-CRITICAL REQUIREMENTS:**
1. **FIND REAL FLIGHTS FIRST** - You MUST search for and find specific, real flights with actual airlines, times, and prices
2. **PLAN ENTIRE TRIP AROUND FLIGHT TIMES** - Every single day must be planned according to flight arrival/departure times
3. **INCLUDE ALL TRANSPORTATION** - Show every movement between locations as separate activities (walking, taxi, bus, etc.)
4. **HOTEL AS ANCHOR POINTS** - Start and end each day at the hotel (except arrival/departure)
5. **REAL COORDINATES ONLY** - Every location must have precise, real latitude/longitude coordinates`
  } catch {
    return `You are a world-class AI travel planner. 

**CRITICAL MISSION-CRITICAL REQUIREMENTS:**
1. **FIND REAL FLIGHTS FIRST** - You MUST search for and find specific, real flights with actual airlines, times, and prices
2. **PLAN ENTIRE TRIP AROUND FLIGHT TIMES** - Every single day must be planned according to flight arrival/departure times
3. **INCLUDE ALL TRANSPORTATION** - Show every movement between locations as separate activities (walking, taxi, bus, etc.)
4. **HOTEL AS ANCHOR POINTS** - Start and end each day at the hotel (except arrival/departure)
5. **REAL COORDINATES ONLY** - Every location must have precise, real latitude/longitude coordinates`;
  }
}

async function getTripReplanPrompt(originalItinerary = []) {
  try {
    const settings = await SystemSettings.list();
    const basePrompt = settings[0]?.tripReplanPrompt || `You are an expert AI travel planner specializing in replanning trips.

**FLIGHT-FIRST PLANNING:**
When changing flights, you MUST first find the new flight details, then replan ONLY the first and last days around the new flight times.
Preserve middle days exactly as they were in the original itinerary.

**Original Itinerary for Reference:**
${JSON.stringify(originalItinerary, null, 2)}
`;
    return basePrompt;
  } catch {
    return `You are an expert AI travel planner. When changing flights, find the new flight first, then replan only first/last days.`;
  }
}

async function getTripComponents(tripId) {
  if (!tripId) return [];
  try {
    return await TripComponent.filter({ trip_id: tripId });
  } catch (error) {
    console.warn("Could not fetch trip components:", error);
    return [];
  }
}

function extractFlightInfo(tripData, components) {
  const flightComponent = components.find(c => c.type === 'flight');
  if (flightComponent?.metadata?.outbound && flightComponent?.metadata?.return) {
    return {
      arrival_time: flightComponent.metadata.outbound.arrivalTime || "14:00",
      departure_time: flightComponent.metadata.return.departureTime || "19:00",
      arrival_date: flightComponent.metadata.outbound.date || tripData.start_date,
      departure_date: flightComponent.metadata.return.date || tripData.end_date
    };
  }
  return null;
}

function buildUsedItemsList(pastItinerary) {
  const usedItems = {
    restaurants: new Set(),
    attractions: new Set(),
    activities: new Set(),
    locations: new Set()
  };

  pastItinerary.forEach(day => {
    if (day.activities) {
      day.activities.forEach(activity => {
        const title = activity.title?.toLowerCase().trim();
        const locationName = activity.location?.name?.toLowerCase().trim();

        if (title) {
          usedItems.activities.add(title);

          if (activity.category === 'restaurant' ||
              title.includes('מסעדה') ||
              title.includes('ארוחה') ||
              title.includes('אוכל') ||
              title.includes('ארוחת')) {
            usedItems.restaurants.add(title);
          }

          if (activity.category === 'attraction' ||
              activity.category === 'sightseeing' ||
              activity.category === 'museum' ||
              title.includes('מוזיאון') ||
              title.includes('גלריה') ||
              title.includes('אתר') ||
              title.includes('מקדש') ||
              title.includes('טירה')) {
            usedItems.attractions.add(title);
          }
        }

        if (locationName) {
          usedItems.locations.add(locationName);
        }
      });
    }
  });

  return usedItems;
}

function createFlightSearchPrompt(tripData) {
  return `**CRITICAL FLIGHT SEARCH TASK:**

You are a professional travel agent. Your FIRST and MOST IMPORTANT task is to find real, specific flights for this trip.

**Trip Details:**
- Destination: ${tripData.destination}
- Departure Date: ${tripData.start_date}
- Return Date: ${tripData.end_date}
- Travelers: ${tripData.num_adults} adults${tripData.num_children > 0 ? `, ${tripData.num_children} children` : ''}
- Budget: $${tripData.budget_min}-${tripData.budget_max}

**MANDATORY FLIGHT SEARCH REQUIREMENTS:**
1. Search for REAL flights from major airlines (El Al, Arkia, Wizz Air, Ryanair, etc.)
2. Find specific departure and arrival times that make sense
3. Consider the destination and typical flight routes
4. Provide realistic prices based on the route and dates
5. Include flight duration that matches the route

**CRITICAL OUTPUT FORMAT:**
Return ONLY a JSON object with this exact structure:
{
  "outbound_flight": {
    "airline": "Specific airline name",
    "flight_number": "Realistic flight number",
    "departure_time": "HH:MM format",
    "arrival_time": "HH:MM format", 
    "duration": "H:MM format",
    "date": "${tripData.start_date}",
    "price_per_person": realistic_number
  },
  "return_flight": {
    "airline": "Specific airline name", 
    "flight_number": "Realistic flight number",
    "departure_time": "HH:MM format",
    "arrival_time": "HH:MM format",
    "duration": "H:MM format", 
    "date": "${tripData.end_date}",
    "price_per_person": realistic_number
  }
}

**EXAMPLE OF GOOD OUTPUT:**
{
  "outbound_flight": {
    "airline": "El Al",
    "flight_number": "LY395",
    "departure_time": "07:30",
    "arrival_time": "12:45", 
    "duration": "5:15",
    "date": "${tripData.start_date}",
    "price_per_person": 450
  },
  "return_flight": {
    "airline": "El Al",
    "flight_number": "LY396", 
    "departure_time": "19:20",
    "arrival_time": "00:35",
    "duration": "5:15",
    "date": "${tripData.end_date}",
    "price_per_person": 450
  }
}

DO NOT include any explanations or additional text. Return ONLY the JSON object.`;
}

function createContextualDayPrompt({ dayNumber, totalDays, date, tripData, systemPrompt, pastItinerary, chatHistory, flightInfo, isReplanning = false }) {
  const isFirstDay = dayNumber === 1;
  const isLastDay = dayNumber === totalDays;
  const usedItems = buildUsedItemsList(pastItinerary);

  let prompt = systemPrompt;
  prompt += `\n\n**CRITICAL TASK: Plan Day ${dayNumber} of ${totalDays} for ${tripData.destination}**\n`;
  prompt += `**Date: ${date}**\n\n`;

  prompt += `**Trip Details:**\n`;
  prompt += `- Destination: ${tripData.destination}\n`;
  prompt += `- Travelers: ${tripData.num_adults} adults`;
  if (tripData.num_children > 0) {
    prompt += `, ${tripData.num_children} children`;
  }
  prompt += `\n`;
  prompt += `- Trip Style: ${tripData.trip_type}\n`;
  prompt += `- Budget: $${tripData.budget_min} - $${tripData.budget_max}\n\n`;

  // **תיקון קריטי: זמני טיסה מפורטים ומחייבים**
  if (flightInfo) {
    prompt += `**FLIGHT CONSTRAINTS - ABSOLUTELY CRITICAL:**\n`;
    if (isFirstDay) {
      prompt += `- This is DAY 1: Flight arrives at ${flightInfo.arrival_time} on ${flightInfo.arrival_date}\n`;
      prompt += `- **NO ACTIVITIES CAN START BEFORE ${flightInfo.arrival_time}**\n`;
      prompt += `- Account for 1-2 hours after arrival for immigration, baggage, and transport to hotel\n`;
      const arrivalHour = parseInt(flightInfo.arrival_time.split(':')[0]);
      const firstActivityHour = Math.min(arrivalHour + 2, 23);
      prompt += `- **FIRST REAL ACTIVITY CANNOT START BEFORE ${firstActivityHour.toString().padStart(2, '0')}:00**\n`;
      prompt += `- You MUST include transport from airport to hotel as a separate activity\n`;
    }
    if (isLastDay) {
      prompt += `- This is LAST DAY: Flight departs at ${flightInfo.departure_time} on ${flightInfo.departure_date}\n`;
      prompt += `- **ALL ACTIVITIES MUST END AT LEAST 3 HOURS BEFORE DEPARTURE**\n`;
      const departureHour = parseInt(flightInfo.departure_time.split(':')[0]);
      const lastActivityHour = Math.max(departureHour - 3, 0);
      prompt += `- **LAST ACTIVITY MUST END BY ${lastActivityHour.toString().padStart(2, '0')}:00**\n`;
      prompt += `- You MUST include hotel checkout and transport to airport\n`;
    }
    prompt += `\n`;
  }

  if (pastItinerary.length > 0) {
    prompt += `**PREVIOUS DAYS SUMMARY:**\n`;
    pastItinerary.forEach(day => {
      prompt += `Day ${day.day_number}: `;
      const activities = day.activities?.map(a => a.title).join(', ') || 'No activities';
      prompt += `${activities}\n`;
    });
    prompt += `\n`;
  }

  if (usedItems.restaurants.size > 0 || usedItems.attractions.size > 0) {
    prompt += `**NEVER REPEAT THESE (ABSOLUTE PROHIBITION):**\n`;
    if (usedItems.restaurants.size > 0) {
      prompt += `- Restaurants: ${Array.from(usedItems.restaurants).join(', ')}\n`;
    }
    if (usedItems.attractions.size > 0) {
      prompt += `- Attractions: ${Array.from(usedItems.attractions).join(', ')}\n`;
    }
    prompt += `\n`;
  }

  prompt += `**CRITICAL PLANNING REQUIREMENTS - FOLLOW THESE OR THE PLAN WILL FAIL:**\n`;
  prompt += `1. **CATEGORY IS MANDATORY:** Every single activity object in the 'activities' array MUST have a valid 'category' from this list: ["restaurant", "attraction", "sightseeing", "transport", "hotel", "other"]. Examples: "ארוחת בוקר במלון" must have category: "restaurant". "נסיעה לשדה התעופה" must have category: "transport". "צ'ק-אין במלון" must have category: "hotel". "חזרה למלון" must have category: "transport". THIS IS NOT OPTIONAL.\n`;
  prompt += `2. **REAL, FULL ADDRESS IS MANDATORY:** Every 'location' object must have a real, full, searchable street address in the 'address' field. Do not use generic names. Instead of "The Coffee Shop", find a real one and use its full address like "Strada Lipscani 21, București, Romania". This is essential for the map to work.\n`;
  prompt += `3. **REALISTIC TIMING & TRANSPORT:** Calculate actual travel time between locations and add a separate 'transport' activity for EVERY movement (walking, taxi, bus, metro).\n`;
  prompt += `4. **HOTEL ANCHORING:** Start and end each day at the hotel (except for arrival/departure days).\n`;
  prompt += `5. **NO REPETITION:** Never repeat restaurants or attractions from previous days.\n`;

  if (isFirstDay || isReplanning) {
    prompt += `6. **HOTEL RECOMMENDATION:** Find and recommend a specific, real hotel with an exact, full address and coordinates.\n`;
  }

  prompt += `\n**CRITICAL OUTPUT REQUIREMENT: YOUR ENTIRE RESPONSE MUST BE A SINGLE, VALID JSON OBJECT. NO INTRODUCTIONS, EXPLANATIONS, OR EXTRA TEXT. START WITH { AND END WITH }.**\n`;
  prompt += `The JSON object must have this exact structure:\n`;
  prompt += `{\n`;
  prompt += `  "activities": [\n`;
  prompt += `    {\n`;
  prompt += `      "time": "HH:MM",\n`;
  prompt += `      "title": "Specific Activity Name",\n`;
  prompt += `      "description": "Detailed description",\n`;
  prompt += `      "location": {\n`;
  prompt += `        "name": "Exact Location Name",\n`;
  prompt += `        "address": "Full Address",\n`;
  prompt += `        "latitude": 45.1234,\n`;
  prompt += `        "longitude": 9.5678\n`;
  prompt += `      },\n`;
  prompt += `      "category": "restaurant|attraction|sightseeing|transport|hotel|other",\n`;
  prompt += `      "price_estimate": number\n`;
  prompt += `    }\n`;
  prompt += `  ]\n`;
  prompt += `}\n`;

  return prompt;
}

function parseAIResponse(response, dayNumber) {
  if (!response) {
    throw new Error(`AI returned empty response for day ${dayNumber}`);
  }

  // If the response is already a parsed object from response_json_schema, just validate it
  if (typeof response === 'object') {
    if (response.activities && Array.isArray(response.activities)) {
      return response;
    }
     // If it's an object but not in the right shape, something is wrong
    throw new Error(`AI response is an object, but not in the expected format for day ${dayNumber}. Received: ${JSON.stringify(response)}`);
  }

  // Fallback for string-based responses
  let rawContent = String(response);

  try {
    const trimmedContent = rawContent.trim();
    let jsonString = '';

    const jsonBlockMatch = trimmedContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      jsonString = jsonBlockMatch[1].trim();
    } else {
      const jsonStart = trimmedContent.indexOf('{');
      const jsonEnd = trimmedContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = trimmedContent.substring(jsonStart, jsonEnd + 1);
      } else {
        throw new Error(`Could not find parsable JSON in response for day ${dayNumber}`);
      }
    }

    const parsed = JSON.parse(jsonString);

    if (!parsed.activities || !Array.isArray(parsed.activities)) {
      throw new Error(`Missing 'activities' array in AI response for day ${dayNumber}`);
    }

    return parsed;
  } catch (e) {
    console.error(`Error parsing AI response for day ${dayNumber}:`, e);
    console.error(`Raw response:`, response);
    throw e;
  }
}

function createFallbackDay(dayNumber, date, tripData) {
  return {
    day_number: dayNumber,
    date: date,
    activities: [
      {
        time: "09:00",
        title: `יום חופשי ב${tripData.destination}`,
        description: "יום פתוח לחקירה עצמאית",
        location: {
          name: "מרכז העיר",
          address: `${tripData.destination}`
        },
        category: "other",
        price_estimate: 0
      }
    ]
  };
}

// **התיקון הקריטי - פונקציה חדשה לחיפוש טיסות תחילה**
async function searchAndCreateFlightComponent(tripData) {
  console.log("🛫 CRITICAL: Searching for real flights first...");
  
  try {
    const flightSearchPrompt = createFlightSearchPrompt(tripData);
    
    const flightResponse = await InvokeLLM({
      prompt: flightSearchPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          outbound_flight: {
            type: "object",
            properties: {
              airline: { type: "string" },
              flight_number: { type: "string" },
              departure_time: { type: "string" },
              arrival_time: { type: "string" },
              duration: { type: "string" },
              date: { type: "string" },
              price_per_person: { type: "number" }
            },
            required: ["airline", "departure_time", "arrival_time", "date"]
          },
          return_flight: {
            type: "object",
            properties: {
              airline: { type: "string" },
              flight_number: { type: "string" },
              departure_time: { type: "string" },
              arrival_time: { type: "string" },
              duration: { type: "string" },
              date: { type: "string" },
              price_per_person: { type: "number" }
            },
            required: ["airline", "departure_time", "arrival_time", "date"]
          }
        },
        required: ["outbound_flight", "return_flight"]
      }
    });

    if (!flightResponse?.outbound_flight || !flightResponse?.return_flight) {
      throw new Error("AI failed to find flights");
    }

    console.log("✅ Found flights:", flightResponse);

    // יצירת רכיב הטיסה במסד הנתונים
    const flightComponent = await TripComponent.create({
      trip_id: tripData.id,
      type: 'flight',
      title: `טיסות ${flightResponse.outbound_flight.airline}`,
      description: `טיסת הלוך ושוב עם ${flightResponse.outbound_flight.airline}`,
      price: (flightResponse.outbound_flight.price_per_person + flightResponse.return_flight.price_per_person),
      metadata: {
        outbound: {
          airline: flightResponse.outbound_flight.airline,
          flight_number: flightResponse.outbound_flight.flight_number,
          departureTime: flightResponse.outbound_flight.departure_time,
          arrivalTime: flightResponse.outbound_flight.arrival_time,
          duration: flightResponse.outbound_flight.duration,
          date: flightResponse.outbound_flight.date
        },
        return: {
          airline: flightResponse.return_flight.airline,
          flight_number: flightResponse.return_flight.flight_number,
          departureTime: flightResponse.return_flight.departure_time,
          arrivalTime: flightResponse.return_flight.arrival_time,
          duration: flightResponse.return_flight.duration,
          date: flightResponse.return_flight.date
        }
      }
    });

    return {
      arrival_time: flightResponse.outbound_flight.arrival_time,
      departure_time: flightResponse.return_flight.departure_time,
      arrival_date: flightResponse.outbound_flight.date,
      departure_date: flightResponse.return_flight.date
    };

  } catch (error) {
    console.error("❌ Flight search failed:", error);
    // יצירת טיסה ברירת מחדל
    await TripComponent.create({
      trip_id: tripData.id,
      type: 'flight',
      title: 'טיסה מומלצת',
      description: 'טיסה ישירה',
      price: 450,
      metadata: {
        outbound: { airline: "אל על", departureTime: "10:30", arrivalTime: "15:45", duration: "5:15", date: tripData.start_date },
        return: { airline: "אל על", departureTime: "18:00", arrivalTime: "23:15", duration: "5:15", date: tripData.end_date }
      }
    });

    return {
      arrival_time: "15:45",
      departure_time: "18:00", 
      arrival_date: tripData.start_date,
      departure_date: tripData.end_date
    };
  }
}

// --- Main Exported Function ---
export async function generateTripPlan(tripData, chatHistory = [], startDay = 1, pastItinerary = [], originalItinerary = [], endDay = null) {
  const fullItinerary = [...pastItinerary];
  const isReplanning = startDay > 1 || originalItinerary.length > 0;
  const systemPrompt = isReplanning ? await getTripReplanPrompt(originalItinerary) : await getSystemPrompt();
  
  const startDate = new Date(tripData.start_date);
  const endDate = new Date(tripData.end_date);
  const totalDays = differenceInDays(endDate, startDate) + 1;

  const lastDayToPlan = endDay ? Math.min(endDay, totalDays) : totalDays;

  console.log(`🚀 Starting trip planning. Total days: ${totalDays}. Planning from day ${startDay} to ${lastDayToPlan}.`);

  // **תיקון קריטי: חיפוש טיסות ראשון**
  let flightInfo = null;
  
  if (!isReplanning) {
    // תכנון חדש - חפש טיסות קודם
    console.log("🛫 NEW TRIP: Searching for flights FIRST...");
    flightInfo = await searchAndCreateFlightComponent(tripData);
    console.log("✅ Flight info obtained:", flightInfo);
  } else {
    // תכנון מחדש - קבל את הטיסות הקיימות
    const tripComponents = await getTripComponents(tripData.id);
    flightInfo = extractFlightInfo(tripData, tripComponents);
    console.log("♻️ REPLANNING: Using existing flight info:", flightInfo);
  }

  // תכנון כל יום לפי זמני הטיסה
  for (let i = startDay; i <= lastDayToPlan; i++) {
    const currentDate = addDays(startDate, i - 1);
    const dayDateStr = format(currentDate, 'yyyy-MM-dd');

    console.log(`📅 Planning Day ${i}/${totalDays} with flight constraints...`);

    try {
      const contextualPrompt = createContextualDayPrompt({
        dayNumber: i,
        totalDays,
        date: dayDateStr,
        tripData,
        systemPrompt,
        pastItinerary: fullItinerary,
        chatHistory,
        flightInfo, // **זה הקריטי - העברת זמני הטיסה**
        isReplanning: i === startDay && isReplanning,
      });

      // **התיקון המרכזי: הוספת response_json_schema כדי להכריח את ה-AI להחזיר JSON**
      const response = await InvokeLLM({
        prompt: contextualPrompt,
        add_context_from_internet: true,
        response_json_schema: {
            type: "object",
            properties: {
                activities: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            time: { type: "string" },
                            title: { type: "string" },
                            description: { type: "string" },
                            location: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    address: { type: "string" },
                                    latitude: { type: "number" },
                                    longitude: { type: "number" }
                                },
                                required: ["name", "address", "latitude", "longitude"]
                            },
                            category: { type: "string", "enum": ["restaurant", "attraction", "sightseeing", "transport", "hotel", "other"] },
                            price_estimate: { type: "number" }
                        },
                        required: ["time", "title", "description", "location", "category"]
                    }
                }
            },
            required: ["activities"]
        }
      });

      const dayPlan = parseAIResponse(response, i);

      // טיפול ביצירת רכיב מלון אם נמצא
      if ((i === 1 || (isReplanning && i === startDay)) && dayPlan.activities) {
        const checkInActivity = dayPlan.activities.find(a =>
            a.category?.toLowerCase() === 'hotel' ||
            a.title?.toLowerCase().includes('check-in') ||
            a.title?.toLowerCase().includes('מלון')
        );

        if (checkInActivity && checkInActivity.location?.name && checkInActivity.location?.address) {
          console.log(`🏨 Hotel found: ${checkInActivity.location.name}`);
          try {
            if (isReplanning) {
              const oldHotel = (await getTripComponents(tripData.id)).find(c => c.type === 'hotel');
              if (oldHotel) {
                await TripComponent.delete(oldHotel.id);
              }
            }
            
            await TripComponent.create({
              trip_id: tripData.id,
              type: 'hotel',
              title: checkInActivity.location.name,
              description: checkInActivity.description || `מלון מומלץ ב${tripData.destination}`,
              price: checkInActivity.price_estimate || 150,
              metadata: {
                address: checkInActivity.location.address,
                latitude: checkInActivity.location.latitude,
                longitude: checkInActivity.location.longitude,
                rating: 4.5,
                amenities: ['WiFi', 'ארוחת בוקר']
              },
              image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
            });
          } catch (compError) {
            console.error("Failed to create hotel component:", compError);
          }
        }
      }

      fullItinerary.push({
        day_number: i,
        date: dayDateStr,
        activities: dayPlan.activities || [],
      });

      console.log(`✅ Day ${i} planned with ${dayPlan.activities?.length || 0} activities`);

    } catch (error) {
      console.error(`❌ Failed to plan day ${i}:`, error.message);
      fullItinerary.push(createFallbackDay(i, dayDateStr, tripData));
    }
  }

  const newDays = fullItinerary.filter(day => day.day_number >= startDay && day.day_number <= lastDayToPlan);
  console.log(`🎉 Trip planning completed! Generated ${newDays.length} days based on flight times.`);
  return { daily_itinerary: newDays };
}
