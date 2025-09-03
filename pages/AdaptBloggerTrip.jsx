
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BloggerTrip } from '@/api/entities';
import { Trip } from '@/api/entities';
import { User } from '@/api/entities';
import { SystemSettings } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Calendar as CalendarIcon,
  ArrowLeft,
  Plane,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Send,
  ChevronRight,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { TripComponent } from '@/api/entities';
import { useLanguage } from '../components/contexts/LanguageContext';
import { Textarea } from '@/components/ui/textarea';
import { TripItinerary } from '@/api/entities'; // Assuming TripItinerary is defined elsewhere and needed for saving

const LoadingAnimation = ({ message }) => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
    <p className="text-lg text-gray-700">{message}</p>
  </div>
);

function FlightInfoCard({ flightInfo }) {
  const { t } = useLanguage();
  if (!flightInfo?.outbound_flight || !flightInfo?.return_flight) {
    return null;
  }
  const { outbound_flight, return_flight, price } = flightInfo;

  return (
    <Card className="border-solid border-sky-400 shadow-lg">
      <CardHeader>
        <CardTitle>{t('recommendedFlight')}</CardTitle>
        <CardDescription>{t('flightChosenByAI')}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="font-semibold">{t('outboundFlight')}</p>
          <p>{outbound_flight.airline} - {t('flight')} {outbound_flight.flight_number}</p>
          <p>
            <span className="font-medium">{outbound_flight.departure_time} &rarr; {outbound_flight.arrival_time}</span>
          </p>
          <p className="text-xs text-gray-500">{outbound_flight.date ? format(new Date(outbound_flight.date), 'EEEE, dd/MM/yyyy', { locale: he }) : ''}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="font-semibold">{t('returnFlight')}</p>
          <p>{return_flight.airline} - {t('flight')} {return_flight.flight_number}</p>
          <p>
            <span className="font-medium">{return_flight.departure_time} &rarr; {return_flight.arrival_time}</span>
          </p>
           <p className="text-xs text-gray-500">{return_flight.date ? format(new Date(return_flight.date), 'EEEE, dd/MM/yyyy', { locale: he }) : ''}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const ReviewChangesCard = ({ originalTrip, adaptedItinerary, flightInfo, onConfirm, onBack, setAdaptedItinerary }) => {
  const { t } = useLanguage();
  const [activityFeedback, setActivityFeedback] = useState({});
  const [dislikeChat, setDislikeChat] = useState({
    open: false,
    key: null,
    dayNumber: null,
    activityIndex: null,
    activity: null,
    messages: [],
    responding: false,
    input: '',
    alternatives: [],
    waitingForSelection: false // New state for controlling UI after alternatives are presented
  });

  const handleActivityFeedback = (dayNumber, activityIndex, feedback) => {
    const key = `${dayNumber}-${activityIndex}`;
    const currentFeedback = activityFeedback[key];

    if (currentFeedback === feedback) {
      const newFeedback = { ...activityFeedback };
      delete newFeedback[key];
      setActivityFeedback(newFeedback);
      if (feedback === 'disliked') {
        setDislikeChat(prev => ({ ...prev, open: false }));
      }
    } else {
      setActivityFeedback(prev => ({ ...prev, [key]: feedback }));
      if (feedback === 'disliked') {
        const day = adaptedItinerary.find(d => d.day === dayNumber);
        const activity = day?.activities?.[activityIndex];
        if (activity) {
          setDislikeChat({
            open: true,
            key,
            dayNumber,
            activityIndex,
            activity,
            messages: [{ 
              role: 'assistant', 
              content: `מה לא מתאים לך בפעילות "${activity.title}"? ספר לי מה תרצה במקום זה ואני אמצא לך חלופות!` 
            }],
            responding: false,
            input: '',
            alternatives: [],
            waitingForSelection: false
          });
        }
      } else {
        if (dislikeChat.key === key) {
          setDislikeChat(prev => ({ ...prev, open: false }));
        }
      }
    }
  };

  const handleDislikeChatSubmit = async () => {
    if (!dislikeChat.input.trim() || dislikeChat.responding || !dislikeChat.activity) return;

    const userMessage = { role: 'user', content: dislikeChat.input };
    const updatedMessages = [...dislikeChat.messages, userMessage];

    setDislikeChat(prev => ({ ...prev, messages: updatedMessages, responding: true, input: '' }));

    try {
      const userInput = userMessage.content.toLowerCase();
      
      // בדיקה אם זו שאלה או בקשה לשינוי
      const isQuestion = userInput.includes("למה") || 
                        userInput.includes("מה החלפת") || 
                        userInput.includes("מה השתנה") || 
                        userInput.includes("איך") || 
                        userInput.includes("מדוע") || 
                        userInput.includes("?") ||
                        userInput.includes("תסביר") || // Added per outline
                        userInput.includes("why") ||
                        userInput.includes("what changed") ||
                        userInput.includes("how") ||
                        userInput.includes("explain"); // Added per outline

      if (isQuestion) {
        // שאלה - תן תשובה בלבד
        const explanationPrompt = `
          המשתמש שואל שאלה על פעילות בטיול: "${userMessage.content}"
          
          הפעילות שעליה הוא שואל:
          - כותרת: ${dislikeChat.activity.title}
          - תיאור: ${dislikeChat.activity.description}
          - מיקום: ${dislikeChat.activity.location}
          - זמן: ${dislikeChat.activity.time}
          
          תן תשובה מסבירה וידידותית לשאלה שלו. אל תציע שינויים או חלופות - רק תענה על השאלה.
        `;

        const response = await InvokeLLM({
          prompt: explanationPrompt,
          add_context_from_internet: false
        });

        const aiResponseMessage = { role: 'assistant', content: response };
        setDislikeChat(prev => ({
          ...prev,
          messages: [...updatedMessages, aiResponseMessage],
          responding: false,
          waitingForSelection: false // Keep input field available
        }));
        return;
      }

      // בקשה לשינוי - הצע חלופות אבל אל תשנה עדיין
      const fullItineraryString = JSON.stringify(adaptedItinerary, null, 2);

      const prompt = `
        אתה מומחה טיולים. משתמש מתאים טיול של בלוגר ל${originalTrip.destination} ורוצה לשנות פעילות מסוימת.

        הפעילות שרוצה לשנות:
        - כותרת: ${dislikeChat.activity.title}
        - תיאור: ${dislikeChat.activity.description}
        - מיקום: ${dislikeChat.activity.location}
        - קטגוריה: ${dislikeChat.activity.category}
        - זמן: ${dislikeChat.activity.time}

        מה המשתמש רוצה במקום: "${userMessage.content}"

        **איסור מוחלט:** אל תציע פעילות שכבר קיימת במסלול הבא:
        ---
        ${fullItineraryString}
        ---

        אנא הצע 3 חלופות מגוונות וספציפיות באותו אזור ובאותו זמן בערך. לכל חלופה, ספק אובייקט JSON מלא.

        קריטי: החזר רק אובייקט JSON עם מפתח יחיד "alternatives".
      `;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            alternatives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  category: { type: "string" },
                  price_estimate: { type: "number" }
                },
                required: ["title", "description", "location", "category"] // 'time' removed from required per outline
              }
            }
          },
          required: ["alternatives"]
        },
        add_context_from_internet: true
      });

      const aiResponseMessage = { 
        role: 'assistant', 
        content: 'הנה כמה חלופות שמצאתי. בחר את המתאימה לך ביותר:' // Changed message per outline
      };
      
      setDislikeChat(prev => ({
        ...prev,
        messages: [...updatedMessages, aiResponseMessage],
        responding: false,
        alternatives: response.alternatives || [],
        waitingForSelection: true
      }));

    } catch (err) {
      console.error("Error in dislike chat:", err);
      const errorMessage = { 
        role: 'assistant', 
        content: 'אופס, התקשיתי למצוא חלופות. אפשר לנסות שוב?' // Changed message per outline
      };
      setDislikeChat(prev => ({ 
        ...prev, 
        messages: [...updatedMessages, errorMessage], 
        responding: false,
        waitingForSelection: false 
      }));
    }
  };

  const handleAlternativeSelect = (alternative) => {
    // עדכון המסלול המקומי (בלי לשמור למסד נתונים עדיין)
    const updatedItinerary = adaptedItinerary.map(day => {
      if (day.day === dislikeChat.dayNumber) {
        const newActivities = [...day.activities];
        newActivities[dislikeChat.activityIndex] = alternative;
        return { ...day, activities: newActivities };
      }
      return day;
    });

    setAdaptedItinerary(updatedItinerary);

    // איפוס מצב הצ'אט
    setDislikeChat({
      open: false,
      key: null,
      dayNumber: null,
      activityIndex: null,
      activity: null,
      messages: [],
      responding: false,
      input: '',
      alternatives: [],
      waitingForSelection: false
    });

    // הסרת הפידבק
    const newFeedback = { ...activityFeedback };
    delete newFeedback[dislikeChat.key];
    setActivityFeedback(newFeedback);
  };

  return (
    <>
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            {t('reviewChanges')}
          </CardTitle>
          <CardDescription>
            {t('itineraryAdaptedToFlights')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {flightInfo && ( // Keep the conditional rendering for flightInfo
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">{t('outboundFlight')}</h4>
                <div className="flex items-center gap-2 text-blue-700">
                  <Plane className="w-4 h-4" />
                  <span>{flightInfo.outbound_flight.airline}</span>
                  <span>{flightInfo.outbound_flight.departure_time} - {flightInfo.outbound_flight.arrival_time}</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">{flightInfo.outbound_flight.date ? format(new Date(flightInfo.outbound_flight.date), 'dd/MM/yyyy', { locale: he }) : ''}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">{t('returnFlight')}</h4>
                <div className="flex items-center gap-2 text-purple-700">
                  <Plane className="w-4 h-4" />
                  <span>{flightInfo.return_flight.airline}</span>
                  <span>{flightInfo.return_flight.departure_time} - {flightInfo.return_flight.arrival_time}</span>
                </div>
                <p className="text-sm text-purple-600 mt-1">{flightInfo.return_flight.date ? format(new Date(flightInfo.return_flight.date), 'dd/MM/yyyy', { locale: he }) : ''}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {(adaptedItinerary || []).map((day) => (
              <div key={day.day} className="border rounded-lg p-4 bg-white">
                <h3 className="font-semibold mb-3 text-gray-900">
                  {t('day')} {day.day} - {day.date ? format(new Date(day.date), 'dd/MM/yyyy', { locale: he }) : ''}
                </h3>
                <div className="space-y-2">
                  {(day.activities || []).map((activity, activityIndex) => (
                    <div key={activityIndex} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <span className="font-medium text-blue-600 min-w-[3rem]">{activity.time}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            {activity.location && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span>{activity.location}</span>
                              </div>
                            )}
                            {activity.price_estimate && (
                              <Badge variant="outline" className="mt-2">
                                {activity.category === 'restaurant' ? `~` : ''}${activity.price_estimate} {activity.category === 'restaurant' ? 'לאדם' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-8 w-8 p-0 rounded-full ${activityFeedback[`${day.day}-${activityIndex}`] === 'liked' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          onClick={() => handleActivityFeedback(day.day, activityIndex, 'liked')}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-8 w-8 p-0 rounded-full ${activityFeedback[`${day.day}-${activityIndex}`] === 'disliked' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                          onClick={() => handleActivityFeedback(day.day, activityIndex, 'disliked')}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToPreviousStep')}
            </Button>
            <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
              {t('confirmAndSaveTrip')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dislikeChat.open} onOpenChange={(open) => setDislikeChat(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>שינוי פעילות: {dislikeChat.activity?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {dislikeChat.messages.map((msg, i) => (
                <div key={i} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 text-right ml-auto' : 'bg-gray-100 mr-auto'} max-w-[85%]`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
              {dislikeChat.responding && (
                <div className="flex justify-center p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>

            {dislikeChat.alternatives.length > 0 && dislikeChat.waitingForSelection && ( // Changed condition per outline's intent
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">בחר חלופה:</h4> {/* Added header back */}
                  {dislikeChat.alternatives.map((alt, i) => (
                    <Card key={i} className="p-3 hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleAlternativeSelect(alt)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-800">{alt.title}</p>
                          <p className="text-xs text-gray-500">{alt.description}</p>
                          {alt.location && ( // Added location display
                            <p className="text-xs text-gray-400 mt-1">📍 {alt.location}</p>
                          )}
                          {alt.time && ( // Added time display
                            <p className="text-xs text-gray-400 mt-1">🕒 {alt.time}</p>
                          )}
                          {alt.price_estimate && ( // Added price estimate display
                            <p className="text-xs text-gray-400 mt-1">₪{alt.price_estimate}</p>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          בחר <ChevronRight className="w-4 h-4"/>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

            {!dislikeChat.waitingForSelection && dislikeChat.alternatives.length === 0 && ( // Changed condition for input display
              <div className="flex gap-2 items-center pt-2">
                <Textarea
                  placeholder="ספר לי מה לא מתאים או מה תרצה במקום..." // Changed placeholder
                  value={dislikeChat.input}
                  onChange={(e) => setDislikeChat(prev => ({ ...prev, input: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleDislikeChatSubmit()}
                  disabled={dislikeChat.responding} // Added disabled attribute
                  className="flex-1 text-sm resize-none" // Changed classname
                  rows={2}
                />
                <Button onClick={handleDislikeChatSubmit} disabled={dislikeChat.responding || !dislikeChat.input.trim()}>
                  {dislikeChat.responding ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />} {/* Added Loader2 */}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};


export default function AdaptBloggerTripPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('id');

  const [stage, setStage] = useState('loading'); // form, loading, review, saving, error
  const [loadingMessage, setLoadingMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [originalTrip, setOriginalTrip] = useState(null);
  const [adaptedItinerary, setAdaptedItinerary] = useState([]);
  const [flightInfo, setFlightInfo] = useState(null);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [adapting, setAdapting] = useState(false);

  const [formData, setFormData] = useState({
    start_date: null,
    num_adults: 2,
    num_children: 0,
    children_ages: [],
    special_requests: '',
  });

  useEffect(() => {
    const loadTrip = async () => {
      setLoadingMessage(t('loadingTripDataOrNotFound'));
      if (!tripId) {
        setError(t('missingTripId'));
        setStage('error');
        return;
      }
      try {
        const tripData = await BloggerTrip.get(tripId);
        if (!tripData) {
          setError(t('originalTripNotFound'));
          setStage('error');
        } else {
          setOriginalTrip(tripData);
          setFormData(prev => ({
            ...prev,
            num_adults: tripData.default_adults || 2,
            num_children: tripData.default_children || 0,
            children_ages: Array(tripData.default_children || 0).fill(8)
          }));
          setStage('form');
        }
      } catch (err) {
        setError(t('errorLoadingOriginalTrip') + err.message);
        setStage('error');
      }
    };
    loadTrip();
  }, [tripId, t]);

  const handleAdaptTrip = async () => {
    setFormError(null);
    if (!formData.start_date || formData.num_adults < 1) {
        setFormError(t('fillAllRequiredFields'));
        return;
    }

    const calculatedEndDate = addDays(new Date(formData.start_date), originalTrip.duration - 1);

    setAdapting(true);
    setLoadingMessage(t('preparingTrip'));
    setProgress(0);
    setStage('loading');

    try {
        const settings = await SystemSettings.list();

        setLoadingMessage(t('findingSuitableFlight'));
        setProgress(25);

        let promptFlight = settings[0]?.bloggerTripAdaptationPrompt_flight || `
          You are a travel agent AI. Find the best flight for the user.
          **User Request:**
          - Destination: {destination}
          - Dates: {start_date} to {end_date}
          - People: {adults} adults, {children} children.
          - Children Ages: {children_ages}
          
          **Blogger's original schedule (for reference, try to match times loosely):**
          - Approx Arrival Time: {blogger_arrival_time}
          - Approx Departure Time: {blogger_departure_time}

          **Instructions:**
          1. Find a REAL flight from a major airline (e.g., El Al, Wizz Air, Ryanair).
          2. Provide realistic flight numbers, times, and prices.
          3. The price should be per person for the round trip.
          4. Return ONLY a valid JSON object with the structure: { "outbound_flight": { ... }, "return_flight": { ... }, "price": ... }.
             The flight objects must contain: airline, flight_number, departure_time, arrival_time, date.
        `;
        
        const firstDayActivities = originalTrip.itinerary?.find(d => d.day === 1)?.activities || [];
        const lastDayActivities = originalTrip.itinerary?.find(d => d.day === originalTrip.duration)?.activities || [];
        const bloggerArrivalTime = firstDayActivities[0]?.time || '12:00';
        const bloggerDepartureTime = lastDayActivities[lastDayActivities.length - 1]?.time || '18:00';

        promptFlight = promptFlight
          .replace('{destination}', originalTrip.destination)
          .replace('{start_date}', format(formData.start_date, 'yyyy-MM-dd'))
          .replace('{end_date}', format(calculatedEndDate, 'yyyy-MM-dd'))
          .replace('{adults}', formData.num_adults)
          .replace('{children}', formData.num_children)
          .replace('{children_ages}', formData.children_ages.join(', '))
          .replace('{blogger_arrival_time}', bloggerArrivalTime)
          .replace('{blogger_departure_time}', bloggerDepartureTime);

        const flightResponse = await InvokeLLM({
            prompt: promptFlight,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                  outbound_flight: { type: "object" },
                  return_flight: { type: "object" },
                  price: { type: "number" }
                },
                required: ["outbound_flight", "return_flight", "price"]
            }
        });
        setFlightInfo(flightResponse);
        setProgress(50);
        setLoadingMessage(t('adaptingItineraryToFlightTimes'));

        let promptAdapt = settings[0]?.bloggerTripAdaptationPrompt_alternatives || `
        You are a helpful travel assistant AI. You are adapting a blogger's trip itinerary to new flight times.
        
        **Instructions:**
        - Review the original itinerary and the new flight times.
        - Adjust the itinerary ONLY if absolutely necessary due to flight times.
        - If the new arrival/departure time clashes significantly with the first/last day's activities, move, shorten, or remove activities as needed.
        - Prioritize keeping the original spirit and activities of the blogger's trip.
        - For days not affected by flight changes, return them as they are.
        
        **Context:**
        - New Trip Arrival Date: {arrival_date}
        - New Trip Arrival Time: {new_arrival_time}
        - New Trip Departure Date: {departure_date}
        - New Trip Departure Time: {new_departure_time}
        - Original Blogger Trip Arrival Time: {original_arrival_time}
        - Original Blogger Trip Departure Time: {original_departure_time}
        
        **Original Itinerary:**
        {original_itinerary}
        
        **Response Format (JSON):**
        - \`needs_changes\`: boolean (true if any day's activities were modified, false otherwise)
        - \`reason\`: string (brief explanation if changes were made, or "No changes needed" if not)
        - \`modified_days\`: array of day objects (only include days that were modified. If no changes, this array will be empty.)
            - Each day object in \`modified_days\` must have: \`day\` (number), \`date\` (string, YYYY-MM-DD), and \`activities\` (array of activity objects).
            - Each activity object must have: \`time\` (string), \`title\` (string), \`description\` (string), \`location\` (string), \`category\` (string), \`price_estimate\` (number, optional).
        `;
        
        promptAdapt = promptAdapt
          .replace('{new_arrival_time}', flightResponse.outbound_flight.arrival_time)
          .replace('{arrival_date}', flightResponse.outbound_flight.date)
          .replace('{new_departure_time}', flightResponse.return_flight.departure_time)
          .replace('{departure_date}', flightResponse.return_flight.date)
          .replace('{original_arrival_time}', bloggerArrivalTime)
          .replace('{original_departure_time}', bloggerDepartureTime)
          .replace('{original_itinerary}', JSON.stringify(originalTrip.itinerary, null, 2));

        const adaptResponse = await InvokeLLM({
          prompt: promptAdapt,
          response_json_schema: {
            type: "object",
            properties: {
              needs_changes: { type: "boolean" },
              reason: { type: "string" },
              modified_days: { type: "array" }
            },
            required: ["needs_changes", "modified_days"]
          }
        });
        
        setProgress(75);
        let finalItinerary = [...originalTrip.itinerary];
        if (adaptResponse.needs_changes) {
            adaptResponse.modified_days.forEach(modifiedDay => {
                const index = finalItinerary.findIndex(d => d.day === modifiedDay.day);
                if (index !== -1) {
                    finalItinerary[index] = modifiedDay;
                }
            });
        }
        setAdaptedItinerary(finalItinerary);
        setStage('review');

    } catch (err) {
        console.error("Failed to adapt trip:", err);
        setError(err.message || t('adaptationFailed'));
        setStage('error');
    } finally {
        setAdapting(false);
    }
  };

  const handleSaveTrip = async () => {
    setStage('saving');
    setLoadingMessage(t('savingYourAdaptedTrip'));
    try {
        const user = await User.me();
        if (!user) {
            setError(t('userNotLoggedIn'));
            setStage('error');
            return;
        }

        const calculatedEndDate = addDays(new Date(formData.start_date), originalTrip.duration - 1);
        
        const newTrip = await Trip.create({
            title: originalTrip.title,
            description: originalTrip.short_description,
            destination: originalTrip.destination,
            start_date: format(formData.start_date, 'yyyy-MM-dd'),
            end_date: format(calculatedEndDate, 'yyyy-MM-dd'),
            num_adults: formData.num_adults,
            num_children: formData.num_children,
            children_ages: formData.children_ages,
            budget_min: 0, // Not relevant here
            budget_max: 0, // Not relevant here
            trip_type: originalTrip.trip_type.join(', '),
            status: 'draft',
            special_requests: formData.special_requests,
            adapted_from: {
                blogger_trip_id: originalTrip.id,
                blogger_name: "Blogger Name" // Should get from blogger data if available
            },
            cover_image: originalTrip.cover_image,
        });

        if (flightInfo) {
            await TripComponent.create({
                trip_id: newTrip.id,
                type: 'flight',
                title: t('roundTripFlightWithAirline', { airline: flightInfo.outbound_flight.airline }),
                description: t('flightChosenByAI'),
                price: flightInfo.price,
                metadata: {
                    outbound: flightInfo.outbound_flight,
                    return: flightInfo.return_flight,
                }
            });
        }

        const itineraryPromises = adaptedItinerary.map(day => 
            TripItinerary.create({
                trip_id: newTrip.id,
                day_number: day.day,
                date: day.date,
                activities: day.activities
            })
        );
        await Promise.all(itineraryPromises);

        // Assuming `createPageUrl` is defined elsewhere or should be `navigate`
        navigate(`/trip/${newTrip.id}`); // Corrected navigation path

    } catch (err) {
        console.error("Error saving trip:", err);
        setError(t('errorSavingTrip') + err.message);
        setStage('error');
    }
  };

  const renderStage = () => {
    if (stage === 'loading' || adapting) {
      return (
        <div className="text-center p-8">
          <LoadingAnimation message={loadingMessage} />
          <p className="text-sm text-gray-500 mt-4">{t('thisMayTakeAFewMoments')}</p>
        </div>
      );
    }
    if (stage === 'error') {
      return (
        <div className="text-center p-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('error')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => setStage('form')} className="mt-4">
                <ArrowLeft className="w-4 h-4 ml-2"/>
                {t('backToForm')}
            </Button>
        </div>
      );
    }

    if (stage === 'review') {
        return (
            <ReviewChangesCard
                originalTrip={originalTrip}
                adaptedItinerary={adaptedItinerary}
                flightInfo={flightInfo}
                onConfirm={handleSaveTrip}
                onBack={() => setStage('form')}
                setAdaptedItinerary={setAdaptedItinerary}
            />
        );
    }

    if (stage === 'form') {
      return (
        <>
        <Card className="mb-6 bg-gray-50">
           <CardContent className="p-4 flex items-center gap-4">
                <img src={originalTrip?.cover_image} alt={originalTrip?.title} className="w-24 h-24 rounded-lg object-cover" />
                <div>
                    <h3 className="font-bold text-lg">{originalTrip?.title}</h3>
                    <p className="text-sm text-gray-600">{originalTrip?.short_description}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{originalTrip?.duration} {t('days')}</Badge>
                        <Badge variant="secondary">{originalTrip?.destination}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('tripPreferences')}</CardTitle>
            <CardDescription>{t('fillDetailsToAdapt')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start_date">{t('startDate')} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(new Date(formData.start_date), "dd/MM/yyyy", { locale: he }) : <span>{t('selectDate')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date ? new Date(formData.start_date) : null}
                      onSelect={(date) => setFormData({...formData, start_date: date})}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={he}
                    />
                  </PopoverContent>
                </Popover>
                {formData.start_date && originalTrip && (
                  <p className="text-xs text-gray-500">
                    {t('tripWillEndOn')}: {format(addDays(new Date(formData.start_date), originalTrip.duration - 1), "dd/MM/yyyy", { locale: he })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="num_adults">{t('numberOfAdults')} *</Label>
                <div className="flex items-center space-x-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={() => setFormData({...formData, num_adults: Math.max(1, formData.num_adults - 1)})}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="num_adults"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.num_adults}
                    onChange={(e) => setFormData({...formData, num_adults: parseInt(e.target.value) || 1})}
                    className="text-center"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={() => setFormData({...formData, num_adults: Math.min(10, formData.num_adults + 1)})}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="num_children">{t('numberOfChildren')}</Label>
                <div className="flex items-center space-x-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      const newCount = Math.max(0, formData.num_children - 1);
                      setFormData(prev => ({
                        ...prev, 
                        num_children: newCount,
                        children_ages: prev.children_ages.slice(0, newCount)
                      }));
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="num_children"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.num_children}
                    onChange={(e) => {
                      const newCount = parseInt(e.target.value) || 0;
                      setFormData(prev => {
                        const newAges = [...prev.children_ages];
                        while (newAges.length < newCount) newAges.push(8);
                        return {
                          ...prev, 
                          num_children: newCount,
                          children_ages: newAges.slice(0, newCount)
                        };
                      });
                    }}
                    className="text-center"
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      const newCount = Math.min(10, formData.num_children + 1);
                      setFormData(prev => ({
                        ...prev, 
                        num_children: newCount,
                        children_ages: [...prev.children_ages, 8].slice(0, newCount)
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {formData.num_children > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('childrenAges')}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {formData.children_ages.map((age, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Label htmlFor={`child_age_${index}`} className="text-sm whitespace-nowrap">{t('child')} {index + 1}:</Label>
                        <Input
                          id={`child_age_${index}`}
                          type="number"
                          min="0"
                          max="17"
                          value={age}
                          onChange={(e) => {
                            const newAges = [...formData.children_ages];
                            newAges[index] = parseInt(e.target.value) || 0;
                            setFormData({...formData, children_ages: newAges});
                          }}
                          className="text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="special_requests">{t('specialRequests')}</Label>
                <Textarea
                    id="special_requests"
                    placeholder={t('specialRequestsPlaceholder')}
                    value={formData.special_requests}
                    onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                />
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('error')}</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleAdaptTrip} disabled={adapting} className="w-full" size="lg">
              {adapting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('adaptTripForMe')}
            </Button>
          </CardContent>
        </Card>
        </>
      );
    }
    
    if (stage === 'saving') {
      return (
        <div className="text-center p-8">
          <LoadingAnimation message={loadingMessage} />
        </div>
      );
    }

    return null;
  };

  if (!originalTrip && stage !== 'loading' && stage !== 'error') {
    return <div className="p-8 text-center text-gray-700">{t('loadingTripDataOrNotFound')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {(stage === 'loading' || stage === 'error' || stage === 'saving') ? ( // Only render these directly
            renderStage()
        ) : ( // All other stages (form, review) render within the Card wrapper
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">{t('adaptTripTitle', { tripTitle: originalTrip?.title || '' })}</CardTitle>
              <CardDescription className="text-center">{t('makeThisTripPerfect')}</CardDescription>
            </CardHeader>
            <CardContent>
              {renderStage()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
