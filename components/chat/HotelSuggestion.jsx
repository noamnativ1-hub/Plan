import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Wifi, Car, Coffee, Check } from 'lucide-react';

export default function HotelSuggestion({ hotel, onSelect }) {
  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={hotel.image} 
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        {hotel.rating && (
          <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900">
            <Star className="h-3 w-3 fill-current mr-1" />
            {hotel.rating}
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{hotel.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{hotel.location}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {hotel.wifi && <Wifi className="h-4 w-4" />}
            {hotel.parking && <Car className="h-4 w-4" />}
            {hotel.breakfast && <Coffee className="h-4 w-4" />}
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-muted-foreground">מחיר ללילה</p>
              <p className="text-lg font-bold">${hotel.price}</p>
            </div>
            
            <Button onClick={() => onSelect(hotel)} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-2" />
              בחר
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}