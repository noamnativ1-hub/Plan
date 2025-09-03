import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trip } from '@/api/entities';
import { TripComponent } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, ArrowLeft, BedDouble, Hotel as HotelIcon, Star } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function HotelChangeConfirmationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trip, setTrip] = useState(null);
    const [oldHotel, setOldHotel] = useState(null);
    const [newHotel, setNewHotel] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tripId = params.get('tripId');
        const newHotelData = params.get('newHotel');

        if (!tripId || !newHotelData) {
            setError("מזהה הטיול או פרטי המלון החדש חסרים.");
            setLoading(false);
            return;
        }

        try {
            const parsedNewHotel = JSON.parse(decodeURIComponent(newHotelData));
            setNewHotel(parsedNewHotel);
            loadData(tripId);
        } catch (e) {
            setError("פורמט נתוני המלון החדש אינו תקין.");
            setLoading(false);
        }
    }, [location.search]);

    const loadData = async (tripId) => {
        try {
            const currentTrip = await Trip.get(tripId);
            setTrip(currentTrip);

            const components = await TripComponent.filter({ trip_id: tripId, type: 'hotel' });
            if (components && components.length > 0) {
                setOldHotel(components[0]);
            }
        } catch (e) {
            setError("שגיאה בטעינת נתוני הטיול או המלון הישן.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setProcessing(true);
        setError(null);
        try {
            // Delete the old hotel component
            if (oldHotel) {
                await TripComponent.delete(oldHotel.id);
            }

            // Create the new hotel component
            await TripComponent.create({
                trip_id: trip.id,
                type: 'hotel',
                title: newHotel.title,
                description: newHotel.description || `מלון במיקום מצוין ב${trip.destination}`,
                price: newHotel.price || 180,
                metadata: {
                    address: newHotel.location?.address || newHotel.title,
                    rating: newHotel.rating || 4.2,
                },
                image_url: newHotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            });
            
            setIsConfirmed(true);
        } catch (e) {
            setError("שגיאה בעדכון המלון. אנא נסה שוב.");
        } finally {
            setProcessing(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container max-w-2xl mx-auto py-12">
                <Alert variant="destructive">
                    <AlertTitle>שגיאה</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => navigate(-1)} className="mt-4">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    חזרה
                </Button>
            </div>
        );
    }
    
    if (isConfirmed) {
        return (
            <div className="container max-w-2xl mx-auto py-12 text-center">
                 <Card className="p-8 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">המלון עודכן בהצלחה!</h1>
                    <p className="text-gray-600 mb-6">
                        המלון החדש, {newHotel?.title}, נשמר עבור הטיול שלך ל{trip?.destination}.
                    </p>
                    <Button onClick={() => navigate(createPageUrl('TripDetails') + `?id=${trip.id}`)}>
                        <ArrowLeft className="ml-2 h-4 w-4" />
                        חזור לפרטי הטיול
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container max-w-3xl mx-auto">
                <Card className="shadow-lg overflow-hidden">
                    <CardHeader className="bg-gray-100 p-6 border-b">
                        <CardTitle className="text-2xl font-bold text-gray-800">אישור שינוי מלון</CardTitle>
                        <p className="text-gray-600 mt-1">
                            נא בדוק את הפרטים ואשר את החלפת המלון עבור הטיול שלך ל{trip?.destination}.
                        </p>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Old Hotel */}
                            {oldHotel && (
                                <div className="relative">
                                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">יוחלף</div>
                                    <HotelCard hotel={oldHotel} isOld={true} />
                                </div>
                            )}

                            {/* New Hotel */}
                            {newHotel && (
                                <div className="relative">
                                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">מלון חדש</div>
                                    <HotelCard hotel={newHotel} />
                                </div>
                            )}
                        </div>

                        <Separator />
                        
                        <div className="text-center space-y-4">
                            <p className="text-lg">האם אתה בטוח שברצונך להחליף את המלון?</p>
                            <div className="flex justify-center gap-4">
                                <Button variant="outline" onClick={() => navigate(-1)} disabled={processing}>
                                    ביטול
                                </Button>
                                <Button 
                                    onClick={handleConfirm} 
                                    disabled={processing}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                            מעדכן...
                                        </>
                                    ) : "אשר והחלף מלון"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const HotelCard = ({ hotel, isOld = false }) => (
    <div className={`border rounded-lg overflow-hidden h-full flex flex-col ${isOld ? 'border-red-200 bg-red-50 opacity-70' : 'border-green-200 bg-green-50'}`}>
        <img 
            src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=60'} 
            alt={hotel.title} 
            className="w-full h-40 object-cover"
        />
        <div className="p-4 flex-grow flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800">{hotel.title}</h3>
            {hotel.metadata?.address && <p className="text-sm text-gray-600 mt-1">{hotel.metadata.address}</p>}
            <div className="mt-auto pt-4 flex justify-between items-center text-sm">
                {hotel.metadata?.rating && (
                     <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold">{hotel.metadata.rating}</span>
                    </div>
                )}
                 {hotel.price && (
                    <div className="font-bold text-lg text-gray-800">
                        ₪{hotel.price}<span className="text-sm font-normal text-gray-500">/לילה</span>
                    </div>
                )}
            </div>
        </div>
    </div>
);