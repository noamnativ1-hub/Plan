import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { MapPin, Calendar, Clock, Coffee, Plane, Hotel, Car, ArrowRight } from 'lucide-react';

export default function ItineraryMapView({ itinerary, activeDay, onDayChange }) {
  const [selectedDay, setSelectedDay] = useState(activeDay);
  const [dayActivities, setDayActivities] = useState([]);
  
  useEffect(() => {
    if (itinerary && itinerary.length > 0) {
      const day = itinerary.find(d => d.day_number === selectedDay) || itinerary[0];
      setDayActivities(day.activities || []);
    }
  }, [itinerary, selectedDay]);
  
  const handleDayChange = (day) => {
    setSelectedDay(day);
    if (onDayChange) onDayChange(day);
  };
  
  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">אין נתוני מסלול זמינים</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
        <div className="space-y-2">
          <h3 className="font-medium mb-2">ימים במסלול:</h3>
          
          <div className="flex flex-wrap gap-2">
            {itinerary.map(day => (
              <Button
                key={day.day_number}
                variant={selectedDay === day.day_number ? "default" : "outline"}
                size="sm"
                onClick={() => handleDayChange(day.day_number)}
              >
                יום {day.day_number}
              </Button>
            ))}
          </div>
          
          <div className="mt-6 space-y-4">
            {dayActivities.length > 0 ? (
              dayActivities.map((activity, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 mt-1">
                        {getCategoryIcon(activity.category)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{activity.title}</h4>
                          <span className="text-sm text-muted-foreground">{activity.time}</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground my-1">
                          {activity.description}
                        </p>
                        
                        {activity.location && (
                          <div className="flex items-center text-xs text-muted-foreground mt-2">
                            <MapPin className="h-3 w-3 mr-1" />
                            {activity.location.name}
                          </div>
                        )}
                        
                        {activity.price > 0 && (
                          <Badge variant="outline" className="mt-2">${activity.price}</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">
                אין פעילויות ליום זה
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="col-span-12 lg:col-span-8 xl:col-span-9 order-1 lg:order-2">
        <Card className="overflow-hidden h-[600px]">
          <CardContent className="p-0 h-full">
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">מפת המסלול</h3>
                <p className="text-muted-foreground mb-4">
                  תצוגת מפה למסלול הטיול תהיה זמינה בקרוב
                </p>
                <Button>בנה מסלול מפה</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get icon based on activity category
function getCategoryIcon(category) {
  switch(category) {
    case 'flight':
      return <Plane className="h-4 w-4" />;
    case 'hotel':
      return <Hotel className="h-4 w-4" />;
    case 'restaurant':
      return <Coffee className="h-4 w-4" />;
    case 'attraction':
      return <MapPin className="h-4 w-4" />;
    case 'transport':
      return <Car className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}