import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BloggerTrip } from '@/api/entities';
import { Blogger } from '@/api/entities';
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { 
  Calendar,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Upload,
  Image,
  X,
  MapPin,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function CreateBloggerTripPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [blogger, setBlogger] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [tripData, setTripData] = useState({
    title: '',
    destination: '',
    destinations: [],
    trip_type: [],
    duration: 1,
    cover_image: '',
    gallery: [],
    description: '',
    short_description: '',
    highlights: [''],
    price_from: 0,
    itinerary: [
      {
        day: 1,
        title: 'יום 1',
        description: '',
        activities: [
          {
            time: '09:00',
            title: '',
            description: '',
            location: ''
          }
        ]
      }
    ]
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const bloggerSession = sessionStorage.getItem('currentBlogger');
      
      if (!bloggerSession) {
        setError('רק בלוגרים רשאים ליצור טיולים. יש להתחבר תחילה.');
        navigate(createPageUrl('BloggerLogin'));
        return;
      }

      const bloggerData = JSON.parse(bloggerSession);
      const fullBloggerData = await Blogger.get(bloggerData.bloggerId);

      if (!fullBloggerData || !fullBloggerData.is_active) {
        setError('חשבון הבלוגר אינו פעיל או שלא נמצא.');
        sessionStorage.removeItem('currentBlogger');
        navigate(createPageUrl('BloggerLogin'));
        return;
      }
      
      setBlogger(fullBloggerData);
      setUser({ email: fullBloggerData.email, full_name: fullBloggerData.name });

    } catch (err) {
      console.error('Auth error:', err);
      setError('שגיאת אימות. יש להתחבר כבלוגר.');
      navigate(createPageUrl('BloggerLogin'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setTripData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddDestination = () => {
    if (tripData.destinations.length < 10) {
      setTripData(prev => ({
        ...prev,
        destinations: [...prev.destinations, '']
      }));
    }
  };

  const handleDestinationChange = (index, value) => {
    const newDestinations = [...tripData.destinations];
    newDestinations[index] = value;
    setTripData(prev => ({
      ...prev,
      destinations: newDestinations
    }));
  };

  const handleRemoveDestination = (index) => {
    const newDestinations = [...tripData.destinations];
    newDestinations.splice(index, 1);
    setTripData(prev => ({
      ...prev,
      destinations: newDestinations
    }));
  };

  const handleAddHighlight = () => {
    if (tripData.highlights.length < 10) {
      setTripData(prev => ({
        ...prev,
        highlights: [...prev.highlights, '']
      }));
    }
  };

  const handleHighlightChange = (index, value) => {
    const newHighlights = [...tripData.highlights];
    newHighlights[index] = value;
    setTripData(prev => ({
      ...prev,
      highlights: newHighlights
    }));
  };

  const handleRemoveHighlight = (index) => {
    const newHighlights = [...tripData.highlights];
    newHighlights.splice(index, 1);
    setTripData(prev => ({
      ...prev,
      highlights: newHighlights
    }));
  };

  const handleAddTripType = (type) => {
    if (!tripData.trip_type.includes(type)) {
      setTripData(prev => ({
        ...prev,
        trip_type: [...prev.trip_type, type]
      }));
    }
  };

  const handleRemoveTripType = (type) => {
    setTripData(prev => ({
      ...prev,
      trip_type: prev.trip_type.filter(t => t !== type)
    }));
  };

  const handleAddDay = () => {
    const newDay = tripData.itinerary.length + 1;
    setTripData(prev => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        {
          day: newDay,
          title: `יום ${newDay}`,
          description: '',
          activities: [
            {
              time: '09:00',
              title: '',
              description: '',
              location: ''
            }
          ]
        }
      ]
    }));
  };

  const handleRemoveDay = (index) => {
    if (tripData.itinerary.length <= 1) return;
    
    const newItinerary = [...tripData.itinerary];
    newItinerary.splice(index, 1);
    
    newItinerary.forEach((day, i) => {
      day.day = i + 1;
      if (day.title.startsWith('יום')) {
        day.title = `יום ${i + 1}`;
      }
    });
    
    setTripData(prev => ({
      ...prev,
      itinerary: newItinerary
    }));
  };

  const handleDayChange = (dayIndex, field, value) => {
    const newItinerary = [...tripData.itinerary];
    newItinerary[dayIndex] = {
      ...newItinerary[dayIndex],
      [field]: value
    };
    
    setTripData(prev => ({
      ...prev,
      itinerary: newItinerary
    }));
  };

  const handleAddActivity = (dayIndex) => {
    const newItinerary = [...tripData.itinerary];
    newItinerary[dayIndex].activities.push({
      time: '09:00',
      title: '',
      description: '',
      location: ''
    });
    
    setTripData(prev => ({
      ...prev,
      itinerary: newItinerary
    }));
  };

  const handleRemoveActivity = (dayIndex, activityIndex) => {
    if (tripData.itinerary[dayIndex].activities.length <= 1) return;
    
    const newItinerary = [...tripData.itinerary];
    newItinerary[dayIndex].activities.splice(activityIndex, 1);
    
    setTripData(prev => ({
      ...prev,
      itinerary: newItinerary
    }));
  };

  const handleActivityChange = (dayIndex, activityIndex, field, value) => {
    const newItinerary = [...tripData.itinerary];
    newItinerary[dayIndex].activities[activityIndex] = {
      ...newItinerary[dayIndex].activities[activityIndex],
      [field]: value
    };
    
    setTripData(prev => ({
      ...prev,
      itinerary: newItinerary
    }));
  };

  const handleImageUpload = async (event, imageField, isGallery = false) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const { file_url } = await UploadFile({ file });
      if (isGallery) {
        setTripData(prev => ({ ...prev, gallery: [...prev.gallery, file_url] }));
      } else {
        handleChange(imageField, file_url);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setError('שגיאה בהעלאת התמונה');
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
    }
  };

  const handleRemoveGalleryImage = (index) => {
    const newGallery = [...tripData.gallery];
    newGallery.splice(index, 1);
    setTripData(prev => ({
      ...prev,
      gallery: newGallery
    }));
  };

  const validateForm = () => {
    setError(null);
    if (!tripData.title) { setError('יש להזין כותרת לטיול'); return false; }
    if (!tripData.destination) { setError('יש להזין יעד ראשי'); return false; }
    if (tripData.trip_type.length === 0) { setError('יש לבחור לפחות סוג טיול אחד'); return false; }
    if (!tripData.cover_image) { setError('יש להעלות תמונת שער'); return false; }
    if (!tripData.description) { setError('יש להזין תיאור מפורט'); return false; }
    if (tripData.price_from <= 0) { setError('יש להזין מחיר התחלתי תקין'); return false; }
    for (const day of tripData.itinerary) {
      if (!day.description) { setError(`יש להזין תיאור ליום ${day.day}`); return false; }
      for (const activity of day.activities) {
        if (!activity.title) { setError(`יש להזין כותרת לפעילות ביום ${day.day}`); return false; }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setSaveLoading(true);
      const filteredHighlights = tripData.highlights.filter(h => h.trim() !== '');
      await BloggerTrip.create({
        ...tripData,
        blogger_id: blogger.id,
        highlights: filteredHighlights,
        duration: tripData.itinerary.length
      });
      navigate(createPageUrl('BloggerDashboard'));
    } catch (error) {
      console.error('Error creating trip:', error);
      setError('אירעה שגיאה ביצירת הטיול');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !blogger) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button onClick={() => navigate(createPageUrl('BloggerApplication'))}>
            הגש בקשה להצטרף כבלוגר
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">יצירת טיול חדש</h1>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-8">
            <Card>
              <CardHeader><CardTitle>מידע בסיסי</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="title">כותרת הטיול</Label><Input id="title" value={tripData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="לדוגמה: חופשה קסומה ברומא" /></div>
                  <div><Label htmlFor="destination">יעד ראשי</Label><Input id="destination" value={tripData.destination} onChange={(e) => handleChange('destination', e.target.value)} placeholder="לדוגמה: רומא, איטליה" /></div>
                </div>
                <div>
                  <Label>יעדים נוספים</Label>
                  <div className="space-y-2">
                    {tripData.destinations.map((dest, index) => (
                      <div key={index} className="flex gap-2"><Input value={dest} onChange={(e) => handleDestinationChange(index, e.target.value)} placeholder={`יעד נוסף ${index + 1}`} /><Button type="button" variant="outline" size="icon" onClick={() => handleRemoveDestination(index)}><Trash2 className="h-4 w-4" /></Button></div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddDestination} className="w-full"><Plus className="h-4 w-4 mr-2" />הוסף יעד נוסף</Button>
                  </div>
                </div>
                <div>
                  <Label>סוגי טיול</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tripData.trip_type.map(type => (<Badge key={type} className="px-3 py-1">{type}<button type="button" className="mr-2" onClick={() => handleRemoveTripType(type)}><X className="h-3 w-3" /></button></Badge>))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {['adventure', 'cultural', 'beach', 'luxury', 'budget', 'family', 'romantic', 'food', 'nature', 'urban'].map(type => (<Button key={type} type="button" variant={tripData.trip_type.includes(type) ? 'secondary' : 'outline'} size="sm" onClick={() => tripData.trip_type.includes(type) ? handleRemoveTripType(type) : handleAddTripType(type)}>{type}</Button>))}
                  </div>
                </div>
                <div><Label htmlFor="price_from">מחיר התחלתי</Label><div className="flex items-center"><Input id="price_from" type="number" value={tripData.price_from} onChange={(e) => handleChange('price_from', parseInt(e.target.value) || 0)} placeholder="מחיר בדולרים" /><span className="mx-2">$</span></div></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>תמונות</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div><Label>תמונת שער</Label><div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center"><div><div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"><input type="file" id="coverImage" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover_image')} disabled={uploadingImage} /><label htmlFor="coverImage" className="cursor-pointer flex flex-col items-center justify-center h-32">{uploadingImage ? <div>מעלה...</div> : <><Upload className="h-10 w-10 text-gray-400" /><p className="mt-2 text-sm text-gray-500">לחץ להעלאת תמונת שער</p></>}</label></div></div>{tripData.cover_image && <div className="relative h-40"><img src={tripData.cover_image} alt="Cover" className="w-full h-full object-cover rounded-lg" /><Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleChange('cover_image', '')}><X className="h-4 w-4" /></Button></div>}</div></div>
                <div>
                  <Label>גלריית תמונות</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"><input type="file" id="galleryImage" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'gallery', true)} disabled={uploadingImage} /><label htmlFor="galleryImage" className="cursor-pointer flex flex-col items-center justify-center h-20">{uploadingImage ? <div>מעלה...</div> : <><Upload className="h-8 w-8 text-gray-400" /><p className="mt-2 text-sm text-gray-500">לחץ להוספת תמונה לגלריה</p></>}</label></div>
                  {tripData.gallery.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">{tripData.gallery.map((image, index) => (<div key={index} className="relative"><img src={image} alt={`Gallery ${index}`} className="w-full h-24 object-cover rounded-lg" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleRemoveGalleryImage(index)}><X className="h-3 w-3" /></Button></div>))}</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>תיאור</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label htmlFor="short_description">תיאור קצר</Label><Textarea id="short_description" value={tripData.short_description} onChange={(e) => handleChange('short_description', e.target.value)} placeholder="תיאור קצר שיופיע בעמוד הראשי" rows={2} /></div>
                <div><Label htmlFor="description">תיאור מפורט</Label><Textarea id="description" value={tripData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="תיאור מפורט של הטיול" rows={6} /></div>
                <div>
                  <Label>נקודות בולטות</Label>
                  <div className="space-y-2">
                    {tripData.highlights.map((highlight, index) => (<div key={index} className="flex gap-2"><Input value={highlight} onChange={(e) => handleHighlightChange(index, e.target.value)} placeholder={`נקודה בולטת ${index + 1}`} /><Button type="button" variant="outline" size="icon" onClick={() => handleRemoveHighlight(index)}><Trash2 className="h-4 w-4" /></Button></div>))}
                    <Button type="button" variant="outline" onClick={handleAddHighlight} className="w-full"><Plus className="h-4 w-4 mr-2" />הוסף נקודה בולטת</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>מסלול יומי</CardTitle><Button type="button" onClick={handleAddDay}><Plus className="h-4 w-4 mr-2" />הוסף יום</Button></CardHeader>
              <CardContent className="space-y-6">
                {tripData.itinerary.map((day, dayIndex) => (
                  <div key={dayIndex} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">{day.title}</h3>{tripData.itinerary.length > 1 && <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveDay(dayIndex)}><Trash2 className="h-4 w-4" /></Button>}</div>
                    <div className="space-y-4">
                      <div><Label htmlFor={`day-${dayIndex}-description`}>תיאור היום</Label><Textarea id={`day-${dayIndex}-description`} value={day.description} onChange={(e) => handleDayChange(dayIndex, 'description', e.target.value)} placeholder="תיאור כללי של היום" rows={3} /></div>
                      <div>
                        <div className="flex justify-between items-center"><Label>פעילויות</Label><Button type="button" variant="outline" size="sm" onClick={() => handleAddActivity(dayIndex)}><Plus className="h-3 w-3 mr-1" />הוסף פעילות</Button></div>
                        <div className="space-y-4 mt-2">
                          {day.activities.map((activity, activityIndex) => (
                            <div key={activityIndex} className="border rounded-lg p-3 bg-gray-50/50">
                              <div className="flex justify-between items-center mb-2"><div className="font-medium">פעילות {activityIndex + 1}</div>{day.activities.length > 1 && <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveActivity(dayIndex, activityIndex)}><Trash2 className="h-4 w-4" /></Button>}</div>
                              <div className="grid gap-3">
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="space-y-1"><Label htmlFor={`activity-${dayIndex}-${activityIndex}-time`} className="text-xs"><Clock className="h-3 w-3 inline mr-1" />שעה</Label><Input id={`activity-${dayIndex}-${activityIndex}-time`} value={activity.time} onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'time', e.target.value)} placeholder="09:00" className="text-sm" /></div>
                                  <div className="space-y-1 col-span-2"><Label htmlFor={`activity-${dayIndex}-${activityIndex}-title`} className="text-xs">כותרת</Label><Input id={`activity-${dayIndex}-${activityIndex}-title`} value={activity.title} onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'title', e.target.value)} placeholder="שם הפעילות" className="text-sm" /></div>
                                </div>
                                <div><Label htmlFor={`activity-${dayIndex}-${activityIndex}-location`} className="text-xs"><MapPin className="h-3 w-3 inline mr-1" />מיקום</Label><Input id={`activity-${dayIndex}-${activityIndex}-location`} value={activity.location} onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'location', e.target.value)} placeholder="כתובת או שם המקום" className="text-sm" /></div>
                                <div><Label htmlFor={`activity-${dayIndex}-${activityIndex}-description`} className="text-xs">תיאור</Label><Textarea id={`activity-${dayIndex}-${activityIndex}-description`} value={activity.description} onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'description', e.target.value)} placeholder="תיאור קצר של הפעילות" className="text-sm" rows={2} /></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <CardFooter className="flex justify-between px-0">
              <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('BloggerDashboard'))}>ביטול</Button>
              <Button type="submit" disabled={saveLoading} className="min-w-[120px]">
                {saveLoading ? (<span className="flex items-center justify-center"><div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>שומר...</span>) : ('שמור טיול')}
              </Button>
            </CardFooter>
          </div>
        </form>
      </div>
    </div>
  );
}