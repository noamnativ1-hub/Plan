import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plane, Hotel, Car, Coffee, MapPin, Calendar, Clock, ExternalLink } from 'lucide-react';

export default function ItineraryCategoryView({ components, componentsByType, getComponentIcon }) {
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    try {
      return format(parseISO(dateTimeStr), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return '';
    }
  };
  
  const getCategoryLabel = (type) => {
    switch (type) {
      case 'flight': return 'טיסות';
      case 'hotel': return 'מלונות';
      case 'car': return 'רכבים';
      case 'activity': return 'אטרקציות';
      case 'restaurant': return 'מסעדות';
      default: return type;
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'booked':
        return <Badge className="bg-green-100 text-green-800">הוזמן</Badge>;
      case 'suggested':
        return <Badge className="bg-blue-100 text-blue-800">מוצע</Badge>;
      case 'selected':
        return <Badge className="bg-indigo-100 text-indigo-800">נבחר</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">בוטל</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">הושלם</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Tabs defaultValue="flight">
      <TabsList className="mb-4">
        <TabsTrigger value="flight" className="flex items-center gap-1">
          <Plane className="h-4 w-4" />
          <span>טיסות</span>
          {componentsByType.flight.length > 0 && (
            <Badge variant="secondary" className="ml-1">{componentsByType.flight.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="hotel" className="flex items-center gap-1">
          <Hotel className="h-4 w-4" />
          <span>מלונות</span>
          {componentsByType.hotel.length > 0 && (
            <Badge variant="secondary" className="ml-1">{componentsByType.hotel.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="car" className="flex items-center gap-1">
          <Car className="h-4 w-4" />
          <span>רכבים</span>
          {componentsByType.car.length > 0 && (
            <Badge variant="secondary" className="ml-1">{componentsByType.car.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>אטרקציות</span>
          {componentsByType.activity.length > 0 && (
            <Badge variant="secondary" className="ml-1">{componentsByType.activity.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="restaurant" className="flex items-center gap-1">
          <Coffee className="h-4 w-4" />
          <span>מסעדות</span>
          {componentsByType.restaurant.length > 0 && (
            <Badge variant="secondary" className="ml-1">{componentsByType.restaurant.length}</Badge>
          )}
        </TabsTrigger>
      </TabsList>
      
      {Object.keys(componentsByType).map(type => (
        <TabsContent key={type} value={type} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getComponentIcon(type)}
                <span className="ml-2">{getCategoryLabel(type)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {componentsByType[type].length > 0 ? (
                <div className="space-y-6">
                  {componentsByType[type].map((component) => (
                    <div key={component.id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-start p-4">
                        {component.image_url && (
                          <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 mr-4">
                            <img 
                              src={component.image_url} 
                              alt={component.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="flex flex-wrap justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{component.title}</h3>
                              {component.description && (
                                <p className="text-sm text-muted-foreground">{component.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {component.price && (
                                <p className="font-medium">${component.price}</p>
                              )}
                              {getStatusBadge(component.status)}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4 mt-3">
                            {component.start_datetime && (
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-3.5 w-3.5" />
                                <span>{formatDateTime(component.start_datetime)}</span>
                                {component.end_datetime && (
                                  <>
                                    <span className="mx-1">-</span>
                                    <span>{formatDateTime(component.end_datetime)}</span>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {component.location && component.location.address && (
                              <div className="flex items-center">
                                <MapPin className="mr-1 h-3.5 w-3.5" />
                                <span>{component.location.address}</span>
                              </div>
                            )}
                          </div>
                          
                          {component.booking_reference && (
                            <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                              מספר הזמנה: {component.booking_reference}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {component.status === 'suggested' && (
                        <div className="border-t p-3 bg-muted/10 flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            שינוי פרטים
                          </Button>
                          <Button size="sm">
                            הזמן עכשיו
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/10 rounded-lg">
                  <p className="text-muted-foreground">אין רכיבים מסוג {getCategoryLabel(type)} בטיול זה</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}