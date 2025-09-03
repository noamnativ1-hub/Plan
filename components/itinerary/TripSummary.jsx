import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Plane, 
  Hotel, 
  Car, 
  Coffee 
} from 'lucide-react';

export default function TripSummary({ tripData }) {
  if (!tripData) return null;
  
  // Calculate trip duration
  const startDate = new Date(tripData.start_date);
  const endDate = new Date(tripData.end_date);
  const duration = differenceInDays(endDate, startDate) + 1;
  
  // For demo purposes - add prices
  const basePrice = tripData.budget_min || 1000;
  const flightPrice = Math.round(basePrice * 0.4);
  const hotelPrice = Math.round(basePrice * 0.3);
  const activitiesPrice = Math.round(basePrice * 0.2);
  const totalPrice = flightPrice + hotelPrice + activitiesPrice;
  
  // Add total price to tripData for access by other components
  tripData.total_price = totalPrice;
  
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2 text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              פרטי נסיעה
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>תאריך יציאה:</span>
                <span className="font-medium">{format(startDate, 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>תאריך חזרה:</span>
                <span className="font-medium">{format(endDate, 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>משך הטיול:</span>
                <span className="font-medium">{duration} ימים</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2 text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              מטיילים
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>מבוגרים:</span>
                <span className="font-medium">{tripData.num_adults}</span>
              </div>
              <div className="flex justify-between">
                <span>ילדים:</span>
                <span className="font-medium">{tripData.num_children}</span>
              </div>
              {tripData.children_ages && tripData.children_ages.length > 0 && (
                <div className="flex justify-between">
                  <span>גילאי ילדים:</span>
                  <span className="font-medium">{tripData.children_ages.join(', ')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2 text-muted-foreground">
              <CreditCard className="mr-2 h-4 w-4" />
              תקציב
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>תקציב מינימלי:</span>
                <span className="font-medium">${tripData.budget_min}</span>
              </div>
              <div className="flex justify-between">
                <span>תקציב מקסימלי:</span>
                <span className="font-medium">${tripData.budget_max}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">סיכום עלויות</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Plane className="mr-2 h-4 w-4 text-blue-500" />
                <span>טיסות</span>
              </div>
              <span className="font-medium">${flightPrice}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Hotel className="mr-2 h-4 w-4 text-purple-500" />
                <span>מלונות</span>
              </div>
              <span className="font-medium">${hotelPrice}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Coffee className="mr-2 h-4 w-4 text-green-500" />
                <span>פעילויות ואטרקציות</span>
              </div>
              <span className="font-medium">${activitiesPrice}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center font-bold text-lg">
              <span>סה"כ</span>
              <span>${totalPrice}</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              המחירים הם הערכה בלבד וכפופים לשינויים בהתאם לזמינות ולשינויים במחירי הספקים.
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">פרטי הזמנה</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>סטטוס:</span>
                <Badge className="capitalize">
                  {tripData.status === 'draft' ? 'טיוטה' : 
                   tripData.status === 'planning' ? 'בתכנון' :
                   tripData.status === 'booked' ? 'הוזמן' :
                   tripData.status === 'completed' ? 'הושלם' : 'בוטל'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span>סוג הטיול:</span>
                <span>{tripData.trip_type || 'לא הוגדר'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>העדפות:</span>
                <div className="flex flex-wrap gap-2 justify-end">
                  {tripData.preferences?.include_flights && (
                    <Badge variant="outline">טיסות</Badge>
                  )}
                  {tripData.preferences?.include_hotels && (
                    <Badge variant="outline">מלונות</Badge>
                  )}
                  {tripData.preferences?.include_cars && (
                    <Badge variant="outline">רכב</Badge>
                  )}
                  {tripData.preferences?.include_activities && (
                    <Badge variant="outline">פעילויות</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}