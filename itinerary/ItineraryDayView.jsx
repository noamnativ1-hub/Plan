import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Clock, MapPin, DollarSign, Calendar } from 'lucide-react';

export default function ItineraryDayView({ day, isActive }) {
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'flight':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">טיסה</Badge>;
      case 'hotel':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">מלון</Badge>;
      case 'attraction':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">אטרקציה</Badge>;
      case 'restaurant':
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">מסעדה</Badge>;
      case 'transport':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">תחבורה</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">אחר</Badge>;
    }
  };

  return (
    <Card className={`${isActive ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
            {day.day_number}
          </span>
          <span>יום {day.day_number}</span>
          <span className="text-sm text-gray-500 font-normal mr-auto flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {day.date ? format(new Date(day.date), 'EEEE, dd/MM/yyyy') : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {day.activities.length > 0 ? (
          <div className="space-y-4">
            {day.activities.map((activity, index) => (
              <div
                key={index}
                className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{activity.title}</h4>
                  {getCategoryIcon(activity.category)}
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {formatTime(activity.time)}
                  </div>
                  
                  {activity.location && activity.location.name && (
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {activity.location.name}
                    </div>
                  )}
                  
                  {activity.price > 0 && (
                    <div className="flex items-center">
                      <DollarSign className="h-3.5 w-3.5 mr-1" />
                      {activity.price}
                    </div>
                  )}
                </div>
                
                {activity.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{activity.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            אין פעילויות מתוכננות ליום זה
          </div>
        )}
        
        {day.notes && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
            <strong>הערות:</strong> {day.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}