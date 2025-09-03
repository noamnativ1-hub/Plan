
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trip } from '@/api/entities';
import { TripPayment } from '@/api/entities';
import { TripInsurance } from '@/api/entities';
import { User } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { 
    CreditCard, 
    AlertTriangle, 
    Shield, 
    Check, 
    Info, 
    ArrowRight,
    Loader2
} from 'lucide-react';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('tripId');
    
    const [trip, setTrip] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    
    const [paymentDetails, setPaymentDetails] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        nameOnCard: ''
    });
    
    const [hasCancellationInsurance, setHasCancellationInsurance] = useState(false);
    const [cancellationInsuranceType, setCancellationInsuranceType] = useState(null);
    const [hasTravelInsurance, setHasTravelInsurance] = useState(false);
    const [travelInsuranceType, setTravelInsuranceType] = useState(null);
    
    useEffect(() => {
        loadTripAndUser();
    }, [tripId]);
    
    const loadTripAndUser = async () => {
        try {
            const [tripData, userData] = await Promise.all([
                Trip.get(tripId),
                User.me()
            ]);
            setTrip(tripData);
            setUser(userData);
        } catch (error) {
            console.error('Error loading data:', error);
            setError('אירעה שגיאה בטעינת פרטי ההזמנה');
        } finally {
            setLoading(false);
        }
    };
    
    const calculateTotal = () => {
        let total = trip?.total_price || 0;
        
        if (hasCancellationInsurance && cancellationInsuranceType) {
            total += cancellationInsuranceType === 'basic' ? 50 : 100;
        }
        
        if (hasTravelInsurance && travelInsuranceType) {
            total += {
                basic: 100,
                extended: 200,
                premium: 300
            }[travelInsuranceType];
        }
        
        return total;
    };
    
    const handlePayment = async () => {
        setProcessing(true);
        setError(null);
        
        try {
            // Create payment record
            const payment = await TripPayment.create({
                trip_id: tripId,
                user_id: user.id,
                amount: calculateTotal(),
                payment_date: new Date().toISOString(),
                status: 'completed',
                payment_method: 'credit_card',
                insurance_details: {
                    cancellation_insurance: hasCancellationInsurance,
                    travel_insurance: hasTravelInsurance,
                    insurance_level: travelInsuranceType || cancellationInsuranceType,
                    insurance_cost: calculateInsuranceCost()
                }
            });
            
            // Create insurance records if selected
            if (hasCancellationInsurance && cancellationInsuranceType) {
                await TripInsurance.create({
                    trip_id: tripId,
                    user_id: user.id,
                    type: 'cancellation',
                    level: cancellationInsuranceType,
                    status: 'active',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: trip.end_date,
                    cost: cancellationInsuranceType === 'basic' ? 50 : 100
                });
            }
            
            if (hasTravelInsurance && travelInsuranceType) {
                await TripInsurance.create({
                    trip_id: tripId,
                    user_id: user.id,
                    type: 'travel',
                    level: travelInsuranceType,
                    status: 'active',
                    start_date: trip.start_date,
                    end_date: trip.end_date,
                    cost: {
                        basic: 100,
                        extended: 200,
                        premium: 300
                    }[travelInsuranceType]
                });
            }
            
            // Update trip status
            await Trip.update(tripId, { status: 'booked' });
            
            // Send confirmation email
            await SendEmail({
                to: user.email,
                subject: `אישור הזמנה - ${trip.destination}`,
                body: `
                    תודה על הזמנתך!
                    
                    פרטי ההזמנה:
                    יעד: ${trip.destination}
                    תאריכים: ${format(new Date(trip.start_date), 'dd/MM/yyyy')} - ${format(new Date(trip.end_date), 'dd/MM/yyyy')}
                    מספר מטיילים: ${trip.num_adults} מבוגרים, ${trip.num_children} ילדים
                    
                    סה"כ לתשלום: $${calculateTotal()}
                    
                    ${hasCancellationInsurance ? `
                    ביטוח ביטול: ${cancellationInsuranceType === 'basic' ? 'בסיסי' : 'מורחב'}
                    ` : ''}
                    
                    ${hasTravelInsurance ? `
                    ביטוח נסיעות: ${
                        travelInsuranceType === 'basic' ? 'בסיסי' :
                        travelInsuranceType === 'extended' ? 'מורחב' : 'פרימיום'
                    }
                    ` : ''}
                    
                    לצפייה בפרטי ההזמנה המלאים:
                    ${window.location.origin}${createPageUrl('MyBookings')}
                `
            });
            
            // Navigate to success page
            navigate(createPageUrl('BookingConfirmation') + `?tripId=${tripId}`);
            
        } catch (error) {
            console.error('Error processing payment:', error);
            setError('אירעה שגיאה בביצוע התשלום. נסה שנית.');
            setProcessing(false);
        }
    };
    
    const calculateInsuranceCost = () => {
        let cost = 0;
        if (hasCancellationInsurance && cancellationInsuranceType) {
            cost += cancellationInsuranceType === 'basic' ? 50 : 100;
        }
        if (hasTravelInsurance && travelInsuranceType) {
            cost += {
                basic: 100,
                extended: 200,
                premium: 300
            }[travelInsuranceType];
        }
        return cost;
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
                <h1 className="text-3xl font-bold mb-8">השלמת הזמנה</h1>
                
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>פרטי תשלום</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>מספר כרטיס</Label>
                                    <Input
                                        type="text"
                                        maxLength="16"
                                        value={paymentDetails.cardNumber}
                                        onChange={(e) => setPaymentDetails({
                                            ...paymentDetails,
                                            cardNumber: e.target.value.replace(/\D/g, '')
                                        })}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>תוקף</Label>
                                        <Input
                                            type="text"
                                            placeholder="MM/YY"
                                            maxLength="5"
                                            value={paymentDetails.expiryDate}
                                            onChange={(e) => setPaymentDetails({
                                                ...paymentDetails,
                                                expiryDate: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CVV</Label>
                                        <Input
                                            type="text"
                                            maxLength="3"
                                            value={paymentDetails.cvv}
                                            onChange={(e) => setPaymentDetails({
                                                ...paymentDetails,
                                                cvv: e.target.value.replace(/\D/g, '')
                                            })}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>שם בעל הכרטיס</Label>
                                    <Input
                                        type="text"
                                        value={paymentDetails.nameOnCard}
                                        onChange={(e) => setPaymentDetails({
                                            ...paymentDetails,
                                            nameOnCard: e.target.value
                                        })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>ביטוחים</CardTitle>
                                <CardDescription>
                                    בחר את הביטוחים המתאימים לך
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Cancellation Insurance */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium">ביטוח ביטול</h3>
                                        <Switch 
                                            id="hasCancellationInsurance"
                                            checked={hasCancellationInsurance}
                                            onCheckedChange={setHasCancellationInsurance}
                                        />
                                    </div>
                                    
                                    {hasCancellationInsurance && (
                                        <RadioGroup
                                            value={cancellationInsuranceType}
                                            onValueChange={setCancellationInsuranceType}
                                            className="mt-3"
                                        >
                                            <div className="space-y-4 bg-white p-4 rounded-lg">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="basic" id="cancelBasic" />
                                                    <Label htmlFor="cancelBasic" className="text-gray-900">
                                                        ביטוח בסיסי ($50) - החזר של עד 90% במקרה של ביטול
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="extended" id="cancelExtended" />
                                                    <Label htmlFor="cancelExtended" className="text-gray-900">
                                                        ביטוח מורחב ($100) - החזר מלא במקרה של ביטול
                                                    </Label>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    )}
                                </div>

                                {/* Travel Insurance */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium">ביטוח נסיעות</h3>
                                        <Switch 
                                            id="hasTravelInsurance"
                                            checked={hasTravelInsurance}
                                            onCheckedChange={setHasTravelInsurance}
                                        />
                                    </div>
                                    
                                    {hasTravelInsurance && (
                                        <RadioGroup
                                            value={travelInsuranceType}
                                            onValueChange={setTravelInsuranceType}
                                            className="mt-3"
                                        >
                                            <div className="space-y-4 bg-white p-4 rounded-lg mt-4">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="basic" id="travelBasic" />
                                                    <Label htmlFor="travelBasic" className="text-gray-900">
                                                        ביטוח בסיסי ($100) - כיסוי רפואי בסיסי עד $200,000
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="extended" id="travelExtended" />
                                                    <Label htmlFor="travelExtended" className="text-gray-900">
                                                        ביטוח מורחב ($200) - כולל אובדן כבודה ועיכובים
                                                    </Label>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div>
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle>סיכום הזמנה</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium">פרטי הטיול</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {trip.destination}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(trip.start_date), 'dd/MM/yyyy')} - {format(new Date(trip.end_date), 'dd/MM/yyyy')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {trip.num_adults} מבוגרים, {trip.num_children} ילדים
                                        </p>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>מחיר בסיסי</span>
                                            <span>${trip.total_price}</span>
                                        </div>
                                        
                                        {hasCancellationInsurance && cancellationInsuranceType && (
                                            <div className="flex justify-between text-sm">
                                                <span>ביטוח ביטול</span>
                                                <span>
                                                    ${cancellationInsuranceType === 'basic' ? '50' : '100'}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {hasTravelInsurance && travelInsuranceType && (
                                            <div className="flex justify-between text-sm">
                                                <span>ביטוח נסיעות</span>
                                                <span>
                                                    ${
                                                        travelInsuranceType === 'basic' ? '100' :
                                                        travelInsuranceType === 'extended' ? '200' : '300'
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>סה"כ לתשלום</span>
                                        <span>${calculateTotal()}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={handlePayment}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            מבצע תשלום...
                                        </>
                                    ) : (
                                        <>
                                            השלם תשלום
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
