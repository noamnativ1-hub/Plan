import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trip } from '@/api/entities';
import { TripItinerary } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Star,
  CheckCircle,
  Plane,
  AlertCircle,
  Edit,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AdaptedTripDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('id');
  
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAdaptedTrip = async () => {
      if (!tripId) {
        setError('מזהה טיול חסר');
        setLoading(false);
        return;
      }

      try {
        // טוען את הטיול המותאם
        const tripData = await Trip.get(tripId);
        if (!tripData) {
          setError('הטיול לא נמצא');
          return;
        }
        setTrip(tripData);

        // טוען את המסלול המותאם (בדיוק כמו שנוצר בתהליך ההתאמה)
        const itineraryData = await TripItinerary.filter({ trip_id: tripId }, 'day_number');
        setItinerary(itineraryData || []);

      } catch (err) {
        console.error('Error loading adapted trip:', err);
        setError('שגיאה בטעינת הטיול המותאם');
      } finally {
        setLoading(false);
      }
    };

    loadAdaptedTrip();
  }, [tripId]);

  const getCategoryIcon = (category) => {
    const icons = {
      flight: <Plane className="w-4 h-4" />,
      transport: <MapPin className="w-4 h-4" />,
      hotel: <MapPin className="w-4 h-4" />,
      restaurant: <Star className="w-4 h-4" />,
      attraction: <Star className="w-4 h-4" />,
      other: <Clock className="w-4 h-4" />
    };
    return icons[category] || icons.other;
  };

  const getCategoryColor = (category) => {
    const colors = {
      flight: 'bg-blue-100 text-blue-800',
      transport: 'bg-green-100 text-green-800',
      hotel: 'bg-purple-100 text-purple-800',
      restaurant: 'bg-orange-100 text-orange-800',
      attraction: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>הטיול לא נמצא</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 ml-2" />
              חזרה
            </Button>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 ml-1" />
              טיול מותאם
            </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{trip.title}</h1>
              {trip.adapted_from && (
                <p className="text-muted-foreground">
                  מותאם מהטיול של {trip.adapted_from.blogger_name}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                <Share2 className="w-4 h-4 ml-2" />
                שתף
              </Button>
              <Button>
                <Edit className="w-4 h-4 ml-2" />
                ערוך טיול
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Info */}
      <div className="container py-6">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">יעד</p>
                  <p className="font-semibold">{trip.destination}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">תאריכים</p>
                  <p className="font-semibold">
                    {format(new Date(trip.start_date), 'dd/MM', { locale: he })} - 
                    {format(new Date(trip.end_date), 'dd/MM', { locale: he })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">מטיילים</p>
                  <p className="font-semibold">
                    {trip.num_adults} מבוגרים
                    {trip.num_children > 0 && `, ${trip.num_children} ילדים`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">משך</p>
                  <p className="font-semibold">
                    {itinerary.length} ימים
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Itinerary */}
        <Card>
          <CardHeader>
            <CardTitle>המסלול המותאם שלך</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {itinerary.map((day, dayIndex) => (
                <div key={day.id} className="border-r-4 border-blue-200 pr-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                      {day.day_number}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        יום {day.day_number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(day.date), 'EEEE, d בMMMM', { locale: he })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mr-11">
                    {day.activities?.map((activity, activityIndex) => (
                      <div key={activityIndex} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getCategoryColor(activity.category)}>
                                {getCategoryIcon(activity.category)}
                                <span className="mr-1">{activity.category}</span>
                              </Badge>
                              {activity.time && (
                                <span className="text-sm text-muted-foreground">
                                  {activity.time}
                                </span>
                              )}
                            </div>
                            
                            <h4 className="font-semibold mb-1">{activity.title}</h4>
                            
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {activity.description}
                              </p>
                            )}
                            
                            {activity.location && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>{activity.location.name || activity.location}</span>
                              </div>
                            )}
                          </div>
                          
                          {activity.price_estimate && activity.price_estimate > 0 && (
                            <div className="text-sm font-semibold text-green-600">
                              ₪{activity.price_estimate}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        <Alert className="mt-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            הטיול שלך הותאם בהצלחה! המסלול שלמעלה מבוסס על הטיול המקורי של הבלוגר, 
            עם התאמות מיוחדות עבור המשפחה שלך וזמני הטיסה שבחרת.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}