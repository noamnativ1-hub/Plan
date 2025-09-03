
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BloggerTrip } from '@/api/entities';
import { Trip } from '@/api/entities';
import { TripItinerary } from '@/api/entities';
import { TripComponent } from '@/api/entities';
import { User } from '@/api/entities';
import { SystemSettings } from '@/api/entities';
import { UserPreference } from '@/api/entities';
import { Blogger } from '@/api/entities'; // Added import for Blogger entity
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, differenceInDays, addDays } from 'date-fns';
import {
  Plane, Hotel, MapPin, Calendar, Users, Car,
  Utensils, Ticket, Clock, ArrowLeft, MessageSquare,
  Star, Share2, Edit3, Globe, Camera, ThumbsUp, ThumbsDown,
  ChevronLeft, ChevronRight, Sun, Droplet, Coffee, Bed,
  Loader2, AlertTriangle, Check, ShieldCheck, Search, Copy, Send, X, Bot, Sparkles, HelpCircle,
  Briefcase, Euro, Crown, Wand2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { uniqBy } from 'lodash';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Helper function - זהה ל-TripDetails
const getCoordinatesForDestination = async (destinationName, country = '') => {
    if (!destinationName) return null;
    
    console.log(`🔍 Searching coordinates for: "${destinationName}" in ${country || 'any country'}`);
    
    const searchQuery = country ? `${destinationName}, ${country}` : destinationName;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&addressdetails=1`, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'PlanGo Travel App'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Nominatim API HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            console.log(`✅ Found via Nominatim API: "${destinationName}" at [${lat}, ${lon}]`);
            return [parseFloat(lat), parseFloat(lon)];
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn(`⚠️ Nominatim API request for "${destinationName}" timed out.`);
        } else {
            console.warn(`⚠️ Nominatim API failed for "${destinationName}":`, error.message);
        }
    }
    
    const countryDefaults = {
        'רומניה': [44.4268, 26.1025],
        'אוסטריה': [48.2082, 16.3738],
        'סלובקיה': [48.1486, 17.1077],
        'יפן': [35.6762, 139.6503],
        'איטליה': [41.9028, 12.4964],
        'יוון': [37.9755, 23.7348]
    };
    
    for (const countryKey in countryDefaults) {
        if (destinationName.toLowerCase().includes(countryKey.toLowerCase())) {
            console.log(`⚠️ Using country default for "${destinationName}" (inferred: ${countryKey})`);
            return countryDefaults[countryKey];
        }
    }

    if (country && countryDefaults[country]) {
        console.log(`⚠️ Using country default for "${destinationName}" in ${country}`);
        return countryDefaults[country];
    }
    
    console.error(`❌ No coordinates found for: "${destinationName}"`);
    return null;
};

export default function BloggerTripDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('id');

  const [bloggerTrip, setBloggerTrip] = useState(null);
  const [mockTrip, setMockTrip] = useState(null); // Mock trip object מבוסס על BloggerTrip
  const [itinerary, setItinerary] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [user, setUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);

  const [preloadedMaps, setPreloadedMaps] = useState({});
  const [loadingDays, setLoadingDays] = useState({});

  const [showEditChat, setShowEditChat] = useState(false);
  const [showStyleMatchDialog, setShowStyleMatchDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const [activityFeedback, setActivityFeedback] = useState({});

  const [dislikeChat, setDislikeChat] = useState({
    open: false,
    key: null,
    activity: null,
    messages: [],
    responding: false,
    input: '',
    alternatives: []
  });

  const [helpChat, setHelpChat] = useState({
    open: false,
    type: null,
    messages: [],
    responding: false,
    input: '',
    alternatives: []
  });

  const [componentReplaceDialog, setComponentReplaceDialog] = useState({
    open: false,
    type: null,
    options: [],
    loading: false
  });

  const [editChat, setEditChat] = useState({
    messages: [],
    responding: false,
    input: '',
    conversationContext: '',
  });

  const editChatRef = useRef(null);
  const dislikeChatRef = useRef(null);
  const helpChatRef = useRef(null);

  useEffect(() => {
    if (editChatRef.current) {
        editChatRef.current.scrollTop = editChatRef.current.scrollHeight;
    }
  }, [editChat.messages]);

  useEffect(() => {
    if (dislikeChatRef.current) {
        dislikeChatRef.current.scrollTop = dislikeChatRef.current.scrollHeight;
    }
  }, [dislikeChat.messages]);

  useEffect(() => {
    if (helpChatRef.current) {
      helpChatRef.current.scrollTop = helpChatRef.current.scrollHeight;
    }
  }, [helpChat.messages]);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!tripId) {
            setError("Trip ID is missing.");
            setLoading(false);
            return;
        }

        // טוען משתמש
        try {
          const userData = await User.me();
          setUser(userData);
          const prefs = await UserPreference.filter({ user_id: userData.id });
          if (Array.isArray(prefs) && prefs.length > 0) {
            setUserPreferences(prefs[0]);
          }
        } catch (err) {
          console.log('Not logged in or no preferences');
        }

        // 1. טוען את טיול הבלוגר
        const bloggerTripData = await BloggerTrip.get(tripId);
        if (!bloggerTripData) {
            throw new Error('טיול בלוגר לא נמצא');
        }
        
        // FIX: בדיקת תקינות תאריכים
        let startDate = null;
        let endDate = null;
        
        if (bloggerTripData.start_date) {
            startDate = new Date(bloggerTripData.start_date);
            if (isNaN(startDate.getTime())) {
                console.warn('Invalid start_date, using fallback');
                startDate = new Date(); // תאריך נוכחי כחלופה
            }
        } else {
            console.warn('Missing start_date, using current date');
            startDate = new Date();
        }
        
        if (bloggerTripData.end_date) {
            endDate = new Date(bloggerTripData.end_date);
            if (isNaN(endDate.getTime())) {
                console.warn('Invalid end_date, calculating from duration');
                endDate = addDays(startDate, bloggerTripData.duration || 7);
            }
        } else {
            console.warn('Missing end_date, calculating from duration');
            endDate = addDays(startDate, bloggerTripData.duration || 7);
        }

        setBloggerTrip(bloggerTripData);

        // 2. FIX: שימוש בשם הבלוגר מהטיול או ברירת מחדל
        let bloggerName = bloggerTripData.blogger_name || 'בלוגר מומחה';
        
        // רק אם יש blogger_id בטיול - ננסה לטעון את פרטי הבלוגר
        if (bloggerTripData.blogger_id) {
            try {
                const bloggerDetails = await Blogger.get(bloggerTripData.blogger_id);
                if (bloggerDetails && bloggerDetails.name) {
                    bloggerName = bloggerDetails.name;
                }
            } catch (e) {
                console.warn(`Could not load blogger details for id ${bloggerTripData.blogger_id}:`, e);
                // ממשיכים עם השם מהטיול או ברירת המחדל
            }
        }

        // 3. יוצר mock trip object עם תאריכים תקינים
        const mockTripData = {
          id: bloggerTripData.id,
          destination: bloggerTripData.destination || 'יעד לא ידוע',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          num_adults: 2,
          num_children: 0,
          trip_type: Array.isArray(bloggerTripData.trip_type) ? bloggerTripData.trip_type.join(', ') : (bloggerTripData.trip_type || 'טיול'),
          status: 'published',
          title: bloggerTripData.title || 'טיול בלוגר',
          description: bloggerTripData.description || '',
          cover_image: bloggerTripData.cover_image,
          gallery: bloggerTripData.gallery || [],
          blogger_info: {
            name: bloggerName,
            id: bloggerTripData.blogger_id
          }
        };
        setMockTrip(mockTripData);

        // 4. ממיר את מסלול הבלוגר עם בדיקות תקינות
        const mockItinerary = (bloggerTripData.itinerary || []).map((day, index) => ({
          id: `day-${index}`,
          day_number: day.day || (index + 1),
          date: addDays(startDate, index).toISOString().split('T')[0],
          activities: (day.activities || []).map((activity, actIndex) => ({
            id: `activity-${index}-${actIndex}`,
            time: activity.time || '09:00',
            title: activity.title || 'פעילות',
            description: activity.description || '',
            category: activity.category || 'other',
            location: typeof activity.location === 'string' ? 
              { name: activity.location, address: activity.location } : 
              (activity.location || { name: 'מיקום לא ידוע', address: '' }),
            price_estimate: activity.price_estimate || 0
          }))
        }));
        setItinerary(mockItinerary);

        // יוצר mock components
        const mockComponents = [
          {
            id: 'hotel-1',
            type: 'hotel',
            title: 'מלון מומלץ',
            description: 'מלון איכותי המומלץ על ידי הבלוגר',
            price: bloggerTripData.price_from ? (bloggerTripData.price_from * 0.3) : 150,
            metadata: {
              rating: 4.5,
              amenities: ['WiFi', 'ארוחת בוקר', 'בריכה'],
              address: mockTripData.destination
            },
            image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
          },
          // Flight component is removed based on instructions.
          // {
          //   id: 'flight-1',
          //   type: 'flight',
          //   title: 'טיסה מומלצת',
          //   description: 'טיסה ישירה המתאימה לטיול',
          //   price: bloggerTripData.price_from ? (bloggerTripData.price_from * 0.4) : 450,
          //   metadata: {
          //     outbound: { airline: "אל על", departureTime: "10:30", arrivalTime: "15:45", duration: "5:15", date: mockTripData.start_date },
          //     return: { airline: "אל על", departureTime: "18:00", arrivalTime: "23:15", duration: "5:15", date: mockTripData.end_date }
          //   }
          // },
          {
            id: 'car-1',
            type: 'car',
            title: 'השכרת רכב',
            description: 'רכב מומלץ לטיול',
            price: 35,
            metadata: {
              company: 'הרץ',
              model: 'הונדה סיוויק',
              transmission: 'אוטומטית'
            },
            image_url: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=800&q=80'
          }
        ];
        setComponents(mockComponents);

      } catch (err) {
        console.error("Error initializing blogger trip page:", err);
        setError(err.message || 'אירעה שגיאה בטעינת הדף');
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [tripId]);

  // כל הפונקציות זהות ל-TripDetails - רק מעדכנות את mockTrip במקום trip
  const loadDayAndGetMapData = async (dayNumber) => {
      if (!mockTrip || !Array.isArray(itinerary) || itinerary.length === 0) {
          return { locations: [], center: [51.505, -0.09], zoom: 12 };
      }

      const day = itinerary.find(d => d.day_number === dayNumber);
      if (!day || !day.activities || !Array.isArray(day.activities)) {
          let fallbackCenter = [51.505, -0.09];
          if (mockTrip?.destination) {
              const coords = await getCoordinatesForDestination(mockTrip.destination);
              if (coords) fallbackCenter = coords;
          }
          return { locations: [], center: fallbackCenter, zoom: 10 };
      }

      console.log(`🗺️ Loading map data for day ${dayNumber}`);
      const locations = [];
      const tripDestinationCountry = mockTrip?.destination || '';
      const hotelData = Array.isArray(components) ? components.find(c => c.type === 'hotel') : null;

      for (let i = 0; i < day.activities.length; i++) {
        const activity = day.activities[i];
        let coords = null;
        
        if (activity.location?.latitude && activity.location?.longitude) {
            coords = [activity.location.latitude, activity.location.longitude];
        } else {
            coords = await getCoordinatesForDestination(activity.location?.name || activity.title, tripDestinationCountry);
        }

        if (coords) {
            let activityIcon = '📍';
            let backgroundColor = '#8B5CF6';
            const titleLower = (activity.title || '').toLowerCase();
            const categoryLower = (activity.category || '').toLowerCase();
            
            if (categoryLower === 'restaurant' || titleLower.includes('מסעדה') || titleLower.includes('ארוחה') || titleLower.includes('קפה')) {
              activityIcon = '🍽️';
              backgroundColor = '#10B981';
            } else if (categoryLower === 'attraction' || categoryLower === 'sightseeing' || titleLower.includes('מוזיאון') || titleLower.includes('טירה') || titleLower.includes('ארמון') || titleLower.includes('קתדרלה') || titleLower.includes('כנסייה')) {
              activityIcon = '🖼️';
              backgroundColor = '#F59E0B';
            } else if (titleLower.includes('פארק') || titleLower.includes('גן') || titleLower.includes('טבע') || titleLower.includes('הר') || titleLower.includes('אגם')) {
              activityIcon = '🏞️';
              backgroundColor = '#059669';
            } else if (titleLower.includes('קניות') || titleLower.includes('שוק') || titleLower.includes('חנות')) {
              activityIcon = '🛍️';
              backgroundColor = '#DC2626';
            } else if (titleLower.includes('תחבורה') || titleLower.includes('רכבת') || titleLower.includes('אוטובוס') || titleLower.includes('שייט') || titleLower.includes('שדה תעופה')) {
              activityIcon = '🚌';
              backgroundColor = '#7C3AED';
            }
            
            locations.push({ 
              lat: coords[0], 
              lng: coords[1], 
              name: activity.title || 'פעילות', 
              type: 'activity', 
              time: activity.time || '', 
              description: activity.description || '', 
              category: activity.category || 'other', 
              activityNumber: i + 1, 
              icon: activityIcon, 
              backgroundColor: backgroundColor 
            });
        }
      }

      if (hotelData) {
        let hotelCoords = null;
        if (hotelData.metadata?.latitude && hotelData.metadata?.longitude) {
            hotelCoords = [hotelData.metadata.latitude, hotelData.metadata.longitude];
        } else {
            hotelCoords = await getCoordinatesForDestination(hotelData.metadata?.address || hotelData.title, tripDestinationCountry);
        }
        
        if (hotelCoords) {
            locations.push({ 
              lat: hotelCoords[0], 
              lng: hotelCoords[1], 
              name: hotelData.title || 'מלון', 
              type: 'hotel', 
              icon: '🛏️', 
              backgroundColor: '#3B82F6', 
              description: hotelData.description || 'מלון מומלץ' 
            });
        }
      }
      
      let currentDayMapCenter = [51.505, -0.09];
      let currentDayMapZoom = 12;
      if (locations.length > 0) {
        const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
        const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
        currentDayMapCenter = [avgLat, avgLng];
        
        if (locations.length > 1) {
          const lats = locations.map(l => l.lat);
          const lngs = locations.map(l => l.lng);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const latRange = maxLat - minLat;
          const lngRange = maxLng - minLng;

          if (Math.max(latRange, lngRange) < 0.005) {
            currentDayMapZoom = 17;
          } else if (Math.max(latRange, lngRange) < 0.01) {
            currentDayMapZoom = 16;
          } else if (Math.max(latRange, lngRange) < 0.05) {
            currentDayMapZoom = 15;
          } else if (Math.max(latRange, lngRange) < 0.1) {
            currentDayMapZoom = 14;
          } else if (Math.max(latRange, lngRange) < 0.5) {
            currentDayMapZoom = 12;
          } else {
            currentDayMapZoom = 10;
          }
        } else {
          currentDayMapZoom = 14;
        }
      } else if (mockTrip?.destination) {
        const fallbackCoords = await getCoordinatesForDestination(mockTrip.destination);
        if (fallbackCoords) {
            currentDayMapCenter = fallbackCoords;
            currentDayMapZoom = 10;
        }
      }

      console.log(`✅ Day ${dayNumber} loaded with ${locations.length} locations`);
      return { locations, center: currentDayMapCenter, zoom: currentDayMapZoom };
  };

  useEffect(() => {
    const manageLoading = async () => {
        if (!mockTrip || !Array.isArray(itinerary) || itinerary.length === 0) return;

        if (!preloadedMaps[activeDay] && !loadingDays[activeDay]) {
            console.log(`Prioritizing load for active day ${activeDay}`);
            setLoadingDays(prev => ({ ...prev, [activeDay]: true }));
            const dayData = await loadDayAndGetMapData(activeDay);
            setPreloadedMaps(prev => ({ ...prev, [activeDay]: dayData }));
            setLoadingDays(prev => ({ ...prev, [activeDay]: false }));
        }

        const allDays = uniqBy(itinerary, 'day_number').map(d => d.day_number).sort((a, b) => a - b);
        for (const dayNum of allDays) {
            if (!preloadedMaps[dayNum] && !loadingDays[dayNum]) {
                console.log(`Sequential preload triggered for day ${dayNum}`);
                setLoadingDays(prev => ({ ...prev, [dayNum]: true }));
                const dayData = await loadDayAndGetMapData(dayNum);
                setPreloadedMaps(prev => ({ ...prev, [dayNum]: dayData }));
                setLoadingDays(prev => ({ ...prev, [dayNum]: false }));
            }
        }
    };

    const handler = setTimeout(() => {
        manageLoading();
    }, 100);

    return () => clearTimeout(handler);
  }, [mockTrip, itinerary, components, activeDay]);

  // כל הפונקציות האחרות זהות ל-TripDetails
  const handleEditChatSubmit = async () => {
    if (!editChat.input.trim() || editChat.responding) return;

    const userMessage = { role: 'user', content: editChat.input };
    const updatedMessages = [...editChat.messages, userMessage];

    setEditChat(prev => ({ 
        ...prev, 
        messages: updatedMessages, 
        responding: true, 
        input: '',
        conversationContext: prev.conversationContext + `\nUser: ${editChat.input}`
    }));

    const timeoutId = setTimeout(() => {
        const errorMessage = { role: 'assistant', content: 'אני מתנצל, אני מתקשה לעבד את הבקשה כרגע. אנא נסה שוב.' };
        setEditChat(prev => ({ ...updatedMessages, ...prev, messages: [...updatedMessages, errorMessage], responding: false }));
    }, 15000);

    try {
        const currentDays = itinerary?.length || 0;
        const prompt = `
            אתה עוזר תכנון טיולים מתקדם עבור טיול בלוגר. זהו טיול שתוכנן על ידי בלוגר ומוצג למשתמש לעיון. המשתמש יכול לבקש עריכות והתאמות.

            **נתוני הטיול:**
            - יעד נוכחי: ${mockTrip?.destination || 'לא צוין'}
            - תאריכים: ${mockTrip?.start_date || ''} עד ${mockTrip?.end_date || ''}
            - מספר ימים נוכחי: ${currentDays}
            - תכנון מקורי: טיול בלוגר של ${mockTrip?.blogger_info?.name || 'בלוגר'}

            **היסטוריית השיחה המלאה:**
            ${editChat.conversationContext}

            **הודעה נוכחית של המשתמש:** "${userMessage.content}"

            אתה יכול לענוצ על שאלות ולהציע שינויים, אך הודע למשתמש שעריכות בפועל יתבצעו באמצעות "התאמת הטיול". החזר תשובה בעברית.
        `;

        const response = await InvokeLLM({
            prompt: prompt
        });

        clearTimeout(timeoutId);

        const aiResponseMessage = { 
            role: 'assistant', 
            content: response || 'איך אני יכול לעזור לך עם הטיול הזה?' 
        };

        setEditChat(prev => ({ 
            ...prev, 
            messages: [...updatedMessages, aiResponseMessage], 
            responding: false,
            conversationContext: prev.conversationContext + `\nAssistant: ${aiResponseMessage.content}`
        }));

    } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error in edit chat:', err);
        const errorMessage = { role: 'assistant', content: 'אופס, אירעה שגיאה בעיבוד הבקשה. אנא נסה שוב.' };
        setEditChat(prev => ({ ...prev, messages: [...updatedMessages, errorMessage], responding: false }));
    }
  };

  const handleActivityFeedback = async (dayNumber, activityIndex, feedback) => {
    const key = `${dayNumber}-${activityIndex}`;
    const newFeedbackState = { ...activityFeedback };

    if (newFeedbackState[key] === feedback) {
        delete newFeedbackState[key];
        if (feedback === 'disliked') {
            setDislikeChat({ open: false, key: null, activity: null, messages: [], responding: false, input: '', alternatives: [] });
        }
    } else {
        newFeedbackState[key] = feedback;
        if (feedback === 'disliked') {
            const day = itinerary.find(d => d.day_number === dayNumber);
            const activity = day?.activities?.[activityIndex];
            if (activity) {
                setDislikeChat({
                    open: true,
                    key,
                    activity,
                    messages: [{ role: 'assistant', content: `מה לא אהבת בפעילות "${activity.title}"? ספר לי ואני אמצא לך חלופות מעולות! (שימו לב: זהו טיול בלוגר - החלופות הן להשראה ולא ישונו בטיול המקורי)` }],
                    responding: false,
                    input: '',
                    alternatives: []
                });
            }
        } else {
            if (dislikeChat.key === key) {
                setDislikeChat({ open: false, key: null, activity: null, messages: [], responding: false, input: '', alternatives: [] });
            }
        }
    }
    setActivityFeedback(newFeedbackState);
  };

  const handleDislikeChatSubmit = async () => {
    if (!dislikeChat.input.trim() || dislikeChat.responding || !dislikeChat.activity) return;

    const userMessage = { role: 'user', content: dislikeChat.input };
    const updatedMessages = [...dislikeChat.messages, userMessage];
    
    setDislikeChat(prev => ({ ...prev, messages: updatedMessages, responding: true, input: '' }));

    try {
        const prompt = `
            You are a travel expert. A user is viewing a blogger's trip to ${mockTrip.destination} and disliked an activity.
            Trip Style: ${mockTrip.trip_type}.
            
            The disliked activity:
            - Title: ${dislikeChat.activity.title}
            - Description: ${dislikeChat.activity.description}
            - Location: ${dislikeChat.activity.location?.name}
            - Category: ${dislikeChat.activity.category}

            User's reason for disliking it: "${userMessage.content}"

            Please suggest 3 diverse and specific alternative activities in the same general area. For each alternative, provide a JSON object with the same structure as the original activity.
            
            CRITICAL: Return ONLY a JSON object with a single key "alternatives", which is an array of 3 activity objects. Each object must have: time, title, description, location (with name, address, latitude, longitude), category, and price_estimate. The time should be similar to the original activity time: ${dislikeChat.activity.time}.
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
                                location: { 
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        address: { type: "string" },
                                        latitude: { type: "number" },
                                        longitude: { type: "number" }
                                    },
                                    required: ["name", "latitude", "longitude"]
                                },
                                category: { type: "string" },
                                price_estimate: { type: "number" }
                            },
                            required: ["title", "description", "location", "category"]
                        }
                    }
                },
                required: ["alternatives"]
            },
            add_context_from_internet: true
        });

        const aiResponseMessage = { role: 'assistant', content: 'מצוין, מצאתי כמה חלופות להשראה. זכור שזהו טיול בלוגר המוצג לעיון - לעריכה בפועל, השתמש ב"התאם את הטיול אליי":' };
        setDislikeChat(prev => ({
            ...prev,
            messages: [...updatedMessages, aiResponseMessage],
            responding: false,
            alternatives: response.alternatives || []
        }));

    } catch (err) {
        console.error("Error in dislike chat:", err);
        const errorMessage = { role: 'assistant', content: 'אופס, התקשיתי למצוא חלופות. אפשר לנסות שוב?' };
        setDislikeChat(prev => ({ ...prev, messages: [...updatedMessages, errorMessage], responding: false }));
    }
  };

  const handleAlternativeSelect = async (alternative) => {
    // במקום לעדכן את הטיול, פשוט נציג הודעה שמסבירה שזהו טיול בלוגר
    setDislikeChat(prev => ({
        ...prev,
        messages: [...prev.messages, {
            role: 'assistant',
            content: `בחירה מעולה! "${alternative.title}" נראית כמו פעילות נהדרת. זכור שזהו טיול בלוגר המוצג לעיון בלבד. כדי ליצור גרסה אישית עם השינויים שלך, לחץ על "התאם את הטיול אליי" בחלק העליון של הדף.`
        }],
        alternatives: [],
        responding: false
    }));
  };

  const handleComponentReplace = async (componentType) => {
    // במקום להחליף רכיבים, נציג הודעה שמסבירה שזהו טיול בלוגר
    setConfirmationDialog({
        isOpen: true,
        title: `עריכת ${componentType === 'hotel' ? 'מלון' : componentType === 'flight' ? 'טיסה' : 'רכב'}`,
        description: `זהו טיול בלוגר המוצג לעיון בלבד. כדי לערוך ולהתאים את הרכיבים לצרכים שלך, לחץ על "התאם את הטיול אליי" בחלק העליון של הדף.`,
        onConfirm: () => {
            setConfirmationDialog({ isOpen: false });
            navigate(createPageUrl('AdaptBloggerTrip') + `?id=${tripId}`);
        }
    });
  };

  const handleHelpMeChoose = (componentType) => {
    // במקום לפתוח צ'אט עזרה, נפנה להתאמה
    navigate(createPageUrl('AdaptBloggerTrip') + `?id=${tripId}`);
  };

  const handleShareTrip = () => {
    const shareableUrl = `${window.location.origin}${createPageUrl('BloggerTripDetails')}?id=${tripId}`;
    setShareUrl(shareableUrl);
    setShowShareDialog(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const expenseBreakdown = useMemo(() => {
    if (!mockTrip || !Array.isArray(itinerary) || !Array.isArray(components)) return null;

    const nights = differenceInDays(new Date(mockTrip.end_date), new Date(mockTrip.start_date));
    const flightComponent = components.find(c => c.type === 'flight');
    const hotelComponent = components.find(c => c.type === 'hotel');
    const carComponent = components.find(c => c.type === 'car');

    const flightCost = flightComponent ? (flightComponent.price * 2) : 0; // Default 2 adults
    const hotelCost = hotelComponent ? hotelComponent.price * nights : 0;
    const carCost = carComponent ? carComponent.price * (nights + 1) : 0;

    const restaurantCost = itinerary.reduce((total, day) => {
        return total + (Array.isArray(day.activities) ? day.activities : []).reduce((dayTotal, activity) => {
            if (activity.category === 'restaurant' && activity.price_estimate) {
                return dayTotal + (activity.price_estimate * 2); // Default 2 adults
            }
            return dayTotal;
        }, 0);
    }, 0);

    const activityCost = itinerary.reduce((total, day) => {
        return total + (Array.isArray(day.activities) ? day.activities : []).reduce((dayTotal, activity) => {
            if (activity.category !== 'restaurant' && activity.price_estimate) {
                return dayTotal + (activity.price_estimate * 2); // Default 2 adults
            }
            return dayTotal;
        }, 0);
    }, 0);

    const defaultMealCost = restaurantCost === 0 ? (nights + 1) * 2 * 50 : 0;
    const totalCost = flightCost + hotelCost + carCost + restaurantCost + activityCost + defaultMealCost;

    return {
        flightCost,
        hotelCost,
        carCost,
        restaurantCost: restaurantCost + defaultMealCost,
        activityCost,
        totalCost,
    };
  }, [mockTrip, itinerary, components]);

  const styleMatch = useMemo(() => {
    if (!mockTrip || !userPreferences) return { score: 85, breakdown: {} };

    // Logic דומה ל-TripDetails אבל מבוססת על BloggerTrip
    let personalScore = 70;
    if (Array.isArray(userPreferences.preferred_trip_types) && bloggerTrip?.trip_type?.some(type => userPreferences.preferred_trip_types.includes(type))) {
        personalScore += 20;
    }

    let activityScore = 80;
    const currentItinerary = Array.isArray(itinerary) ? itinerary : [];
    const totalActivities = currentItinerary.reduce((acc, day) => acc + (Array.isArray(day.activities) ? day.activities.length : 0), 0);
    if (totalActivities > 0 && Array.isArray(userPreferences.preferred_activities)) {
      const preferredActivitiesCount = currentItinerary.flatMap(day => Array.isArray(day.activities) ? day.activities : []).filter(act =>
        userPreferences.preferred_activities.some(pref => act.title && act.title.toLowerCase().includes(pref.toLowerCase()))
      ).length;
      if (preferredActivitiesCount > 0) {
        activityScore = Math.min((preferredActivitiesCount / totalActivities) * 100, 100);
      }
    }

    let hotelScore = 75;
    const logisticsScore = 85;

    const finalScore = (personalScore * 0.35) + (activityScore * 0.20) + (hotelScore * 0.25) + (logisticsScore * 0.20);

    return {
      score: Math.min(Math.round(finalScore), 99),
      breakdown: {
        personalPreferences: { score: Math.round(personalScore), title: "התאמה להעדפות אישיות", desc: "התאמה לסגנון הטיול, יעדים ותקציב שהגדרת." },
        activityFit: { score: Math.round(activityScore), title: "התאמת פעילויות", desc: "התאמה בין הפעילויות בתכנון לסוג הפעילויות שאתה אוהב." },
        accommodationQuality: { score: Math.round(hotelScore), title: "התאמת המלון", desc: "התאמת איכות המלון לרמה המצופה ולסגנון הטיול." },
        logistics: { score: Math.round(logisticsScore), title: "יעילות לוגיסטית", desc: "הגיון ונוחות במעברים בין פעילויות לאורך היום." },
      }
    };
  }, [mockTrip, userPreferences, itinerary, bloggerTrip]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-8 text-center text-red-500"><AlertTriangle className="mx-auto w-12 h-12 mb-4" /><h2>שגיאה</h2><p>{error}</p></div>;
  if (!mockTrip || !bloggerTrip) return <div className="p-8 text-center text-gray-500"><h2>טוען פרטי טיול...</h2></div>;

  const currentItinerary = Array.isArray(itinerary) ? itinerary : [];
  const currentComponents = Array.isArray(components) ? components : [];
  
  const uniqueItineraryDays = uniqBy(currentItinerary, 'day_number').sort((a,b) => a.day_number - b.day_number);
  const nights = (mockTrip.start_date && mockTrip.end_date) ? differenceInDays(new Date(mockTrip.end_date), new Date(mockTrip.start_date)) : 0;

  return (
    <div className="bg-gray-50 min-h-screen font-sans relative">
      <div className={`transition-all duration-300 ${showEditChat ? 'lg:mr-[28rem]' : 'mr-0'}`}>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-8">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        {/* אינדיקציה ברורה שזה טיול בלוגר */}
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                טיול בלוגר
                            </Badge>
                            <span className="text-sm text-gray-600">
                                תוכנן על ידי {mockTrip?.blogger_info?.name || 'בלוגר מומחה'}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800">{mockTrip.destination}</h1>
                        <div className="flex items-center gap-4 text-gray-500 mt-2">
                            {mockTrip.start_date && mockTrip.end_date && (
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(mockTrip.start_date), 'dd/MM/yy')} - {format(new Date(mockTrip.end_date), 'dd/MM/yy')} ({nights} לילות)</span>
                            )}
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> מתאים למשפחות ויחידים</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* FIX: הסרת Style Match - לא רלוונטי עבור טיול בלוגר */}
                        <Button variant="outline" size="icon" onClick={handleShareTrip}><Share2 className="w-4 h-4" /></Button>
                        <Button onClick={() => setShowEditChat(prev => !prev)}><Edit3 className="w-4 h-4 mr-2" /> ערוך בצ'אט</Button>
                        <Button onClick={() => navigate(createPageUrl('AdaptBloggerTrip') + `?id=${tripId}`)} className="bg-purple-600 hover:bg-purple-700">
                            <Crown className="w-4 h-4 mr-2" />
                            התאם את הטיול אליי
                        </Button>
                    </div>
                </div>
            </header>

            {/* השאר של הקוד זהה ל-TripDetails - מסלול, מפה, הוצאות, רכיבים */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {currentItinerary && currentItinerary.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>מסלול הטיול</CardTitle>
                        <div className="border-b -mx-6 px-2 mt-4">
                            <div className="flex gap-1 overflow-x-auto pb-px">
                                {uniqueItineraryDays.map(day => (
                                <Button
                                    key={day.id || day.day_number}
                                    variant="ghost"
                                    onClick={() => setActiveDay(day.day_number)}
                                    className={`whitespace-nowrap rounded-b-none border-b-2 transition-all min-w-fit px-4
                                        ${activeDay === day.day_number
                                            ? 'border-blue-600 text-white bg-blue-600 hover:bg-blue-600 hover:text-white'
                                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                                >
                                    יום {day.day_number}
                                    <span className="text-xs block mt-1">
                                      {day.date ? format(new Date(day.date), 'dd/MM') : ''}
                                    </span>
                                </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                    {currentItinerary.filter(day => day.day_number === activeDay).map((day) => (
                        <div key={day.id || day.day_number} className="space-y-4">
                            {(Array.isArray(day.activities) ? day.activities : []).map((activity, activityIndex) => (
                            <div key={activity.id || activityIndex} className="flex gap-4 items-start relative">
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-sm">{activity.time}</span>
                                    <div className="h-full w-px bg-gray-200 mt-1"></div>
                                </div>
                                <div className="flex-1 pb-6 border-b last:border-b-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold">{activity.title}</h4>
                                        <div className="flex gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className={`h-8 w-8 rounded-full transition-colors ${activityFeedback[`${day.day_number}-${activityIndex}`] === 'liked' ? 'bg-green-100 text-green-600' : ''}`}
                                                            onClick={() => handleActivityFeedback(day.day_number, activityIndex, 'liked')}
                                                        >
                                                            <ThumbsUp className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>אהבתי!</p></TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className={`h-8 w-8 rounded-full transition-colors ${activityFeedback[`${day.day_number}-${activityIndex}`] === 'disliked' ? 'bg-red-100 text-red-600' : ''}`}
                                                            onClick={() => handleActivityFeedback(day.day_number, activityIndex, 'disliked')}
                                                        >
                                                            <ThumbsDown className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>שנה לי את זה</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm">{activity.description}</p>
                                    <span className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {activity.location?.name}</span>
                                    {activity.price_estimate && activity.price_estimate > 0 && (
                                      <Badge variant="outline" className="mt-2">
                                        ₪{activity.price_estimate}
                                      </Badge>
                                    )}
                                </div>
                            </div>
                            ))}
                        </div>
                    ))}
                    </CardContent>
                </Card>
                 ) : (
                    <Card><CardContent className="p-8 text-center text-gray-500">
                      <h3 className="text-xl font-semibold mb-2">אין מסלול זמין</h3>
                      <p>המסלול לא נמצא או לא הוגדר עדיין.</p>
                    </CardContent></Card>
                 )}

                 {expenseBreakdown && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="text-indigo-600" />
                                פירוט הוצאות מוערך
                            </CardTitle>
                            <CardDescription>
                                הערכת עלויות כוללת לטיול (מבוססת על 2 מבוגרים).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-semibold text-gray-800">סה"כ מוערך:</span>
                                    <span className="font-bold text-2xl text-indigo-600">₪{expenseBreakdown.totalCost.toFixed(0)}</span>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                    {expenseBreakdown.flightCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Plane className="w-4 h-4"/> טיסות:</span>
                                          <span className="font-medium">₪{expenseBreakdown.flightCost.toFixed(0)}</span>
                                      </div>
                                    )}
                                    {expenseBreakdown.hotelCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Hotel className="w-4 h-4"/> מלונות:</span>
                                          <span className="font-medium">₪{expenseBreakdown.hotelCost.toFixed(0)}</span>
                                      </div>
                                    )}
                                    {expenseBreakdown.carCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Car className="w-4 h-4"/> רכב:</span>
                                          <span className="font-medium">₪{expenseBreakdown.carCost.toFixed(0)}</span>
                                      </div>
                                    )}
                                    {expenseBreakdown.restaurantCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Utensils className="w-4 h-4"/> ארוחות:</span>
                                          <span className="font-medium">₪{expenseBreakdown.restaurantCost.toFixed(0)}</span>
                                      </div>
                                    )}
                                    {expenseBreakdown.activityCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Ticket className="w-4 h-4"/> פעילויות:</span>
                                          <span className="font-medium">₪{expenseBreakdown.activityCost.toFixed(0)}</span>
                                      </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                 )}

                {/* רכיבי הטיול - מלון, טיסה, רכב */}
                {(() => {
                  const hotel = currentComponents.find(c => c.type === 'hotel') || {
                    title: "מלון מומלץ",
                    description: "מלון איכותי המומלץ על ידי הבלוגר",
                    price: 150,
                    metadata: { rating: 4.5, amenities: ['WiFi', 'ארוחת בוקר', 'בריכה'] },
                    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                  };

                  return (
                    <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                              <Hotel className="text-blue-600" />
                              {hotel.title}
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="flex gap-4">
                              <img src={hotel.image_url} alt={hotel.title} className="rounded-lg w-32 h-24 object-cover" />
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="flex items-center">
                                          {[...Array(5)].map((_, i) => (
                                              <Star key={i} className={`w-4 h-4 ${i < Math.floor(hotel.metadata?.rating || 4.5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
                                          <span className="ml-2 text-sm">{hotel.metadata?.rating || 4.5}</span>
                                      </div>
                                      <Badge className="bg-green-100 text-green-800">₪{hotel.price}/לילה</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{hotel.description}</p>
                                  {hotel.metadata?.amenities && (
                                    <div className="flex flex-wrap gap-1">
                                      {hotel.metadata.amenities.slice(0, 3).map((amenity, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">{amenity}</Badge>
                                      ))}
                                    </div>
                                  )}
                              </div>
                          </div>
                           <div className="flex gap-2 mt-4">
                             <Button variant="outline" size="sm" onClick={() => handleComponentReplace('hotel')}>החלף מלון</Button>
                             <Button variant="ghost" size="sm" onClick={() => handleHelpMeChoose('hotel')}>
                               <HelpCircle className="w-4 h-4 mr-1" />
                               עזור לי לבחור
                             </Button>
                           </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* FIX: הסרת רכיב הטיסה - לא רלוונטי עבור טיול בלוגר */}
                {/* רק מלון ורכב יוצגו */}
                {(() => {
                  const car = currentComponents.find(c => c.type === 'car') || {
                    title: "השכרת רכב",
                    description: "רכב מומלץ לטיול",
                    price: 35,
                    metadata: { company: "הרץ", model: "הונדה סיוויק", transmission: "אוטומטית" },
                    image_url: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=800&q=80"
                  };

                  return (
                    <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                              <Car className="text-purple-600" />
                              {car.title}
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="flex gap-4">
                              <img src={car.image_url} alt={car.title} className="rounded-lg w-32 h-24 object-cover" />
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium">{car.metadata?.model || "רכב"}</span>
                                      <Badge className="bg-purple-100 text-purple-800">₪{car.price}/יום</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{car.description}</p>
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div>חברה: {car.metadata?.company || "חברת השכרה"}</div>
                                    {car.metadata?.transmission && <div>תיבת הילוכים: {car.metadata.transmission}</div>}
                                  </div>
                              </div>
                          </div>
                           <div className="flex gap-2 mt-4">
                             <Button variant="outline" size="sm" onClick={() => handleComponentReplace('car')}>החלף רכב</Button>
                             <Button variant="ghost" size="sm" onClick={() => handleHelpMeChoose('car')}>
                               <HelpCircle className="w-4 h-4 mr-1" />
                               עזור לי לבחור
                             </Button>
                           </div>
                      </CardContent>
                    </Card>
                  );
                })()}
            </div>

            {/* מפה */}
            <div className="space-y-8 sticky top-8">
                <Card className="h-96">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">מפת הטיול - יום {activeDay}</CardTitle>
                     <p className="text-sm text-gray-600">
                        {
                          loadingDays[activeDay] ? "טוען מיקומים..." : 
                          preloadedMaps[activeDay] ? `${preloadedMaps[activeDay].locations.length} מיקומים` :
                          "בחר יום להצגת המפה"
                        }
                      </p>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="h-80 w-full rounded-lg bg-gray-100 flex items-center justify-center">
                      {loadingDays[activeDay] ? (
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                          <p className="text-gray-600">טוען את יום {activeDay}...</p>
                        </div>
                      ) : preloadedMaps[activeDay] && preloadedMaps[activeDay].locations.length > 0 ? (
                        <MapContainer 
                          center={preloadedMaps[activeDay].center} 
                          zoom={preloadedMaps[activeDay].zoom} 
                          scrollWheelZoom={true} 
                          style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                          key={`map-${activeDay}`}
                        >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {preloadedMaps[activeDay].locations.map((loc, idx) => {
                                const iconHtml = loc.type === 'hotel' ? 
                                    `<div style="background-color: ${loc.backgroundColor}; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.5); font-size: 18px;">${loc.icon}</div>` :
                                    `<div style="background-color: ${loc.backgroundColor}; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 3px solid white; font-weight: bold; font-size: 11px; position: relative; box-shadow: 0 3px 8px rgba(0,0,0,0.5);">
                                        <div style="position: absolute; top: -2px; right: -2px; background-color: white; color: black; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">${loc.activityNumber}</div>
                                        ${loc.icon}
                                     </div>`;
                                const customIcon = L.divIcon({ html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20], className: 'custom-div-icon' });
                                return (
                                    <Marker key={`marker-${activeDay}-${idx}`} position={[loc.lat, loc.lng]} icon={customIcon}>
                                        <Popup maxWidth={300}>
                                          <div className="p-4 text-right" dir="rtl">
                                            <h4 className="font-bold text-lg mb-2 text-gray-800">{loc.name}</h4>
                                            {loc.time && <p className="text-sm text-blue-600 mb-2 flex items-center gap-1"><span>🕐</span> {loc.time}</p>}
                                            {loc.description && <p className="text-sm text-gray-700 mb-3">{loc.description}</p>}
                                            <div className="flex items-center gap-2 mt-2 justify-end">
                                              <Badge variant="outline" className="text-xs">
                                                {loc.type === 'hotel' ? 'מלון' : 
                                                 loc.category === 'restaurant' ? 'מסעדה' : 
                                                 loc.category === 'attraction' ? 'אטרקציה' : 'פעילות'}
                                              </Badge>
                                              {loc.type !== 'hotel' && (
                                                <Badge variant="secondary" className="text-xs">
                                                  פעילות #{loc.activityNumber}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                            {preloadedMaps[activeDay].locations.filter(loc => loc.type === 'activity').length > 1 && (
                                <Polyline positions={preloadedMaps[activeDay].locations.filter(loc => loc.type === 'activity').map(loc => [loc.lat, loc.lng])} color="#3B82F6" weight={3} opacity={0.7} dashArray="8, 4"/>
                            )}
                        </MapContainer>
                      ) : (
                        <div className="text-center">
                          <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-600">לא נמצאו מיקומים עבור יום זה</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
            </div>
            </div>
        </div>
      </div>

      {/* כל הדיאלוגים זהים ל-TripDetails */}
      <Dialog open={showStyleMatchDialog} onOpenChange={setShowStyleMatchDialog}>
        <DialogContent className="max-w-4xl bg-white border-0 shadow-2xl">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <Sparkles className="text-blue-500 w-8 h-8"/>
              התאמת הטיול שלך: {styleMatch.score}%
            </DialogTitle>
            <p className="text-gray-600 text-lg mt-2">הציון מחושב על בסיס הנוסחא המתקדמת שלנו P.A.H.T</p>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {Object.values(styleMatch.breakdown).map((metric, index) => (
                  <Card key={index} className="p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-xl text-gray-900">{metric.title}</h3>
                        <div className="text-3xl font-bold text-blue-600">{metric.score}%</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{width: `${metric.score}%`}}
                        />
                      </div>
                      <p className="text-gray-700 leading-relaxed">{metric.desc}</p>
                  </Card>
              ))}
          </div>
          <div className="text-center pb-6">
            <Button onClick={() => setShowStyleMatchDialog(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
              מעולה, הבנתי!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md bg-white border-0 shadow-xl">
            <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">שתף את הטיול</DialogTitle>
                <p className="text-gray-600">שלח את הקישור לחברים ומשפחה</p>
            </DialogHeader>
            <div className="space-y-6 p-4">
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Input
                        value={shareUrl}
                        readOnly
                        className="bg-white border-gray-300 text-gray-800 font-mono text-sm"
                    />
                </div>
                <Button
                    onClick={copyToClipboard}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold shadow-lg"
                    size="lg"
                >
                    {copySuccess ? (
                        <>
                            <Check className="w-6 h-6 mr-3" />
                            הועתק בהצלחה!
                        </>
                    ) : (
                        <>
                            <Copy className="w-6 h-6 mr-3"/>
                            העתק קישור
                        </>
                    )}
                </Button>
            </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={confirmationDialog.isOpen} onOpenChange={() => setConfirmationDialog(prev => ({...prev, isOpen: false}))}>
          <DialogContent className="max-w-md">
              <DialogHeader>
                  <DialogTitle>{confirmationDialog.title}</DialogTitle>
              </DialogHeader>
              <p>{confirmationDialog.description}</p>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setConfirmationDialog({ isOpen: false })}>ביטול</Button>
                  <Button onClick={confirmationDialog.onConfirm}>אישור</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

       {/* צ'אט עריכה */}
       <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg border-l flex flex-col transition-transform duration-300 z-50 ${showEditChat ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center p-4 border-b">
                <h3 className="font-semibold">צ'אט עם הבלוגר</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowEditChat(false)}><X className="w-4 h-4"/></Button>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 p-4" ref={editChatRef}>
                  <div className="space-y-4">
                      {editChat.messages.length === 0 && (
                          <div className="text-center text-gray-500 py-8">
                              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                              <p>יש לך שאלות על הטיול של {mockTrip?.blogger_info?.name || 'הבלוגר'}?</p>
                              <p className="text-xs mt-2">זהו טיול בלוגר - לעריכה בפועל השתמש ב"התאם את הטיול אליי"</p>
                          </div>
                      )}
                      {editChat.messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-3 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                              </div>
                          </div>
                      ))}
                      {editChat.responding && <div className="flex justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>}
                  </div>
              </ScrollArea>
              <div className="p-4 border-t">
                  <div className="flex gap-2">
                      <Input
                          placeholder="יש לך שאלות על הטיול?"
                          value={editChat.input}
                          onChange={(e) => setEditChat(prev => ({ ...prev, input: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleEditChatSubmit()}
                          disabled={editChat.responding}
                          className="text-sm"
                      />
                      <Button onClick={handleEditChatSubmit} disabled={editChat.responding || !editChat.input.trim()} size="sm">
                          <Send className="w-4 h-4" />
                      </Button>
                  </div>
              </div>
            </div>
       </div>

      {/* דיאלוג דיסלייק */}
      <Dialog open={dislikeChat.open} onOpenChange={(isOpen) => setDislikeChat(prev => ({ ...prev, open: isOpen }))}>
        <DialogContent className="max-w-lg bg-white rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg text-gray-800">חלופות לפעילות</DialogTitle>
            <p className="text-sm text-gray-500">"{dislikeChat.activity?.title}"</p>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <ScrollArea className="h-48 p-4 border rounded-md bg-gray-50" ref={dislikeChatRef}>
              {dislikeChat.messages.map((msg, i) => (
                <div key={i} className={`flex mb-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 rounded-lg max-w-sm text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                </div>
              ))}
              {dislikeChat.responding && !dislikeChat.alternatives.length && <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}
            </ScrollArea>
            
            {dislikeChat.alternatives.length > 0 && (
                <div className="space-y-3">
                    {dislikeChat.alternatives.map((alt, i) => (
                        <Card key={i} className="p-3 hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleAlternativeSelect(alt)}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-gray-800">{alt.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-1 group-hover:line-clamp-none">{alt.description}</p>
                              </div>
                              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                למידע <ChevronLeft className="w-4 h-4"/>
                              </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            {dislikeChat.alternatives.length === 0 && (
                <div className="flex gap-2 items-center pt-2">
                    <Input
                        placeholder="מה לא אהבת בפעילות הזו?"
                        value={dislikeChat.input}
                        onChange={(e) => setDislikeChat(prev => ({ ...prev, input: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleDislikeChatSubmit()}
                        disabled={dislikeChat.responding}
                    />
                    <Button onClick={handleDislikeChatSubmit} disabled={dislikeChat.responding || !dislikeChat.input.trim()}>
                        {dislikeChat.responding ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
