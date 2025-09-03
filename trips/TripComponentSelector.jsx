import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plane, Hotel, Car, Ticket, Utensils } from 'lucide-react';

export default function TripComponentSelector({ preferences, onChange }) {
  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plane className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <Label htmlFor="include_flights" className="text-lg font-medium">טיסות</Label>
              <p className="text-sm text-gray-500">כולל חיפוש וסינון טיסות מתאימות</p>
            </div>
          </div>
          <Switch 
            id="include_flights"
            className="dark:bg-gray-700"
            checked={preferences.include_flights}
            onCheckedChange={(checked) => onChange('include_flights', checked)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Hotel className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <Label htmlFor="include_hotels" className="text-lg font-medium">מלונות</Label>
              <p className="text-sm text-gray-500">חיפוש והמלצות למקומות לינה</p>
            </div>
          </div>
          <Switch 
            id="include_hotels"
            className="dark:bg-gray-700"
            checked={preferences.include_hotels}
            onCheckedChange={(checked) => onChange('include_hotels', checked)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <Label htmlFor="include_cars" className="text-lg font-medium">השכרת רכב</Label>
              <p className="text-sm text-gray-500">חיפוש והשוואת מחירי רכב להשכרה</p>
            </div>
          </div>
          <Switch 
            id="include_cars"
            className="dark:bg-gray-700"
            checked={preferences.include_cars}
            onCheckedChange={(checked) => onChange('include_cars', checked)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Ticket className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <Label htmlFor="include_activities" className="text-lg font-medium">אטרקציות</Label>
              <p className="text-sm text-gray-500">פעילויות ואטרקציות מומלצות</p>
            </div>
          </div>
          <Switch 
            id="include_activities"
            className="dark:bg-gray-700"
            checked={preferences.include_activities}
            onCheckedChange={(checked) => onChange('include_activities', checked)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Utensils className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <Label htmlFor="include_restaurants" className="text-lg font-medium">מסעדות</Label>
              <p className="text-sm text-gray-500">המלצות למסעדות ומקומות אוכל</p>
            </div>
          </div>
          <Switch 
            id="include_restaurants"
            className="dark:bg-gray-700"
            checked={preferences.include_restaurants}
            onCheckedChange={(checked) => onChange('include_restaurants', checked)}
          />
        </div>
      </div>
    </Card>
  );
}