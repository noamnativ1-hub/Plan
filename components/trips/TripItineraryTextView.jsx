import React, { useState, useEffect } from 'react';
import { Trip } from '@/api/entities';
import { TripItinerary } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Copy, Printer, ArrowUpRight, Plane, Hotel, Coffee, Car, MapPin, Calendar, Loader2 } from 'lucide-react';

export default function TripItineraryTextView({ tripId, onNavigateToDetails }) {
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  
  useEffect(() => {
    loadData();
  }, [tripId]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      if (tripId) {
        const tripData = await Trip.get(tripId);
        setTrip(tripData);
        
        const itineraryData = await TripItinerary.filter({ trip_id: tripId }, 'day_number');
        setItinerary(itineraryData);
        
        if (itineraryData.length > 0) {
          setSelectedDay(itineraryData[0].day_number.toString());
        }
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (!trip || !trip.plan) return;
    
    try {
      navigator.clipboard.writeText(trip.plan);
      alert('המסלול הועתק ללוח!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };
  
  const handlePrint = () => {
    if (!trip || !itinerary.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = `
      <html>
        <head>
          <title>מסלול טיול ל${trip.destination}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              direction: rtl;
            }
            h1 {
              color: #2563eb;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            h2 {
              color: #4b5563;
              margin-top: 25px;
            }
            .day-header {
              background-color: #f3f4f6;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 15px;
            }
            .activity {
              margin-bottom: 15px;
              padding-left: 20px;
            }
            .activity-time {
              font-weight: bold;
              color: #4b5563;
            }
            .activity-title {
              font-weight: bold;
            }
            .activity-description {
              margin-top: 5px;
            }
            .notes {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 5px;
              border-left: 3px solid #2563eb;
              margin-top: 20px;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              font-size: 12px;
              font-weight: 500;
              border-radius: 9999px;
              background-color: #e5e7eb;
              color: #4b5563;
              margin-right: 5px;
            }
            .badge-flight {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .badge-hotel {
              background-color: #e0e7ff;
              color: #3730a3;
            }
            .badge-restaurant {
              background-color: #ffedd5;
              color: #9a3412;
            }
            .badge-attraction {
              background-color: #d1fae5;
              color: #065f46;
            }
            .badge-transport {
              background-color: #dbeafe;
              color: #0369a1;
            }
          </style>
        </head>
        <body>
          <h1>מסלול טיול ל${trip.destination}</h1>
          <p>
            <strong>תאריכים:</strong> ${format(new Date(trip.start_date), 'dd/MM/yyyy')} - ${format(new Date(trip.end_date), 'dd/MM/yyyy')}
            <br>
            <strong>מטיילים:</strong> ${trip.num_adults} מבוגרים${trip.num_children > 0 ? `, ${trip.num_children} ילדים` : ''}
            <br>
            <strong>סגנון:</strong> ${trip.trip_type}
          </p>
          
          ${itinerary.map(day => `
            <div>
              <h2 class="day-header">יום ${day.day_number}: ${format(new Date(day.date), 'EEEE, dd/MM/yyyy')}</h2>
              
              ${day.activities && day.activities.length > 0 ? 
                day.activities.map(activity => `
                  <div class="activity">
                    <div class="activity-time">${activity.time}</div>
                    <div class="activity-title">
                      ${activity.title}
                      <span class="badge badge-${activity.category}">${activity.category}</span>
                    </div>
                    <div class="activity-description">${activity.description}</div>
                    ${activity.location && activity.location.name ? 
                      `<div class="activity-location">מיקום: ${activity.location.name}</div>` : 
                      ''}
                  </div>
                `).join('') : 
                '<p>אין פעילויות מתוכננות ליום זה</p>'
              }
              
              ${day.notes ? `<div class="notes">${day.notes}</div>` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  if (!trip) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">לא נמצא מידע על הטיול</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'hotel': return <Hotel className="h-4 w-4" />;
      case 'restaurant': return <Coffee className="h-4 w-4" />;
      case 'attraction': return <MapPin className="h-4 w-4" />;
      case 'transport': return <Car className="h-4 w-4" />;
      default: return null;
    }
  };
  
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
  
  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{trip.destination}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mt-1.5">
              <Calendar className="h-4 w-4 mr-1" />
              {format(new Date(trip.start_date), 'dd/MM/yyyy')} - {format(new Date(trip.end_date), 'dd/MM/yyyy')}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleCopyToClipboard} title="העתק למסלול">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint} title="הדפס">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {itinerary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4">
            <div className="md:col-span-1 border-r">
              <ScrollArea className="h-[400px] p-3">
                <div className="space-y-2">
                  {itinerary.map((day) => (
                    <Button
                      key={day.day_number}
                      variant={selectedDay === day.day_number.toString() ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedDay(day.day_number.toString())}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>יום {day.day_number}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <div className="md:col-span-3">
              <ScrollArea className="h-[400px]">
                {itinerary.map((day) => (
                  <div
                    key={day.day_number}
                    className={`p-4 ${selectedDay === day.day_number.toString() ? 'block' : 'hidden'}`}
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-1">
                        יום {day.day_number}: {format(new Date(day.date), 'EEEE, dd/MM/yyyy')}
                      </h3>
                    </div>
                    
                    {day.activities && day.activities.length > 0 ? (
                      <div className="relative space-y-6">
                        {/* Timeline connector */}
                        <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200 z-0"></div>
                        
                        {day.activities.map((activity, idx) => (
                          <div key={idx} className="relative flex gap-4 pl-4">
                            {/* Timeline dot */}
                            <div className="absolute left-4 transform -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-500 z-10"></div>
                            
                            {/* Time */}
                            <div className="w-14 flex-shrink-0 text-sm font-medium mt-1">
                              {activity.time}
                            </div>
                            
                            {/* Activity */}
                            <div className="flex-grow">
                              <div className="flex items-start gap-2">
                                <h4 className="font-medium">{activity.title}</h4>
                                <Badge className={getCategoryColor(activity.category)}>
                                  {getCategoryIcon(activity.category)}
                                  <span className="ml-1">{activity.category}</span>
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                              
                              {activity.location && activity.location.name && (
                                <div className="flex items-center mt-2 text-sm text-blue-600">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{activity.location.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        אין פעילויות מתוכננות ליום זה עדיין
                      </div>
                    )}
                    
                    {day.notes && (
                      <div className="mt-6 p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
                        <h4 className="font-medium mb-1">הערות:</h4>
                        <p className="text-sm">{day.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">עדיין אין מסלול מפורט לטיול זה</p>
          </div>
        )}
      </CardContent>
      
      {onNavigateToDetails && (
        <CardFooter className="border-t p-4 flex justify-end">
          <Button onClick={onNavigateToDetails}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            צפייה בפרטים מלאים
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}