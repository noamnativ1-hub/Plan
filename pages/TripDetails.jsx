
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trip } from '@/api/entities';
import { TripComponent } from '@/api/entities';
import { TripItinerary } from '@/api/entities';
import { User } from '@/api/entities';
import { SystemSettings } from '@/api/entities';
import { UserPreference } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import {
  Plane, Hotel, MapPin, Calendar, Users, Car,
  Utensils, Ticket, Clock, Star, Share2, Edit2, ThumbsUp, ThumbsDown,
  ChevronRight, Sun, Loader2, AlertTriangle, Check, Copy, Send, X, Bot, Sparkles, HelpCircle,
  Briefcase, Moon, Cloud, ChevronDown, Landmark, Replace, PlusCircle, Heart, Edit3, ArrowLeft, ArrowRight, ChevronLeft,
  Shield 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { uniqBy } from 'lodash';
import TripPlanningAnimation from '../components/animations/TripPlanningAnimation';
import { generateTripPlan } from '../components/ai/TripPlannerAI';
import { useLanguage } from '../components/contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';


// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Helper function to get coordinates - תיקון השגיאה ושיפור היציבות
const getCoordinatesForDestination = async (destinationName, country = '') => {
    if (!destinationName) return null;

    console.log(`🔍 Searching coordinates for: "${destinationName}" in ${country || 'any country'}`);

    // טיפול בשמות גנריים או לא מדויקים
    const knownLocations = {
        'La Mama': 'La Mama Restaurant, Strada Barbu Văcărescu 3, București, Romania',
        'Hotel XYZ': `Hotel Central, ${country || 'București'}, Romania`, // Default to Bucharest if trip.destination not available
        'מרכז העיר': `City Center, ${country || 'București'}, Romania`,
        'יעד_שתבחר': country || 'București, Romania',
        'Henri Coandă International Airport': 'Henri Coandă International Airport, Calea Bucureștilor 224E, Otopeni, Romania',
        'Bucharest Henri Coandă International Airport': 'Henri Coandă International Airport, Calea Bucureștilor 224E, Otopeni, Romania',
        'National Museum of Romanian Literature': 'Muzeul Național al Literaturii Române, Piața Presei Libere 1, București, Romania',
        'Cismigiu Gardens': 'Parcul Cișmigiu, Bulevardul Regina Elisabeta, București, Romania',
        'National Museum of Contemporary Art': 'Muzeul Național de Artă Contemporană, Calea Victoriei 125, București, Romania',
        'Romanian Athenaeum': 'Ateneul Român, Strada Benjamin Franklin 1-3, București, Romania',
        'Palace of the Parliament': 'Palatul Parlamentului, Strada Izvor 2-4, București, Romania',
        'Old Town Bucharest': 'Centrul Vechi, București, Romania',
        'Lipscani District': 'Strada Lipscani, București, Romania',
        'Hanu\' Berarilor': 'Hanul Berarilor, Strada Șelari 9, București, Romania',
        'Caru\' cu Bere': 'Caru\' cu Bere, Strada Stavropoleos 5, București, Romania',
        'The English Bar': 'The English Bar, Strada Ion Câmpineanu 18, București, Romania'
    };

    let searchQuery;
    // If it's a generic name, use the known address
    if (knownLocations[destinationName]) {
        searchQuery = knownLocations[destinationName];
        console.log(`📍 Using known location mapping: "${destinationName}" -> "${searchQuery}"`);
    } else {
        searchQuery = country ? `${destinationName}, ${country}` : destinationName;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8 seconds

        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=3&addressdetails=1`, {
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

        // Second attempt with a simpler search if initial search fails and contains a comma
        if (destinationName.includes(',')) {
            const simplifiedName = destinationName.split(',')[0].trim();
            const simpleSearchQuery = country ? `${simplifiedName}, ${country}` : simplifiedName;

            const response2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(simpleSearchQuery)}&format=json&limit=1&addressdetails=1`, {
                headers: {
                    'User-Agent': 'PlanGo Travel App'
                }
            });

            if (response2.ok) {
                const data2 = await response2.json();
                if (data2 && data2.length > 0) {
                    const { lat, lon } = data2[0];
                    console.log(`✅ Found via simplified search: "${simplifiedName}" at [${lat}, ${lon}]`);
                    return [parseFloat(lat), parseFloat(lon)];
                }
            }
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn(`⚠️ Nominatim API request for "${destinationName}" timed out.`);
        } else {
            console.warn(`⚠️ Nominatim API failed for "${destinationName}":`, error.message);
        }
    }

    // Default to country/city capitals
    const countryDefaults = {
        'רומניה': [44.4268, 26.1025], // בוקרשט
        'romania': [44.4268, 26.1025], // בוקרשט
        'bucurești': [44.4268, 26.1025], // בוקרשט
        'bucharest': [44.4268, 26.1025], // בוקרשט
        'אוסטריה': [48.2082, 16.3738], // וינה
        'austria': [48.2082, 16.3738], // וינה
        'סלובקיה': [48.1486, 17.1077], // בראטיסלבה
        'slovakia': [48.1486, 17.1077], // בראטיסלבה
        'יפן': [35.6762, 139.6503], // טוקיו
        'japan': [35.6762, 139.6503], // טוקיו
        'איטליה': [41.9028, 12.4964], // רומא
        'italy': [41.9028, 12.4964], // רומא
        'יוון': [37.9755, 23.7348], // אתונה
        'greece': [37.9755, 23.7348] // אתונה
    };

    // Search for defaults based on provided country, trip destination, or the destination name itself
    const searchIn = [country, destinationName].filter(Boolean).map(s => s.toLowerCase());

    for (const searchTerm of searchIn) {
        if (countryDefaults[searchTerm]) {
            console.log(`⚠️ Using country default for "${destinationName}" (found: ${searchTerm})`);
            return countryDefaults[searchTerm];
        }
    }

    // Final fallback to Bucharest's coordinates if no match is found
    console.error(`❌ No coordinates found for: "${destinationName}" - using Bucharest default`);
    return [44.4268, 26.1025];
};

