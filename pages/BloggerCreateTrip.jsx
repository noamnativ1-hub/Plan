import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BloggerTrip } from '@/api/entities';
import { Blogger } from '@/api/entities';
import { User } from '@/api/entities';
import { SystemSettings } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
  Loader2,
  Save,
  Send,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  PackagePlus,
  Trash,
  Video
} from 'lucide-react';
import { useLanguage } from '../components/contexts/LanguageContext';

// Enhanced Time Picker Component
const TimePicker = ({ value, onChange, previousTime }) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState(value || '09:00');

  useEffect(() => {
    setInputValue(value || '09:00');
  }, [value]);

  const updateTime = (newTime) => {
    setInputValue(newTime);
    onChange(newTime);
  };

  const adjustMinutes = (increment) => {
    const [hours, minutes] = inputValue.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + increment);
    const newTime = format(date, 'HH:mm');
    updateTime(newTime);
  };

  const handleManualInput = (timeString) => {
    let formatted = timeString.replace(/[^\d]/g, '');
    if (formatted.length >= 2) {
      formatted = formatted.substring(0, 2) + ':' + formatted.substring(2, 4);
    }
    setInputValue(formatted);
    if (formatted.length === 5) {
      updateTime(formatted);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={inputValue}
        onChange={(e) => handleManualInput(e.target.value)}
        className="w-20 text-center"
        placeholder="09:00"
      />
      <div className="flex flex-col">
        <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustMinutes(15)}><ChevronUp className="h-3 w-3" /></Button>
        <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustMinutes(-15)}><ChevronDown className="h-3 w-3" /></Button>
      </div>
      {previousTime && inputValue <= previousTime && (
        <span className="text-amber-500 text-xs">{t('illogicalTime')}</span>
      )}
    </div>
  );
};

