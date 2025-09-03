import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { UserPreference } from '@/api/entities';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, User as UserIcon, Map, Heart, History, DollarSign, X } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '../components/contexts/LanguageContext';

export default function UserProfilePage() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserAndPreferences();
  }, []);

  const loadUserAndPreferences = async () => {
    try {
      setLoading(true);
      // Get current user with safe error handling
      try {
        const userData = await User.me();
        setUser(userData);

        // Get or create preferences
        let userPrefs = await UserPreference.filter({ user_id: userData.id });
        
        if (userPrefs && userPrefs.length > 0) {
          setPreferences(userPrefs[0]);
        } else {
          // Create default preferences for new users
          const defaultPrefs = {
            user_id: userData.id,
            preferred_destinations: [],
            preferred_trip_types: ["adventure", "cultural"],
            preferred_activities: [],
            travel_history: [],
            budget_range: { min: 1000, max: 5000 },
            seasonal_preferences: {
              winter: ["skiing", "winter sun"],
              spring: ["city breaks", "nature"],
              summer: ["beach", "islands"],
              fall: ["cultural", "food and wine"]
            },
            last_updated: new Date().toISOString()
          };
          
          const createdPrefs = await UserPreference.create(defaultPrefs);
          setPreferences(createdPrefs);
        }
      } catch (userError) {
        console.error("Not authenticated:", userError);
        setError(t('error') + ': Authentication required');
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(t('error') + ': Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTripTypeToggle = (tripType) => {
    setPreferences(prev => {
      const currentTypes = [...(prev.preferred_trip_types || [])];
      
      if (currentTypes.includes(tripType)) {
        return {
          ...prev,
          preferred_trip_types: currentTypes.filter(type => type !== tripType)
        };
      } else {
        return {
          ...prev,
          preferred_trip_types: [...currentTypes, tripType]
        };
      }
    });
  };

  const handleAddDestination = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      setPreferences(prev => ({
        ...prev,
        preferred_destinations: [...(prev.preferred_destinations || []), e.target.value.trim()]
      }));
      e.target.value = '';
    }
  };

  const handleRemoveDestination = (destination) => {
    setPreferences(prev => ({
      ...prev,
      preferred_destinations: prev.preferred_destinations.filter(d => d !== destination)
    }));
  };

  const handleAddActivity = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      setPreferences(prev => ({
        ...prev,
        preferred_activities: [...(prev.preferred_activities || []), e.target.value.trim()]
      }));
      e.target.value = '';
    }
  };

  const handleRemoveActivity = (activity) => {
    setPreferences(prev => ({
      ...prev,
      preferred_activities: prev.preferred_activities.filter(a => a !== activity)
    }));
  };

  const handleBudgetChange = (value) => {
    setPreferences(prev => ({
      ...prev,
      budget_range: {
        min: value[0],
        max: value[1]
      }
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Update last_updated timestamp
      const updatedPreferences = {
        ...preferences,
        last_updated: new Date().toISOString()
      };
      
      await UserPreference.update(preferences.id, updatedPreferences);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError(t('error') + ': Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t('userProfile')}</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{t('preferencesUpdated')}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {t('personalDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>{t('fullName')}</Label>
                  <p className="font-medium">{user.full_name}</p>
                </div>
                <div>
                  <Label>{t('email')}</Label>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('travelPreferences')}</CardTitle>
              <CardDescription>
                {t('helpUsCustomize')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="destinations">
                <TabsList className="mb-6 grid grid-cols-4 w-full">
                  <TabsTrigger value="destinations">{t('destinations')}</TabsTrigger>
                  <TabsTrigger value="preferences">{t('preferences')}</TabsTrigger>
                  <TabsTrigger value="activities">{t('activities')}</TabsTrigger>
                  <TabsTrigger value="budget">{t('budget')}</TabsTrigger>
                </TabsList>

                <TabsContent value="destinations">
                  <div className="space-y-4">
                    <div>
                      <Label>{t('preferredDestinations')}</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('addDestinationsDesc')}
                      </p>
                      <Input 
                        placeholder={t('enterDestination')}
                        onKeyDown={handleAddDestination}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {preferences.preferred_destinations && preferences.preferred_destinations.map(destination => (
                        <Badge key={destination} variant="secondary" className="flex items-center gap-1">
                          {destination}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleRemoveDestination(destination)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      {(!preferences.preferred_destinations || preferences.preferred_destinations.length === 0) && (
                        <p className="text-sm text-muted-foreground">{t('noPreferredDestinations')}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences">
                  <div className="space-y-4">
                    <Label>{t('preferredTripStyles')}</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('chooseTripStyles')}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'luxury', label: t('luxury') },
                        { id: 'budget', label: t('budgetFriendly') },
                        { id: 'adventure', label: t('adventure') },
                        { id: 'family', label: t('family') },
                        { id: 'romantic', label: t('romantic') },
                        { id: 'cultural', label: t('cultural') },
                        { id: 'beach', label: t('beach') },
                        { id: 'urban', label: t('urban') },
                        { id: 'nature', label: t('nature') },
                        { id: 'mountains', label: t('mountains') }
                      ].map(type => (
                        <div key={type.id} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox 
                            id={`type-${type.id}`} 
                            checked={preferences.preferred_trip_types?.includes(type.id)}
                            onCheckedChange={() => handleTripTypeToggle(type.id)}
                          />
                          <Label htmlFor={`type-${type.id}`}>{type.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activities">
                  <div className="space-y-4">
                    <div>
                      <Label>{t('preferredActivities')}</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('activitiesDesc')}
                      </p>
                      <Input
                        placeholder={t('enterActivity')}
                        onKeyDown={handleAddActivity}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {preferences.preferred_activities && preferences.preferred_activities.map(activity => (
                        <Badge key={activity} variant="secondary" className="flex items-center gap-1">
                          {activity}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleRemoveActivity(activity)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      {(!preferences.preferred_activities || preferences.preferred_activities.length === 0) && (
                        <p className="text-sm text-muted-foreground">{t('noPreferredActivities')}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="budget">
                  <div className="space-y-6">
                    <div>
                      <Label>{t('budgetRangeForTrips')}</Label>
                      <p className="text-sm text-muted-foreground mb-6">
                        {t('typicalBudget')}
                      </p>
                      
                      <div className="px-4">
                        <Slider
                          defaultValue={[
                            preferences.budget_range?.min || 1000, 
                            preferences.budget_range?.max || 5000
                          ]}
                          max={10000}
                          min={500}
                          step={100}
                          onValueChange={handleBudgetChange}
                        />
                        <div className="flex justify-between mt-2 text-sm">
                          <span>${preferences.budget_range?.min || 1000}</span>
                          <span>${preferences.budget_range?.max || 5000}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button 
                onClick={handleSavePreferences}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('savePreferences')}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}