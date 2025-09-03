import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Calendar, Users } from 'lucide-react';

export default function BloggerTripList({ trips = [], onSelectTrip }) {
  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">אין טיולים זמינים כרגע</h3>
        <p className="text-muted-foreground">הבלוגר עדיין לא פרסם טיולים</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {trips.map(trip => (
        <Card 
          key={trip.id} 
          className="overflow-hidden cursor-pointer group hover:shadow-md transition-shadow"
          onClick={() => onSelectTrip && onSelectTrip(trip)}
        >
          <div className="relative h-48 overflow-hidden">
            <img 
              src={trip.cover_image} 
              alt={trip.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/80 text-black">
                {formatTripType(trip.trip_type[0])}
              </Badge>
            </div>
            
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-yellow-500/90 text-white">
                <Star className="h-3 w-3 mr-1 fill-current" /> {trip.rating.toFixed(1)}
              </Badge>
            </div>
            
            {trip.featured && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-blue-500/90 text-white">
                  מומלץ
                </Badge>
              </div>
            )}
            
            <div className="absolute bottom-3 left-0 right-0 px-4">
              <h3 className="text-white font-medium text-lg truncate">{trip.title}</h3>
              <div className="flex items-center text-white/90 text-sm">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate">{trip.destination}</span>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="line-clamp-2 text-sm text-muted-foreground mb-3">
              {trip.short_description || trip.description?.substring(0, 120) + '...'}
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                <span>{trip.duration} ימים</span>
              </div>
              
              <div className="font-medium">מ-${trip.price_from}</div>
            </div>
            
            {trip.bookings_count > 0 && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center">
                <Users className="h-3 w-3 mr-1" />
                <span>{trip.bookings_count} אנשים הזמינו</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  function formatTripType(type) {
    const types = {
      'adventure': 'הרפתקאות',
      'cultural': 'תרבות',
      'beach': 'חופים',
      'luxury': 'יוקרה',
      'budget': 'תקציבי',
      'family': 'משפחות',
      'romantic': 'רומנטי',
      'food': 'קולינריה',
      'nature': 'טבע',
      'urban': 'עירוני'
    };
    return types[type] || type;
  }
}