
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trip } from '@/api/entities';
import { TripItinerary } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  ArrowLeft,
  Send,
  AlertTriangle,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  Briefcase,
  CheckCircle,
  Loader2,
  Bot,
  Plane,
  Hotel,
  Car,
  Ticket,
  Utensils
} from 'lucide-react';
import { format, addDays, isBefore, isAfter, parseISO } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import TripPlanningAnimation from '../components/animations/TripPlanningAnimation';
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { generateTripPlan } from '../components/ai/TripPlannerAI';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SystemSettings } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { useLanguage } from '../components/contexts/LanguageContext';

// הסרת המפתח של גוגל, הוא כבר לא בשימוש
// const GOOGLE_PLACES_API_KEY = 'AIzaSyCz9AozUcYjF9cIu26UaUWKpu46EsUGwrE';

// רשימת יעדים מקיפה
const DESTINATIONS_DATABASE = [
  // אירופה
  { id: 'paris_france', name_he: 'פריז, צרפת', name_en: 'Paris, France', country: 'France' },
  { id: 'rome_italy', name_he: 'רומא, איטליה', name_en: 'Rome, Italy', country: 'Italy' },
  { id: 'london_uk', name_he: 'לונדון, בריטניה', name_en: 'London, UK', country: 'UK' },
  { id: 'barcelona_spain', name_he: 'ברצלונה, ספרד', name_en: 'Barcelona, Spain', country: 'Spain' },
  { id: 'amsterdam_netherlands', name_he: 'אמסטרדם, הולנד', name_en: 'Amsterdam, Netherlands', country: 'Netherlands' },
  { id: 'berlin_germany', name_he: 'ברלין, גרמניה', name_en: 'Berlin, Germany', country: 'Germany' },
  { id: 'vienna_austria', name_he: 'וינה, אוסטריה', name_en: 'Vienna, Austria', country: 'Austria' },
  { id: 'prague_czech', name_he: 'פראג, צ׳כיה', name_en: 'Prague, Czech Republic', country: 'Czech Republic' },
  { id: 'lisbon_portugal', name_he: 'ליסבון, פורטוגל', name_en: 'Lisbon, Portugal', country: 'Portugal' },
  { id: 'madrid_spain', name_he: 'מדריד, ספרד', name_en: 'Madrid, Spain', country: 'Spain' },
  { id: 'budapest_hungary', name_he: 'בודפשט, הונגריה', name_en: 'Budapest, Hungary', country: 'Hungary' },
  { id: 'florence_italy', name_he: 'פירנצה, איטליה', name_en: 'Florence, Italy', country: 'Italy' },
  { id: 'venice_italy', name_he: 'ונציה, איטליה', name_en: 'Venice, Italy', country: 'Italy' },
  { id: 'milan_italy', name_he: 'מילאנו, איטליה', name_en: 'Milan, Italy', country: 'Italy' },
  { id: 'brussels_belgium', name_he: 'בריסל, בלגיה', name_en: 'Brussels, Belgium', country: 'Belgium' },
  { id: 'zurich_switzerland', name_he: 'ציריך, שוויץ', name_en: 'Zurich, Switzerland', country: 'Switzerland' },
  { id: 'stockholm_sweden', name_he: 'שטוקהולם, שבדיה', name_en: 'Stockholm, Sweden', country: 'Sweden' },
  { id: 'copenhagen_denmark', name_he: 'קופנהגן, דנמרק', name_en: 'Copenhagen, Denmark', country: 'Denmark' },
  { id: 'oslo_norway', name_he: 'אוסלו, נורבגיה', name_en: 'Oslo, Norway', country: 'Norway' },
  { id: 'helsinki_finland', name_he: 'הלסינקי, פינלנד', name_en: 'Helsinki, Finland', country: 'Finland' },
  { id: 'istanbul_turkey', name_he: 'איסטנבול, טורקיה', name_en: 'Istanbul, Turkey', country: 'Turkey' },
  { id: 'athens_greece', name_he: 'אתונה, יוון', name_en: 'Athens, Greece', country: 'Greece' },
  { id: 'santorini_greece', name_he: 'סנטוריני, יוון', name_en: 'Santorini, Greece', country: 'Greece' },
  { id: 'mykonos_greece', name_he: 'מיקונוס, יוון', name_en: 'Mykonos, Greece', country: 'Greece' },
  { id: 'dubrovnik_croatia', name_he: 'דוברובניק, קרואטיה', name_en: 'Dubrovnik, Croatia', country: 'Croatia' },
  { id: 'split_croatia', name_he: 'ספליט, קרואטיה', name_en: 'Split, Croatia', country: 'Croatia' },
  { id: 'reykjavik_iceland', name_he: 'רייקיאוויק, איסלנד', name_en: 'Reykjavik, Iceland', country: 'Iceland' },

  // צפון אמריקה
  { id: 'new_york_usa', name_he: 'ניו יורק, ארה״ב', name_en: 'New York, USA', country: 'USA' },
  { id: 'los_angeles_usa', name_he: 'לוס אנג׳לס, ארה״ב', name_en: 'Los Angeles, USA', country: 'USA' },
  { id: 'san_francisco_usa', name_he: 'סן פרנסיסקו, ארה״ב', name_en: 'San Francisco, USA', country: 'USA' },
  { id: 'miami_usa', name_he: 'מיאמי, ארה״ב', name_en: 'Miami, USA', country: 'USA' },
  { id: 'las_vegas_usa', name_he: 'לאס וגאס, ארה״ב', name_en: 'Las Vegas, USA', country: 'USA' },
  { id: 'chicago_usa', name_he: 'שיקגו, ארה״ב', name_en: 'Chicago, USA', country: 'USA' },
  { id: 'boston_usa', name_he: 'בוסטון, ארה״ב', name_en: 'Boston, USA', country: 'USA' },
  { id: 'washington_usa', name_he: 'וושינגטון, ארה״ב', name_en: 'Washington DC, USA', country: 'USA' },
  { id: 'toronto_canada', name_he: 'טורונטו, קנדה', name_en: 'Toronto, Canada', country: 'Canada' },
  { id: 'vancouver_canada', name_he: 'ונקובר, קנדה', name_en: 'Vancouver, Canada', country: 'Canada' },
  { id: 'montreal_canada', name_he: 'מונטריאול, קנדה', name_en: 'Montreal, Canada', country: 'Canada' },

  // אסיא
  { id: 'tokyo_japan', name_he: 'טוקיו, יפן', name_en: 'Tokyo, Japan', country: 'Japan' },
  { id: 'kyoto_japan', name_he: 'קיוטו, יפן', name_en: 'Kyoto, Japan', country: 'Japan' },
  { id: 'osaka_japan', name_he: 'אוסקה, יפן', name_en: 'Osaka, Japan', country: 'Japan' },
  { id: 'seoul_korea', name_he: 'סיאול, קוריאה', name_en: 'Seoul, South Korea', country: 'South Korea' },
  { id: 'bangkok_thailand', name_he: 'בנגקוק, תאילנד', name_en: 'Bangkok, Thailand', country: 'Thailand' },
  { id: 'phuket_thailand', name_he: 'פוקט, תאילנד', name_en: 'Phuket, Thailand', country: 'Thailand' },
  { id: 'singapore', name_he: 'סינגפור', name_en: 'Singapore', country: 'Singapore' },
  { id: 'hong_kong', name_he: 'הונג קונג', name_en: 'Hong Kong', country: 'Hong Kong' },
  { id: 'shanghai_china', name_he: 'שנחאי, סין', name_en: 'Shanghai, China', country: 'China' },
  { id: 'beijing_china', name_he: 'בייג׳ינג, סין', name_en: 'Beijing, China', country: 'China' },
  { id: 'dubai_uae', name_he: 'דובאי, איחוד האמירויות', name_en: 'Dubai, UAE', country: 'UAE' },
  { id: 'abu_dhabi_uae', name_he: 'אבו דאבי, איחוד האמירויות', name_en: 'Abu Dhabi, UAE', country: 'UAE' },
  { id: 'mumbai_india', name_he: 'מומבאי, הודו', name_en: 'Mumbai, India', country: 'India' },
  { id: 'delhi_india', name_he: 'דלהי, הודו', name_en: 'Delhi, India', country: 'India' },
  { id: 'goa_india', name_he: 'גואה, הודו', name_en: 'Goa, India', country: 'India' },

  // אוקיאניה
  { id: 'sydney_australia', name_he: 'סידני, אוסטרליה', name_en: 'Sydney, Australia', country: 'Australia' },
  { id: 'melbourne_australia', name_he: 'מלבורן, אוסטרליה', name_en: 'Melbourne, Australia', country: 'Australia' },
  { id: 'brisbane_australia', name_he: 'בריסביין, אוסטרליה', name_en: 'Brisbane, Australia', country: 'Australia' },
  { id: 'auckland_nz', name_he: 'אוקלנד, ניו זילנד', name_en: 'Auckland, New Zealand', country: 'New Zealand' },

  // דרום אמריקה
  { id: 'rio_brazil', name_he: 'ריו דה ז׳נרו, ברזיל', name_en: 'Rio de Janeiro, Brazil', country: 'Brazil' },
  { id: 'sao_paulo_brazil', name_he: 'סאו פאולו, ברזיל', name_en: 'São Paulo, Brazil', country: 'Brazil' },
  { id: 'buenos_aires_argentina', name_he: 'בואנוס איירס, ארגנטינה', name_en: 'Buenos Aires, Argentina', country: 'Argentina' },
  { id: 'lima_peru', name_he: 'לימה, פרו', name_en: 'Lima, Peru', country: 'Peru' },
  { id: 'cusco_peru', name_he: 'קוסקו, פרו', name_en: 'Cusco, Peru', country: 'Peru' },

  // אפריקה
  { id: 'cape_town_sa', name_he: 'קייפטאון, דרום אפריקה', name_en: 'Cape Town, South Africa', country: 'South Africa' },
  { id: 'johannesburg_sa', name_he: 'יוהנסבורג, דרום אפריקה', name_en: 'Johannesburg, South Africa', country: 'South Africa' },
  { id: 'cairo_egypt', name_he: 'קהיר, מצרים', name_en: 'Cairo, Egypt', country: 'Egypt' },
  { id: 'marrakech_morocco', name_he: 'מרקש, מרוקו', name_en: 'Marrakech, Morocco', country: 'Morocco' },
  { id: 'casablanca_morocco', name_he: 'קזבלנקה, מרוקו', name_en: 'Casablanca, Morocco', country: 'Morocco' }
];

