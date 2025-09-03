import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { BloggerTrip } from '@/api/entities';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TimePicker } from '@/components/ui/time-picker';
import { 
  Check, 
  Save, 
  Plus, 
  Trash2, 
  Calendar,

  Image,
  DollarSign,
  MapPin,
  Clock,
  Edit,
  ArrowUp,
  ArrowDown,
  Upload,
  AlertTriangle
} from 'lucide-react';

export default function TripEditorPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const [activeDay, setActiveDay] = useState(1);
  const [saveStatus, setSaveStatus] = useState("");
  
  const [tripData, setTripData] = useState({
    title: '',
    destination: '',
    destinations: [],
    trip_type: [],
    duration: 7,
    cover_image: '',
    gallery: [],
    description: '',
    short_description: '',
    highlights: [],
    price_from: 0,
    itinerary: []
  });
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  useEffect(() => {
    // Initialize itinerary days based on duration
    if (tripData.duration > 0 && (!tripData.itinerary || tripData.itinerary.length < tripData.duration)) {
      const newItinerary = [...(tripData.itinerary || [])];
      
      for (let i = newItinerary.length + 1; i <= tripData.duration; i++) {
        newItinerary.push({
          day: i,
          title: `יום ${i}`,
          description: '',
          activities: []
        });
      }
      
      setTripData({
        ...tripData,
        itinerary: newItinerary
      });
    }
  }, [tripData.duration]);
  
  const checkAuth = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // In a real app, check if we're editing an existing trip
      const urlParams = new URLSearchParams(window.location.search);
      const tripId = urlParams.get('id');
      
      if (tripId) {
        // Load trip data
        loadTripData(tripId);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      navigate(createPageUrl('Home'));
    } finally {
      setLoading(false);
    }
  };
  
  const loadTripData = (tripId) => {
    // For demo purposes, we'll use sample data
    setTripData({
      title: 'שבוע בפריז: אמנות, אוכל ותרבות',
      destination: 'פריז',
      destinations: ['פריז', 'ורסאי'],
      trip_type: ['culture', 'food', 'city'],
      duration: 7,
      cover_image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1551634979-2b11f8c218da?auto=format&fit=crop&w=800&q=80'
      ],
      description: 'טיול מושלם לפריז הקסומה, עיר האורות והרומנטיקה. במהלך השבוע נסייר באתרים המפורסמים ביותר, נטעם מהמטבח הצרפתי המשובח ונתרשם מהאמנות והתרבות העשירה של העיר.',
      short_description: 'שבוע קסום בעיר האורות - אמנות, אוכל, תרבות והיסטוריה',
      highlights: [
        'ביקור במגדל אייפל וצפייה על העיר',
        'סיור במוזיאון הלובר וצפייה במונה ליזה',
        'שיט על נהר הסן',
        'טיול יום לארמון ורסאי',
        'סיור קולינרי בשוק המקומי'
      ],
      price_from: 1200,
      itinerary: [
        {
          day: 1,
          title: 'הגעה לפריז והתמקמות',
          description: 'נחיתה בשדה התעופה שארל דה גול, הגעה למלון והתארגנות. בערב, ארוחת ערב ראשונה במסעדה מקומית וטיול רגלי להתרשמות ראשונית מהעיר.',
          activities: [
            {
              time: '10:00',
              title: 'הגעה לשדה התעופה',
              description: 'נחיתה בשדה התעופה שארל דה גול',
              location: 'שדה התעופה שארל דה גול'
            },
            {
              time: '12:00',
              title: 'צ\'ק-אין במלון',
              description: 'התמקמות במלון במרכז העיר',
              location: 'מלון פריז סנטר, רחוב ריבולי'
            },
            {
              time: '19:00',
              title: 'ארוחת ערב',
              description: 'ארוחת ערב במסעדה צרפתית מסורתית',
              location: 'Le Petit Bistrot, מרכז העיר'
            }
          ]
        },
        {
          day: 2,
          title: 'מוזיאון הלובר',
          description: 'יום שלם מוקדש לאחד המוזיאונים החשובים בעולם. נראה את המונה ליזה, את הוונוס ממילו ועוד יצירות מופת רבות.',
          activities: [
            {
              time: '09:00',
              title: 'ארוחת בוקר',
              description: 'ארוחת בוקר במלון',
              location: 'מלון פריז סנטר'
            },
            {
              time: '10:30',
              title: 'ביקור במוזיאון הלובר',
              description: 'סיור מודרך במוזיאון הלובר',
              location: 'מוזיאון הלובר, רחוב ריבולי'
            },
            {
              time: '14:00',
              title: 'ארוחת צהריים',
              description: 'ארוחת צהריים בקפה סמוך ללובר',
              location: 'Café Marly, רחוב ריבולי'
            }
          ]
        },
        // Rest of the days would be here
      ]
    });
  };
  
  const handleInputChange = (field, value) => {
    setTripData({
      ...tripData,
      [field]: value
    });
  };
  
  const handleAddHighlight = () => {
    setTripData({
      ...tripData,
      highlights: [...tripData.highlights, '']
    });
  };
  
  const handleHighlightChange = (index, value) => {
    const newHighlights = [...tripData.highlights];
    newHighlights[index] = value;
    
    setTripData({
      ...tripData,
      highlights: newHighlights
    });
  };
  
  const handleRemoveHighlight = (index) => {
    const newHighlights = [...tripData.highlights];
    newHighlights.splice(index, 1);
    
    setTripData({
      ...tripData,
      highlights: newHighlights
    });
  };
  
  const handleAddActivity = (dayIndex) => {
    const newItinerary = [...tripData.itinerary];
    
    newItinerary[dayIndex].activities.push({
      time: '',
      title: '',
      description: '',
      location: ''
    });
    
    setTripData({
      ...tripData,
      itinerary: newItinerary
    });
  };
  
  const handleActivityChange = (dayIndex, activityIndex, field, value) => {
    const newItinerary = [...tripData.itinerary];
    
    newItinerary[dayIndex].activities[activityIndex][field] = value;
    
    setTripData({
      ...tripData,
      itinerary: newItinerary
    });
  };
  
  const handleRemoveActivity = (dayIndex, activityIndex) => {
    const newItinerary = [...tripData.itinerary];
    
    newItinerary[dayIndex].activities.splice(activityIndex, 1);
    
    setTripData({
      ...tripData,
      itinerary: newItinerary
    });
  };
  
  const handleDayTitleChange = (dayIndex, value) => {
    const newItinerary = [...tripData.itinerary];
    
    newItinerary[dayIndex].title = value;
    
    setTripData({
      ...tripData,
      itinerary: newItinerary
    });
  };
  
  const handleDayDescriptionChange = (dayIndex, value) => {
    const newItinerary = [...tripData.itinerary];
    
    newItinerary[dayIndex].description = value;
    
    setTripData({
      ...tripData,
      itinerary: newItinerary
    });
  };
  
  const moveActivity = (dayIndex, activityIndex, direction) => {
    const newItinerary = [...tripData.itinerary];
    const activities = newItinerary[dayIndex].activities;
    
    if (direction === 'up' && activityIndex > 0) {
      // Swap with the activity above
      [activities[activityIndex], activities[activityIndex - 1]] = 
      [activities[activityIndex - 1], activities[activityIndex]];
    } else if (direction === 'down' && activityIndex < activities.length - 1) {
      // Swap with the activity below
      [activities[activityIndex], activities[activityIndex + 1]] = 
      [activities[activityIndex + 1], activities[activityIndex]];
    }
    
    setTripData({
      ...tripData,
      itinerary: newItinerary
    });
  };
  
  const handleSave = async (status = 'draft') => {
    setSaveStatus("saving");
    
    try {
      // In a real app, this would save to your database
      // For the demo, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus("saved");
      
      setTimeout(() => {
        setSaveStatus("");
      }, 2000);
      
      if (status === 'published') {
        navigate(createPageUrl('BloggerDashboard'));
      }
    } catch (error) {
      console.error("Error saving trip:", error);
      setSaveStatus("error");
    }
  };
  
  const renderBasicInfoTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>פרטים בסיסיים</CardTitle>
          <CardDescription>
            מידע כללי על הטיול
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת הטיול</Label>
            <Input
              id="title"
              value={tripData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="לדוגמה: שבוע קסום בברצלונה"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destination">יעד ראשי</Label>
              <Input
                id="destination"
                value={tripData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                placeholder="לדוגמה: ברצלונה"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">משך הטיול (ימים)</Label>
              <Input
                id="duration"
                type="number"
                value={tripData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                min={1}
                max={30}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="short_description">תיאור קצר</Label>
            <Input
              id="short_description"
              value={tripData.short_description}
              onChange={(e) => handleInputChange('short_description', e.target.value)}
              placeholder="תיאור קצר שיופיע בתוצאות החיפוש"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">תיאור מלא</Label>
            <Textarea
              id="description"
              value={tripData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="תאר את הטיול בפירוט"
              className="min-h-[150px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="trip_type">סוג טיול</Label>
            <Select
              value={tripData.trip_type[0] || ""}
              onValueChange={(value) => handleInputChange('trip_type', [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג טיול" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adventure">הרפתקאות</SelectItem>
                <SelectItem value="culture">תרבות ואמנות</SelectItem>
                <SelectItem value="romantic">רומנטי</SelectItem>
                <SelectItem value="family">משפחתי</SelectItem>
                <SelectItem value="beach">חופים ושמש</SelectItem>
                <SelectItem value="city">עירוני</SelectItem>
                <SelectItem value="food">קולינרי</SelectItem>
                <SelectItem value="nature">טבע</SelectItem>
                <SelectItem value="luxury">יוקרה</SelectItem>
                <SelectItem value="budget">תקציב נמוך</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price_from">מחיר מ- (בדולרים)</Label>
            <Input
              id="price_from"
              type="number"
              value={tripData.price_from}
              onChange={(e) => handleInputChange('price_from', parseInt(e.target.value))}
              min={0}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>תמונות</CardTitle>
          <CardDescription>
            הוסף תמונות שימחישו את הטיול
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>תמונה ראשית</Label>
            <div className="border rounded-md p-4 flex flex-col items-center justify-center">
              {tripData.cover_image ? (
                <div className="relative w-full">
                  <img
                    src={tripData.cover_image}
                    alt="Cover"
                    className="w-full h-64 object-cover rounded-md"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <Button variant="secondary">
                      <Edit className="mr-2 h-4 w-4" />
                      החלף תמונה
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  העלאת תמונה ראשית
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>גלריית תמונות</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tripData.gallery.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border rounded-md flex items-center justify-center h-32">
                <Button variant="ghost">
                  <Plus className="mr-2 h-4 w-4" />
                  הוסף תמונה
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>הדגשים בטיול</span>
            <Button variant="outline" size="sm" onClick={handleAddHighlight}>
              <Plus className="mr-2 h-4 w-4" />
              הוסף נקודת ציון
            </Button>
          </CardTitle>
          <CardDescription>
            הוסף את הנקודות המרכזיות שיופיעו בדף הטיול
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tripData.highlights.map((highlight, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={highlight}
                  onChange={(e) => handleHighlightChange(index, e.target.value)}
                  placeholder={`נקודה ${index + 1}`}
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveHighlight(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {tripData.highlights.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                אין עדיין נקודות ציון. לחץ על "הוסף נקודת ציון" כדי להוסיף.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const renderItineraryTab = () => (
    <div>
      <div className="grid md:grid-cols-12 gap-6">
        {/* Day selection sidebar */}
        <div className="md:col-span-3">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>ימי הטיול</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tripData.itinerary.map((day, index) => (
                  <Button
                    key={index}
                    variant={activeDay === day.day ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setActiveDay(day.day)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    יום {day.day}: {day.title ? day.title.substring(0, 20) + (day.title.length > 20 ? '...' : '') : `יום ${day.day}`}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Day details */}
        <div className="md:col-span-9">
          {tripData.itinerary.map((day, dayIndex) => {
            if (day.day !== activeDay) return null;
            
            return (
              <div key={dayIndex} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Input
                        value={day.title}
                        onChange={(e) => handleDayTitleChange(dayIndex, e.target.value)}
                        placeholder={`יום ${day.day}`}
                        className="text-xl font-bold"
                      />
                    </CardTitle>
                    <CardDescription>
                      <Textarea
                        value={day.description}
                        onChange={(e) => handleDayDescriptionChange(dayIndex,  e.target.value)}
                        placeholder="תיאור כללי של היום"
                        className="mt-2"
                      />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {day.activities.map((activity, activityIndex) => (
                        <div key={activityIndex} className="border p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => moveActivity(dayIndex, activityIndex, 'up')}
                                  disabled={activityIndex === 0}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => moveActivity(dayIndex, activityIndex, 'down')}
                                  disabled={activityIndex === day.activities.length - 1}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              </div>
                              <Badge>פעילות {activityIndex + 1}</Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveActivity(dayIndex, activityIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label className="flex items-center">
                                <Clock className="mr-1 h-4 w-4" />
                                זמן
                              </Label>
                              <Input
                                value={activity.time}
                                onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'time', e.target.value)}
                                placeholder="לדוגמה: 10:00"
                              />
                            </div>
                            
                            <div className="space-y-2 md:col-span-3">
                              <Label>כותרת</Label>
                              <Input
                                value={activity.title}
                                onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'title', e.target.value)}
                                placeholder="לדוגמה: ביקור במוזיאון"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2 mt-4">
                            <Label>תיאור</Label>
                            <Textarea
                              value={activity.description}
                              onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'description', e.target.value)}
                              placeholder="תיאור הפעילות"
                            />
                          </div>
                          
                          <div className="space-y-2 mt-4">
                            <Label className="flex items-center">
                              <MapPin className="mr-1 h-4 w-4" />
                              מיקום
                            </Label>
                            <Input
                              value={activity.location}
                              onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'location', e.target.value)}
                              placeholder="לדוגמה: מוזיאון הלובר, פריז"
                            />
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleAddActivity(dayIndex)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        הוסף פעילות ליום {day.day}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  
  const renderPreviewTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>תצוגה מקדימה</CardTitle>
          <CardDescription>
            כך ייראה הטיול שלך בדף הטיול
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6">
            <div className="relative w-full h-64 mb-6">
              <img 
                src={tripData.cover_image || "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80"} 
                alt={tripData.title}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  {tripData.trip_type.includes('culture') && <Badge>תרבות ואמנות</Badge>}
                  {tripData.trip_type.includes('food') && <Badge>קולינרי</Badge>}
                  {tripData.trip_type.includes('city') && <Badge>עירוני</Badge>}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{tripData.title || "כותרת הטיול"}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{tripData.destination || "יעד"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{tripData.duration || 0} ימים</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>מ-${tripData.price_from || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">תיאור</h2>
              <p>{tripData.description || "אין תיאור עדיין"}</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">נקודות בולטות</h2>
              {tripData.highlights.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {tripData.highlights.map((highlight, index) => (
                    <li key={index}>{highlight}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">לא נוספו נקודות בולטות</p>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold mb-3">מסלול הטיול</h2>
              {tripData.itinerary.length > 0 ? (
                <div className="space-y-4">
                  {tripData.itinerary.slice(0, 2).map((day, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <h3 className="font-bold">יום {day.day}: {day.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{day.description}</p>
                      
                      <div className="space-y-2 mt-4">
                        {day.activities.map((activity, actIndex) => (
                          <div key={actIndex} className="flex items-start gap-3">
                            <div className="text-sm font-medium text-gray-500 min-w-[40px]">
                              {activity.time}
                            </div>
                            <div>
                              <div className="font-medium">{activity.title}</div>
                              <div className="text-sm text-muted-foreground">{activity.description}</div>
                              {activity.location && (
                                <div className="text-sm flex items-center text-blue-600 mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {activity.location}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {tripData.itinerary.length > 2 && (
                    <div className="text-center">
                      <Badge variant="outline">
                        ועוד {tripData.itinerary.length - 2} ימים...
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">לא נוסף מסלול טיול</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {tripData.title ? `עריכת: ${tripData.title}` : 'טיול חדש'}
          </h1>
          <p className="text-muted-foreground">
            {tripData.title ? 'עריכת טיול קיים' : 'יצירת טיול חדש'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {saveStatus === "saving" && (
            <span className="text-muted-foreground flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              שומר...
            </span>
          )}
          
          {saveStatus === "saved" && (
            <span className="text-green-600 flex items-center">
              <Check className="mr-2 h-4 w-4" />
              נשמר בהצלחה
            </span>
          )}
          
          {saveStatus === "error" && (
            <span className="text-red-600 flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              שגיאה בשמירה
            </span>
          )}
          
          <Button variant="outline" onClick={() => navigate(createPageUrl('BloggerDashboard'))}>
            ביטול
          </Button>
          <Button variant="outline" onClick={() => handleSave('draft')}>
            <Save className="mr-2 h-4 w-4" />
            שמור כטיוטה
          </Button>
          <Button onClick={() => handleSave('published')}>
            פרסם טיול
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="basic">פרטים בסיסיים</TabsTrigger>
          <TabsTrigger value="itinerary">מסלול הטיול</TabsTrigger>
          <TabsTrigger value="preview">תצוגה מקדימה</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          {renderBasicInfoTab()}
        </TabsContent>
        
        <TabsContent value="itinerary">
          {renderItineraryTab()}
        </TabsContent>
        
        <TabsContent value="preview">
          {renderPreviewTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}