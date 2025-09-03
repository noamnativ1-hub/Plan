import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TimelineItinerary from './TimelineItinerary';
import ItineraryMapView from './ItineraryMapView';
import { Map, Clock } from 'lucide-react';

export default function VisualItinerary({ trip, itinerary }) {
  const [activeView, setActiveView] = useState('timeline');
  
  return (
    <div className="space-y-4">
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            ציר זמן
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            מפה
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline">
          <TimelineItinerary trip={trip} itinerary={itinerary} />
        </TabsContent>
        <TabsContent value="map">
          <ItineraryMapView trip={trip} itinerary={itinerary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}