export default function BloggerCreateTripPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('id');
  const isEditing = !!tripId;

  const [blogger, setBlogger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [systemSettings, setSystemSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationAction, setValidationAction] = useState(null);

  const initializeDefaultTrip = () => ({
    title: '',
    destination: '',
    destinations: [''],
    trip_type: [],
    duration: 1,
    cover_image: '',
    gallery: [],
    description: '',
    short_description: '',
    highlights: [''],
    price_from: 0,
    itinerary: [{
      day: 1,
      title: t('day') + ' 1',
      description: '',
      activities: [{
        time: '09:00',
        title: '',
        description: '',
        location: '',
        price: 0,
        is_free: false
      }]
    }],
    status: 'draft',
    rejection_reason: ''
  });

  const [tripData, setTripData] = useState(initializeDefaultTrip());

  useEffect(() => {
    loadData();
  }, [tripId]);

  useEffect(() => {
    if (tripData.duration > 0 && tripData.duration !== tripData.itinerary.length) {
      if (tripData.duration > tripData.itinerary.length) {
        const newDays = [];
        for (let i = tripData.itinerary.length + 1; i <= tripData.duration; i++) {
          newDays.push({
            day: i,
            title: t('day') + ' ' + i,
            description: '',
            activities: [{ time: '09:00', title: '', description: '', location: '', price: 0, is_free: false }]
          });
        }
        setTripData(prev => ({
          ...prev,
          itinerary: [...prev.itinerary, ...newDays]
        }));
      } else {
        setTripData(prev => ({
          ...prev,
          itinerary: prev.itinerary.slice(0, tripData.duration)
        }));
      }
    }
  }, [tripData.duration]);

  const loadData = async () => {
    try {
      setLoading(true);

      const session = sessionStorage.getItem('bloggerSession');
      if (!session) {
        navigate(createPageUrl('BloggerLogin'));
        return;
      }
      const { bloggerId } = JSON.parse(session);
      const bloggerData = await Blogger.get(bloggerId);

      if (!bloggerData) {
        sessionStorage.removeItem('bloggerSession');
        navigate(createPageUrl('BloggerLogin'));
        return;
      }
      setBlogger(bloggerData);

      const settings = await SystemSettings.list();
      if (settings.length > 0) setSystemSettings(settings[0]);

      if (isEditing) {
        const trip = await BloggerTrip.get(tripId);
        if (trip && trip.blogger_id === bloggerId) {
          setTripData(trip);
        } else if (trip) {
          setError("You are not authorized to edit this trip.");
          setTimeout(() => navigate(createPageUrl('BloggerDashboard')), 2000);
        } else {
          setError("Trip not found.");
          setTimeout(() => navigate(createPageUrl('BloggerDashboard')), 2000);
        }
      }
    } catch (err) {
      setError(t('errorLoadingData'));
      sessionStorage.removeItem('bloggerSession');
      navigate(createPageUrl('BloggerLogin'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTripData(prev => ({ ...prev, [field]: value }));
    if (successMessage) setSuccessMessage('');
  };

  const handleItineraryChange = (dayIndex, field, value) => {
    const newItinerary = [...tripData.itinerary];
    newItinerary[dayIndex] = { ...newItinerary[dayIndex], [field]: value };
    setTripData(prev => ({ ...prev, itinerary: newItinerary }));
    if (successMessage) setSuccessMessage('');
  };

  const handleActivityChange = (dayIndex, activityIndex, field, value) => {
    const newItinerary = [...tripData.itinerary];
    newItinerary[dayIndex].activities[activityIndex] = {
      ...newItinerary[dayIndex].activities[activityIndex],
      [field]: value
    };
    setTripData(prev => ({ ...prev, itinerary: newItinerary }));
    if (successMessage) setSuccessMessage('');
  };

  const addActivity = (dayIndex) => {
    const newItinerary = [...tripData.itinerary];
    const lastActivity = newItinerary[dayIndex].activities[newItinerary[dayIndex].activities.length - 1];
    const lastTime = lastActivity ? lastActivity.time : '09:00';

    // Add 1 hour to the last activity time
    const [hours, minutes] = lastTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    date.setHours(date.getHours() + 1); // Add 1 hour
    const newTime = format(date, 'HH:mm');

    newItinerary[dayIndex].activities.push({
      time: newTime,
      title: '',
      description: '',
      location: '',
      price: 0,
      is_free: false
    });
    setTripData(prev => ({ ...prev, itinerary: newItinerary }));
  };

  const removeActivity = (dayIndex, activityIndex) => {
    const newItinerary = [...tripData.itinerary];
    if (newItinerary[dayIndex].activities.length > 1) {
      newItinerary[dayIndex].activities.splice(activityIndex, 1);
      setTripData(prev => ({ ...prev, itinerary: newItinerary }));
    }
  };

  const addDay = () => {
    const newDay = {
      day: tripData.itinerary.length + 1,
      title: t('day') + ' ' + (tripData.itinerary.length + 1),
      description: '',
      activities: [{ time: '09:00', title: '', description: '', location: '', price: 0, is_free: false }]
    };
    setTripData(prev => ({
      ...prev,
      duration: prev.duration + 1,
      itinerary: [...prev.itinerary, newDay]
    }));
  };

  const removeDay = (dayIndex) => {
    if (tripData.itinerary.length > 1) {
      const newItinerary = tripData.itinerary.filter((_, index) => index !== dayIndex);
      const updatedItinerary = newItinerary.map((day, index) => ({
        ...day,
        day: index + 1,
        title: t('day') + ' ' + (index + 1)
      }));

      setTripData(prev => ({
        ...prev,
        duration: prev.duration - 1,
        itinerary: updatedItinerary
      }));
    }
  };

  const validateTrip = () => {
    const errors = [];

    if (!tripData.title) errors.push(t('tripTitleRequired'));
    if (!tripData.destination) errors.push(t('destinationRequired'));
    if (!tripData.description) errors.push(t('tripDescriptionRequired'));
    if (tripData.trip_type.length === 0) errors.push(t('selectAtLeastOneTripType'));
    if (tripData.price_from <= 0) errors.push(t('priceGreaterThanZero'));
    if (!tripData.cover_image) errors.push(t('coverImageRequired'));
    if (tripData.duration < 1) errors.push(t('durationMustBeAtLeastOne'));

    tripData.itinerary.forEach((day, dayIndex) => {
      if (!day.title) errors.push(t('dayTitleRequired', { dayNumber: dayIndex + 1 }));
      day.activities.forEach((activity, activityIndex) => {
        if (!activity.title) errors.push(t('activityTitleRequired', { activityNumber: activityIndex + 1, dayNumber: dayIndex + 1 }));
        if (!activity.description) errors.push(t('activityDescriptionRequired', { activityNumber: activityIndex + 1, dayNumber: dayIndex + 1 }));
      });
    });

    return errors;
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError(null);

      const dataToSave = {
        ...tripData,
        status: 'draft',
      };

      if (isEditing) {
        await BloggerTrip.update(tripId, dataToSave);
        setSuccessMessage(t('draftSavedSuccessfully'));
      } else {
        const savedTrip = await BloggerTrip.create({ ...dataToSave, blogger_id: blogger.id });
        navigate(createPageUrl('BloggerCreateTrip') + `?id=${savedTrip.id}`);
        setSuccessMessage(t('draftSavedSuccessfully'));
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(t('errorSavingDraft'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    const errors = validateTrip();

    if (errors.length > 0) {
      setValidationErrors(errors);
      setValidationAction('submit');
      setShowValidationDialog(true);
      return;
    }

    // Check duration mismatch
    if (tripData.duration !== tripData.itinerary.length) {
      setValidationErrors([t('durationMismatchMessage', { expectedDays: tripData.duration, actualDays: tripData.itinerary.length })]);
      setValidationAction('duration');
      setShowValidationDialog(true);
      return;
    }

    await submitTrip();
  };

  const submitTrip = async () => {
    try {
      setSaving(true);
      setError(null);

      const dataToSubmit = {
        ...tripData,
        status: 'pending_approval',
      };

      if (isEditing) {
        await BloggerTrip.update(tripId, dataToSubmit);
      } else {
        await BloggerTrip.create({ ...dataToSubmit, blogger_id: blogger.id });
      }

      setSuccessMessage(t('tripSubmittedSuccessfully'));
      setTimeout(() => {
        navigate(createPageUrl('BloggerDashboard'));
      }, 2000);
    } catch (err) {
      console.error('Error submitting trip:', err);
      setError(t('errorSubmittingTrip'));
    } finally {
      setSaving(false);
    }
  };

  const handleValidationConfirm = async () => {
    if (validationAction === 'duration') {
      setTripData(prev => ({ ...prev, duration: prev.itinerary.length }));
      setShowValidationDialog(false);
      await submitTrip();
    } else {
      setShowValidationDialog(false);
    }
  };

  const uploadImage = async (file) => {
    try {
      const { file_url } = await UploadFile({ file });
      return file_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl('BloggerDashboard'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToDashboard')}
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? t('editTrip') : t('createNewTrip')}
        </h1>
        {isEditing && tripData.status === 'rejected' && tripData.rejection_reason && (
          <Alert variant="destructive" className="ml-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('tripRejected')}</AlertTitle>
            <AlertDescription>{t('reason')}: {tripData.rejection_reason}</AlertDescription>
          </Alert>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <TabsList className="grid w-full sm:max-w-md grid-cols-3 mb-4 sm:mb-0">
            <TabsTrigger value="details">{t('tripDetails')}</TabsTrigger>
            <TabsTrigger value="itinerary">{t('dailyItinerary')}</TabsTrigger>
            <TabsTrigger value="media">{t('imagesAndMedia')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('tripDetails')}</CardTitle>
              <CardDescription>{t('fillBasicTripDetails')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('tripTitle')} *</Label>
                  <Input
                    value={tripData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={t('tripTitlePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('mainDestination')} *</Label>
                  <Input
                    value={tripData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    placeholder={t('destinationPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('tripDurationDays')} *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tripData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('priceStartingFrom')} *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tripData.price_from}
                    onChange={(e) => handleInputChange('price_from', parseInt(e.target.value) || 0)}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('tripTypes')} *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['adventure', 'cultural', 'beach', 'luxury', 'budget', 'family', 'romantic', 'food', 'nature', 'urban', 'wellness', 'sports', 'shopping', 'photography'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={tripData.trip_type.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleInputChange('trip_type', [...tripData.trip_type, type]);
                          } else {
                            handleInputChange('trip_type', tripData.trip_type.filter(t => t !== type));
                          }
                        }}
                      />
                      <Label htmlFor={type} className="text-sm font-normal">
                        {t(type)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('detailedTripDescription')} *</Label>
                <Textarea
                  value={tripData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('shortDescription')}</Label>
                <Textarea
                  value={tripData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  placeholder={t('shortDescriptionPlaceholder')}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itinerary" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t('dailyItinerary')}</h2>
            <Button onClick={addDay}>
              <PackagePlus className="w-4 h-4 mr-2" />
              {t('addDay')}
            </Button>
          </div>

          {tripData.itinerary.map((day, dayIndex) => (
            <Card key={dayIndex}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t('day')} {day.day}</CardTitle>
                  {tripData.itinerary.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDay(dayIndex)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('dayTitle')}</Label>
                  <Input
                    value={day.title}
                    onChange={(e) => handleItineraryChange(dayIndex, 'title', e.target.value)}
                    placeholder={t('dayTitlePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('dayDescription')}</Label>
                  <Textarea
                    value={day.description}
                    onChange={(e) => handleItineraryChange(dayIndex, 'description', e.target.value)}
                    placeholder={t('dayDescriptionPlaceholder')}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{t('activities')}</h4>
                    <Button size="sm" onClick={() => addActivity(dayIndex)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('addActivity')}
                    </Button>
                  </div>

                  {day.activities.map((activity, activityIndex) => {
                    const previousActivity = activityIndex > 0 ? day.activities[activityIndex - 1] : null;

                    return (
                      <div key={activityIndex} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium">{t('activity')} {activityIndex + 1}</h5>
                          {day.activities.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeActivity(dayIndex, activityIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label>{t('time')}</Label>
                            <TimePicker
                              value={activity.time}
                              onChange={(time) => handleActivityChange(dayIndex, activityIndex, 'time', time)}
                              previousTime={previousActivity?.time}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>{t('activityTitle')}</Label>
                            <Input
                              value={activity.title}
                              onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'title', e.target.value)}
                              placeholder={t('activityTitlePlaceholder')}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>{t('location')}</Label>
                            <Input
                              value={activity.location}
                              onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'location', e.target.value)}
                              placeholder={t('locationPlaceholder')}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>{t('activityDescription')}</Label>
                          <Textarea
                            value={activity.description}
                            onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'description', e.target.value)}
                            placeholder={t('activityDescriptionPlaceholder')}
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`free-${dayIndex}-${activityIndex}`}
                              checked={activity.is_free}
                              onCheckedChange={(checked) => handleActivityChange(dayIndex, activityIndex, 'is_free', checked)}
                            />
                            <Label htmlFor={`free-${dayIndex}-${activityIndex}`}>{t('freeActivity')}</Label>
                          </div>

                          {!activity.is_free && (
                            <div className="space-y-2">
                              <Label>{t('priceDollar')}</Label>
                              <Input
                                type="number"
                                min="0"
                                value={activity.price}
                                onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'price', parseInt(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('imagesAndMedia')}</CardTitle>
              <CardDescription>{t('addImagesToTrip')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('coverImage')} *</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const url = await uploadImage(file);
                        handleInputChange('cover_image', url);
                      } catch (error) {
                        setError(t('imageUploadError'));
                      }
                    }
                  }}
                />
                {tripData.cover_image && (
                  <img src={tripData.cover_image} alt={t('coverImage')} className="w-32 h-24 object-cover rounded" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('saveAsDraft')}
          </Button>

          <Button
            onClick={handleSubmitForApproval}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {t('publishTrip')}
          </Button>
        </div>

        {successMessage && (
          <div className="text-green-600 font-medium">
            {successMessage}
          </div>
        )}
      </div>

      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationAction === 'duration' ? t('updateDaysCount') : t('missingOrInvalidFields')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <p key={index} className="text-sm text-red-600">• {error}</p>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationDialog(false)}>
              {t('cancel')}
            </Button>
            {validationAction === 'duration' && (
              <Button onClick={handleValidationConfirm}>
                {t('yesUpdateAndSubmit')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}