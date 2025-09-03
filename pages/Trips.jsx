import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trip } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, AlertCircle, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyPlaceholder } from '@/components/ui/empty-placeholder';
import { useLanguage } from '../components/contexts/LanguageContext';

export default function TripsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const tripsList = await Trip.list();
      setTrips(tripsList || []);
    } catch (err) {
      console.error('Error loading trips:', err);
      setError(t('error') + ': ' + 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const getTripStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: t('draft'), class: 'bg-gray-100 text-gray-800' },
      planning: { label: t('planning'), class: 'bg-blue-100 text-blue-800' },
      booked: { label: t('booked'), class: 'bg-green-100 text-green-800' },
      completed: { label: t('completed'), class: 'bg-purple-100 text-purple-800' },
      cancelled: { label: t('cancelled'), class: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('myTrips')}</h1>
        <Button onClick={() => navigate(createPageUrl('PlanTrip'))}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('planNewTrip')}
        </Button>
      </div>

      {trips.length === 0 ? (
        <EmptyPlaceholder>
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('noTripsYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('noTripsFound')}
            </p>
            <Button onClick={() => navigate(createPageUrl('PlanTrip'))}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('planNewTrip')}
            </Button>
          </div>
        </EmptyPlaceholder>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card 
              key={trip.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(createPageUrl('TripDetails') + `?id=${trip.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{trip.destination}</h3>
                  {getTripStatusBadge(trip.status)}
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  {trip.start_date && trip.end_date && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {format(new Date(trip.start_date), 'dd/MM/yyyy')} - 
                        {format(new Date(trip.end_date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{trip.destination}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>
                      {trip.num_adults} {t('adults')}
                      {trip.num_children > 0 && `, ${trip.num_children} ${t('children')}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}