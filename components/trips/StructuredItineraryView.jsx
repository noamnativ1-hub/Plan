import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripItinerary } from '@/api/entities';
import { TripComponent } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarDays, 
  MessageSquare, 
  Layers, 
  Map as MapIcon, 
  Calendar, 
  Plane, 
  Hotel, 
  Car, 
  Coffee, 
  MapPin, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import TripChatSidebar from '../chat/TripChatSidebar';
import ItineraryMapView from '../itinerary/ItineraryMapView';
import ItineraryCategoryView from '../itinerary/ItineraryCategoryView';

export default function StructuredItineraryView({ tripId }) {
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('days');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  useEffect(() => {
    loadItineraryData();
  }, [tripId]);
  
  const loadItineraryData = async () => {
    setLoading(true);
    try {
      // Load the itinerary data
      const itineraryData = await TripItinerary.filter({ trip_id: tripId }, 'day_number');
      setItinerary(itineraryData);
      
      // Load all components
      const componentsData = await TripComponent.filter({ trip_id: tripId });
      setComponents(componentsData);
    } catch (error) {
      console.error('Error loading itinerary:', error);
      
      // Fallback data for demo/development
      setItinerary(getSampleItinerary());
      setComponents(getSampleComponents());
    } finally {
      setLoading(false);
    }
  };
  
  const handleItineraryUpdate = () => {
    loadItineraryData();
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        
        <Skeleton className="h-12 w-full" />
        
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex gap-4">
                      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                      <div className="space-y-2 flex-grow">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Group components by their types
  const componentsByType = {
    flight: components.filter(c => c.type === 'flight'),
    hotel: components.filter(c => c.type === 'hotel'),
    car: components.filter(c => c.type === 'car'),
    activity: components.filter(c => c.type === 'activity'),
    restaurant: components.filter(c => c.type === 'restaurant')
  };
  
  // Get the appropriate icon for a component type
  const getComponentIcon = (type) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-5 w-5" />;
      case 'hotel':
        return <Hotel className="h-5 w-5" />;
      case 'car':
        return <Car className="h-5 w-5" />;
      case 'activity':
        return <MapIcon className="h-5 w-5" />;
      case 'restaurant':
        return <Coffee className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };
  
  // Format time from datetime string
  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    try {
      return format(parseISO(dateTimeStr), 'HH:mm');
    } catch (error) {
      return '';
    }
  };
  
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className={`${isChatOpen ? 'col-span-9' : 'col-span-12'} transition-all duration-300`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">מסלול הטיול</h2>
          
          <div className="flex gap-2">
            <Button 
              variant={isChatOpen ? "default" : "outline"} 
              size="sm" 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={isChatOpen ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <MessageSquare className="ml-1.5 h-4 w-4" />
              צ'אט
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="days" className="flex items-center">
              <CalendarDays className="ml-1.5 h-4 w-4" />
              לפי ימים
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center">
              <Layers className="ml-1.5 h-4 w-4" />
              לפי קטגוריות
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center">
              <MapIcon className="ml-1.5 h-4 w-4" />
              מפה
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <TabsContent value="days" className="mt-0 space-y-8">
          {itinerary.length > 0 ? (
            itinerary.map((day) => (
              <Card key={day.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                      יום {day.day_number}: {format(new Date(day.date), 'dd/MM/yyyy')}
                    </CardTitle>
                    {day.weather_forecast && (
                      <div className="flex items-center">
                        <img 
                          src={`/weather-icons/${day.weather_forecast.icon}.svg`} 
                          alt={day.weather_forecast.condition}
                          className="h-6 w-6 mr-1"
                        />
                        <span>{day.weather_forecast.temperature}°C</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Timeline connector */}
                    <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200 z-0"></div>
                    
                    <div className="py-4">
                      {day.activities && day.activities.length > 0 ? (
                        <div className="space-y-6">
                          {day.activities.map((activity, idx) => {
                            // Find matching component if exists
                            const matchingComponent = components.find(c => 
                              c.title === activity.title || 
                              (c.start_datetime && formatTime(c.start_datetime) === activity.time)
                            );
                            
                            // Get color based on category
                            const getCategoryColor = (category) => {
                              switch (category) {
                                case 'flight': return 'bg-blue-100 text-blue-800';
                                case 'hotel': return 'bg-indigo-100 text-indigo-800';
                                case 'restaurant': return 'bg-orange-100 text-orange-800';
                                case 'transport': return 'bg-cyan-100 text-cyan-800';
                                case 'attraction': return 'bg-green-100 text-green-800';
                                default: return 'bg-gray-100 text-gray-800';
                              }
                            };
                            
                            // Get icon based on category
                            const getCategoryIcon = (category) => {
                              switch (category) {
                                case 'flight': return <Plane className="h-4 w-4" />;
                                case 'hotel': return <Hotel className="h-4 w-4" />;
                                case 'restaurant': return <Coffee className="h-4 w-4" />;
                                case 'transport': return <Car className="h-4 w-4" />;
                                case 'attraction': return <MapPin className="h-4 w-4" />;
                                default: return <Calendar className="h-4 w-4" />;
                              }
                            };
                            
                            return (
                              <div key={idx} className="relative flex gap-4 pl-4 pr-3">
                                {/* Timeline dot */}
                                <div className="absolute left-4 transform -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-500 z-10"></div>
                                
                                {/* Time */}
                                <div className="w-16 flex-shrink-0 text-sm font-medium pt-1">
                                  {activity.time}
                                </div>
                                
                                {/* Activity card */}
                                <div className={`flex-grow p-4 rounded-lg border ${
                                  activity.status === 'confirmed' ? 'border-green-200 bg-green-50' : 
                                  activity.status === 'cancelled' ? 'border-red-200 bg-red-50' : 
                                  'border-gray-200 bg-white'
                                }`}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium">{activity.title}</h4>
                                        <Badge className={getCategoryColor(activity.category)}>
                                          {getCategoryIcon(activity.category)}
                                          <span className="ml-1">{activity.category}</span>
                                        </Badge>
                                        {activity.status === 'confirmed' && (
                                          <Badge className="bg-green-100 text-green-800">מאושר</Badge>
                                        )}
                                        {activity.status === 'cancelled' && (
                                          <Badge className="bg-red-100 text-red-800">מבוטל</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                                    </div>
                                    
                                    {matchingComponent && matchingComponent.price && (
                                      <div className="text-right">
                                        <span className="font-medium">${matchingComponent.price}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {activity.location && activity.location.name && (
                                    <div className="flex items-center mt-3 text-sm text-muted-foreground">
                                      <MapPin className="h-3.5 w-3.5 mr-1 text-blue-500" />
                                      <span>{activity.location.name}</span>
                                      {activity.location.address && (
                                        <span className="mr-1 text-xs">({activity.location.address})</span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {matchingComponent && matchingComponent.booking_reference && (
                                    <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                                      מספר הזמנה: {matchingComponent.booking_reference}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          אין פעילויות מתוכננות ליום זה עדיין
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {day.notes && (
                    <div className="px-6 py-3 border-t bg-muted/20">
                      <h4 className="font-medium mb-1">הערות ליום זה:</h4>
                      <p className="text-sm text-muted-foreground">{day.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-xl">
              <h3 className="text-lg font-medium mb-2">אין מידע על מסלול הטיול</h3>
              <p className="text-muted-foreground mb-6">עדיין לא הוגדר מסלול מפורט לטיול זה</p>
              <Button variant="outline" onClick={() => setIsChatOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                שאל את עוזר הטיולים על אפשרויות מסלול
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories" className="mt-0">
          <ItineraryCategoryView 
            components={components} 
            componentsByType={componentsByType}
            getComponentIcon={getComponentIcon}
          />
        </TabsContent>
        
        <TabsContent value="map" className="mt-0">
          <ItineraryMapView 
            itinerary={itinerary} 
            components={components}
          />
        </TabsContent>
      </div>
      
      {isChatOpen && (
        <div className="col-span-3">
          <TripChatSidebar
            tripId={tripId}
            onClose={() => setIsChatOpen(false)}
            onItineraryUpdate={handleItineraryUpdate}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
  
  // Helper function to generate sample itinerary data
  function getSampleItinerary() {
    return [
      {
        id: 'day1',
        trip_id: tripId,
        day_number: 1,
        date: new Date().toISOString(),
        activities: [
          {
            time: '07:00',
            title: 'טיסה הלוך - אל על',
            description: 'טיסה ישירה מנתב"ג לניו יורק (JFK)',
            category: 'flight',
            location: {
              name: 'נמל תעופה בן-גוריון',
              address: 'טרמינל 3'
            },
            status: 'confirmed'
          },
          {
            time: '14:00',
            title: 'הגעה לניו יורק וצ\'ק אין במלון',
            description: 'הגעה לשדה התעופה JFK, נסיעה במונית למלון',
            category: 'transport',
            location: {
              name: 'מלון הילטון טיימס סקוור',
              address: '42nd Street, New York, NY'
            },
            status: 'planned'
          },
          {
            time: '18:00',
            title: 'ארוחת ערב במסעדת דלמוניקו',
            description: 'מסעדת סטייקים איכותית, יש להגיע בזמן',
            category: 'restaurant',
            location: {
              name: 'Delmonico\'s Restaurant',
              address: '56 Beaver St, New York, NY'
            },
            status: 'planned'
          }
        ],
        notes: 'כדאי להצטייד בבגדים חמים, הטמפרטורה בניו יורק צפויה להיות נמוכה',
        weather_forecast: {
          temperature: 12,
          condition: 'Partly Cloudy',
          icon: 'partly-cloudy'
        }
      },
      {
        id: 'day2',
        trip_id: tripId,
        day_number: 2,
        date: new Date(Date.now() + 86400000).toISOString(),
        activities: [
          {
            time: '09:00',
            title: 'סיור בסנטרל פארק',
            description: 'סיור מודרך ברגל בפארק המפורסם',
            category: 'attraction',
            location: {
              name: 'Central Park',
              address: 'כניסה מרחוב 59'
            },
            status: 'planned'
          },
          {
            time: '13:00',
            title: 'ארוחת צהריים',
            description: 'מסעדה איטלקית מומלצת',
            category: 'restaurant',
            location: {
              name: 'Eataly NYC',
              address: '200 5th Ave, New York, NY'
            },
            status: 'planned'
          },
          {
            time: '15:00',
            title: 'ביקור במוזיאון ה-MoMA',
            description: 'מוזיאון לאומנות מודרנית',
            category: 'attraction',
            location: {
              name: 'The Museum of Modern Art',
              address: '11 W 53rd St, New York, NY'
            },
            status: 'planned'
          }
        ],
        weather_forecast: {
          temperature: 14,
          condition: 'Sunny',
          icon: 'sunny'
        }
      },
      {
        id: 'day3',
        trip_id: tripId,
        day_number: 3,
        date: new Date(Date.now() + 86400000 * 2).toISOString(),
        activities: [
          {
            time: '10:00',
            title: 'סיור באיסט וילג\'',
            description: 'סיור ברובע המגניב של ניו יורק',
            category: 'attraction',
            location: {
              name: 'East Village',
              address: 'St. Marks Place'
            },
            status: 'planned'
          },
          {
            time: '14:00',
            title: 'שופינג ב-SoHo',
            description: 'קניות באזור האופנתי של ניו יורק',
            category: 'attraction',
            location: {
              name: 'SoHo',
              address: 'Broadway & Spring St'
            },
            status: 'planned'
          },
          {
            time: '19:00',
            title: 'מופע ברודווי',
            description: 'הצגה מומלצת בברודווי',
            category: 'attraction',
            location: {
              name: 'Broadway Theatre',
              address: 'Times Square'
            },
            status: 'confirmed'
          }
        ]
      }
    ];
  }
  
  // Helper function to generate sample components data
  function getSampleComponents() {
    return [
      {
        id: 'flight1',
        trip_id: tripId,
        type: 'flight',
        title: 'טיסה הלוך - אל על',
        description: 'טיסה ישירה מנתב"ג לניו יורק (JFK)',
        start_datetime: new Date().toISOString(),
        end_datetime: new Date(Date.now() + 3600000 * 12).toISOString(),
        price: 850,
        status: 'booked',
        booking_reference: 'LY12345',
        image_url: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=500&q=80',
        location: {
          address: 'נמל תעופה בן-גוריון'
        }
      },
      {
        id: 'hotel1',
        trip_id: tripId,
        type: 'hotel',
        title: 'מלון הילטון טיימס סקוור',
        description: 'מלון 4 כוכבים במיקום מרכזי, כולל ארוחת בוקר',
        start_datetime: new Date().toISOString(),
        end_datetime: new Date(Date.now() + 3600000 * 24 * 5).toISOString(),
        price: 1200,
        status: 'booked',
        booking_reference: 'HT98765',
        image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=500&q=80',
        location: {
          address: '42nd Street, New York, NY',
          latitude: 40.7566,
          longitude: -73.9863
        }
      },
      {
        id: 'activity1',
        trip_id: tripId,
        type: 'activity',
        title: 'סיור בסנטרל פארק',
        description: 'סיור מודרך ברגל בפארק המפורסם',
        start_datetime: new Date(Date.now() + 3600000 * 24 + 3600000 * 9).toISOString(),
        end_datetime: new Date(Date.now() + 3600000 * 24 + 3600000 * 12).toISOString(),
        price: 35,
        status: 'booked',
        booking_reference: 'CP54321',
        image_url: 'https://images.unsplash.com/photo-1588614959060-4d141f4d4532?auto=format&fit=crop&w=500&q=80',
        location: {
          address: 'Central Park, New York, NY',
          latitude: 40.7812,
          longitude: -73.9665
        }
      },
      {
        id: 'activity2',
        trip_id: tripId,
        type: 'activity',
        title: 'מופע ברודווי',
        description: 'הצגה מומלצת בברודווי',
        start_datetime: new Date(Date.now() + 3600000 * 24 * 3 + 3600000 * 19).toISOString(),
        end_datetime: new Date(Date.now() + 3600000 * 24 * 3 + 3600000 * 22).toISOString(),
        price: 120,
        status: 'booked',
        booking_reference: 'BW67890',
        image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=500&q=80',
        location: {
          address: 'Times Square, New York, NY',
          latitude: 40.7580,
          longitude: -73.9855
        }
      },
      {
        id: 'restaurant1',
        trip_id: tripId,
        type: 'restaurant',
        title: 'מסעדת דלמוניקו',
        description: 'מסעדת סטייקים איכותית, כולל הזמנת שולחן',
        start_datetime: new Date(Date.now() + 3600000 * 18).toISOString(),
        end_datetime: new Date(Date.now() + 3600000 * 20).toISOString(),
        price: 120,
        status: 'booked',
        booking_reference: 'DM23456',
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
        location: {
          address: '56 Beaver St, New York, NY',
          latitude: 40.7046,
          longitude: -74.0095
        }
      }
    ];
  }
}