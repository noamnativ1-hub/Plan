import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Plane, Hotel, Car, Map, Coffee, CreditCard, Loader2, Star, ArrowLeft, Check, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TripChatSidebar from '../components/chat/TripChatSidebar';

export default function TripDetailsSamplePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trip, setTrip] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isBloggerTrip, setIsBloggerTrip] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [tripId, setTripId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const blogger = urlParams.get('blogger');
    
    setTripId(id);
    if (blogger) {
      setIsBloggerTrip(true);
    }
    
    loadTripData(id);
  }, [location.search]);

  const loadTripData = async (id) => {
    // Simulation of API call
    setTimeout(() => {
      let tripData = {};
      let componentsData = [];

      // Different trip data based on ID
      if (id === "101") {
        // Thailand trip data
        tripData = {
          id: id,
          destination: "תאילנד",
          title: "הרפתקאות בתאילנד - 14 ימים של קסם",
          description: "טיול מרהיב בתאילנד עם חוויות אותנטיות, מחופים קסומים ועד למקדשים עתיקים",
          start_date: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
          end_date: new Date(new Date().getTime() + (44 * 24 * 60 * 60 * 1000)).toISOString(),
          num_adults: 2,
          num_children: 0,
          trip_type: "הרפתקאות",
          price: 2500,
          rating: 4.8,
          traveler_type: "זוגות",
          status: "available",
          blogger: {
            name: "תמר לוינסון",
            image: "https://images.unsplash.com/photo-1616002411355-49593fd89721?auto=format&fit=crop&w=150&q=80",
            trips: 12,
            followers: 5300
          }
        };

        componentsData = [
          {
            id: "flight101_1",
            trip_id: id,
            type: "flight",
            title: "טיסה הלוך - אל על",
            description: "טיסה ישירה מנתב\"ג לבנגקוק",
            start_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000) + 11 * 60 * 60 * 1000).toISOString(),
            price: 850,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "נמל תעופה בן-גוריון"
            }
          },
          {
            id: "hotel101_1",
            trip_id: id,
            type: "hotel",
            title: "מלון מנדרין אוריינטל בנגקוק",
            description: "מלון 5 כוכבים על גדות נהר צ'או פריאה",
            start_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (34 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 480,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Bangkok, Thailand"
            }
          },
          {
            id: "activity101_1",
            trip_id: id,
            type: "activity",
            title: "שוק צף דמנואן סדואק",
            description: "סיור בשוק המפורסם כולל שייט בסירה מסורתית",
            start_datetime: new Date(new Date().getTime() + (32 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (32 * 24 * 60 * 60 * 1000) + 4 * 60 * 60 * 1000).toISOString(),
            price: 35,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1588614959060-4d141f4d4532?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Damnoen Saduak, Thailand"
            }
          },
          {
            id: "hotel101_2",
            trip_id: id,
            type: "hotel",
            title: "חוף צ'אוונג קו סמוי",
            description: "מלון יוקרה על החוף בקו סמוי",
            start_datetime: new Date(new Date().getTime() + (34 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (39 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 550,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Koh Samui, Thailand"
            }
          },
          {
            id: "activity101_2",
            trip_id: id,
            type: "activity",
            title: "טיול ג'יפים באי",
            description: "טיול ג'יפים כולל מפלים ונקודות תצפית",
            start_datetime: new Date(new Date().getTime() + (36 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (36 * 24 * 60 * 60 * 1000) + 6 * 60 * 60 * 1000).toISOString(),
            price: 60,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1516496636080-14fb876e029d?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Koh Samui, Thailand"
            }
          },
          {
            id: "hotel101_3",
            trip_id: id,
            type: "hotel",
            title: "מלון אווני+ בצ'אנג מאי",
            description: "מלון בוטיק בצפון תאילנד",
            start_datetime: new Date(new Date().getTime() + (39 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (44 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 390,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1561501878-aabd62634533?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Chiang Mai, Thailand"
            }
          },
          {
            id: "activity101_3",
            trip_id: id,
            type: "activity",
            title: "מקדש דוי סוטפ",
            description: "סיור במקדש המפורסם על ראש ההר",
            start_datetime: new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000) + 3 * 60 * 60 * 1000).toISOString(),
            price: 25,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Doi Suthep, Chiang Mai, Thailand"
            }
          },
          {
            id: "flight101_2",
            trip_id: id,
            type: "flight",
            title: "טיסה חזור - אל על",
            description: "טיסה ישירה מבנגקוק לנתב\"ג",
            start_datetime: new Date(new Date().getTime() + (44 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (44 * 24 * 60 * 60 * 1000) + 11 * 60 * 60 * 1000).toISOString(),
            price: 850,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Suvarnabhumi Airport, Bangkok"
            }
          }
        ];
      } else if (id === "102") {
        // Italy trip data
        tripData = {
          id: id,
          destination: "איטליה",
          title: "סיור קולינרי באיטליה - טעמים וריחות",
          description: "מסע קולינרי באיטליה, מהפיצות של נאפולי ועד לגלידות של פירנצה וליינות של טוסקנה",
          start_date: new Date(new Date().getTime() + (20 * 24 * 60 * 60 * 1000)).toISOString(),
          end_date: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
          num_adults: 2,
          num_children: 0,
          trip_type: "קולינרי",
          price: 3200,
          rating: 4.9,
          traveler_type: "חובבי אוכל",
          status: "available",
          blogger: {
            name: "יובל כהן",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
            trips: 8,
            followers: 3200
          }
        };

        componentsData = [
          {
            id: "flight102_1",
            trip_id: id,
            type: "flight",
            title: "טיסה הלוך - אליטליה",
            description: "טיסה ישירה מנתב\"ג לרומא",
            start_datetime: new Date(new Date().getTime() + (20 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (20 * 24 * 60 * 60 * 1000) + 4 * 60 * 60 * 1000).toISOString(),
            price: 450,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "נמל תעופה בן-גוריון"
            }
          },
          {
            id: "hotel102_1",
            trip_id: id,
            type: "hotel",
            title: "מלון אדריאנו רומא",
            description: "מלון בוטיק במרכז רומא",
            start_datetime: new Date(new Date().getTime() + (20 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (23 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 580,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Via di Pallacorda, Rome, Italy"
            }
          },
          {
            id: "activity102_1",
            trip_id: id,
            type: "activity",
            title: "סיור אוכל רחוב ברומא",
            description: "סיור קולינרי ברובע טרסטוורה",
            start_datetime: new Date(new Date().getTime() + (21 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (21 * 24 * 60 * 60 * 1000) + 4 * 60 * 60 * 1000).toISOString(),
            price: 85,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Trastevere, Rome, Italy"
            }
          },
          {
            id: "hotel102_2",
            trip_id: id,
            type: "hotel",
            title: "אגריטוריזמו בטוסקנה",
            description: "חווה כפרית עם ייצור יין מקומי",
            start_datetime: new Date(new Date().getTime() + (23 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (26 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 420,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Chianti Region, Tuscany, Italy"
            }
          },
          {
            id: "activity102_2",
            trip_id: id,
            type: "activity",
            title: "סדנת בישול טוסקנית",
            description: "למידה עם שף מקומי וארוחת צהריים",
            start_datetime: new Date(new Date().getTime() + (24 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (24 * 24 * 60 * 60 * 1000) + 5 * 60 * 60 * 1000).toISOString(),
            price: 120,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Chianti Region, Tuscany, Italy"
            }
          },
          {
            id: "hotel102_3",
            trip_id: id,
            type: "hotel",
            title: "מלון ספלנדיד פירנצה",
            description: "מלון היסטורי במרכז פירנצה",
            start_datetime: new Date(new Date().getTime() + (26 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 650,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1551631646-6dd34a7aa01f?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Florence, Italy"
            }
          },
          {
            id: "activity102_3",
            trip_id: id,
            type: "activity",
            title: "סיור גלידריות בפירנצה",
            description: "טעימות בחמש מהגלדריות הטובות בעיר",
            start_datetime: new Date(new Date().getTime() + (27 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (27 * 24 * 60 * 60 * 1000) + 3 * 60 * 60 * 1000).toISOString(),
            price: 45,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Florence, Italy"
            }
          },
          {
            id: "flight102_2",
            trip_id: id,
            type: "flight",
            title: "טיסה חזור - אליטליה",
            description: "טיסה ישירה מרומא לנתב\"ג",
            start_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000) + 4 * 60 * 60 * 1000).toISOString(),
            price: 450,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Leonardo da Vinci Airport, Rome"
            }
          }
        ];
      } else if (id === "103") {
        // Japan trip data
        tripData = {
          id: id,
          destination: "יפן",
          title: "חוויה משפחתית ביפן - המדריך השלם",
          description: "טיול משפחתי ביפן עם אטרקציות לילדים ולמבוגרים, משילוב מושלם של מסורת ותרבות",
          start_date: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
          end_date: new Date(new Date().getTime() + (42 * 24 * 60 * 60 * 1000)).toISOString(),
          num_adults: 2,
          num_children: 2,
          trip_type: "משפחתי",
          price: 4000,
          rating: 4.9,
          traveler_type: "משפחות",
          status: "available",
          blogger: {
            name: "מיכל ברק",
            image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&q=80",
            trips: 15,
            followers: 7800
          }
        };

        componentsData = [
          {
            id: "flight103_1",
            trip_id: id,
            type: "flight",
            title: "טיסה הלוך - אל על",
            description: "טיסה ישירה מנתב\"ג לטוקיו",
            start_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000) + 12 * 60 * 60 * 1000).toISOString(),
            price: 1200,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "נמל תעופה בן-גוריון"
            }
          },
          {
            id: "hotel103_1",
            trip_id: id,
            type: "hotel",
            title: "מלון סייו פארק טוקיו",
            description: "מלון משפחתי מול הפארק",
            start_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (35 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 950,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Shinjuku, Tokyo, Japan"
            }
          },
          {
            id: "activity103_1",
            trip_id: id,
            type: "activity",
            title: "דיסנילנד טוקיו",
            description: "יום שלם בפארק השעשועים המפורסם",
            start_datetime: new Date(new Date().getTime() + (31 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (31 * 24 * 60 * 60 * 1000) + 8 * 60 * 60 * 1000).toISOString(),
            price: 320,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1580651214613-f4692d6d138f?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Tokyo DisneySea, Chiba, Japan"
            }
          },
          {
            id: "activity103_2",
            trip_id: id,
            type: "activity",
            title: "מוזיאון ג'יבלי",
            description: "ביקור בעולמו של מיאזאקי",
            start_datetime: new Date(new Date().getTime() + (33 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (33 * 24 * 60 * 60 * 1000) + 4 * 60 * 60 * 1000).toISOString(),
            price: 60,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Mitaka, Tokyo, Japan"
            }
          },
          {
            id: "hotel103_2",
            trip_id: id,
            type: "hotel",
            title: "ריוקאן מסורתי בקיוטו",
            description: "אירוח מסורתי יפני",
            start_datetime: new Date(new Date().getTime() + (35 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (39 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 850,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Gion, Kyoto, Japan"
            }
          },
          {
            id: "activity103_3",
            trip_id: id,
            type: "activity",
            title: "סדנת הכנת סושי משפחתית",
            description: "למידה מקצועית עם שף מקומי",
            start_datetime: new Date(new Date().getTime() + (36 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (36 * 24 * 60 * 60 * 1000) + 3 * 60 * 60 * 1000).toISOString(),
            price: 120,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Kyoto, Japan"
            }
          },
          {
            id: "hotel103_3",
            trip_id: id,
            type: "hotel",
            title: "מלון ניקו בהירושימה",
            description: "מלון איכותי במרכז העיר",
            start_datetime: new Date(new Date().getTime() + (39 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (42 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 650,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Hiroshima, Japan"
            }
          },
          {
            id: "activity103_4",
            trip_id: id,
            type: "activity",
            title: "ביקור באי מיאג'ימה",
            description: "ביקור בשער הטורי המפורסם",
            start_datetime: new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000) + 6 * 60 * 60 * 1000).toISOString(),
            price: 55,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Miyajima Island, Hiroshima, Japan"
            }
          },
          {
            id: "flight103_2",
            trip_id: id,
            type: "flight",
            title: "טיסה חזור - אל על",
            description: "טיסה ישירה מטוקיו לנתב\"ג",
            start_datetime: new Date(new Date().getTime() + (42 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (42 * 24 * 60 * 60 * 1000) + 12 * 60 * 60 * 1000).toISOString(),
            price: 1200,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "Narita International Airport, Tokyo"
            }
          }
        ];
      } else if (id === "201") {
        // Greece trip data
        tripData = {
          id: id,
          destination: "יוון",
          title: "החופים היפים ביותר ביוון",
          description: "חופשת חלומות בחופים היפים ביותר ביוון, מהאיים הקיקלדיים ועד למפרצים החבויים בקורפו",
          start_date: new Date(new Date().getTime() + (15 * 24 * 60 * 60 * 1000)).toISOString(),
          end_date: new Date(new Date().getTime() + (22 * 24 * 60 * 60 * 1000)).toISOString(),
          num_adults: 2,
          num_children: 0,
          trip_type: "חופים",
          price: 1800,
          rating: 4.8,
          traveler_type: "זוגות",
          status: "available"
        };

        componentsData = [
          {
            id: "flight201_1",
            trip_id: id,
            type: "flight",
            title: "טיסה הלוך - אייר אתונה",
            description: "טיסה ישירה מנתב\"ג לאתונה",
            start_datetime: new Date(new Date().getTime() + (15 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (15 * 24 * 60 * 60 * 1000) + 3 * 60 * 60 * 1000).toISOString(),
            price: 350,
            status: "suggested",
            location: {
              address: "נמל תעופה בן-גוריון"
            }
          },
          {
            id: "hotel201_1",
            trip_id: id,
            type: "hotel",
            title: "מלון סנטורין סיקרט",
            description: "מלון בוטיק עם נוף לקלדרה",
            start_datetime: new Date(new Date().getTime() + (15 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (19 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 780,
            status: "suggested",
            location: {
              address: "Oia, Santorini, Greece"
            }
          },
          {
            id: "activity201_1",
            trip_id: id,
            type: "activity",
            title: "שייט שקיעה בסנטוריני",
            description: "שייט לאורך הקלדרה בשעת השקיעה",
            start_datetime: new Date(new Date().getTime() + (16 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (16 * 24 * 60 * 60 * 1000) + 3 * 60 * 60 * 1000).toISOString(),
            price: 90,
            status: "suggested",
            location: {
              address: "Ammoudi Bay, Santorini, Greece"
            }
          },
          {
            id: "hotel201_2",
            trip_id: id,
            type: "hotel",
            title: "מלון מיקונוס בלו",
            description: "מלון יוקרה על חוף פסראדי",
            start_datetime: new Date(new Date().getTime() + (19 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (22 * 24 * 60 * 60 * 1000)).toISOString(),
            price: 620,
            status: "suggested",
            location: {
              address: "Psarou Beach, Mykonos, Greece"
            }
          },
          {
            id: "activity201_2",
            trip_id: id,
            type: "activity",
            title: "סיור חופים במיקונוס",
            description: "ביקור בחמישה מהחופים המובילים באי",
            start_datetime: new Date(new Date().getTime() + (20 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (20 * 24 * 60 * 60 * 1000) + 6 * 60 * 60 * 1000).toISOString(),
            price: 75,
            status: "suggested",
            location: {
              address: "Mykonos, Greece"
            }
          },
          {
            id: "flight201_2",
            trip_id: id,
            type: "flight",
            title: "טיסה חזור - אייר אתונה",
            description: "טיסה ישירה מאתונה לנתב\"ג",
            start_datetime: new Date(new Date().getTime() + (22 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (22 * 24 * 60 * 60 * 1000) + 3 * 60 * 60 * 1000).toISOString(),
            price: 350,
            status: "suggested",
            location: {
              address: "Athens International Airport, Greece"
            }
          }
        ];
      } else {
        // Default trip data for all other IDs
        tripData = {
          id: id,
          destination: isBloggerTrip ? "יפן" : "ניו יורק",
          title: isBloggerTrip ? "חוויה משפחתית ביפן - המדריך השלם" : "ניו יורק - עיר שלא ישנה",
          description: "טיול מושלם עם שילוב של אטרקציות מרכזיות וחוויות מקומיות אותנטיות",
          start_date: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
          end_date: new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000)).toISOString(),
          num_adults: 2,
          num_children: 1,
          trip_type: "משפחתי",
          price: isBloggerTrip ? 4000 : 2500,
          rating: 4.9,
          traveler_type: "משפחות",
          status: "available",
          blogger: isBloggerTrip ? {
            name: "מיכל ברק",
            image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&q=80",
            trips: 15,
            followers: 7800
          } : null
        };

        componentsData = [
          {
            id: "flight1",
            trip_id: id,
            type: "flight",
            title: "טיסה הלוך - אל על",
            description: "טיסה ישירה מנתב\"ג ל" + (isBloggerTrip ? "טוקיו" : "ניו יורק"),
            start_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000) + 10 * 60 * 60 * 1000).toISOString(),
            price: isBloggerTrip ? 1200 : 950,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=500&q=80",
            location: {
              address: "נמל תעופה בן-גוריון"
            }
          },
          {
            id: "flight2",
            trip_id: id,
            type: "flight",
            title: "טיסה חזור - אל על",
            description: "טיסה ישירה מ" + (isBloggerTrip ? "טוקיו" : "ניו יורק") + " לנתב\"ג",
            start_datetime: new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000) + 11 * 60 * 60 * 1000).toISOString(),
            price: isBloggerTrip ? 1200 : 950,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=500&q=80",
            location: {
              address: isBloggerTrip ? "Narita International Airport" : "JFK International Airport"
            }
          },
          {
            id: "hotel1",
            trip_id: id,
            type: "hotel",
            title: isBloggerTrip ? "מלון סייו פארק טוקיו" : "מלון הילטון טיימס סקוור",
            description: "מלון 4 כוכבים במיקום מרכזי, כולל ארוחת בוקר",
            start_datetime: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (40 * 24 * 60 * 60 * 1000)).toISOString(),
            price: isBloggerTrip ? 2200 : 1800,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=500&q=80",
            location: {
              address: isBloggerTrip ? "Tokyo, Shinjuku District" : "42nd Street, New York, NY"
            }
          },
          {
            id: "activity1",
            trip_id: id,
            type: "activity",
            title: isBloggerTrip ? "סיור במקדש מייג'י" : "סיור בסנטרל פארק",
            description: "סיור מודרך ברגל באחד האתרים המפורסמים",
            start_datetime: new Date(new Date().getTime() + (31 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (31 * 24 * 60 * 60 * 1000) + 4 * 60 * 60 * 1000).toISOString(),
            price: 45,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1588614959060-4d141f4d4532?auto=format&fit=crop&w=500&q=80",
            location: {
              address: isBloggerTrip ? "Meiji Shrine, Tokyo" : "Central Park, New York, NY"
            }
          },
          {
            id: "activity2",
            trip_id: id,
            type: "activity",
            title: isBloggerTrip ? "סיור בדיסנילנד טוקיו" : "כרטיסים למחזמר בברודווי",
            description: isBloggerTrip ? "יום שלם בפארק השעשועים המפורסם" : "כרטיסים למחזמר מובחר",
            start_datetime: new Date(new Date().getTime() + (33 * 24 * 60 * 60 * 1000)).toISOString(),
            end_datetime: new Date(new Date().getTime() + (33 * 24 * 60 * 60 * 1000) + 8 * 60 * 60 * 1000).toISOString(),
            price: isBloggerTrip ? 120 : 180,
            status: "suggested",
            image_url: "https://images.unsplash.com/photo-1551143574-25f7a7191b8b?auto=format&fit=crop&w=500&q=80"
          }
        ];
      }

      setTrip(tripData);
      setComponents(componentsData);
      setLoading(false);
    }, 1000);
  };

  const handleSelectComponent = (componentId) => {
    setComponents(prev => prev.map(component => 
      component.id === componentId 
        ? { ...component, status: component.status === 'selected' ? 'suggested' : 'selected' }
        : component
    ));
  };

  const handleBookTrip = () => {
    setIsBooking(true);
    
    // Simulate booking API call
    setTimeout(() => {
      setBookingSuccess(true);
      setIsBooking(false);
    }, 2000);
  };

  const handleUpdateTrip = (updatedTrip) => {
    // This would normally update the trip with changes from the AI
    console.log('Trip updated:', updatedTrip);
    
    // For demo purposes, show a success message
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  const handleGoBack = () => {
    navigate(-1); // Navigate back to previous page
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-5 w-5" />;
      case 'hotel':
        return <Hotel className="h-5 w-5" />;
      case 'car':
        return <Car className="h-5 w-5" />;
      case 'activity':
        return <Map className="h-5 w-5" />;
      case 'restaurant':
        return <Coffee className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const tripImage = 
    tripId === "101" ? "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80" :
    tripId === "102" ? "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80" :
    tripId === "103" ? "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80" :
    tripId === "201" ? "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80" :
    isBloggerTrip ? "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80" :
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="container py-8 relative">
      <Button 
        variant="outline" 
        size="sm" 
        className="mb-6"
        onClick={handleGoBack}
      >
        <ArrowLeft className="h-4 w-4 ml-2" />
        חזרה
      </Button>

      {bookingSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            הטיול עודכן בהצלחה! צור המערכת תכנון מפורט עבורכם.
          </AlertDescription>
        </Alert>
      )}

      <Button 
        className="fixed bottom-8 right-8 z-40 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 h-14 w-14 p-0"
        onClick={() => setIsChatOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="relative h-64 w-full">
              <img 
                src={tripImage}
                alt={trip?.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4">
                <Badge className="bg-yellow-500/90 text-white">
                  <Star className="h-3 w-3 mr-1 fill-current" /> {trip?.rating}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{trip?.title}</CardTitle>
                  <CardDescription>
                    {trip?.start_date && trip?.end_date ? (
                      <>
                        {format(new Date(trip.start_date), 'dd/MM/yyyy')} - {format(new Date(trip.end_date), 'dd/MM/yyyy')} 
                        · {Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24))}  ימים
                      </>
                    ) : 'תאריכים לא זמינים'}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {trip?.traveler_type || 'כל המטיילים'}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {trip?.blogger && (
            <Card>
              <CardHeader>
                <CardTitle>בהמלצת הבלוגר</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <img 
                    src={trip.blogger.image} 
                    alt={trip.blogger.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{trip.blogger.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {trip.blogger.trips} טיולים · {trip.blogger.followers.toLocaleString()} עוקבים
                    </p>
                  </div>
                </div>
                <p className="mt-4">
                  {tripId === "101" ? 
                    "\"תאילנד היא אחד היעדים האהובים עלי. שילבתי במסלול חופים, פעילויות, ומקדשים, כדי לתת חוויה מאוזנת של תרבות והרפתקאות. אני ממליצה במיוחד על השוק הצף והטיול בצ'אנג מאי.\"" : 
                  tripId === "102" ? 
                    "\"באיטליה הכל מתחיל ונגמר באוכל. כחובב קולינריה, יצרתי מסלול שיאפשר לכם לטעום את הטעמים האמיתיים - מהפיצות בנאפולי ועד הגלידות בפירנצה והיינות בטוסקנה. אל תפספסו את הסדנה!\"" : 
                    "\"זה המסלול המושלם למשפחות שרוצות לחוות את החוויה היפנית האותנטית. שילבתי בין האטרקציות המרכזיות לבין מקומות שמתאימים לילדים במיוחד, ומניסיוני, זה המסלול האידיאלי לביקור ראשון ביפן עם הילדים.\""
                  }
                </p>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">סקירה</TabsTrigger>
              <TabsTrigger value="itinerary">מסלול</TabsTrigger>
              <TabsTrigger value="customizer">התאמה אישית</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>תיאור הטיול</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    {tripId === "101" ? 
                      "מסע של 14 ימים בממלכת החיוכים, שמ שלב את החופים הקסומים של הדרום, את העיר התוססת בנגקוק ואת האווירה השלווה של צפון תאילנד. תבקרו בשווקים צפים אותנטיים, במקדשים עתיקים וביערות גשם מרהיבים. תיהנו מהחופים הלבנים של קו סמוי ופפאיה, מהאוכל המעולה בסמטאות בנגקוק, ומהאווירה השלווה של צ'אנג מאי. מסלול שמשלב תרבות, טבע, החופים והאוכל הכי טובים שתאילנד יכולה להציע." : 
                    tripId === "102" ? 
                      "מסע קולינרי של 10 ימים שייקח אתכם לטעמים האותנטיים של איטליה. התחילו ברומא עם שף מקומי שיחשוף אתכם לסודות המטבח האיטלקי. המשיכו לטוסקנה, שם תבקרו ביקבים משפחתיים ותלמדו להכין פסטה ביתית. סיימו בפירנצה עם סיור גלידריות ושווקים מקומיים. זהו מסע שמחבר אתכם לתרבות האיטלקית דרך הדבר החשוב ביותר - האוכל." :
                    tripId === "103" ? 
                      "המסלול הזה הוא תמצית החוויה היפנית המושלמת למשפחות. נתחיל בטוקיו הסואנת, עם שילוב מושלם של מסורת ומודרניות. נבקר באתרים המובילים, נחווה את התרבות המקומית, ונמשיך דרך קיוטו העתיקה להירושימה עם אתריה ההיסטוריים. המסלול מותאם במיוחד למשפחות עם פעילויות לילדים כמו דיסנילנד טוקיו ומוזיאון ג'יבלי, לצד חוויות תרבותיות כמו לינה בריוקאן מסורתי וסדנת הכנת סושי." :
                    tripId === "201" ? 
                      "טיול של 7 ימים בחופים הכי יפים של יוון. תתחילו בסנטוריני עם נופי הקלדרה המרהיבים, החופים הוולקניים והכפרים הלבנים התלויים על המצוק. תחוו שקיעה מרהיבה באויה ותשוטו לאורך האי. משם תמשיכו למיקונוס, עם החופים הטורקיזיים שלה, העיירה הלבנה הקסומה והחיים התוססים. תבקרו בחופים המובילים כמו פלאטיס גיאלוס, פסראדי ופרדייס ותיהנו מהשמש והים של יוון הקלאסית." :
                    isBloggerTrip ? 
                      "המסלול הזה הוא תמצית החוויה היפנית המושלמת למשפחות. נתחיל בטוקיו הסואנת, עם שילוב מושלם של מסורת ומודרניות. נבקר באתרים הנחשבים ביותר, נחווה את התרבות המקומית, ונמשיך דרך האזורים הכפריים אל קיוטו העתיקה. המסלול מותאם במיוחד למשפחות עם פעילויות המותאמות לילדים וגם למבוגרים. הטיול כולל שילוב של מלונות איכותיים, מסעדות מומלצות ואטרקציות מגוונות." :
                      "זה לא סתם עוד ביקור בניו יורק, זו חוויה שתזכרו לתמיד. המסלול שלנו לוקח אתכם דרך האייקונים המפורסמים של העיר – מטיימס סקוור ועד הסנטרל פארק, אבל גם חושף אתכם לצדדים פחות מוכרים של עיר שאף פעם לא ישנה. תיהנו מהמסעדות הטובות ביותר, מופעי ברודווי, קניות בחנויות המפורסמות, וממוזיאונים עולמיים, כל זאת בליווי המלצות מקומיות שיעשירו את החוויה שלכם."
                    }
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">מטיילים</h4>
                      <p className="mt-1">{trip?.num_adults || 2} מבוגרים, {trip?.num_children || 0} ילדים</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">סגנון טיול</h4>
                      <p className="mt-1">{trip?.trip_type || 'הרפתקאות'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">יעד</h4>
                      <p className="mt-1">{trip?.destination || 'לא צוין'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">משך הטיול</h4>
                      <p className="mt-1">
                        {trip?.start_date && trip?.end_date
                          ? Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24))
                          : '?'} ימים
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="itinerary">
              <Card>
                <CardHeader>
                  <CardTitle>מסלול הטיול</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {components.map((component) => (
                      <div
                        key={component.id}
                        className="flex items-start gap-4 p-4 border-b last:border-0"
                      >
                        <div className="p-2 bg-muted rounded-lg">
                          {getTypeIcon(component.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{component.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(component.start_datetime), 'dd/MM/yyyy, HH:mm')}
                              </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {
                                component.status === 'suggested' ? 'מוצע' : 
                                component.status === 'selected' ? 'נבחר' :
                                component.status === 'booked' ? 'הוזמן' :
                                component.status === 'completed' ? 'הושלם' : 'בוטל'
                              }
                            </Badge>
                          </div>
                          {component.description && (
                            <p className="mt-2 text-sm">{component.description}</p>
                          )}
                          {component.location?.address && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              📍 {component.location.address}
                            </p>
                          )}
                          <div className="mt-2 flex justify-between items-center">
                            <span className="font-semibold">${component.price}</span>
                            {component.status !== 'booked' && (
                              <Button 
                                variant={component.status === 'selected' ? 'default' : 'outline'} 
                                size="sm"
                                onClick={() => handleSelectComponent(component.id)}
                              >
                                {component.status === 'selected' ? 'נבחר ✓' : 'בחר'}
                              </Button>
                            )}
                            {component.status === 'booked' && (
                              <Badge variant="secondary">מוזמן</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customizer">
              <Card>
                <CardHeader>
                  <CardTitle>התאמת המסלול</CardTitle>
                  <CardDescription>
                    התאימו את המסלול לצרכים שלכם עם העוזר האישי שלנו
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      העוזר האישי שלנו יכול לעזור לכם להתאים את המסלול לצרכים המדויקים שלכם. פשוט לחצו על הכפתור למטה כדי לפתוח את הצ'אט ולבקש שינויים:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>שינוי מלונות לפי העדפות ספציפיות</li>
                      <li>התאמת זמני הטיסות</li>
                      <li>הוספת פעילויות או אטרקציות</li>
                      <li>המלצות למסעדות מקומיות</li>
                      <li>התאמת המסלול למשפחות עם ילדים</li>
                    </ul>
                    <div className="flex justify-center mt-6">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsChatOpen(true)}
                      >
                        <MessageSquare className="mr-2 h-5 w-5" />
                        פתיחת צ'אט עם העוזר האישי
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trip Summary */}
          <Card>
            <CardHeader>
              <CardTitle>סיכום עלויות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(['flight', 'hotel', 'car', 'activity', 'restaurant']).map(type => {
                  const filteredComponents = components.filter(c => c.type === type && (c.status === 'selected' || c.status === 'booked'));
                  
                  const typeTotal = filteredComponents.reduce((sum, c) => sum + c.price, 0);
                  
                  if (typeTotal > 0) {
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-muted-foreground capitalize">
                          {type === 'flight' ? 'טיסות' : 
                           type === 'hotel' ? 'מלונות' :
                           type === 'car' ? 'רכב' :
                           type === 'activity' ? 'פעילויות' : 'מסעדות'}
                          {filteredComponents.length > 1 ? ` (${filteredComponents.length})` : ''}
                        </span>
                        <span>${typeTotal}</span>
                      </div>
                    );
                  }
                  return null;
                })}
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">מיסים ועמלות</span>
                  <span>$250</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between font-medium">
                    <span>סה"כ</span>
                    <span>${(components.filter(c => c.status === 'selected' || c.status === 'booked').reduce((sum, c) => sum + c.price, 0) + 250) || trip?.price || 0}</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleBookTrip}
                  disabled={isBooking || bookingSuccess || components.filter(c => c.status === 'selected').length === 0}
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      מזמין...
                    </>
                  ) : bookingSuccess ? (
                    <>
                      <Check className="ml-2 h-4 w-4" />
                      הוזמן בהצלחה
                    </>
                  ) : (
                    <>
                      <CreditCard className="ml-2 h-4 w-4" />
                      הזמינו עכשיו
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle>תאריכים חשובים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">יציאה</p>
                    <p className="text-sm text-muted-foreground">
                      {trip?.start_date ? format(new Date(trip.start_date), 'EEEE, dd/MM/yyyy') : 'לא צוין'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">חזרה</p>
                    <p className="text-sm text-muted-foreground">
                      {trip?.end_date ? format(new Date(trip.end_date), 'EEEE, dd/MM/yyyy') : 'לא צוין'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Availability */}
          <Card>
            <CardHeader>
              <CardTitle>זמינות בזמן אמת</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>טיסות</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">זמין</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>מלונות</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">מתמלא במהירות</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>פעילויות</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">זמין</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * הזמינות מתעדכנת בזמן אמת. מומלץ להזמין בהקדם.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Sidebar */}
      <TripChatSidebar 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        trip={{ ...trip, components }} 
        onUpdateTrip={handleUpdateTrip}
      />
    </div>
  );
}