export default function TripDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const tripId = searchParams.get('id');

  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [user, setUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [planningMode, setPlanningMode] = useState('initial');

  const [preloadedMaps, setPreloadedMaps] = useState({});
  const [loadingDays, setLoadingDays] = useState({});

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const [pendingAction, setPendingAction] = useState(null);
  const [activityFeedback, setActivityFeedback] = useState({});

  // helpChat is for general context-based help or component help (hotel/flight)
  // It no longer handles activity replacement, which is now done in editChat.
  const [helpChat, setHelpChat] = useState({
    open: false,
    type: null,
    messages: [],
    responding: false,
    input: '',
    // alternatives: [], // Removed, now handled by editChat for activities
    // activityToReplace: null // Removed, now handled by editChat
  });

  const [componentReplaceDialog, setComponentReplaceDialog] = useState({
    open: false,
    type: null,
    options: [],
    loading: false
  });

  // editChat is for trip modifications and activity replacement
  const [editChat, setEditChat] = useState({
    isOpen: false,
    messages: [],
    responding: false,
    input: '',
    pendingAction: null,
    conversationContext: '',
    lastActionLog: null,
    replacingActivity: null, // NEW: Used when an activity is disliked and needs replacement
  });

  const [lastChangeDetails, setLastChangeDetails] = useState(null);

  // Refs for scrolling and auto-focus
  const editChatRef = useRef(null);
  const helpChatRef = useRef(null);
  const itineraryCardRef = useRef(null);
  const editChatInputRef = useRef(null);
  const helpChatInputRef = useRef(null);

  // Helper function to format text with bold markers
  const formatMessageText = (text) => {
    if (!text) return text;
    
    // Convert **text** to <strong>text</strong>
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return formattedText;
  };

  // Helper function for scrolling to top of itinerary card
  const scrollToItineraryTop = () => {
    if (itineraryCardRef.current) {
      itineraryCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handlers for day navigation
  const handleNextDay = () => {
    const nextDay = activeDay + 1;
    if (nextDay <= uniqueItineraryDays.length) {
      setActiveDay(nextDay);
      scrollToItineraryTop();
    }
  };

  const handlePrevDay = () => {
    const prevDay = activeDay - 1;
    if (prevDay >= 1) { // Day numbers are 1-indexed
      setActiveDay(prevDay);
      scrollToItineraryTop();
    }
  };

  useEffect(() => {
    if (editChatRef.current) {
        editChatRef.current.scrollTop = editChatRef.current.scrollHeight;
    }
  }, [editChat.messages]);

  useEffect(() => {
    if (helpChatRef.current) {
      helpChatRef.current.scrollTop = helpChatRef.current.scrollHeight;
    }
  }, [helpChat.messages]);

  // Auto-focus useEffects for chats
  useEffect(() => {
    if (!editChat.responding && editChat.isOpen && editChatInputRef.current) {
      editChatInputRef.current.focus();
    }
  }, [editChat.responding, editChat.isOpen]);

  useEffect(() => {
    if (!helpChat.responding && helpChat.open && helpChatInputRef.current) {
      helpChatInputRef.current.focus();
    }
  }, [helpChat.responding, helpChat.open]);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        if (!tripId) {
            setError("Trip ID is missing.");
            setLoading(false);
            return;
        }

        const userData = await User.me();
        setUser(userData);

        const prefs = await UserPreference.filter({ user_id: userData.id });
        if (Array.isArray(prefs) && prefs.length > 0) {
          setUserPreferences(prefs[0]);
        }

        const settings = await SystemSettings.list();
        if (Array.isArray(settings) && settings.length > 0) {
          setSystemSettings(settings[0]);
        }

        const tripData = await Trip.get(tripId);
        if (!tripData) throw new Error('טיול לא נמצא');
        setTrip(tripData);

        if (tripData.status === 'planning') {
            setIsGenerating(true);
            await generateFullTrip(tripData);
            setIsGenerating(false);
        }
        await loadTripDetails(tripId);

        // הגדרת הודעת פתיחה לפי שפת הטיול
        // Only set initial message if chat is empty. This prevents overwriting user messages on re-render.
        if (editChat.messages.length === 0) {
            const welcomeMessage = getWelcomeMessage();
            setEditChat(prev => ({
                ...prev,
                messages: [{
                    role: 'assistant',
                    content: welcomeMessage,
                    timestamp: new Date() 
                }],
                conversationContext: `assistant: ${welcomeMessage}` 
            }));
        }
      } catch (err) {
        console.error("Error initializing page:", err);
        setError(err.message || 'אירעה שגיאה בטעינת הדף');
        setIsGenerating(false);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [tripId]);

  const loadDayAndGetMapData = async (dayNumber) => {
      if (!trip || !Array.isArray(itinerary) || itinerary.length === 0) {
          return { locations: [], center: [51.505, -0.09], zoom: 12 };
      }

      const day = itinerary.find(d => d.day_number === dayNumber);
      if (!day || !day.activities || !Array.isArray(day.activities)) {
          let fallbackCenter = [51.505, -0.09];
          if (trip?.destination) {
              const coords = await getCoordinatesForDestination(trip.destination);
              if (coords) fallbackCenter = coords;
          }
          return { locations: [], center: fallbackCenter, zoom: 10 };
      }

      console.log(`🗺️ Loading map data for day ${dayNumber}`);
      const locations = [];
      const tripDestinationCountry = trip?.destination || '';
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
      } else if (trip?.destination) {
        const fallbackCoords = await getCoordinatesForDestination(trip.destination);
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
        if (!trip || !Array.isArray(itinerary) || itinerary.length === 0) return;

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
  }, [trip, itinerary, components, activeDay]);

  const loadTripDetails = async (currentTripId) => {
    if (!currentTripId) return;
    try {
      const [itineraryData, componentsData] = await Promise.all([
        TripItinerary.filter({ trip_id: currentTripId }, 'day_number'),
        TripComponent.filter({ trip_id: currentTripId })
      ]);

      // תיקון קריטי: וידוא שהנתונים הם arrays
      setItinerary(Array.isArray(itineraryData) ? itineraryData : []);
      setComponents(Array.isArray(componentsData) ? componentsData : []);

      if (!Array.isArray(componentsData) || componentsData.length === 0) {
        await createDefaultComponents(currentTripId);
        const newComponents = await TripComponent.filter({ trip_id: currentTripId });
        setComponents(Array.isArray(newComponents) ? newComponents : []);
      }

    } catch(err) {
      console.error("Error loading trip sub-details:", err);
      setError("שגיאה בטעינת פרטי המסלול.");
    }
  };

  const generateFullTrip = async (tripData) => {
      setPlanningMode('replan');
      const plan = await generateTripPlan(tripData, []);

      if (plan && plan.daily_itinerary && Array.isArray(plan.daily_itinerary)) {
        const itineraryPromises = plan.daily_itinerary.map(day =>
          TripItinerary.create({ trip_id: tripData.id, ...day })
        );
        await Promise.all(itineraryPromises);
      }

      await createDefaultComponents(tripData.id);

      await Trip.update(tripData.id, { status: 'draft' });
      setTrip(prev => ({...prev, status: 'draft'}));
  };

  const createDefaultComponents = async (tripId) => {
    const defaultComponents = [
      {
        trip_id: tripId,
        type: 'hotel',
        title: 'מלון מומלץ',
        description: 'מלון איכותי במיקום מרכזי עם כל השירותים הנדרשים',
        price: 150,
        metadata: {
          rating: 4.5,
          amenities: ['WiFi', 'ארוחת בוקר', 'בריכה'],
          address: trip?.destination || 'מרכז העיר'
        },
        image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
      },
      {
        trip_id: tripId,
        type: 'flight',
        title: 'טיסה מומלצת',
        description: 'טיסה ישירה עם חברת תעופה מובילה',
        price: 450,
        metadata: {
          outbound: { airline: "אל על", departureTime: "10:30", arrivalTime: "15:45", duration: "5:15", date: trip?.start_date },
          return: { airline: "אל על", departureTime: "18:00", arrivalTime: "23:15", duration: "5:15", date: trip?.end_date }
        }
      },
      {
        trip_id: tripId,
        type: 'car',
        title: 'השכרת רכב',
        description: 'רכב קומפקטי חסכוני לטיול',
        price: 35,
        metadata: {
          company: 'הרץ',
          model: 'הונדה סיוויק',
          transmission: 'אוטומטית',
          fuel_type: 'בנזין'
        },
        image_url: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const component of defaultComponents) {
      await TripComponent.create(component);
    }
  };

  const executeAiAction = async (action, data) => {
    try {
        if (action === 'EXTEND_TRIP') {
            const additionalDays = data.additional_days;
            if (!additionalDays || additionalDays <= 0) {
                return { success: false, message: "מספר הימים להוספה לא תקין." };
            }

            setIsGenerating(true);
            setPlanningMode('replan');

            try {
                const currentDays = itinerary?.length || 0;
                const startDate = new Date(trip.start_date);
                const newEndDate = addDays(startDate, currentDays + additionalDays - 1);

                await Trip.update(trip.id, { end_date: format(newEndDate, 'yyyy-MM-dd') });
                setTrip(prev => ({...prev, end_date: format(newEndDate, 'yyyy-MM-dd')}));

                const tripForExtension = await Trip.get(trip.id);
                const newPlan = await generateTripPlan(tripForExtension, [], currentDays + 1, itinerary);

                if (newPlan && newPlan.daily_itinerary && Array.isArray(newPlan.daily_itinerary)) {
                    const itineraryPromises = newPlan.daily_itinerary.map(day =>
                        TripItinerary.create({ trip_id: trip.id, ...day })
                    );
                    await Promise.all(itineraryPromises);
                }

                await createDefaultComponents(trip.id);

                await Trip.update(trip.id, { status: 'draft' });
                setTrip(prev => ({...prev, status: 'draft'}));
            

                await loadTripDetails(trip.id);

                return {
                    success: true,
                    message: `הוספו ${additionalDays} ימים חדשים לטיול עד ${format(newEndDate, 'dd/MM/yyyy')}.`,
                    changeDetails: {
                      type: 'extend_trip',
                      additionalDays: additionalDays,
                      newEndDate: format(newEndDate, 'yyyy-MM-dd'),
                      timestamp: new Date().toISOString()
                    }
                };
            } catch (extendError) {
                console.error("Error extending trip:", extendError);
                return { success: false, message: `אירעה שגיאה בהרחבת הטיול: ${extendError.message}` };
            } finally {
                setIsGenerating(false);
                setPlanningMode('initial');
            }
        }

        if (action === 'REPLAN_TRIP') {
            const startDay = data.start_day;
            const endDay = data.end_day;
            if (!startDay) {
                return { success: false, message: "לא צוין יום התחלה לתכנון מחדש." };
            }

            setIsGenerating(true);
            setPlanningMode('replan');

            try {
                const currentItinerary = Array.isArray(itinerary) ? itinerary : [];

                let daysToDelete;
                let pastItinerary;

                if (endDay && endDay >= startDay) {
                    // Replan a specific range of days (handles single day too)
                    console.log(`Replanning days ${startDay} to ${endDay}`);
                    daysToDelete = currentItinerary.filter(day => day.day_number >= startDay && day.day_number <= endDay);
                    pastItinerary = currentItinerary.filter(day => day.day_number < startDay);
                } else {
                    // Replan from startDay to the end of the trip
                    console.log(`Replanning from day ${startDay} to the end`);
                    daysToDelete = currentItinerary.filter(day => day.day_number >= startDay);
                    pastItinerary = currentItinerary.filter(day => day.day_number < startDay);
                }

                if (daysToDelete.length > 0) {
                    await Promise.all(daysToDelete.map(day => TripItinerary.delete(day.id)));
                }

                let tripForReplan = { ...trip };
                let newDestination = null;

                if (data.new_destination) {
                    newDestination = data.new_destination;
                } else {
                    const destinations = {
                        'רומניה': ['בראשוב', 'סיגישוארה', 'סלובקיה', 'קלוז'],
                        'אוסטריה': ['סלצבורג', 'אינסברוק', 'הלסטט', 'גרץ'],
                        'סלובקיה': ['בראטיסלבה', 'קושיצה', 'זילינה', 'טרנצין'],
                        'יפן': ['קיוטו', 'אוסקה', 'הירושימה'],
                        'איטליה': ['פירנצה', 'ונציה', 'מילאנו'],
                        'יוון': ['סנטוריני', 'כרתים', 'רודוס']
                    };

                    const countryKey = Object.keys(destinations).find(key =>
                        trip.destination.includes(key) || key.includes(trip.destination) ||
                        key.toLowerCase().includes(trip.destination.toLowerCase()) || trip.destination.toLowerCase().includes(key.toLowerCase())
                    );

                    if (countryKey && destinations[countryKey]) {
                        newDestination = destinations[countryKey][0];
                    } else {
                        newDestination = 'אזור חדש';
                    }
                }

                if (newDestination) {
                    tripForReplan.destination = newDestination;
                    await Trip.update(trip.id, { destination: newDestination });
                    setTrip(prev => ({...prev, destination: newDestination}));
                }

                const newPlan = await generateTripPlan(tripForReplan, [], startDay, pastItinerary, [], endDay);

                if (newPlan && newPlan.daily_itinerary && Array.isArray(newPlan.daily_itinerary)) {
                    const itineraryPromises = newPlan.daily_itinerary.map(day =>
                        TripItinerary.create({ trip_id: trip.id, ...day })
                    );
                    await Promise.all(itineraryPromises);
                }

                await loadTripDetails(trip.id);

                const changeDetails = {
                    type: 'replan_trip',
                    startDay: startDay,
                    endDay: endDay ? endDay : Math.max(...currentItinerary.map(d => d.day_number), startDay), 
                    newDestination: newDestination,
                    oldActivities: daysToDelete.map(day => ({
                        day: day.day_number,
                        activities: day.activities ? day.activities.map(a => a.title) : []
                    })),
                    newActivities: newPlan.daily_itinerary ? newPlan.daily_itinerary.map(day => ({
                        day: day.day_number,
                        activities: day.activities ? day.activities.map(a => a.title) : []
                    })) : [],
                    timestamp: new Date().toISOString()
                };

                setLastChangeDetails(changeDetails);

                setPreloadedMaps(prev => {
                    const updatedMaps = { ...prev };
                    const lastDayInItinerary = Math.max(...currentItinerary.map(d => d.day_number), 0);
                    const lastDayToDelete = endDay ? endDay : lastDayInItinerary;

                    for (let dayNum = startDay; dayNum <= lastDayToDelete; dayNum++) {
                       if (updatedMaps[dayNum]) {
                         delete updatedMaps[dayNum];
                       }
                    }
                    return updatedMaps;
                });
                setLoadingDays({});

                return {
                    success: true,
                    message: `המסלול תוכנן מחדש בהצלחה.`,
                    changeDetails: changeDetails
                };
            } catch (replanError) {
                console.error("Critical error during itinerary replan in AI action:", replanError);
                setError("אירעה שגיאה קריטית בתכנון מחדש של המסלול. אנא רענן את הדף.");
                return { success: false, message: `אירעה שגיאה קריטית בתכנון מחדש: ${replanError.message}` };
            } finally {
                setIsGenerating(false);
                setPlanningMode('initial');
            }
        }
        if (action === 'REPLACE_COMPONENT_CHAT') {
            const { componentType, selectedOption } = data;

            setIsGenerating(true);
            setPlanningMode('replan');

            try {
                const { title, description, price, metadata } = selectedOption;
                let currentComponent = components.find(c => c.type === componentType);
                const originalItinerary = await TripItinerary.filter({ trip_id: trip.id });

                if (currentComponent) {
                    await TripComponent.update(currentComponent.id, { title, description, price, metadata });
                } else {
                    await TripComponent.create({ trip_id: trip.id, type: componentType, title, description, price, metadata });
                }

                // Delete all current itinerary items
                if (Array.isArray(originalItinerary) && originalItinerary.length > 0) {
                     await Promise.all(originalItinerary.map(day => TripItinerary.delete(day.id)));
                }

                const refreshedTrip = await Trip.get(trip.id);
                // Regenerate the entire itinerary from day 1
                const newPlan = await generateTripPlan(refreshedTrip, [], 1, [], originalItinerary);
                if (newPlan?.daily_itinerary) {
                    await Promise.all(newPlan.daily_itinerary.map(day =>
                        TripItinerary.create({ trip_id: trip.id, ...day })
                    ));
                }

                setPreloadedMaps({});
                setLoadingDays({});
                await loadTripDetails(trip.id);

                const changeDetails = {
                  type: 'replace_component',
                  componentType: componentType,
                  selectedOption: selectedOption.title,
                  price: selectedOption.price,
                  oldItinerary: originalItinerary.map(d => ({day: d.day_number, activities: d.activities ? d.activities.map(a => a.title) : []})),
                  newItinerary: newPlan.daily_itinerary ? newPlan.daily_itinerary.map(d => ({day: d.day_number, activities: d.activities ? d.activities.map(a => a.title) : []})) : [],
                  timestamp: new Date().toISOString()
                };
                setLastChangeDetails(changeDetails);

                return {
                    success: true,
                    message: `ה${componentType === 'hotel' ? 'מלון' : 'טיסה'} הוחלף/ה בהצלחה והמסלול עודכן בהתאם!`,
                    changeDetails: changeDetails
                };

            } catch (err) {
                console.error(`Failed to update ${componentType}:`, err);
                return { success: false, message: `שגיאה בעדכון ה${componentType === 'hotel' ? 'מלון' : 'טיסה'}. אנא נסה שוב.` };
            } finally {
                setIsGenerating(false);
                setPlanningMode('initial');
            }
        }
        return { success: false, message: `פעולה לא מוכרת: ${action}` };
    } catch (error) {
        console.error(`Error executing AI action '${action}':`, error);
        return { success: false, message: `אירעה שגיאה בביצוע הפעולה: ${error.message}` };
    }
  };

  const handleActivityLike = (dayNumber, activityIndex) => {
    const key = `${dayNumber}-${activityIndex}`;
    setActivityFeedback(prev => {
        const newState = { ...prev };
        if (newState[key] === 'liked') {
            delete newState[key]; // Toggle: if already liked, unlike
        } else {
            newState[key] = 'liked'; // Like it
        }
        return newState;
    });

    // Clear any activity replacement context in editChat if this activity was disliked and now liked
    if (editChat.replacingActivity?.dayNumber === dayNumber && editChat.replacingActivity?.activityIndex === activityIndex) {
        setEditChat(prev => ({
            ...prev,
            replacingActivity: null,
            messages: prev.messages.filter(msg => msg.type !== 'activity_alternatives'), // Clear alternatives from chat history
        }));
    }
  };

  const handleActivityDislike = async (dayNumber, activityIndex, activity) => {
    console.log('Activity dislike clicked:', { dayNumber, activityIndex, activity });
    
    if (!activity) {
      console.error('No activity provided for dislike');
      return;
    }

    // בדיקה אם הפעילות היא חובה ולא ניתנת לשינוי
    const isMandatoryActivity = (act) => {
      const title = act.title?.toLowerCase() || '';
      const category = act.category?.toLowerCase() || '';
      
      return (
        // פעילויות טיסה
        category === 'flight' ||
        title.includes('טיסה') ||
        title.includes('flight') ||
        title.includes('נחיתה') ||
        title.includes('המראה') ||
        title.includes('שדה תעופה') ||
        title.includes('airport') ||
        
        // פעילויות מלון חובה
        title.includes('צ\'ק-אין') ||
        title.includes('צ\'ק-אאוט') ||
        title.includes('check-in') ||
        title.includes('check-out') ||
        title.includes('בדיקת כניסה') ||
        title.includes('בדיקת יציאה') ||
        
        // תחבורה קריטית
        (category === 'transport' && (
          title.includes('נסיעה לשדה') ||
          title.includes('נסיעה למלון') ||
          title.includes('to airport') ||
          title.includes('to hotel') ||
          title.includes('transfer')
        ))
      );
    };

    if (isMandatoryActivity(activity)) {
      // הצגת הודעת הסבר למשתמש
      const currentAssistantLanguage = detectLanguage(editChat.messages.filter(m => m.role === 'user').pop()?.content || '');
      let reasonText = '';
      if (activity.category === 'flight' || activity.title?.toLowerCase().includes('טיסה') || activity.title?.toLowerCase().includes('flight') || activity.title?.toLowerCase().includes('airport')) {
          reasonText = currentAssistantLanguage === 'he' ? 'טיסה' : 'flight related';
      } else if (activity.title?.toLowerCase().includes('צ\'ק') || activity.title?.toLowerCase().includes('check-in') || activity.title?.toLowerCase().includes('check-out')) {
          reasonText = currentAssistantLanguage === 'he' ? 'צ\'ק-אין/אאוט במלון' : 'hotel check-in/out';
      } else if (activity.category === 'transport') {
          reasonText = currentAssistantLanguage === 'he' ? 'תחבורה קריטית' : 'critical transport';
      }

      const explanationMessage = {
        role: 'assistant',
        content: currentAssistantLanguage === 'he' ?
          `לא ניתן לשנות את הפעילות "${activity.title}" כי היא פעילות חובה (${reasonText}). אפשר לשנות רק פעילויות אופציונליות כמו אטרקציות, מסעדות ופעילויות פנויות.` :
          `You cannot change "${activity.title}" because it is a mandatory activity (${reasonText}). You can only change optional activities like attractions, restaurants, and free activities.`,
        timestamp: new Date()
      };

      setEditChat(prev => ({
        ...prev,
        isOpen: true,
        messages: [...prev.messages, explanationMessage]
      }));
      return;
    }

    // אם הפעילות לא חובה, ממשיכים עם התהליך הרגיל
    setActivityFeedback(prev => ({
      ...prev,
      [`${dayNumber}-${activityIndex}`]: 'disliked'
    }));

    const dislikeMessage = {
      role: 'assistant',
      content: currentAssistantLanguage === 'he' ?
        `אני רואה שלא אהבת את "${activity.title}". בוא נמצא לך משהו טוב יותר! מה לא מתאים לך בפעילות הזו?` :
        `I see you didn't like "${activity.title}". Let's find you something better! What didn't you like about this activity?`,
      timestamp: new Date(),
      type: 'activity_feedback',
      activityToReplace: {
        dayNumber,
        activityIndex,
        activity
      }
    };

    // Open edit chat and add the message
    setEditChat(prev => ({
      ...prev,
      isOpen: true,
      messages: [...prev.messages, dislikeMessage],
      replacingActivity: { // Set replacingActivity in editChat state
        dayNumber,
        activityIndex,
        activity
      }
    }));

    // Scroll to the edit chat input after a short delay
    setTimeout(() => {
      if (editChatInputRef.current) {
        editChatInputRef.current.focus();
      }
    }, 100);
  };

  // פונקציה חדשה: הודעת ברוכים הבאים לפי שפה
  const getWelcomeMessage = () => {
    // אם זו ההודעה הראשונה בצ'אט, השתמש בשפת הטיול
    if (editChat.messages.length === 0) {
        // נבדוק אם יש אינדיקציה לשפה מתוך פרטי הטיול
        const tripLanguage = detectTripLanguage();
        return tripLanguage === 'en' ?
            'Hello! How can I help you with your trip today?' :
            'שלום! איך אני יכול לעזור לך עם הטיול שלך היום?';
    }

    // אחרת, השתמש בשפה של ההודעה האחרונה של המשתמש
    const lastUserMessage = editChat.messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
        const detectedLang = detectLanguage(lastUserMessage.content);
        return detectedLang === 'en' ?
            'I understand!' :
            'אני מבין!';
    }

    // ברירת מחדל לעברית
    return 'שלום!';
  };

  // פונקציה חדשה: זיהוי שפת הטיול
  const detectTripLanguage = () => {
    if (!trip) return 'he';

    // בדיקה אם יש מילים באנגלית בתיאור הטיול
    const englishWordsInTripType = ['romantic', 'adventure', 'family', 'luxury', 'budget', 'cultural', 'business', 'fun', 'relaxing'];
    const tripTypeText = trip.trip_type?.toLowerCase() || '';
    const destinationText = trip.destination?.toLowerCase() || '';

    const hasEnglishKeywords = englishWordsInTripType.some(word => tripTypeText.includes(word)) ||
                               destinationText.match(/[a-z]/i); // Check for any English letters in destination

    // Also check if the global language context is English
    if (language === 'en' || hasEnglishKeywords) {
        return 'en';
    }

    return 'he'; // ברירת מחדל
  };

  // פונקציה חדשה: זיהוי שפת הודעה
  const detectLanguage = (text) => {
    if (!text) return 'he'; // Default to Hebrew if no text

    // Regular expression for common Hebrew characters
    const hebrewRegex = /[\u0590-\u05FF]/;
    // Regular expression for common English words (more robust check than just a few words)
    const englishWordRegex = /\b(?:the|and|or|but|for|with|can|you|how|what|where|when|a|an|is|are|to|of|in|on|at|my|your|his|her|its|our|their)\b/i;
    // Regular expression for common English punctuation or patterns
    const englishPunctuationOrPatterns = /[a-zA-Z]/; // Presence of any Latin character

    const hasHebrewChars = hebrewRegex.test(text);
    const hasEnglishWords = englishWordRegex.test(text);
    const hasEnglishChars = englishPunctuationOrPatterns.test(text);

    if (hasHebrewChars && !hasEnglishChars) { // If it has Hebrew and no English chars
        return 'he';
    }
    if (hasEnglishChars && !hasHebrewChars) { // If it has English chars and no Hebrew
        return 'en';
    }
    // If it has both, or neither, a more complex logic could be applied.
    // For simplicity, default to the global language context, or Hebrew if not set.
    return language || 'he';
  };

  const handleSendEditMessage = async () => {
    if (!editChat.input.trim() || editChat.responding) return;

    const userMessage = {
      role: 'user',
      content: editChat.input,
      timestamp: new Date()
    };
    
    // Optimistically add user message
    setEditChat(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      input: '',
      responding: true,
    }));

    const userInputLower = userMessage.content.toLowerCase();
    const currentAssistantLanguage = detectLanguage(userMessage.content);
    const fullItineraryString = JSON.stringify(itinerary, null, 2);
    // conversationHistory needs to include the current userMessage
    const conversationHistory = [...editChat.messages, userMessage].map(m => `${m.role}: ${m.content}`).join('\n');

    try {
      // --- START: Preserved pending action handling (from original code) ---
      if (editChat.pendingAction && (userInputLower.includes('אשר') || userInputLower.includes('כן') || userInputLower.includes('בצע') || userInputLower.includes('confirm') || userInputLower.includes('yes') || userInputLower.includes('נשמע טוב'))) {
        const confirmationMessageContent = currentAssistantLanguage === 'he' ? "מעולה, מבצע את השינויים ומעדכן את המסלול..." : "Great, applying the changes and updating the itinerary...";
        setEditChat(prev => ({
            ...prev,
            messages: [...prev.messages, { role: 'assistant', content: confirmationMessageContent, timestamp: new Date() }],
            pendingAction: null
        }));
        
        if (editChat.pendingAction.type === 'ADD_DAY_WITH_FLIGHT_CHANGE') {
          const { newEndDate, flightComponent, newFlightDetails, revisedLastDay, newFinalDay } = editChat.pendingAction.payload;
          
          try {
            await Trip.update(tripId, { end_date: newEndDate });

            if (flightComponent && flightComponent.id) {
                await TripComponent.update(flightComponent.id, {
                    metadata: { ...flightComponent.metadata, return: { ...newFlightDetails, date: newEndDate } },
                    price: newFlightDetails.price
                });
            } else {
                console.warn("Flight component not found for update, attempting to create a new one.");
                await TripComponent.create({
                    trip_id: tripId,
                    type: 'flight',
                    title: newFlightDetails.airline ? `${newFlightDetails.airline} Flight` : 'Updated Flight',
                    description: 'Flight details updated by AI',
                    price: newFlightDetails.price,
                    metadata: { outbound: {}, return: { ...newFlightDetails, date: newEndDate } }
                });
            }
            
            const currentItineraryRecords = await TripItinerary.filter({ trip_id: tripId }, 'day_number');
            const lastDayRecord = currentItineraryRecords.find(d => d.day_number === itinerary.length);

            if (lastDayRecord) {
                await TripItinerary.delete(lastDayRecord.id);
            } else {
                console.warn("Could not find last day record to delete for revision.");
            }

            const newRevisedLastDay = {
                ...revisedLastDay,
                day_number: itinerary.length,
                date: format(addDays(parseISO(trip.start_date), itinerary.length - 1), 'yyyy-MM-dd'),
                trip_id: tripId
            };
            const newFinalDayWithCorrectedNumber = {
                ...newFinalDay,
                day_number: itinerary.length + 1,
                date: newEndDate,
                trip_id: tripId
            };
            
            await TripItinerary.create(newRevisedLastDay);
            await TripItinerary.create(newFinalDayWithCorrectedNumber);

            const successMessageContent = currentAssistantLanguage === 'he' ? "הטיול עודכן בהצלחה! מרענן את המסלול..." : "Trip successfully updated! Refreshing itinerary...";
            setEditChat(prev => ({
                ...prev,
                messages: [...prev.messages, { role: 'assistant', content: successMessageContent, timestamp: new Date() }],
                responding: false,
                lastActionLog: 'added a day and adjusted flight',
                conversationContext: prev.conversationContext + `\nassistant: ${successMessageContent}`
            }));
            await loadTripDetails(tripId);
            setPreloadedMaps({});
            setLoadingDays({});
            return;
          } catch (error) {
            console.error("Error confirming ADD_DAY_WITH_FLIGHT_CHANGE:", error);
            const errorMessageContent = currentAssistantLanguage === 'he' ? `אירעה שגיאה בביצוע הוספת היום: ${error.message}` : `An error occurred while adding the day: ${error.message}`;
            setEditChat(prev => ({
                ...prev,
                messages: [...prev.messages, { role: 'assistant', content: errorMessageContent, timestamp: new Date() }],
                responding: false,
                pendingAction: null,
                conversationContext: prev.conversationContext + `\nassistant: ${errorMessageContent}`
            }));
            return;
          }
        } else if (editChat.pendingAction.type === 'ADD_DAY') {
            const { newDayPlan, newEndDate } = editChat.pendingAction.payload;
            
            try {
                await Trip.update(tripId, { end_date: format(newEndDate, 'yyyy-MM-dd') });
                setTrip(prev => ({ ...prev, end_date: format(newEndDate, 'yyyy-MM-dd') }));
                await TripItinerary.create({ trip_id: tripId, ...newDayPlan });
                
                const successMessageContent = currentAssistantLanguage === 'he' ? "היום הנוסף עודכן בהצלחה! מרענן את המסלול..." : "The additional day has been successfully added! Refreshing itinerary...";
                setEditChat(prev => ({
                    ...prev,
                    messages: [...prev.messages, { role: 'assistant', content: successMessageContent, timestamp: new Date() }],
                    pendingAction: null,
                    responding: false,
                    lastActionLog: 'added a day',
                    conversationContext: prev.conversationContext + `\nassistant: ${successMessageContent}`
                }));
                await loadTripDetails(tripId);
                setPreloadedMaps({});
                setLoadingDays({});
                return;
            } catch (error) {
                console.error("Error confirming ADD_DAY:", error);
                const errorMessageContent = currentAssistantLanguage === 'he' ? `אירעה שגיאה בביצוע הוספת היום: ${error.message}` : `An error occurred while adding the day: ${error.message}`;
                setEditChat(prev => ({
                    ...prev,
                    messages: [...prev.messages, { role: 'assistant', content: errorMessageContent, timestamp: new Date() }],
                    responding: false,
                    pendingAction: null,
                    conversationContext: prev.conversationContext + `\nassistant: ${errorMessageContent}`
                }));
                return;
            }
        }
      }
      // --- END: Preserved pending action handling ---

      // If not a confirmation, clear any pending action and proceed with new request.
      setEditChat(prev => ({ ...prev, pendingAction: null }));

      // --- START: New Intent Detection (from outline) ---
      // בדיקה עבור הוספת יום
      if (userInputLower.includes('הוסף יום') || userInputLower.includes('יום נוסף') || userInputLower.includes('הוספת יום') || 
          userInputLower.includes('תוסיף יום') || userInputLower.includes('add day') || userInputLower.includes('another day')) {
        
        const startMessage = {
          role: 'assistant',
          content: currentAssistantLanguage === 'he' ? 'מוסיף יום נוסף לטיול... אני בודק אפשרויות טיסה ומתכנן את היום החדש.' : 'Adding another day to your trip... Checking flight options and planning the new day.',
          timestamp: new Date()
        };
        
        setEditChat(prev => ({
          ...prev,
          messages: [...prev.messages, startMessage],
        }));

        try {
          const newEndDate = addDays(new Date(trip.end_date), 1);
          const newDayNumber = itinerary.length + 1;

          await Trip.update(trip.id, {
            end_date: format(newEndDate, 'yyyy-MM-dd')
          });
          setTrip(prev => ({...prev, end_date: format(newEndDate, 'yyyy-MM-dd')}));

          await TripItinerary.create({
            trip_id: trip.id,
            day_number: newDayNumber,
            date: format(newEndDate, 'yyyy-MM-dd'),
            activities: [
              {
                time: "09:00",
                title: currentAssistantLanguage === 'he' ? `יום חופשי ב${trip.destination}` : `Free day in ${trip.destination}`,
                description: currentAssistantLanguage === 'he' ? "יום פתוח לחקירה עצמאית ופעילויות נוספות" : "An open day for independent exploration and additional activities",
                location: {
                  name: currentAssistantLanguage === 'he' ? "מרכז העיר" : "City Center",
                  address: trip.destination
                },
                category: "other",
                price_estimate: 0
              }
            ]
          });

          await loadTripDetails(trip.id);

          const successMessageContent = currentAssistantLanguage === 'he' ? 
            `מעולה! הוספתי יום ${newDayNumber} לטיול שלך. היום החדש יסתיים ב-${format(newEndDate, 'dd/MM/yyyy')}. תוכל לערוך את הפעילויות של היום החדש כרצונך.` : 
            `Great! I've added day ${newDayNumber} to your trip. The new day will end on ${format(newEndDate, 'dd/MM/yyyy')}. You can edit the activities for the new day as you wish.`;
          
          setEditChat(prev => ({
            ...prev,
            messages: [...prev.messages, { role: 'assistant', content: successMessageContent, timestamp: new Date() }],
            responding: false
          }));

          setPreloadedMaps({});
          setLoadingDays({});
        } catch (addDayError) {
          console.error('Error adding day:', addDayError);
          const errorMessageContent = currentAssistantLanguage === 'he' ? 'מצטער, נתקלתי בבעיה בהוספת היום. אפשר לנסות שוב?' : 'Sorry, I encountered an issue adding the day. Can you try again?';
          setEditChat(prev => ({
            ...prev,
            messages: [...prev.messages, { role: 'assistant', content: errorMessageContent, timestamp: new Date() }],
            responding: false
          }));
        }
        return;
      }

      // בדיקה עבור בקשת חלופות לפעילות
      if (editChat.replacingActivity && (
          userInputLower.includes('עוד') || userInputLower.includes('אחר') || userInputLower.includes('נוסף') ||
          userInputLower.includes('more') || userInputLower.includes('other') || userInputLower.includes('different'))) {
        
        const activityToReplace = editChat.replacingActivity.activity;
        
        const alternativesPrompt = currentAssistantLanguage === 'he' ? 
        `המשתמש מבקש חלופות נוספות לפעילות "${activityToReplace.title}" (קטגוריה: ${activityToReplace.category}).
        
        מה המשתמש אמר: "${userMessage.content}"

        מצא 3 חלופות חדשות ושונות לפעילות הזו, מתאימות לטיול ב${trip.destination}.
        זמן הפעילות המקורית: ${activityToReplace.time || 'כל זמן'}
        מיקום כללי: ${trip.destination}

        מסלול נוכחי (כדי למנוע כפילויות): ${fullItineraryString}

        השב רק עם JSON:
        {
          "alternatives": [
            {
              "time": "${activityToReplace.time || ''}",
              "title": "שם הפעילות",
              "description": "תיאור מפורט",
              "location": {
                "name": "שם המקום",
                "address": "כתובת מדויקת"
              },
              "category": "${activityToReplace.category}",
              "price_estimate": 0
            }
          ]
        }`
        : // English version for alternatives prompt
        `The user is asking for more alternatives for the activity "${activityToReplace.title}" (category: ${activityToReplace.category}).
        
        User's last message: "${userMessage.content}"

        Find 3 new and different alternatives for this activity, suitable for a trip to ${trip.destination}.
        Original activity time: ${activityToReplace.time || 'any time'}
        General location: ${trip.destination}

        Current itinerary (to avoid duplicates): ${fullItineraryString}

        Respond ONLY with JSON:
        {
          "alternatives": [
            {
              "time": "${activityToReplace.time || ''}",
              "title": "Activity Name",
              "description": "Detailed description",
              "location": {
                "name": "Place Name",
                "address": "Precise address"
              },
              "category": "${activityToReplace.category}",
              "price_estimate": 0
            }
          ]
        }`;


        const response = await InvokeLLM({
          prompt: alternativesPrompt,
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
                        address: { type: "string" }
                      }
                    },
                    category: { type: "string" },
                    price_estimate: { type: "number" }
                  },
                  required: ["title", "description", "category", "time", "location"]
                }
              }
            },
            required: ["alternatives"]
          },
          add_context_from_internet: true
        });
        
        const aiResponseMessage = {
          role: 'assistant',
          content: currentAssistantLanguage === 'he' ? 'הנה עוד כמה אפשרויות מעולות:' : 'Here are some more great options:',
          timestamp: new Date(),
          type: 'activity_alternatives',
          alternatives: response.alternatives || []
        };
        
        setEditChat(prev => ({
          ...prev,
          messages: [...prev.messages, aiResponseMessage],
          responding: false
        }));
        return;
      }

      // בדיקה עבור החלפות מרובות (כמו "החלף את כל ארוחות הבוקר")
      if (userInputLower.includes('כל') && (userInputLower.includes('ארוחות') || userInputLower.includes('פעילויות') || userInputLower.includes('all') && (userInputLower.includes('meals') || userInputLower.includes('activities')))) {
        const multiReplacePrompt = currentAssistantLanguage === 'he' ?
        `המשתמש רוצה לבצע שינוי רוחבי במסלול הטיול.

        בקשת המשתמש: "${userMessage.content}"
        מסלול נוכחי: ${fullItineraryString}

        נתח את הבקשה והחזר JSON עם הבנה של הבקשה ומה הפעולות שיינקטו. אין צורך להחזיר את הפעילויות עצמן אלא רק תיאור מילולי.

        פורמט תשובה:
        {
          "understanding": "מה אני מבין שהמשתמש רוצה",
          "proposed_changes_summary": "תיאור קצר של הפעולות המוצעות"
        }`
        : // English version for multi-replace prompt
        `The user wants to perform a broad change across the trip itinerary.

        User's request: "${userMessage.content}"
        Current itinerary: ${fullItineraryString}

        Analyze the request and return JSON with your understanding of the request and a summary of the proposed actions. Do not return the activities themselves, only a textual description.

        Response format:
        {
          "understanding": "My understanding of what the user wants",
          "proposed_changes_summary": "A brief description of the proposed actions"
        }`;


        const multiResponse = await InvokeLLM({
          prompt: multiReplacePrompt,
          response_json_schema: {
            type: "object",
            properties: {
              understanding: { type: "string" },
              proposed_changes_summary: { type: "string" }
            },
            required: ["understanding", "proposed_changes_summary"]
          }
        });

        const aiResponseMessage = {
          role: 'assistant',
          content: currentAssistantLanguage === 'he' ? `אני מבין שאתה רוצה: ${multiResponse.understanding}\n\nהפעולות שאבצע: ${multiResponse.proposed_changes_summary}` : `I understand you want: ${multiResponse.understanding}\n\nActions I will take: ${multiResponse.proposed_changes_summary}`,
          timestamp: new Date()
        };
        
        setEditChat(prev => ({
          ...prev,
          messages: [...prev.messages, aiResponseMessage],
          responding: false
        }));
        return;
      }

      // תגובה כללית חכמה
      const generalPrompt = currentAssistantLanguage === 'he' ? 
      `אתה עוזר AI לעריכת טיולים. המשתמש שאל/ביקש: "${userMessage.content}"

      הקשר השיחה: ${conversationHistory}
      מסלול הטיול: ${JSON.stringify(itinerary, null, 2)}
      פרטי טיול נוספים: יעד: ${trip?.destination}, תאריכים: ${trip?.start_date} עד ${trip?.end_date}, מספר מבוגרים: ${trip?.num_adults}, ילדים: ${trip?.num_children}.

      תן תשובה מועילה וממוקדת. אם המשתמש מבקש שינוי ספציפי, הסביר איך תוכל לעזור. אם זו שאלה כללית, ענה עליה. השב בעברית.
      `
      : // English version for general prompt
      `You are an AI travel assistant for trip editing. The user asked/requested: "${userMessage.content}"

      Conversation context: ${conversationHistory}
      Trip itinerary: ${JSON.stringify(itinerary, null, 2)}
      Additional trip details: Destination: ${trip?.destination}, Dates: ${trip?.start_date} to ${trip?.end_date}, Number of adults: ${trip?.num_adults}, Children: ${trip?.num_children}.

      Provide a helpful and focused response. If the user requests a specific change, explain how you can help. If it's a general question, answer it. Respond in English.`;

      const generalResponse = await InvokeLLM({
        prompt: generalPrompt
      });

      const aiResponseMessage = {
        role: 'assistant',
        content: generalResponse,
        timestamp: new Date()
      };
      
      setEditChat(prev => ({
        ...prev,
        messages: [...prev.messages, aiResponseMessage],
        responding: false
      }));

    } catch (error) {
      console.error('Error in smart edit chat:', error);
      const errorMessage = {
        role: 'assistant',
        content: currentAssistantLanguage === 'he' ? 'מצטער, נתקלתי בבעיה בניתוח הבקשה שלך. אפשר לנסח אותה מחדש?' : 'I apologize, I encountered an issue analyzing your request. Could you rephrase it?',
        timestamp: new Date()
      };
      setEditChat(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        responding: false
      }));
    }
  };

  const handleAlternativeSelect = async (alternative) => {
    if (!editChat.replacingActivity) return;

    try {
        const { dayNumber, activityIndex } = editChat.replacingActivity;
        const currentAssistantLanguage = detectLanguage(editChat.messages.filter(m => m.role === 'user').pop()?.content || '');

        const initialMessage = currentAssistantLanguage === 'he' ? `מעולה! מחליף את הפעילות ל-"${alternative.title}". זה יכול לקחת רגע...` : `Great! Replacing the activity with "${alternative.title}". This might take a moment...`;
        
        setEditChat(prev => ({
            ...prev,
            messages: [...prev.messages, { role: 'assistant', content: initialMessage, timestamp: new Date() }],
            responding: true
        }));

        // עדכון הפעילות במסד הנתונים
        const dayRecords = await TripItinerary.filter({
            trip_id: trip.id,
            day_number: dayNumber
        });

        if (dayRecords && dayRecords[0]) {
            const dayRecordToUpdate = dayRecords[0];
            const updatedActivities = [...dayRecordToUpdate.activities];

            updatedActivities[activityIndex] = {
                ...alternative,
                location: {
                    ...alternative.location,
                    // Ensure lat/lon are numbers if present
                    latitude: alternative.location?.latitude ? parseFloat(alternative.location.latitude) : undefined,
                    longitude: alternative.location?.longitude ? parseFloat(alternative.location.longitude) : undefined
                }
            };

            await TripItinerary.update(dayRecordToUpdate.id, {
                activities: updatedActivities
            });

            // רענון הדף
            await loadTripDetails(trip.id);

            // ניקוי סטטוס הדיסלייק של הפעילות החדשה
            const activityKey = `${dayNumber}-${activityIndex}`;
            setActivityFeedback(prev => {
                const newFeedback = { ...prev };
                delete newFeedback[activityKey];
                return newFeedback;
            });

            const finalMessage = currentAssistantLanguage === 'he' ? `מצוין! הפעילות הוחלפה בהצלחה ל-"${alternative.title}". האם תרצה לבצע שינויים נוספים בטיול?` : `Excellent! The activity has been successfully replaced with "${alternative.title}". Would you like to make any further changes to the trip?`;
            setEditChat(prev => ({
                ...prev,
                messages: [...prev.messages, { role: 'assistant', content: finalMessage, timestamp: new Date() }],
                responding: false,
                replacingActivity: null, // Reset activity replacement context
            }));

        } else {
            throw new Error("Day record not found for update.");
        }
    } catch (error) {
        console.error("Error selecting alternative:", error);
        const currentAssistantLanguage = detectLanguage(editChat.messages.filter(m => m.role === 'user').pop()?.content || '');
        const errorMessage = currentAssistantLanguage === 'he' ? 'אופס, אירעה שגיאה בהחלפת הפעילות. נסה שוב.' : 'Oops, an error occurred while replacing the activity. Please try again.';
        setEditChat(prev => ({
            ...prev,
            messages: [...prev.messages, { role: 'assistant', content: errorMessage, timestamp: new Date() }],
            responding: false
        }));
    }
  };


  const handleComponentReplace = async (componentType) => {
    let currentComponent = components.find(c => c.type === componentType);

    if (!currentComponent) {
      console.log(`Creating missing ${componentType} component...`);
      const defaultData = {
        hotel: { title: 'מלון מומלץ', description: 'מלון איכותי במיקום מרכזי עם כל השירותים הנדרשים', price: 150, metadata:{}},
        flight: { title: 'טיסה מומלצת', description: 'טיסה ישירה עם חברת תעופה מובילה', price: 450, metadata:{}},
        car: { title: 'רכב מומלץ', description: 'רכב קומפקטי', price: 35, metadata:{}},
      };

      try {
        const newComponent = await TripComponent.create({
          trip_id: tripId,
          type: componentType,
          ...defaultData[componentType]
        });
        setComponents(prev => [...prev, newComponent]);
        currentComponent = newComponent;
      } catch (err) {
        console.error(`Failed to create default ${componentType} component:`, err);
        setError(`לא ניתן ליצור ${componentType}. אנא נסה שוב.`);
        return;
      }
    }

    setComponentReplaceDialog({ open: true, type: componentType, options: [], loading: true });

    try {
        const prompt =
          componentType === 'flight' ?
          `
            A user wants to replace their flight for a trip to ${trip.destination} from ${trip.start_date} to ${trip.end_date}.
            Trip details: ${trip.trip_type}, budget $${trip.budget_min}-${trip.budget_max}, ${trip.num_adults} adults.

            Please suggest 3 diverse alternatives for a ROUND TRIP flight.
            CRITICAL: Return ONLY a JSON object with a single key "options". Each object must have: title, description, price, and metadata.
            The metadata MUST contain two objects: 'outbound' and 'return', each with 'airline', 'departureTime', 'arrivalTime', 'duration', and 'date'.
            Example metadata: { "outbound": { "airline": "Ryanair", "departureTime": "06:30", "arrivalTime": "10:00", "duration": "3:30", "date": "${trip?.start_date || 'YYYY-MM-DD'}" }, "return": { "airline": "Ryanair", "departureTime": "18:00", "arrivalTime": "23:30", "duration": "5:15", "date": "${trip?.end_date || 'YYYY-MM-DD'}" } }
            Ensure 'date' for both outbound and return flights are provided in YYYY-MM-DD format.` :
        `
            A user wants to replace their ${componentType} for a trip to ${trip.destination} from ${trip.start_date} to ${trip.end_date}.
            Trip details: ${trip.trip_type}, budget $${trip.budget_min}-${trip.budget_max}, ${trip.num_adults} adults.

            ${currentComponent ?
                `The current ${componentType} is:
                Title: ${currentComponent.title}
                Description: ${currentComponent.description}
                Price: $${currentComponent.price}`
                : `No existing ${componentType} found.`
            }

            Please suggest 3 diverse alternatives.
            CRITICAL: Return ONLY a JSON object with a single key "options", which is an array of 3 objects. Each object must have: title, description, price, and metadata (with relevant fields like address, rating for hotel; company, model for car).
        `;

        const response_json_schema =
            componentType === 'flight' ? {
                type: "object",
                properties: {
                    options: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                description: { type: "string" },
                                price: { type: "number" },
                                metadata: {
                                    type: "object",
                                    properties: {
                                        outbound: {
                                            type: "object",
                                            properties: {
                                                airline: { type: "string" },
                                                departureTime: { type: "string" },
                                                arrivalTime: { type: "string" },
                                                duration: { type: "string" },
                                                date: { type: "string" }
                                            },
                                            required: ["airline", "departureTime", "arrivalTime", "date"]
                                        },
                                        "return": {
                                            type: "object",
                                            properties: {
                                                airline: { type: "string" },
                                                departureTime: { type: "string" },
                                                arrivalTime: { type: "string" },
                                                duration: { type: "string" },
                                                date: { type: "string" }
                                            },
                                            required: ["airline", "departureTime", "arrivalTime", "date"]
                                        }
                                    },
                                    required: ["outbound", "return"]
                                }
                            },
                            required: ["title", "description", "price", "metadata"]
                        }
                    }
                },
                required: ["options"]
            } : {
                type: "object",
                properties: {
                    options: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                description: { type: "string" },
                                price: { type: "number" },
                                metadata: { type: "object" }
                            },
                            required: ["title", "description", "price", "metadata"]
                        }
                    }
                },
                required: ["options"]
            };

        const response = await InvokeLLM({
            prompt,
            response_json_schema,
            add_context_from_internet: true
        });

        setComponentReplaceDialog(prev => ({...prev, options: response.options || [], loading: false }));

    } catch (err) {
        console.error(`Error replacing component ${componentType}:`, err);
        setComponentReplaceDialog(prev => ({...prev, loading: false }));
        throw err; // Re-throw the error so `handleConfirmationResponse` can catch it
    }
  };

  const handleComponentSelect = async (selectedOption) => {
    const componentType = componentReplaceDialog.type;

    const confirmAndExecute = async () => {
        setComponentReplaceDialog({ open: false, type: null, options: [], loading: false });
        setPlanningMode('replan');
        setIsGenerating(true);

        try {
            const { title, description, price, metadata } = selectedOption;
            let currentComponent = components.find(c => c.type === componentType);

            // עדכון/יצירת הרכיב
            if (currentComponent) {
                await TripComponent.update(currentComponent.id, { title, description, price, metadata });
            } else {
                 await TripComponent.create({ trip_id: trip.id, type: componentType, title, description, price, metadata });
            }

            // תיקון קריטי: בשינוי טיסה - תכנן מחדש רק יום ראשון ואחרון
            if (componentType === 'flight') {
                console.log("🛫 Flight changed - replanning ONLY first and last days...");

                const currentItinerary = await TripItinerary.filter({ trip_id: trip.id });
                const sortedItinerary = currentItinerary.sort((a, b) => a.day_number - b.day_number);

                const totalDays = sortedItinerary.length;

                // Identify first and last days for deletion
                const firstDayEntry = sortedItinerary.find(day => day.day_number === 1);
                const lastDayEntry = sortedItinerary.find(day => day.day_number === totalDays);

                // Keep only the middle days (if any)
                const middleDays = sortedItinerary.filter(day => day.day_number > 1 && day.day_number < totalDays);

                // Delete only first and last day from DB
                if (firstDayEntry) await TripItinerary.delete(firstDayEntry.id);
                if (lastDayEntry && firstDayEntry?.id !== lastDayEntry?.id) await TripItinerary.delete(lastDayEntry.id); // Handle single-day trips

                // Re-plan day 1
                const refreshedTripForDay1 = await Trip.get(trip.id); // Get latest trip info
                const firstDayPlanResult = await generateTripPlan(refreshedTripForDay1, [], 1, []); // Generate only day 1

                if (firstDayPlanResult && firstDayPlanResult.daily_itinerary && firstDayPlanResult.daily_itinerary.length > 0) {
                    // Take only the first generated day and ensure its day_number is 1
                    const newFirstDay = { ...firstDayPlanResult.daily_itinerary[0], day_number: 1 };
                    await TripItinerary.create({ trip_id: trip.id, ...newFirstDay });
                }

                // Re-plan the last day if there are more than 1 day
                if (totalDays > 1) {
                    const refreshedTripForLastDay = await Trip.get(trip.id);
                    const lastDayPlanResult = await generateTripPlan(refreshedTripForLastDay, [], totalDays, middleDays);

                    if (lastDayPlanResult && lastDayPlanResult.daily_itinerary && lastDayPlanResult.daily_itinerary.length > 0) {
                        // Take the relevant generated day (which should be the last one) and ensure its day_number is totalDays
                        const newLastDay = { ...lastDayPlanResult.daily_itinerary[0], day_number: totalDays };
                        await TripItinerary.create({ trip_id: trip.id, ...newLastDay });
                    }
                }

            } else {
                // למלון או רכב - תכנן הכל מחדש
                const originalItinerary = await TripItinerary.filter({ trip_id: trip.id });

                if (Array.isArray(originalItinerary) && originalItinerary.length > 0) {
                     await Promise.all(originalItinerary.map(day => TripItinerary.delete(day.id)));
                }

                const refreshedTrip = await Trip.get(trip.id);
                const newPlan = await generateTripPlan(refreshedTrip, [], 1, [], originalItinerary);

                if (newPlan && newPlan.daily_itinerary && Array.isArray(newPlan.daily_itinerary)) {
                    const itineraryPromises = newPlan.daily_itinerary.map(day =>
                        TripItinerary.create({ trip_id: trip.id, ...day })
                    );
                    await Promise.all(itineraryPromises);
                }
            }

            setPreloadedMaps({});
            setLoadingDays({});
            await loadTripDetails(trip.id);

        } catch (err) {
            console.error(`Failed to update ${componentType} and replan:`, err);
            setError(`Failed to update ${componentType} and replan. Please try again.`);
        } finally {
            setIsGenerating(false);
            setPlanningMode('initial');
        }
    };

    if (componentType === 'flight' || componentType === 'hotel') {
        const affectedDays = componentType === 'flight' ?
            'את היום הראשון והאחרון (כדי להתאים לזמני הטיסה החדשים)' :
            'את כל מסלול הטיול (כדי להתאים למיקום המלון החדש)';

        setConfirmationDialog({
            isOpen: true,
            title: `אישור שינוי ${componentType === 'hotel' ? 'מלון' : 'טיסה'}`,
            description: `החלפת ה${componentType === 'hotel' ? 'מלון' : 'טיסה'} תתכנן מחדש ${affectedDays}. האם להמשיך?`,
            onConfirm: () => {
                setConfirmationDialog({ isOpen: false });
                confirmAndExecute();
            }
        });
    } else {
        await confirmAndExecute();
    }
  };

  // פונקציה חדשה - חיפוש ואופציות בצ'אט
  const handleComponentReplaceInChat = async (componentType, userLanguage = 'he') => {
    let currentComponent = components.find(c => c.type === componentType);

    try {
        // אם אין רכיב - צור אותו
        if (!currentComponent) {
            const defaultData = {
                hotel: { title: 'מלון מומלץ', description: 'מלון איכותי', price: 150, metadata: {} },
                flight: { title: 'טיסה מומלצת', description: 'טיסה ישירה', price: 450, metadata: {} },
            };

            const newComponent = await TripComponent.create({
                trip_id: tripId,
                type: componentType,
                ...defaultData[componentType]
            });
            setComponents(prev => [...prev, newComponent]);
            currentComponent = newComponent;
        }

        // חיפוש אופציות
        const prompt = componentType === 'flight' ?
            `A user wants to replace their flight for a trip to ${trip.destination} from ${trip.start_date} to ${trip.end_date}.
            Trip details: ${trip.trip_type}, budget $${trip.budget_min}-${trip.budget_max}, ${trip.num_adults} adults.

            Please suggest 3 diverse and different alternatives for a ROUND TRIP flight. Do not suggest the same option multiple times.
            CRITICAL: Return ONLY a JSON object with a single key "options". Each object must have: title, description, price, and metadata.
            The metadata MUST contain two objects: 'outbound' and 'return', each with 'airline', 'departureTime', 'arrivalTime', and 'duration'.` :

            `A user wants to replace their ${componentType} for a trip to ${trip.destination} from ${trip.start_date} to ${trip.end_date}.
            Trip details: ${trip.trip_type}, budget $${trip.budget_min}-${trip.budget_max}, ${trip.num_adults} adults.

            ${currentComponent ?
                `Current ${currentComponent.title} is: ${currentComponent.title} - ${currentComponent.description} (Price: $${currentComponent.price})`
                : `No existing ${componentType} found.`}

            Please suggest 3 diverse and different alternatives. Do not suggest the same option multiple times.
            CRITICAL: Return ONLY a JSON object with a single key "options", which is an array of 3 objects. Each object must have: title, description, price, and metadata (with relevant fields like address, rating for hotel; company, model for car).`;

        const response_json_schema = componentType === 'flight' ? {
            type: "object",
            properties: {
                options: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            price: { type: "number" },
                            metadata: {
                                type: "object",
                                properties: {
                                    outbound: {
                                        type: "object",
                                        properties: {
                                            airline: { type: "string" },
                                            departureTime: { type: "string" },
                                            arrivalTime: { type: "string" },
                                            duration: { type: "string" },
                                            date: { type: "string" }
                                        }
                                    },
                                    "return": {
                                        type: "object",
                                        properties: {
                                            airline: { type: "string" },
                                            departureTime: { type: "string" },
                                            arrivalTime: { type: "string" },
                                            duration: { type: "string" },
                                            date: { type: "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } : {
            type: "object",
            properties: {
                options: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            price: { type: "number" },
                            metadata: { type: "object" }
                        }
                    }
                }
            }
        };

        const response = await InvokeLLM({
            prompt,
            response_json_schema,
            add_context_from_internet: true
        });

        // הצגת האופציות בצ'אט
        const assistantMessage = {
            role: 'assistant',
            content: userLanguage === 'en' ?
                `I found some great options for you! Choose the ${componentType} that suits you best:` :
                `מצאתי כמה אופציות מעולות עבורך! בחר את ה${componentType === 'hotel' ? 'מלון' : 'טיסה'} שהכי מתאים לך:`,
            timestamp: new Date()
        };
        const optionsMessage = { role: 'assistant', type: 'options', options: response.options || [], componentType: componentType, timestamp: new Date() };

        setEditChat(prev => ({
            ...prev,
            messages: [...prev.messages, assistantMessage, optionsMessage],
            responding: false,
            conversationContext: prev.conversationContext + `\nassistant: ${assistantMessage.content}`
        }));

    } catch (err) {
        console.error(`Error finding ${componentType} options:`, err);
        const errorMsg = userLanguage === 'en' ?
            `Oops, I had trouble finding alternative options. Could you try again?` :
            `אופס, התקשיתי למצוא אופציות חלופיות. תוכל לנסות שוב?`;

        setEditChat(prev => ({
            ...prev,
            messages: [...prev.messages, {
                role: 'assistant',
                content: errorMsg,
                timestamp: new Date()
            }],
            responding: false,
            conversationContext: prev.conversationContext + `\nassistant: ${errorMsg}`
        }));
    }
  };

  // פונקציה חדשה - בחירת אופציה מהצ'אט
  const handleChatOptionSelect = async (selectedOption, componentType) => {
    // Filter out the old option cards message
    const filteredMessages = editChat.messages.filter(msg => msg.type !== 'options');
    const userLanguage = detectLanguage(editChat.messages.filter(m => m.role === 'user').pop()?.content || '');

    // Add a message representing the user's choice
    const userChoiceMessage = {
        role: 'user',
        content: userLanguage === 'en' ? `I chose: ${selectedOption.title}` : `בחרתי ב: ${selectedOption.title}`,
        timestamp: new Date()
    };

    const confirmAndExecute = async () => {
        const processingMessage = userLanguage === 'en' ? 'Great! I\'m performing the change now...' : 'מעולה! אני מבצע את השינוי עכשיו...';
        setEditChat(prev => ({
            ...prev,
            messages: [...filteredMessages, userChoiceMessage, { role: 'assistant', content: processingMessage, timestamp: new Date() }],
            responding: true,
            conversationContext: prev.conversationContext + `\nassistant: ${processingMessage}`
        }));

        const result = await executeAiAction('REPLACE_COMPONENT_CHAT', { componentType, selectedOption });

        if(result.changeDetails) {
            setLastChangeDetails(result.changeDetails);
        }

        const finalAssistantMessage = result.success ?
            (userLanguage === 'en' ? `Done! ${result.message}` : `סיימתי! ${result.message}`) :
            (userLanguage === 'en' ? `Oops, something went wrong: ${result.message}` : `אופס, משהו השתבש: ${result.message}`);

        setEditChat(prev => ({
            ...prev,
            messages: [...prev.messages, {
                role: 'assistant',
                content: finalAssistantMessage,
                timestamp: new Date()
            }],
            responding: false,
            conversationContext: prev.conversationContext + `\nassistant: ${finalAssistantMessage}`
        }));
    };

    // Present a confirmation dialog to the user
    const dialogTitle = userLanguage === 'en' ?
        `Confirm ${componentType === 'hotel' ? 'Hotel' : 'Flight'} Change` :
        `אישור שינוי ${componentType === 'hotel' ? 'מלון' : 'טיסה'}`;
    
    const affectedDays = componentType === 'flight' ?
        (userLanguage === 'en' ? 'the first and last day (to match new flight times)' : 'את היום הראשון והאחרון (כדי להתאים לזמני הטיסה החדשים)') :
        (userLanguage === 'en' ? 'the entire trip itinerary (to adjust to the new hotel location)' : 'את כל מסלול הטיול (כדי להתאים למיקום המלון החדש)');

    const dialogDescription = userLanguage === 'en' ?
        `You selected '${selectedOption.title}' for $${selectedOption.price}. This change will replan ${affectedDays}. Do you want to proceed?` :
        `בחרת ב'${selectedOption.title}' במחיר של $${selectedOption.price}. החלפה זו תתכנן מחדש ${affectedDays}. האם להמשיך?`;

    setConfirmationDialog({
        isOpen: true,
        title: dialogTitle,
        description: dialogDescription,
        onConfirm: () => {
            setConfirmationDialog({ isOpen: false });
            confirmAndExecute();
        }
    });
  };

  const handleHelpMeChoose = (componentType) => {
    const userLanguage = detectLanguage(editChat.messages.filter(m => m.role === 'user').pop()?.content || '');
    const initialMessage = userLanguage === 'en' ?
        `Certainly! To help you find a ${componentType === 'hotel' ? 'hotel' : componentType === 'flight' ? 'flight' : 'car'}, what's most important to you? (e.g., price, location, rating, specific amenities)` :
        `בטח! כדי שאעזור לך למצוא ${componentType === 'hotel' ? 'מלון' : componentType === 'flight' ? 'טיסה' : 'רכב'}, מה הכי חשוב לך? (למשל: מחיר, מיקום, דירוג, שירותים מסוימים)`;

    setHelpChat({
        open: true,
        type: componentType,
        messages: [{ role: 'assistant', content: initialMessage, timestamp: new Date() }],
        responding: false,
        input: '',
    });
  };

  const handleHelpChatSubmit = async () => {
    if (!helpChat.input.trim() || helpChat.responding) {
      console.log('Cannot submit - empty input or responding:', { input: helpChat.input, responding: helpChat.responding });
      return;
    }

    console.log('Submitting help chat message:', helpChat.input);

    const userMessage = {
      role: 'user',
      content: helpChat.input,
      timestamp: new Date()
    };

    const updatedMessages = [...helpChat.messages, userMessage];
    
    setHelpChat(prev => ({
      ...prev,
      messages: updatedMessages,
      input: '',
      responding: true
    }));

    try {
      // helpChat is specifically for component selection help now.
      const componentType = helpChat.type;
      const userLanguage = detectLanguage(userMessage.content);
      const conversationHistory = updatedMessages.map(m => `${m.role}: ${m.content}`).join('\n');

      const prompt = componentType === 'flight' ?
      `
          You are a helpful travel assistant. A user needs help choosing a flight for a trip to ${trip.destination} from ${trip.start_date} to ${trip.end_date}.

          Conversation so far:
          ${conversationHistory}

          Based on the conversation, please find ONE best ROUND TRIP flight recommendation and provide its details.
          CRITICAL: Return ONLY a JSON object with a single key "recommendation". The value should be an object with: title, description, price, and metadata.
          The metadata MUST contain 'outbound' and 'return' objects, each with 'airline', 'departureTime', 'arrivalTime', and 'duration'.
          Respond in ${userLanguage === 'en' ? 'English' : 'Hebrew'}.
      ` :
      `
          You are a helpful travel assistant. A user needs help choosing a ${componentType} for a trip to ${trip.destination}.

          Conversation so far:
          ${conversationHistory}

          Based on the conversation, please find ONE best recommendation and provide its details.
          CRITICAL: Return ONLY a JSON object with a single key "recommendation". The value should be an object with: title, description, price, and metadata.
          Respond in ${userLanguage === 'en' ? 'English' : 'Hebrew'}.
      `;

      const response_json_schema = {
          type: "object",
          properties: {
              recommendation: {
                  type: "object",
                  properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      price: { type: "number" },
                      metadata: { type: "object" }
                  },
                  required: ["title", "description", "price"]
              }
          },
          required: ["recommendation"]
      };


      const response = await InvokeLLM({
          prompt,
          response_json_schema,
          add_context_from_internet: true
      });

      if (!response.recommendation) {
          throw new Error("AI did not return a valid recommendation.");
      }

      const rec = response.recommendation;
      let recommendationText = userLanguage === 'en' ?
          `I found a recommendation that might suit you! Here it is:\n**${rec.title}** - ${rec.description} (for $${rec.price}).` :
          `מצאתי המלצה שאולי תתאים! הנה היא:\n**${rec.title}** - ${rec.description} (במחיר של $${rec.price}).`;

      if(componentType === 'flight' && rec.metadata?.outbound && rec.metadata?.return) {
          recommendationText += userLanguage === 'en' ?
              `\n\n✈️ **Outbound Flight:** ${rec.metadata.outbound.departureTime} - ${rec.metadata.outbound.arrivalTime}` :
              `\n\n✈️ **טיסת הלוך:** ${rec.metadata.outbound.departureTime} - ${rec.metadata.outbound.arrivalTime}`;
          recommendationText += userLanguage === 'en' ?
              `\n✈️ **Return Flight:** ${rec.metadata.return.departureTime} - ${rec.metadata.return.arrivalTime}` :
              `\n✈️ **טיסת חזור:** ${rec.metadata.return.arrivalTime}`;
      }

      recommendationText += userLanguage === 'en' ?
          `\nWould you like to choose this option?` :
          `\nהאם תרצה לבחור באפשרות זו?`;

      const aiResponseMessage = {
          role: 'assistant',
          content: recommendationText,
          timestamp: new Date(),
          alternatives: [rec]
      };

      setHelpChat(prev => ({
          ...prev,
          messages: [...updatedMessages, aiResponseMessage],
          responding: false,
          alternatives: [rec]
      }));

    } catch (err) {
      console.error("Error in help chat:", err);
      const errorMessage = {
        role: 'assistant',
        content: currentAssistantLanguage === 'he' ? 'מצטער, נתקלתי בבעיה. אפשר לנסות שוב?' : 'Sorry, I encountered an issue. Can you try again?',
        timestamp: new Date()
      };
      
      setHelpChat(prev => ({
        ...prev,
        messages: [...updatedMessages, errorMessage],
        responding: false
      }));
    }
  };

  const handleHelpChatSelect = async (selectedOption) => {
    const componentType = helpChat.type;
    const userLanguage = detectLanguage(helpChat.messages.filter(m => m.role === 'user').pop()?.content || '');

    const confirmAndExecute = async () => {
        setHelpChat({ open: false, type: null, messages: [], responding: false, input: '', alternatives: [] });
        setPlanningMode('replan');
        setIsGenerating(true);

        try {
            const { title, description, price, metadata } = selectedOption;
            let currentComponent = components.find(c => c.type === componentType);

            if (currentComponent) {
                await TripComponent.update(currentComponent.id, {
                    title, description, price, metadata: {...currentComponent.metadata, ...metadata}
                });
            } else {
                await TripComponent.create({
                    trip_id: tripId,
                    type: componentType,
                    title,
                    description,
                    price,
                    metadata
                });
            }

            // תיקון קריטי: בשינוי טיסה - תכנן מחדש רק ייום ראשון ואחרון
            if (componentType === 'flight') {
                console.log("🛫 Flight changed via help - replanning ONLY first and last days...");

                const currentItinerary = await TripItinerary.filter({ trip_id: trip.id });
                const sortedItinerary = currentItinerary.sort((a, b) => a.day_number - b.day_number);

                const totalDays = sortedItinerary.length;

                const firstDayEntry = sortedItinerary.find(day => day.day_number === 1);
                const lastDayEntry = sortedItinerary.find(day => day.day_number === totalDays);

                const middleDays = sortedItinerary.filter(day => day.day_number > 1 && day.day_number < totalDays);

                if (firstDayEntry) await TripItinerary.delete(firstDayEntry.id);
                if (lastDayEntry && firstDayEntry?.id !== lastDayEntry?.id) await TripItinerary.delete(lastDayEntry.id);

                const refreshedTripForDay1 = await Trip.get(trip.id);
                const firstDayPlanResult = await generateTripPlan(refreshedTripForDay1, [], 1, []);

                if (firstDayPlanResult && firstDayPlanResult.daily_itinerary && firstDayPlanResult.daily_itinerary.length > 0) {
                    const newFirstDay = { ...firstDayPlanResult.daily_itinerary[0], day_number: 1 };
                    await TripItinerary.create({ trip_id: trip.id, ...newFirstDay });
                }

                if (totalDays > 1) {
                    const refreshedTripForLastDay = await Trip.get(trip.id);
                    const lastDayPlanResult = await generateTripPlan(refreshedTripForLastDay, [], totalDays, middleDays);

                    if (lastDayPlanResult && lastDayPlanResult.daily_itinerary && lastDayPlanResult.daily_itinerary.length > 0) {
                        const newLastDay = { ...lastDayPlanResult.daily_itinerary[0], day_number: totalDays };
                        await TripItinerary.create({ trip_id: trip.id, ...newLastDay });
                    }
                }

            } else {
                // למלון או רכב - תכנן הכל מחדש
                const originalItinerary = await TripItinerary.filter({ trip_id: trip.id });

                if (Array.isArray(originalItinerary) && originalItinerary.length > 0) {
                     await Promise.all(originalItinerary.map(day => TripItinerary.delete(day.id)));
                }

                const refreshedTrip = await Trip.get(trip.id);
                const newPlan = await generateTripPlan(refreshedTrip, [], 1, [], originalItinerary);

                if (newPlan && newPlan.daily_itinerary && Array.isArray(newPlan.daily_itinerary)) {
                    const itineraryPromises = newPlan.daily_itinerary.map(day =>
                        TripItinerary.create({ trip_id: trip.id, ...day })
                    );
                    await Promise.all(itineraryPromises);
                }
            }

            setPreloadedMaps({});
            setLoadingDays({});
            await loadTripDetails(trip.id);

        } catch (err) {
            console.error(`Failed to update ${componentType} and replan from help chat:`, err);
            setError("Failed to update component and replan. Please try again.");
        } finally {
            setIsGenerating(false);
            setPlanningMode('initial');
        }
    };

    if (componentType === 'flight' || componentType === 'hotel') {
        const affectedDays = componentType === 'flight' ?
            (userLanguage === 'en' ? 'the first and last day (to match new flight times)' : 'את היום הראשון והאחרון (כדי להתאים לזמני הטיסה החדשים)') :
            (userLanguage === 'en' ? 'the entire trip itinerary (to adjust to the new hotel location)' : 'את כל מסלול הטיול (כדי להתאים למיקום המלון החדש)');

        const dialogTitle = userLanguage === 'en' ?
            `Confirm ${componentType === 'hotel' ? 'Hotel' : 'Flight'} Change` :
            `אישור שינוי ${componentType === 'hotel' ? 'מלון' : 'טיסה'}`;

        const dialogDescription = userLanguage === 'en' ?
            `Changing the ${componentType} will replan ${affectedDays}. Do you want to proceed?` :
            `החלפת ה${componentType === 'hotel' ? 'מלון' : 'טיסה'} תתכנן מחדש ${affectedDays}. האם להמשיח?`;

        setConfirmationDialog({
            isOpen: true,
            title: dialogTitle,
            description: dialogDescription,
            onConfirm: () => {
                setConfirmationDialog({ isOpen: false });
                confirmAndExecute();
            }
        });
    } else {
        await confirmAndExecute();
    }
  };

  const handleShareTrip = () => {
    const shareableUrl = `${window.location.origin}${createPageUrl('TripDetails')}?id=${tripId}`;
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
    if (!trip || !Array.isArray(itinerary) || !Array.isArray(components)) return null;

    const nights = differenceInDays(new Date(trip.end_date), new Date(trip.start_date));
    const flightComponent = components.find(c => c.type === 'flight');
    const hotelComponent = components.find(c => c.type === 'hotel');
    const carComponent = components.find(c => c.type === 'car');

    const flightCost = flightComponent ?
      (flightComponent.price * trip.num_adults) + (flightComponent.price * 0.7 * trip.num_children) : 0;

    const hotelCost = hotelComponent ? hotelComponent.price * nights : 0;

    const carCost = carComponent ? carComponent.price * (nights + 1) : 0;

    const restaurantCost = itinerary.reduce((total, day) => {
        return total + (Array.isArray(day.activities) ? day.activities : []).reduce((dayTotal, activity) => {
            if (activity.category === 'restaurant' && activity.price_estimate) {
                return dayTotal + (activity.price_estimate * trip.num_adults);
            }
            return dayTotal;
        }, 0);
    }, 0);

    const activityCost = itinerary.reduce((total, day) => {
        return total + (Array.isArray(day.activities) ? day.activities : []).reduce((dayTotal, activity) => {
            if (activity.category !== 'restaurant' && activity.price_estimate) {
                return dayTotal + (activity.price_estimate * trip.num_adults);
            }
            return dayTotal;
        }, 0);
    }, 0);

    const defaultMealCost = restaurantCost === 0 ? (nights + 1) * trip.num_adults * 50 : 0;

    const totalCost = flightCost + hotelCost + carCost + restaurantCost + activityCost + defaultMealCost;

    return {
        flightCost,
        hotelCost,
        carCost,
        restaurantCost: restaurantCost + defaultMealCost,
        activityCost,
        totalCost,
    };
  }, [trip, itinerary, components]);

  const activeHotelComponent = useMemo(() => {
    if (!Array.isArray(itinerary) || itinerary.length === 0 || !Array.isArray(components) || components.length === 0) {
      return components.find(c => c.type === 'hotel');
    }

    let currentHotel = null;
    const sortedItinerary = [...itinerary].sort((a, b) => a.day_number - b.day_number);

    for (const day of sortedItinerary) {
        if (day.day_number > activeDay) break;

        const checkInActivity = Array.isArray(day.activities) ? day.activities.find(act =>
            act.category?.toLowerCase() === 'hotel' ||
            act.title?.toLowerCase().includes('check-in')
        ) : null;

        if (checkInActivity) {
            const hotelForActivity = components.find(comp =>
                comp.type === 'hotel' &&
                (comp.title === checkInActivity.title ||
                 (checkInActivity.location?.name && comp.title?.toLowerCase().includes(checkInActivity.location.name.toLowerCase()))
                )
            );
            if (hotelForActivity) {
                currentHotel = hotelForActivity;
            }
        }
    }
    return currentHotel || components.find(c => c.type === 'hotel');
  }, [activeDay, itinerary, components]);

  if (isGenerating) {
    return <TripPlanningAnimation mode={planningMode} isActive={true} onComplete={() => setIsGenerating(false)} />;
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-8 text-center text-red-500"><AlertTriangle className="mx-auto w-12 h-12 mb-4" /><h2>שגיאה</h2><p>{error}</p></div>;
  if (!trip) return <div className="p-8 text-center text-gray-500"><h2>טוען פרטי טיול...</h2><p>אם ההודעה נשארת, ייתכן שהטיול לא קיים או שאין לך גישה.</p></div>;

  const currentItinerary = Array.isArray(itinerary) ? itinerary : [];
  const currentComponents = Array.isArray(components) ? components : [];

  const uniqueItineraryDays = uniqBy(currentItinerary, 'day_number').sort((a,b) => a.day_number - b.day_number);
  const currentActiveDayData = uniqueItineraryDays.find(d => d.day_number === activeDay);
  const nights = differenceInDays(new Date(trip.end_date), new Date(trip.start_date));

  return (
    <div className="bg-gray-50 min-h-screen font-sans relative">
      <div className={`transition-all duration-300 ${editChat.isOpen ? 'lg:mr-[28rem]' : 'mr-0'}`}>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-8">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{trip?.destination}</h1>
                        <div className="flex items-center gap-4 text-gray-500 mt-2">
                            {trip?.start_date && trip?.end_date && (
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(trip.start_date), 'dd/MM/yy')} - {format(new Date(trip.end_date), 'dd/MM/yy')} ({nights} לילות)</span>
                            )}
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {trip?.num_adults} מבוגרים{trip?.num_children > 0 && `, ${trip.num_children} ילדים`}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handleShareTrip}><Share2 className="w-4 h-4" /></Button>
                        <Button onClick={() => setEditChat(prev => ({...prev, isOpen: !prev.isOpen}))}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          {t('travelChatTitle')}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {currentItinerary && currentItinerary.length > 0 ? (
                <Card ref={itineraryCardRef}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{t('tripItinerary')}</CardTitle>
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
                                    {t('day')} {day.day_number}
                                    <span className="text-xs block mt-1">
                                      {day.date ? format(new Date(day.date), 'dd/MM') : '')}
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
                                        <span className="font-bold text-sm tabular-nums">{activity.time ? (activity.time.includes('T') ? format(new Date(activity.time), 'HH:mm') : activity.time.split(':').slice(0,2).join(':')) : ''}</span>
                                        <div className="h-full w-px bg-gray-200 mt-1"></div>
                                    </div>
                                    <div className="flex-1 pb-6 border-b last:border-b-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold">{activity.title}</h4>
                                            <div className="flex gap-1 ml-3">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className={`h-8 w-8 p-0 rounded-full ${activityFeedback[`${day.day_number}-${activityIndex}`] === 'liked' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                                onClick={() => handleActivityLike(day.day_number, activityIndex)}
                                                            >
                                                                <ThumbsUp className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>אהבתי!</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                {/* הצגת כפתור דיסלייק רק לפעילויות שאינן חובה */}
                                                {(() => {
                                                  const title = activity.title?.toLowerCase() || '';
                                                  const category = activity.category?.toLowerCase() || '';
                                                  const isMandatory = (
                                                    category === 'flight' ||
                                                    title.includes('טיסה') ||
                                                    title.includes('flight') ||
                                                    title.includes('נחיתה') ||
                                                    title.includes('המראה') ||
                                                    title.includes('שדה תעופה') ||
                                                    title.includes('airport') ||
                                                    title.includes('צ\'ק-אין') ||
                                                    title.includes('צ\'ק-אאוט') ||
                                                    title.includes('check-in') ||
                                                    title.includes('check-out') ||
                                                    title.includes('בדיקת כניסה') ||
                                                    title.includes('בדיקת יציאה') ||
                                                    (category === 'transport' && (
                                                      title.includes('נסיעה לשדה') ||
                                                      title.includes('נסיעה למלון') ||
                                                      title.includes('to airport') ||
                                                      title.includes('to hotel') ||
                                                      title.includes('transfer')
                                                    ))
                                                  );

                                                  if (isMandatory) {
                                                    return (
                                                      <TooltipProvider>
                                                        <Tooltip>
                                                          <TooltipTrigger asChild>
                                                            <div className="h-8 w-8 p-0 rounded-full flex items-center justify-center text-gray-400 cursor-not-allowed" title="פעילות חובה - לא ניתן לשינוי">
                                                              <Shield className="h-4 w-4" />
                                                            </div>
                                                          </TooltipTrigger>
                                                          <TooltipContent>פעילות חובה - לא ניתן לשינוי</TooltipContent>
                                                        </Tooltip>
                                                      </TooltipProvider>
                                                    );
                                                  }

                                                  return (
                                                    <TooltipProvider>
                                                      <Tooltip>
                                                          <TooltipTrigger asChild>
                                                              <Button
                                                                  size="sm"
                                                                  variant="ghost"
                                                                  className={`h-8 w-8 p-0 rounded-full ${activityFeedback[`${day.day_number}-${activityIndex}`] === 'disliked' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                                                                  onClick={() => handleActivityDislike(day.day_number, activityIndex, activity)}
                                                              >
                                                                  <ThumbsDown className="h-4 w-4" />
                                                              </Button>
                                                          </TooltipTrigger>
                                                          <TooltipContent>שנה לי את זה</TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  );
                                                })()}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">{activity.description}</p>
                                        <span className="text-sm text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {activity.location?.name}</span>
                                        {activity.price_estimate && (
                                        <Badge variant="outline" className="mt-2">
                                            {activity.category === 'restaurant' ? `~` : ''}${activity.price_estimate} {activity.category === 'restaurant' ? 'לאדם' : ''}
                                        </Badge>
                                        )}
                                    </div>
                                </div>
                                ))}
                            </div>
                        ))}
                    </CardContent>
                    {/* Day navigation controls below CardContent */}
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                        <Button variant="ghost" onClick={handlePrevDay} disabled={activeDay === 1}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            {t('previousDay')}
                        </Button>
                        <div className="text-center">
                            <p className="font-bold">{t('day')} {activeDay}</p>
                            {currentActiveDayData?.date && (
                                <p className="text-sm text-gray-500">
                                    {format(parseISO(currentActiveDayData.date), 'eeee, dd/MM/yyyy')}
                                </p>
                            )}
                        </div>
                        <Button variant="ghost" onClick={handleNextDay} disabled={activeDay >= uniqueItineraryDays.length}>
                            {t('nextDay')}
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </Card>
                 ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('tripItinerary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 text-center text-gray-500">
                          <h3 className="text-xl font-semibold mb-2">אין מסלול זמין</h3>
                          <p>{t('loadingItinerary')}</p>
                        </CardContent>
                    </Card>
                 )}

                 {expenseBreakdown && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="text-indigo-600" />
                                פירוט הוצאות מוערך
                            </CardTitle>
                            <CardDescription>
                                הערכת עלויות כוללת לטיול עבור {trip.num_adults} מבוגרים{trip.num_children > 0 ? ` ו-${trip.num_children} ילדים` : ''}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-semibold text-gray-800">סה"כ מוערך:</span>
                                    <span className="font-bold text-2xl text-indigo-600">${expenseBreakdown.totalCost.toFixed(2)}</span>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                    {expenseBreakdown.flightCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Plane className="w-4 h-4"/> טיסות:</span>
                                          <span className="font-medium">${expenseBreakdown.flightCost.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {expenseBreakdown.hotelCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Hotel className="w-4 h-4"/> מלונות:</span>
                                          <span className="font-medium">${expenseBreakdown.hotelCost.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {expenseBreakdown.carCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Car className="w-4 h-4"/> רכב:</span>
                                          <span className="font-medium">${expenseBreakdown.carCost.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {expenseBreakdown.restaurantCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Utensils className="w-4 h-4"/> ארוחות:</span>
                                          <span className="font-medium">${expenseBreakdown.restaurantCost.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {expenseBreakdown.activityCost > 0 && (
                                      <div className="flex justify-between text-sm">
                                          <span className="text-gray-600 flex items-center gap-2"><Ticket className="w-4 h-4"/> פעילויות:</span>
                                          <span className="font-medium">${expenseBreakdown.activityCost.toFixed(2)}</span>
                                      </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                 )}

                {(() => {
                  const hotel = activeHotelComponent || {
                    title: "מלון מומלץ",
                    description: "מלון איכותי במיקום מרכזי עם כל השירותים הנדרשים",
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
                                      <Badge className="bg-green-100 text-green-800">${hotel.price}/לילה</Badge>
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

                {(() => {
                  const flight = currentComponents.find(c => c.type === 'flight') || {
                    title: "טיסה מומלצת",
                    description: "טיסה ישירה עם חברת תעופה מובילה",
                    price: 450,
                    metadata: {
                      outbound: { airline: "אל על", departureTime: "10:30", arrivalTime: "15:45", duration: "5:15", date: trip?.start_date },
                      return: { airline: "אל על", departureTime: "18:00", arrivalTime: "23:15", duration: "5:15", date: trip?.end_date }
                    }
                  };

                  return (
                    <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                              <Plane className="text-green-600" />
                              {flight.title}
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                  <span className="font-medium">{flight.metadata?.outbound?.airline || "חברת תעופה"}</span>
                                  <Badge className="bg-blue-100 text-blue-800">${flight.price}</Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                                {flight.metadata?.outbound && (
                                  <div>
                                    <span className="text-gray-500 font-semibold">טיסת יציאה:</span>
                                    <div className="font-medium">
                                      {flight.metadata.outbound.departureTime} - {flight.metadata.outbound.arrivalTime}
                                    </div>
                                    {flight.metadata.outbound.date && (
                                      <div className="text-xs text-gray-400">
                                        {format(new Date(flight.metadata.outbound.date), 'dd/MM/yyyy')}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {flight.metadata?.return && (
                                  <div>
                                    <span className="text-gray-500 font-semibold">טיסת חזור:</span>
                                    <div className="font-medium">
                                       {flight.metadata.return.departureTime} - {flight.metadata.return.arrivalTime}
                                    </div>
                                    {flight.metadata.return.date && (
                                      <div className="text-xs text-gray-400">
                                        {format(new Date(flight.metadata.return.date), 'dd/MM/yyyy')}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <p className="text-sm text-gray-600">{flight.description}</p>
                          </div>
                           <div className="flex gap-2 mt-4">
                             <Button variant="outline" size="sm" onClick={() => handleComponentReplace('flight')}>החלף טיסה</Button>
                             <Button variant="ghost" size="sm" onClick={() => handleHelpMeChoose('flight')}>
                               <HelpCircle className="w-4 h-4 mr-1" />
                               עזור לי לבחור
                             </Button>
                           </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {(() => {
                  const car = currentComponents.find(c => c.type === 'car') || {
                    title: "השכרת רכב",
                    description: "רכב קומפקטי חסכוני לטיול",
                    price: 35,
                    metadata: { company: "הרץ", model: "הונדה סיוויק", transmission: "אוטומטית", fuel_type: "בנזין" },
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
                                      <Badge className="bg-purple-100 text-purple-800">${car.price}/יום</Badge>
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

            <div className="space-y-8 sticky top-8">
                <Card className="h-96">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">מפת הטיול - {t('day')} {activeDay}</CardTitle>
                     <p className="text-sm text-gray-600">
                        {
                          loadingDays[activeDay] ? "טוען מיקומים..." :
                          preloadedMaps[activeDay] ? `${preloadedMaps[activeDay].locations.length} מיקומים` :
                          "בחר יום להצגת המ mapa"
                        }
                      </p>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="h-80 w-full rounded-lg bg-gray-100 flex items-center justify-center">
                      {loadingDays[activeDay] ? (
                        <div className="text-center">
                          <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-500" />
                          <p className="text-gray-600">טוען את יום {activeDay}...</p>
                        </div>
                      ) : preloadedMaps[activeDay] && preloadedMaps[activeDay].locations.length > 0 ? (
                        <MapContainer
                          center={preloadedMaps[activeDay].center}
                          zoom={preloadedMaps[activeDay].zoom}
                          scrollWheelZoom={true}
                          style={{ height: '100%', wifth: '100%', borderRadius: '0.5rem' }}
                          key={`map-${activeDay}`}
                        >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {preloadedMaps[activeDay].locations.map((loc, idx) => {
                                const iconHtml = loc.type === 'hotel' ?
                                    `<div style="background-color: ${loc.backgroundColor}; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.5); font-size: 18px;">${loc.icon}</div>` :
                                    `<div style="background-color: ${loc.backgroundColor}; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 3px solid white; font-weight: bold; font-size: 11px; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
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
                          <MapPin className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">לא נמצאו מיקומים עבור יום זה</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      המפה תהיה אינטרקטיבית לחלוטין לאחר השלמת החיבור לממשקי הAPI
                    </p>
                  </CardContent>
                </Card>
            </div>
            </div>
        </div>
      </div>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md bg-white border-0 shadow-xl">
            <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">שתף את הטיול שלך</DialogTitle>
                <DialogDescription className="text-gray-600">שלח את הקישור לחברים ומשפחה</DialogDescription>
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

       <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-lg border-l flex flex-col transition-transform duration-300 z-50 ${editChat.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center p-4 border-b bg-white">
                <h3 className="font-semibold">{t('travelChatTitle')}</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditChat(prev => ({...prev, isOpen: false}))}><X className="w-4 h-4"/></Button>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 p-4" ref={editChatRef}>
                  <div className="space-y-4">
                      {editChat.messages.length === 0 && (
                          <div className="text-center text-gray-500 py-8">
                              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                              <p>{t('travelChatPrompt')}</p>
                              <p className="text-xs mt-2">{t('travelChatExample')}</p>
                          </div>
                      )}
                      {editChat.messages.map((message, index) => {
                          if (message.type === 'options') {
                              return (
                                  <div key={index} className="space-y-3">
                                      {message.options.map((option, idx) => (
                                          <Card key={idx} className="p-3 hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer group border border-gray-200" onClick={() => handleChatOptionSelect(option, message.componentType)}>
                                              <div className="flex justify-between items-start gap-3">
                                                  <div className="flex-1">
                                                      <h4 className="font-bold text-gray-900 text-sm">{option.title}</h4>
                                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{option.description}</p>
                                                  </div>
                                                  <div className="text-right">
                                                      <Badge variant="secondary" className="text-sm font-bold">${option.price}</Badge>
                                                  </div>
                                              </div>
                                          </Card>
                                      ))}
                                  </div>
                              );
                          }

                          // הצגת חלופות בכרטיסיות
                          if (message.type === 'activity_alternatives' && message.alternatives && message.alternatives.length > 0) {
                            return (
                              <div key={index} className="mb-4">
                                <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md p-4 shadow-sm max-w-[85%]">
                                  <p className="text-sm mb-3">{message.content}</p>
                                  <div className="space-y-3">
                                    {message.alternatives.map((alternative, altIndex) => (
                                      <Card key={altIndex} className="p-3 hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer group border border-gray-200" onClick={() => handleAlternativeSelect(alternative)}>
                                        <div className="flex justify-between items-start gap-3">
                                          <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-sm">{alternative.title}</h4>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alternative.description}</p>
                                            {alternative.location && (
                                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                <span>{alternative.location.name}</span>
                                              </div>
                                            )}
                                            {alternative.time && (
                                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{alternative.time}</span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-right flex flex-col items-end">
                                            {alternative.price_estimate && alternative.price_estimate > 0 && (
                                              <Badge variant="secondary" className="text-sm font-bold mb-2">
                                                ₪{alternative.price_estimate}
                                              </Badge>
                                            )}
                                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700">
                                              <ChevronLeft className="w-4 h-4 mr-1" />
                                              בחר
                                            </Button>
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                  <div className="text-xs opacity-70 mt-3 text-right">
                                    {format(new Date(message.timestamp), 'HH:mm')}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                                <div key={index} className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                                    message.role === 'user'
                                      ? 'bg-blue-600 text-white rounded-br-md'
                                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                  }`}
                                  style={{ 
                                    overflowWrap: 'break-word', 
                                    wordWrap: 'break-word',
                                    lineHeight: '1.5'
                                  }}>
                                    <div 
                                      className="text-sm leading-relaxed"
                                      dangerouslySetInnerHTML={{ 
                                        __html: formatMessageText(message.content) 
                                      }}
                                    />
                                    <div className="text-xs opacity-70 mt-2 text-right">
                                      {format(new Date(message.timestamp), 'HH:mm')}
                                    </div>
                                  </div>
                                </div>
                              );
                      })}
                      {editChat.responding && <div className="flex justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>}
                  </div>
              </ScrollArea>
              <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                      <Textarea
                          ref={editChatInputRef}
                          placeholder={language === 'he' ? "איך אוכל לעזר לך עם הטיול?" : "How can I help you with your trip?"}
                          value={editChat.input}
                          onChange={(e) => setEditChat(prev => ({ ...prev, input: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendEditMessage();
                            }
                          }}
                          disabled={editChat.responding}
                          className="text-sm resize-none"
                          rows={1}
                          onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                      />
                      <Button
                          onClick={handleSendEditMessage}
                          disabled={editChat.responding || !editChat.input.trim()}
                          size="sm"
                      >
                          <Send className="w-4 h-4" />
                      </Button>
                  </div>
              </div>
            </div>
       </div>

      <Dialog open={componentReplaceDialog.open} onOpenChange={(isOpen) => setComponentReplaceDialog(prev => ({...prev, open: isOpen}))}>
          <DialogContent className="max-w-2xl bg-white rounded-xl shadow-2xl border-0">
              <DialogHeader className="p-6 border-b">
                  <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      {componentReplaceDialog.type === 'hotel' ? <Hotel className="text-blue-500"/> : componentReplaceDialog.type === 'flight' ? <Plane className="text-green-500"/> : <Car className="text-purple-500"/>}
                      החלפת {componentReplaceDialog.type === 'hotel' ? 'מלון' : componentReplaceDialog.type === 'flight' ? 'טיסה' : 'רכב'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500">מצאתי עבורך מספר חלופות. בחר את המתאימה ביותר.</DialogDescription>
              </DialogHeader>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {componentReplaceDialog.loading ? (
                      <div className="flex items-center justify-center h-40 flex-col gap-4">
                          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                          <p className="text-gray-600 font-medium">מחפש הצעות רלוונטיות...</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {componentReplaceDialog.options.length > 0 ? (
                            componentReplaceDialog.options.map((option, i) => (
                                <Card key={i} className="p-4 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer group border-2 border-transparent">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-lg">{option.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                              {option.metadata?.rating && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400"/> {option.metadata.rating}</span>}
                                              {componentReplaceDialog.type === 'flight' && option.metadata?.outbound?.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {option.metadata.outbound.duration}</span>}
                                              {option.metadata?.company && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4"/> {option.metadata.company}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end justify-between h-full">
                                          <Badge variant="secondary" className="text-base font-bold">${option.price}</Badge>
                                          <Button size="sm" className="mt-4" onClick={() => handleComponentSelect(option)}>
                                              בחר
                                          </Button>
                                        </div>
                                    </div>
                                    {componentReplaceDialog.type === 'flight' && option.metadata?.outbound && (
                                        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-xs bg-gray-50 -m-4 p-4 rounded-b-lg">
                                            <div>
                                                <p className="font-semibold text-gray-600">טיסת יציאה:</p>
                                                <p>{option.metadata.outbound.departureTime} - {option.metadata.outbound.arrivalTime}</p>
                                                <p className="text-gray-400">{option.metadata.outbound.airline}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-600">טיסת חזור:</p>
                                                <p>{option.metadata.return.departureTime} - {option.metadata.return.arrivalTime}</p>
                                                <p className="text-gray-400">{option.metadata.return.airline}</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))
                          ) : (
                            <div className="text-center text-gray-500 py-12">
                                <AlertTriangle className="mx-auto w-12 h-12 mb-4 text-orange-400" />
                                <h3 className="font-bold text-lg">לא נמצאו חלופות</h3>
                                <p>לא הצלחתי למצוא חלופות מתאימות. נסה שוב או שנה את הקריטריונים בצ'אט הראשי.</p>
                            </div>
                          )}
                      </div>
                  )}
              </div>
              {!componentReplaceDialog.loading && (
                <DialogFooter className="p-4 border-t bg-gray-50 rounded-b-xl">
                    <Button variant="ghost" onClick={() => setComponentReplaceDialog(prev => ({...prev, open: false}))}>
                        ביטול
                    </Button>
                </DialogFooter>
              )}
          </DialogContent>
      </Dialog>

      <Dialog open={helpChat.open} onOpenChange={(isOpen) => setHelpChat(prev => ({...prev, open: isOpen}))}>
          <DialogContent className="max-w-lg bg-gray-50 rounded-lg shadow-xl">
              <DialogHeader className="p-4 border-b bg-white">
                  <DialogTitle className="font-bold text-lg text-gray-800">עזרה בבחירת {helpChat.type === 'hotel' ? 'מלון' : helpChat.type === 'flight' ? 'טיסה' : 'רכב'}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                  <ScrollArea className="h-64 p-4" ref={helpChatRef}>
                      <div className="space-y-4">
                        {helpChat.messages.map((msg, i) => {
                          return (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                                    msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-md'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                }`}
                                style={{
                                    overflowWrap: 'break-word',
                                    wordWrap: 'break-word',
                                    lineHeight: '1.5'
                                }}>
                                    <div
                                        className="text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: formatMessageText(msg.content)
                                        }}
                                    />
                                    <div className="text-xs opacity-70 mt-2 text-right">
                                        {format(new Date(msg.timestamp), 'HH:mm')}
                                    </div>
                                </div>
                            </div>
                          );
                        })}
                      </div>
                      {helpChat.responding && <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}
                  </ScrollArea>

                  {helpChat.alternatives && helpChat.alternatives.length > 0 && (
                      <div className="space-y-3 p-2">
                        <p className="text-sm font-semibold text-center text-gray-600">מצאתי המלצה! האם תרצה לבחור בה?</p>
                        <Card className="p-3">
                           <p className="font-bold text-gray-800">{helpChat.alternatives[0].title}</p>
                           <p className="text-xs text-gray-500">{helpChat.alternatives[0].description}</p>
                           <Badge variant="secondary" className="mt-2">${helpChat.alternatives[0].price}</Badge>
                        </Card>
                        <Button onClick={() => handleHelpChatSelect(helpChat.alternatives[0])} className="w-full bg-green-600 hover:bg-green-700" disabled={helpChat.responding}>
                            <Check className="w-4 h-4 ml-2"/>
                            כן, בחר באפשרות זו
                        </Button>
                      </div>
                  )}

                  {(helpChat.alternatives && helpChat.alternatives.length === 0) || !helpChat.alternatives && (
                      <div className="flex gap-2 items-center pt-2 p-4 bg-white border-t">
                          <Textarea
                              ref={helpChatInputRef}
                              placeholder="ספר לי מה אתה מחפש..."
                              value={helpChat.input}
                              onChange={(e) => setHelpChat(prev => ({ ...prev, input: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleHelpChatSubmit();
                                }
                              }}
                              disabled={helpChat.responding}
                              className="resize-none"
                              rows={1}
                              onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                          />
                          <Button onClick={handleHelpChatSubmit} disabled={helpChat.responding || !helpChat.input.trim()}>
                              {helpChat.responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                      </div>
                  )}
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}
