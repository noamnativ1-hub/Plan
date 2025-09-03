
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trip } from '@/api/entities';
import { TripPayment } from '@/api/entities';
import { TripInsurance } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
    CheckCircle2,
    Download,
    MessageCircle,
    CalendarDays,
    Clock,
    MapPin,
    Users,
    Shield,
    Receipt,
    ArrowRight,
    Loader2
} from 'lucide-react';

export default function BookingConfirmationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('tripId');
    
    const [loading, setLoading] = useState(true);
    const [trip, setTrip] = useState(null);
    const [payment, setPayment] = useState(null);
    const [insurances, setInsurances] = useState([]);
    
    useEffect(() => {
        loadBookingDetails();
    }, [tripId]);
    
    const loadBookingDetails = async () => {
        try {
            const [tripData, paymentData, insuranceData] = await Promise.all([
                Trip.get(tripId),
                TripPayment.filter({ trip_id: tripId }),
                TripInsurance.filter({ trip_id: tripId })
            ]);
            
            setTrip(tripData);
            setPayment(paymentData[0]);
            setInsurances(insuranceData);
        } catch (error) {
            console.error('Error loading booking details:', error);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <div className="container py-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="container py-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold mb-2">תודה על הזמנתך!</h1>
                    <p className="text-gray-600">
                        ההזמנה שלך אושרה ונשלחה למייל
                    </p>
                </div>
                
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>פרטי ההזמנה</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <MapPin className="h-4 w-4" />
                                            יעד
                                        </div>
                                        <div className="font-medium">{trip.destination}</div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <CalendarDays className="h-4 w-4" />
                                            תאריכים
                                        </div>
                                        <div className="font-medium">
                                            {format(new Date(trip.start_date), 'dd/MM/yyyy')} - {format(new Date(trip.end_date), 'dd/MM/yyyy')}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Users className="h-4 w-4" />
                                            מטיילים
                                        </div>
                                        <div className="font-medium">
                                            {trip.num_adults} מבוגרים, {trip.num_children} ילדים
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <Receipt className="h-4 w-4" />
                                            סכום ששולם
                                        </div>
                                        <div className="font-medium">
                                            ${payment.amount}
                                        </div>
                                    </div>
                                </div>
                                
                                {insurances.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h3 className="font-medium mb-2 flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                ביטוחים שנרכשו
                                            </h3>
                                            <div className="space-y-2">
                                                {insurances.map((insurance, index) => (
                                                    <div key={index} className="text-sm">
                                                        <span className="font-medium">
                                                            {insurance.type === 'cancellation' ? 'ביטוח ביטול' : 'ביטוח נסיעות'}
                                                        </span>
                                                        {' - '}
                                                        <span className="text-muted-foreground">
                                                            {insurance.level === 'basic' ? 'בסיסי' :
                                                             insurance.level === 'extended' ? 'מורחב' : 'פרימיום'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="h-auto py-4"
                            onClick={() => navigate(createPageUrl('TripDetails') + `?id=${tripId}`)}
                        >
                            <div className="text-left">
                                <div className="font-medium">צפייה במסלול הטיול</div>
                                <div className="text-sm text-muted-foreground">
                                    לפרטים מלאים על לוח הזמנים והפעילויות
                                </div>
                            </div>
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                    
                    <Alert>
                        <AlertDescription>
                            שלחנו לך מייל עם כל פרטי ההזמנה, כולל קבלה וקבצי ביטוח.
                            אם לא קיבלת את המייל, בדוק בתיקיית הספאם או צור קשר עם התמיכה.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    );
}
