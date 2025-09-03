import { InvokeLLM } from '@/api/integrations';
import { SystemSettings } from '@/api/entities';
import { Trip } from '@/api/entities';
import { TripComponent } from '@/api/entities';
import { TripItinerary } from '@/api/entities';

export class TripPlanner {
  static async planTrip(tripData, chatHistory = []) {
    try {
      // שליפת הגדרות מערכת
      const settings = await SystemSettings.list();
      const systemPrompt = settings[0]?.tripPlannerPrompt || this.getDefaultPrompt();

      // וידוא שיש מספיק מידע
      if (!this.validateTripData(tripData)) {
        throw new Error('חסר מידע חיוני לתכנון הטיול');
      }

      const fullPrompt = `
${systemPrompt}

מידע על הטיול:
יעד: ${tripData.destination}
תאריכים: ${tripData.start_date} עד ${tripData.end_date}
נוסעים: ${tripData.num_adults} מבוגרים, ${tripData.num_children} ילדים
גילאי ילדים: ${tripData.children_ages?.join(', ') || 'אין'}
תקציב: $${tripData.budget_min}-${tripData.budget_max}
סגנון: ${tripData.trip_type}

העדפות נוספות:
${Object.entries(tripData.preferences || {})
  .filter(([_, value]) => value)
  .map(([key]) => `- ${this.getPreferenceLabel(key)}`)
  .join('\n')}

הערות מיוחדות:
${tripData.notes || 'לא צוינו'}

היסטוריית שיחה:
${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

אנא צור תכנית מפורטת ל-${this.calculateDays(tripData)} ימים הכוללת:
1. לוח זמנים יומי מדויק עם שעות
2. פעילויות מותאמות להעדפות וגילאים
3. מסלולים אופטימליים לכל יום
4. המלצות למסעדות מקומיות
5. טיפים והמלצות ספציפיות ליעד

חשוב: כל ההמלצות חייבות להיות ספציפיות ל${tripData.destination} ומותאמות לתקציב שצוין.
`;

      const response = await InvokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            daily_itinerary: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day_number: { type: "integer" },
                  date: { type: "string" },
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
                            address: { type: "string" }
                          }
                        },
                        type: { type: "string" },
                        price_estimate: { type: "number" },
                        duration: { type: "string" },
                        booking_required: { type: "boolean" },
                        alternatives: {
                          type: "array",
                          items: { type: "string" }
                        }
                      },
                      required: ["time", "title", "description"]
                    }
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" }
                  },
                  local_tips: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["day_number", "date", "activities"]
              }
            }
          }
        }
      });

      return await this.saveTripPlan(tripData.id, response);

    } catch (error) {
      console.error('Trip planning error:', error);
      throw new Error('לא ניתן לתכנן את הטיול כרגע. אנא נסה שוב או צור קשר עם התמיכה.');
    }
  }

  static validateTripData(data) {
    const required = ['destination', 'start_date', 'end_date', 'num_adults'];
    return required.every(field => !!data[field]);
  }

  static calculateDays(tripData) {
    const start = new Date(tripData.start_date);
    const end = new Date(tripData.end_date);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  static getPreferenceLabel(key) {
    const labels = {
      include_flights: 'טיסות',
      include_hotels: 'מלונות',
      include_cars: 'השכרת רכב',
      include_activities: 'אטרקציות',
      include_restaurants: 'מסעדות'
    };
    return labels[key] || key;
  }

  static getDefaultPrompt() {
    return `אתה מתכנן טיולים מקצועי עם התמחות ב:
- התאמה אישית לפי העדפות
- תכנון יעיל של זמנים ומרחקים
- המלצות מקומיות אותנטיות
- התחשבות בתקציב וצרכים מיוחדים`;
  }

  static async saveTripPlan(tripId, planData) {
    // שמירת התכנון בבסיס הנתונים
    const trip = await Trip.get(tripId);
    if (!trip) throw new Error('Trip not found');

    // שמירת מסלול יומי
    for (const day of planData.daily_itinerary) {
      await TripItinerary.create({
        trip_id: tripId,
        day_number: day.day_number,
        date: day.date,
        activities: day.activities,
        notes: day.local_tips?.join('\n')
      });
    }

    return planData;
  }
}