const PlacesAutocomplete = ({ value, onSelect, placeholder, language, setIsDestinationSelected }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);

  const searchPlaces = (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setLoading(false); // Ensure loading is false if query is too short
      return;
    }

    setLoading(true);
    // חיפוש רק במאגר הנתונים הפנימי והיציב
    const results = DESTINATIONS_DATABASE.filter(dest => {
        const nameHe = dest.name_he.toLowerCase();
        const nameEn = dest.name_en.toLowerCase();
        const queryLower = query.toLowerCase();
        return nameHe.includes(queryLower) || nameEn.includes(queryLower);
      }).slice(0, 8).map(dest => ({
        place_id: dest.id,
        description: language === 'he' ? dest.name_he : dest.name_en
      }));
      
    setSuggestions(results);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    setIsDestinationSelected(false); // Invalidate selection on manual input

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    onSelect(suggestion.description);
    setIsDestinationSelected(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[0]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Update internal input value when prop value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  return (
    <div className="relative" ref={inputRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-10 py-6 text-lg"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center gap-2"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm">{suggestion.description}</span>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && inputValue && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-sm">
            {language === 'he' ? 'לא נמצאו יעדים' : 'No destinations found'}
          </div>
        </div>
      )}
    </div>
  );
};

export default function PlanTripPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false); // This state seems unused now, but kept as it was in original
  const [showPlanningChat, setShowPlanningChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // This state seems unused, as chatHistory is managed within PlanningChat
  const [isDestinationSelected, setIsDestinationSelected] = useState(false); // State to track valid selection
  const today = new Date();

  const [tripData, setTripData] = useState({
    destination: '',
    start_date: null,
    end_date: null,
    num_adults: 1,
    num_children: 0,
    children_ages: [],
    trip_type: '',
    budget_min: 1000,
    budget_max: 5000,
    preferences: {
      include_flights: true,
      include_hotels: true,
      include_cars: false,
      include_activities: true,
      include_restaurants: false
    },
    notes: ""
  });

  const handleChange = (field, value) => {
    setTripData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumChange = (field, value, increment = false) => {
    let numValue;

    if (increment) {
      numValue = tripData[field] + value;
    } else {
      numValue = parseInt(value);
      if (isNaN(numValue)) numValue = 0;
    }

    if (field === 'num_adults') {
      numValue = Math.max(1, Math.min(10, numValue));
    } else if (field === 'num_children') {
      numValue = Math.max(0, Math.min(10, numValue));
    }

    handleChange(field, numValue);
  };

  const handleChildAgeChange = (index, value, increment = false) => {
    let numValue;

    if (increment) {
      numValue = tripData.children_ages[index] + value;
    } else {
      numValue = parseInt(value);
      if (isNaN(numValue)) numValue = 0;
    }

    numValue = Math.max(0, Math.min(17, numValue));

    const newAges = [...tripData.children_ages];
    newAges[index] = numValue;

    setTripData(prev => ({
      ...prev,
      children_ages: newAges
    }));
  };

  useEffect(() => {
    if (tripData.num_children > tripData.children_ages.length) {
      const newAges = [...tripData.children_ages];
      for (let i = tripData.children_ages.length; i < tripData.num_children; i++) {
        newAges.push(0);
      }
      setTripData(prev => ({ ...prev, children_ages: newAges }));
    } else if (tripData.num_children < tripData.children_ages.length) {
      setTripData(prev => ({
        ...prev,
        children_ages: prev.children_ages.slice(0, tripData.num_children)
      }));
    }
  }, [tripData.num_children]);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">{t('tripDestination')}</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('whereToTravel')}</Label>
                <PlacesAutocomplete
                  value={tripData.destination}
                  onSelect={(destination) => {
                    handleChange('destination', destination);
                    setIsDestinationSelected(true);
                  }}
                  setIsDestinationSelected={setIsDestinationSelected}
                  placeholder={language === 'he' ? "הזינו יעד (לדוגמה: פריז, צרפת)" : "Enter destination (e.g., Paris, France)"}
                  language={language}
                />
                <p className="text-sm text-muted-foreground">
                  {language === 'he'
                    ? 'התחילו להקליד ובחרו יעד מהרשימה'
                    : 'Start typing and select a destination from the list'
                  }
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">{t('tripDates')}</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('departureDate')}</Label>
                <div className="flex">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-between text-right ${!tripData.start_date ? 'text-muted-foreground' : ''}`}
                      >
                        {tripData.start_date ? (
                          format(tripData.start_date, 'dd/MM/yyyy')
                        ) : (
                          <span>{t('chooseDepartureDate')}</span>
                        )}
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tripData.start_date}
                        onSelect={(date) => {
                          handleChange('start_date', date);
                          if (!tripData.end_date || isBefore(tripData.end_date, date)) {
                            handleChange('end_date', addDays(date, 7));
                          }
                        }}
                        disabled={(date) => isBefore(date, today)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('returnDate')}</Label>
                <div className="flex">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-between text-right ${!tripData.end_date ? 'text-muted-foreground' : ''}`}
                      >
                        {tripData.end_date ? (
                          format(tripData.end_date, 'dd/MM/yyyy')
                        ) : (
                          <span>{t('chooseReturnDate')}</span>
                        )}
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tripData.end_date}
                        onSelect={(date) => handleChange('end_date', date)}
                        disabled={(date) =>
                          isBefore(date, today) ||
                          (tripData.start_date && isBefore(date, tripData.start_date))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Moved from original case 4
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">{t('numberOfTravelers')}</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('numAdults')}</Label>
                <div className="flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleNumChange('num_adults', -1, true)}
                    disabled={tripData.num_adults <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    className="mx-2 text-center"
                    value={tripData.num_adults}
                    onChange={(e) => handleNumChange('num_adults', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleNumChange('num_adults', 1, true)}
                    disabled={tripData.num_adults >= 10}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('numChildren')}</Label>
                <div className="flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleNumChange('num_children', -1, true)}
                    disabled={tripData.num_children <= 0}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    className="mx-2 text-center"
                    value={tripData.num_children}
                    onChange={(e) => handleNumChange('num_children', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleNumChange('num_children', 1, true)}
                    disabled={tripData.num_children >= 10}
                  >
                    +
                  </Button>
                </div>
              </div>

              {tripData.num_children > 0 && (
                <div className="space-y-3 mt-6">
                  <Label>{t('childrenAges')}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {tripData.children_ages.map((age, index) => (
                      <div key={index} className="space-y-2">
                        <Label>{t('child')} {index + 1}</Label>
                        <div className="flex">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleChildAgeChange(index, -1, true)}
                            disabled={age <= 0}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            max="17"
                            className="mx-2 text-center"
                            value={age}
                            onChange={(e) => handleChildAgeChange(index, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleChildAgeChange(index, 1, true)}
                            disabled={age >= 17}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4: // Moved from original case 5
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">{t('budget')}</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('budgetRange')} ($)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">{t('minimum')} ($)</Label>
                    <div className="flex">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleChange('budget_min', Math.max(0, tripData.budget_min - 500))}
                        disabled={tripData.budget_min <= 0}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        placeholder={t('minimum')}
                        className="mx-2 text-center"
                        value={tripData.budget_min}
                        onChange={(e) => handleChange('budget_min', parseInt(e.target.value) || 0)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleChange('budget_min', tripData.budget_min + 500)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">{t('maximum')} ($)</Label>
                    <div className="flex">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleChange('budget_max', Math.max(tripData.budget_min, tripData.budget_max - 500))}
                        disabled={tripData.budget_max <= tripData.budget_min}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        placeholder={t('maximum')}
                        className="mx-2 text-center"
                        value={tripData.budget_max}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            handleChange('budget_max', value);
                          } else {
                            handleChange('budget_max', tripData.budget_min);
                          }
                        }}
                        onBlur={(e) => {
                            let value = parseInt(e.target.value);
                            if (isNaN(value) || value < tripData.budget_min) {
                                handleChange('budget_max', Math.max(tripData.budget_min, 1));
                            }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleChange('budget_max', tripData.budget_max + 500)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5: // Combined from original case 5 (Trip Type) and case 6 (Additional Notes)
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">{t('tripType')}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('describeTripType')}</Label>
                <Textarea
                  placeholder={t('describeTripType')}
                  value={tripData.trip_type}
                  onChange={(e) => handleChange('trip_type', e.target.value)}
                  className="min-h-[150px] text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'he' ? 'הערות נוספות (לא חובה)' : 'Additional Notes (optional)'}</Label>
                <Textarea
                  placeholder={language === 'he' ? "הוסף הערות נוספות או דרישות מיוחדות לגבי הטיול..." : "Add additional notes or special requirements for your trip..."}
                  value={tripData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="min-h-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  {t('notesDescription')}
                </p>
              </div>
            </div>
          </div>
        );

      case 6: // Summary (moved from original case 7)
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">{t('summary')}</h2>

            <Card className="p-6 mb-6">
              <div className="grid md:grid-cols-1 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('tripDetails')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('destination')}:</span>
                      <span className="font-medium">{tripData.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('dates')}:</span>
                      <span className="font-medium">
                        {tripData.start_date && format(tripData.start_date, 'dd/MM/yyyy')} -
                        {tripData.end_date && format(tripData.end_date, 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('travelers')}:</span>
                      <span className="font-medium">
                        {tripData.num_adults} {t('adults')}
                        {tripData.num_children > 0 && `, ${tripData.num_children} ${t('children')}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('budget')}:</span>
                      <span className="font-medium">${tripData.budget_min} - ${tripData.budget_max}</span>
                    </div>
                  </div>
                </div>

                {/* Preferences section removed as requested */}
              </div>
            </Card>

            <p className="text-center">
              {t('allReady')}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const validateCurrentStep = () => {
    setError(null);

    switch (step) {
      case 1:
        if (!tripData.destination || tripData.destination.trim() === '' || !isDestinationSelected) {
          setError(language === 'he' ? 'חובה לבחור יעד מהרשימה המוצעת' : 'You must select a destination from the suggestions list');
          return false;
        }
        break;

      case 2:
        if (!tripData.start_date || !tripData.end_date) {
          setError(language === 'he' ? 'חובה לבחור תאריך התחלה וסיום' : 'You must select a start and end date');
          return false;
        }

        if (isBefore(tripData.end_date, tripData.start_date)) {
          setError(language === 'he' ? 'תאריך הסיום לא יכול להיות לפני תאריך ההתחלה' : 'End date cannot be before start date');
          return false;
        }
        break;

      case 5: // This is the new combined step for Trip Type and Notes
        if (!tripData.trip_type || tripData.trip_type.trim() === '') {
          setError(language === 'he' ? 'חובה לתאר את אופי הטיול' : 'You must describe the type of trip');
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  // Handle planning chat completion and generation
  const handlePlanningChatComplete = async (finalChatHistory) => {
    setShowPlanningChat(false);
    setIsGenerating(true);
    setError(null); // Clear previous errors

    try {
      if (!tripData.destination || tripData.destination.trim() === '') {
        throw new Error(t('missingDestinationError'));
      }

      // 1. Create the initial Trip record to get an ID
      const createdTrip = await Trip.create({
        ...tripData,
        status: 'planning' // Set status to 'planning'
      });

      if (!createdTrip || !createdTrip.id) {
          throw new Error(t('failedToCreateTripError'));
      }

      // 2. Generate the full itinerary using the new robust AI planner
      const plan = await generateTripPlan(createdTrip, finalChatHistory);

      if (plan && plan.daily_itinerary && plan.daily_itinerary.length > 0) {
        // 3. Save each day of the itinerary to the database
        const itineraryPromises = plan.daily_itinerary.map(day =>
          TripItinerary.create({ trip_id: createdTrip.id, ...day })
        );
        await Promise.all(itineraryPromises);
      } else {
        // Handle case where AI returns an empty or invalid plan
        throw new Error(t('invalidItineraryError'));
      }

      // 4. Update the trip status to 'draft'
      await Trip.update(createdTrip.id, { status: 'draft' });

      // 5. Navigate DIRECTLY to the TripDetails page. The animation will stop upon navigation.
      navigate(createPageUrl('TripDetails') + `?id=${createdTrip.id}`);

    } catch (error) {
      console.error('Error during the trip generation process:', error);
      setError(`${t('tripGenerationError')}: ${error.message}. ${t('tryAgainLater')}`);
      setIsGenerating(false); // Stop animation and show the error on the current page
    }
  };

  const totalSteps = 6; // Updated from 7 to 6 due to combination of trip type and notes steps

  if (isGenerating) {
    return (
      <TripPlanningAnimation
        destination={tripData.destination}
        tripType={tripData.trip_type}
        isActive={true}
        // Removed the onComplete prop to prevent premature exit.
        // The animation will run until navigation occurs.
      />
    );
  }

  if (showPlanningChat) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <PlanningChat
            tripData={tripData}
            onComplete={handlePlanningChatComplete}
            onBack={() => setShowPlanningChat(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('planNewVacation')}</h1>
        <p className="text-gray-600">
          {t('tellUsAboutVacation')}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-8">
            {[...Array(totalSteps)].map((_, i) => (
              <React.Fragment key={i}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center
                    ${step >= i+1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                  {i+1}
                </div>
                {i < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${step > i+1 ? 'bg-blue-600' : 'bg-gray-200'}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}

          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                {/* Fixed arrow directions for RTL and LTR */}
                {language === 'he' ? <ArrowRight className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
                {t('back')}
              </Button>
            ) : (
              <div></div>
            )}

            {step < totalSteps && (
              <Button onClick={handleNext}>
                {t('continue')}
                {/* Fixed arrow directions for RTL and LTR */}
                {language === 'he' ? <ArrowLeft className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
            {step === totalSteps && (
                <Button
                    onClick={() => setShowPlanningChat(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {language === 'he' ? "התחל בצ'אט" : "Start Chat"}
                    {/* Fixed arrow directions for RTL and LTR, consistent with 'Continue' */}
                    {language === 'he' ? <ArrowLeft className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Planning Chat Component
const PlanningChat = ({ tripData, onComplete, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const { t, language } = useLanguage();

  const loadClarificationPrompt = async () => {
    try {
      const settings = await SystemSettings.list();
      return settings[0]?.clarificationPrompt || (language === 'he' ? `אתה עוזר תכנון טיולים ידידותי. שאל שאלות קצרות להבנת העדפות המשתמש. כשהמשתמש מוכן לתכנון, השב עם [START_PLANNING].` : `You are a friendly trip planning assistant. Ask short questions to understand user preferences. When the user is ready to plan, respond with [START_PLANNING].`);
    } catch (error) {
      console.error('Error loading system settings for prompt:', error);
      return (language === 'he' ? `אתה עוזר תכנון טיולים ידידותי. שאל שאלות קצרות להבנת העדפות המשתמש. כשהמשתמש מוכן לתכנון, השב עם [START_PLANNING].` : `You are a friendly trip planning assistant. Ask short questions to understand user preferences. When the user is ready to plan, respond with [START_PLANNING].`);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top when chat component mounts
    addWelcomeMessage();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isLoading]);

  const addWelcomeMessage = async () => {
    setIsLoading(true);
    try {
      // הודעת הקדמה
      const introMessage = {
        role: 'assistant',
        content: language === 'he'
          ? `שלום! 👋 זהו צ'אט אישי שמטרתו לוודא שהחופשה שלכם תהיה מותאמת בדיוק אליכם.

אני אשאל כמה שאלות קצרות כדי להבין טוב יותר את ההעדפות שלכם. בכל שלב תוכלו לבקש ממני לעבור לתכנון הטיול והמערכת תתחיל ליצור עבורכם את המסלול המושלם!

בואו נתחיל! 🎯`
          : `Hello! 👋 This is a personal chat designed to ensure your vacation is perfectly tailored to you.

I'll ask a few short questions to better understand your preferences. At any stage, you can ask me to proceed with planning and the system will start creating the perfect itinerary for you!

Let's get started! 🎯`,
        timestamp: new Date()
      };

      const clarificationPrompt = await loadClarificationPrompt();

      const tripContext = `
        Trip Data: ${JSON.stringify(tripData)}
        Context: The user has just finished the questionnaire with all basic trip details. Now start a personalized clarification chat. Focus ONLY on details not covered in the questionnaire.
      `;

      const response = await InvokeLLM({
        prompt: `${clarificationPrompt}\n\n${tripContext}`,
        add_context_from_internet: false
      });

      const welcomeMsg = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages([introMessage, welcomeMsg]);

    } catch (error) {
      console.error('Error generating welcome message:', error);
      const fallbackMsg = {
        role: 'assistant',
        content: t('welcomeChatFallback', {
            destination: tripData.destination,
            tripType: tripData.trip_type,
            numAdults: tripData.num_adults
        }),
        timestamp: new Date()
      };
      setMessages([fallbackMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation context from all current messages
      const conversationContext = updatedMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      const tripContext = `
        Trip Details: ${JSON.stringify(tripData)}
        Current Conversation: ${conversationContext}
      `;

      const systemPrompt = await loadClarificationPrompt();

      const response = await InvokeLLM({
        prompt: `${systemPrompt}\n\nContext: ${tripContext}`,
        add_context_from_internet: false
      });

      // Check for navigation commands
      if (response && (response.includes('navigateTo("TripDetails")') || response.includes('[START_PLANNING]'))) {
        // Extract the message part before the navigation command
        const cleanMessage = response
          .replace(/```javascript[\s\S]*?```/g, '') // Remove javascript code blocks
          .replace(/\[START_PLANNING\]/g, '') // Remove START_PLANNING token
          .replace(/navigateTo\("TripDetails"\)/g, '') // Remove navigateTo("TripDetails") command
          .trim();

        if (cleanMessage) {
          // Show the AI's transition message first (without the technical command)
          const transitionMessage = { role: 'assistant', content: cleanMessage, timestamp: new Date() };
          setMessages(prev => [...prev, transitionMessage]);

          // Wait a moment then start planning
          setTimeout(() => {
            onComplete(updatedMessages);
          }, 1500);
        } else {
          // If no transition message, start immediately
          onComplete(updatedMessages);
        }
        return;
      }

      const aiMessage = { role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error in planning chat:', error);
      const errorMessage = {
        role: 'assistant',
        content: t('errorInChat'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          {t('clarifyTripDetails')}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4" ref={chatRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {format(message.timestamp, 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-gray-50 flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t('writeYourAnswer')}
                disabled={isLoading}
                className="flex-1 resize-none min-h-[40px] max-h-[120px]"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '40px'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={onBack}>
                {t('backToQuestionnaire')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
