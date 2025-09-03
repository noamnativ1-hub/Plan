
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Blogger } from '@/api/entities';
import { BloggerTrip } from '@/api/entities';
import { BloggerReview } from '@/api/entities';
import { BloggerFollowing } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  Heart, 
  MessageCircle, 
  Share2, 
  MapPin, 
  Globe, 
  Calendar, 
  ClipboardList,
  Instagram,
  Youtube,
  Facebook,
  Link as LinkIcon,
  User as UserIcon,
  Clock,
  DollarSign,
  Send,
  Filter,
  Search,
  TrendingUp,
  StarHalf,
  Camera,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BloggerProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const bloggerId = urlParams.get('id');
  
  const [blogger, setBlogger] = useState(null);
  const [trips, setTrips] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('trips');
  const [tripStyleFilter, setTripStyleFilter] = useState('all');
  const [tripDestinationFilter, setTripDestinationFilter] = useState('all');
  const [tripSortBy, setTripSortBy] = useState('popular');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    trip_date: ''
  });
  
  useEffect(() => {
    loadData();
    checkCurrentUser();
  }, [bloggerId]);
  
  const checkCurrentUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      const followings = await BloggerFollowing.filter({
        user_id: userData.id,
        blogger_id: bloggerId
      });
      setIsFollowing(followings && followings.length > 0);
    } catch (error) {
      console.log('User not authenticated');
    }
  };
  
  const loadData = async () => {
    setLoading(true);
    try {
      if (bloggerId) {
        const bloggerData = getSampleBloggers().find(b => b.id === bloggerId) || getSampleBloggers()[0];
        setBlogger(bloggerData);
        setFollowersCount(bloggerData.followers_count);
        
        setTrips(getSampleTrips().filter(trip => trip.blogger_id === bloggerId));
        
        setReviews(getSampleReviews().filter(review => review.blogger_id === bloggerId));
      }
    } catch (error) {
      console.error('Error loading blogger data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getSampleBloggers = () => [
    {
      id: "1",
      name: "דניאל כהן",
      username: "danielcohen",
      profile_image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
      cover_image: "https://images.unsplash.com/photo-1499363536502-87642509e31b?auto=format&fit=crop&w=1200&q=80",
      bio: "מטייל מקצועי שמתמחה באירופה. אוהב תרבות, אוכל וחוויות אותנטיות. מעל 8 שנים של טיולים ברחבי העולם, כתיבת מדריכים וצילום חוויות מיוחדות. השאיפה שלי היא לעזור לאנשים לגלות את העולם בדרך הכי אותנטית ומהנה.",
      specialty: ["culture", "food", "history"],
      popular_regions: ["europe", "mediterranean"],
      trip_count: 24,
      rating: 4.8,
      followers_count: 5200,
      featured: true,
      social_links: {
        instagram: "danielcohen_travels",
        youtube: "danielcohentravels",
        website: "www.danielcohen-travels.co.il"
      },
      experience_years: 8
    },
    {
      id: "2",
      name: "נועה לוי",
      username: "noalevy",
      profile_image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=500&q=80",
      cover_image: "https://images.unsplash.com/photo-1520466809213-7b9a56adcd45?auto=format&fit=crop&w=1200&q=80",
      bio: "בלוגרית טיולים שמתמחה בטיולי תרמילאות. אוהבת הרפתקאות, טרקים וחיבור לטבע",
      specialty: ["adventure", "nature", "budget"],
      popular_regions: ["asia", "south_america"],
      trip_count: 18,
      rating: 4.7,
      followers_count: 4800,
      featured: true,
      social_links: {
        instagram: "noa_travels",
        youtube: "noalevytravels",
        website: "www.noatravels.co.il"
      },
      experience_years: 6
    }
  ];
  
  const getSampleTrips = () => [
    {
      id: "1",
      blogger_id: "1",
      title: "הקסם של פריז - 7 ימים בעיר האורות",
      destination: "פריז",
      destinations: ["פריז", "ורסאי"],
      trip_type: ["culture", "romantic", "food"],
      duration: 7,
      cover_image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1500313830540-7b6650a74fd0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=800&q=80"
      ],
      description: "חוויה בלתי נשכחת של 7 ימים בפריז, כולל סיורים באתרים המפורסמים, חוויות אוכל, אמנות ותרבות. הטיול כולל ביקור במוזיאון הלובר, מגדל אייפל, ארמון ורסאי, מונמארטר ועוד.",
      short_description: "גלו את הקסם של פריז דרך האתרים המפורסמים ביותר, המסעדות הטובות ביותר והחוויות התרבותיות שהעיר מציעה.",
      highlights: [
        "ביקור במוזיאון הלובר וחזיון האורות הלילי",
        "ארוחת ערב רומנטית במגדל אייפל",
        "סיור ביום שלם בארמון ורסאי",
        "סיור קולינרי בשוק המקומי"
      ],
      price_from: 1200,
      rating: 4.9,
      reviews_count: 42,
      bookings_count: 156,
      featured: true,
      itinerary: [
        {
          day: 1,
          title: "הגעה בפריז והתאקלמות",
          description: "נחיתה בשדה התעופה שארל דה גול, הגעה למלון והתארגנות. סיור ערב ראשוני לאורך נהר הסיין.",
          activities: [
            {
              time: "14:00",
              title: "הגעה לשדה התעופה",
              description: "נחיתה בשדה התעופה שארל דה גול והעברה למלון",
              location: "שדה התעופה שארל דה גול"
            },
            {
              time: "17:00",
              title: "צ׳ק אין במלון",
              description: "התמקמות במלון Le Marais District",
              location: "מלון Le Marais"
            },
            {
              time: "19:00",
              title: "ארוחת ערב",
              description: "ארוחת ערב במסעדה מקומית ליד המלון",
              location: "מסעדת La Petite Rose"
            }
          ]
        },
        {
          day: 2,
          title: "מוזיאון הלובר ונהר הסיין",
          description: "יום שלם במוזיאון הלובר, אחד המוזיאונים המפורסמים בעולם, ושייט בנהר הסיין.",
          activities: [
            {
              time: "09:00",
              title: "ארוחת בוקר",
              description: "ארוחת בוקר במלון",
              location: "מלון Le Marais"
            },
            {
              time: "10:00",
              title: "מוזיאון הלובר",
              description: "סיור מודרך במוזיאון הלובר",
              location: "מוזיאון הלובר"
            },
            {
              time: "14:00",
              title: "ארוחת צהריים",
              description: "ארוחת צהריים בקפה הלובר",
              location: "קפה הלובר"
            },
            {
              time: "16:00",
              title: "שייט בנהר הסיין",
              description: "שייט פנורמי בנהר הסיין",
              location: "נהר הסיין"
            }
          ]
        }
      ]
    },
    {
      id: "2",
      blogger_id: "1",
      title: "סוף שבוע בברצלונה - 3 ימים של אדריכלות, חופים ואוכל",
      destination: "ברצלונה",
      destinations: ["ברצלונה"],
      trip_type: ["culture", "beach", "food"],
      duration: 3,
      cover_image: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540162875728-7ac5a213e942?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1504387432042-8aca739eb231?auto=format&fit=crop&w=800&q=80"
      ],
      description: "טיול מושלם לסוף שבוע בברצלונה, השילוב המושלם של תרבות, חופים ואוכל מעולה. הטיול כולל ביקור בסגרדה פמיליה, פארק גואל, הרובע הגותי וחוף ברצלונטה.",
      short_description: "סוף שבוע מושלם בברצלונה - שילוב של אדריכלות יפהפייה, חופים מרהיבים וחוויות אוכל בלתי נשכחות.",
      highlights: [
        "ביקור בסגרדה פמיליה",
        "סיור בפארק גואל",
        "טיול ברובע הגותי",
        "שקיעה בחוף ברצלונטה"
      ],
      price_from: 650,
      rating: 4.7,
      reviews_count: 28,
      bookings_count: 102,
      featured: false,
      itinerary: [
        {
          day: 1,
          title: "הגעה לברצלונה וסיור ראשוני",
          description: "הגעה לברצלונה, התמקמות במלון וסיור ראשוני ברובע הגותי.",
          activities: [
            {
              time: "11:00",
              title: "הגעה לשדה התעופה",
              description: "נחיתה בשדה התעופה אל פראט והעברה למלון",
              location: "שדה התעופה אל פראט"
            },
            {
              time: "13:00",
              title: "צ׳ק אין במלון",
              description: "התמקמות במלון ברובע הגותי",
              location: "מלון ברובע הגותי"
            }
          ]
        }
      ]
    },
    {
      id: "3",
      blogger_id: "1",
      title: "המיטב של רומא - 5 ימים בעיר הנצחית",
      destination: "רומא",
      destinations: ["רומא", "ותיקן"],
      trip_type: ["culture", "history", "food"],
      duration: 5,
      cover_image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1529154691717-3306083d869e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?auto=format&fit=crop&w=800&q=80"
      ],
      description: "טיול בן 5 ימים ברומא, עיר הנצחית. הטיול כולל ביקור בקולוסיאום, פורום רומאנום, מזרקת טרווי, אתרי ותיקן וחוויות קולינריות איטלקיות אותנטיות.",
      short_description: "גלו את רומא העתיקה והמודרנית בטיול מקיף הכולל את כל האתרים ההיסטוריים החשובים והמסעדות הטובות ביותר.",
      highlights: [
        "סיור מודרך בקולוסיאום",
        "ביקור במוזיאוני הותיקן",
        "זריקת מטבע במזרקת טרווי",
        "סדנת פסטה אותנטית"
      ],
      price_from: 850,
      rating: 4.8,
      reviews_count: 35,
      bookings_count: 128,
      featured: false,
      itinerary: []
    },
    {
      id: "4",
      blogger_id: "2",
      title: "הרפתקאות בתאילנד - 14 יום בין חופים, ג'ונגלים ומקדשים",
      destination: "תאילנד",
      destinations: ["בנגקוק", "צ'יאנג מאי", "קו פי פי", "קו סמוי"],
      trip_type: ["adventure", "beach", "nature", "budget"],
      duration: 14,
      cover_image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=800&q=80"
      ],
      description: "חוויה בלתי נשכחת של טיול תרמילאים בתאילנד. הטיול כולל סיור בבנגקוק, טרקים בג'ונגלים של צ'יאנג מאי, ביקור במקדשים עתיקים ורגיעה בחופים טרופיים.",
      short_description: "טיול תרמילאים מקיף בתאילנד, המשלב הרפתקאות, תרבות, מקדשים וחופים יפהפיים.",
      highlights: [
        "טרק בג'ונגל בצ'יאנג מאי",
        "ביקור במקדשים בבנגקוק",
        "שנורקלינג באיי פי פי",
        "מסיבת ירח מלא בקו פנגן"
      ],
      price_from: 1500,
      rating: 4.9,
      reviews_count: 48,
      bookings_count: 180,
      featured: true,
      itinerary: []
    }
  ];
  
  const getSampleReviews = () => [
    {
      id: "1",
      blogger_id: "1",
      trip_id: "1",
      user_id: "101",
      user_name: "אלון לוי",
      user_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      comment: "הטיול בפריז היה מדהים! דניאל נתן טיפים מעולים לגבי מסעדות מקומיות שלא הייתי מוצא לבד. המסלול היה מאוזן - לא עמוס מדי אבל הספקנו לראות המון. ממליץ בחום!",
      date: "2023-11-15T14:48:00.000Z",
      trip_date: "2023-10-10",
      helpful_count: 12
    },
    {
      id: "2",
      blogger_id: "1",
      trip_id: "1",
      user_id: "102",
      user_name: "שירה כהן",
      user_image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      rating: 4,
      comment: "נהניתי מאוד מהטיול. המלון היה במיקום מעולה והמסלול היה מתוכנן היטב. מורידה כוכב רק בגלל שהיה קצת עמוס מדי ביום השלישי, אבל בסך הכל חוויה נהדרת!",
      date: "2023-09-22T10:30:00.000Z",
      trip_date: "2023-09-05",
      helpful_count: 8
    },
    {
      id: "3",
      blogger_id: "1",
      trip_id: "2",
      user_id: "103",
      user_name: "יוסי אברהמי",
      user_image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      comment: "ברצלונה הייתה מדהימה! הטיפים של דניאל לגבי הגעה מוקדמת לסגרדה פמיליה ואיפה לאכול טאפאס אותנטיים היו שווים זהב. ממליץ בחום למי שרוצה לטייל בעיר בזמן קצר.",
      date: "2023-12-05T16:15:00.000Z",
      trip_date: "2023-11-24",
      helpful_count: 15
    },
    {
      id: "4",
      blogger_id: "1",
      trip_id: "3",
      user_id: "104",
      user_name: "דנה פרידמן",
      user_image: "https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?auto=format&fit=crop&w=150&q=80",
      rating: 3,
      comment: "הטיול ברומא היה בסדר, אבל היו כמה אכזבות. המלון לא היה ברמה שציפיתי לה והיו כמה המלצות למסעדות שהיו יקרות מאוד. עם זאת, המסלול עצמו היה מתוכנן היטב והספקנו לראות את רוב האתרים החשובים.",
      date: "2023-08-18T09:20:00.000Z",
      trip_date: "2023-07-30",
      helpful_count: 5
    },
    {
      id: "5",
      blogger_id: "2",
      trip_id: "4",
      user_id: "105",
      user_name: "עידו כהן",
      user_image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      comment: "נועה, הטיול שלך בתאילנד היה פשוט מושלם! ההמלצות לגבי מקומות לינה זולים אבל איכותיים והטיפים לגבי תחבורה מקומית חסכו לי המון כסף. הג'ונגל בצ'יאנג מאי היה חוויה בלתי נשכחת!",
      date: "2023-12-12T11:45:00.000Z",
      trip_date: "2023-11-15",
      helpful_count: 18
    }
  ];
  
  const getSpecialtyName = (specialtyCode) => {
    const specialties = {
      'adventure': 'הרפתקאות',
      'culture': 'תרבות',
      'food': 'אוכל',
      'history': 'היסטוריה',
      'nature': 'טבע',
      'photography': 'צילום',
      'luxury': 'יוקרה',
      'budget': 'תקציב נמוך',
      'family': 'משפחות',
      'beach': 'חופים',
      'urban': 'עירוני',
      'theme_parks': 'פארקי שעשועים',
      'romantic': 'רומנטי'
    };
    return specialties[specialtyCode] || specialtyCode;
  };
  
  const getRegionName = (regionCode) => {
    const regions = {
      'europe': 'אירופה',
      'asia': 'אסיה',
      'north_america': 'צפון אמריקה',
      'south_america': 'דרום אמריקה',
      'africa': 'אפריקה',
      'australia': 'אוסטרליה',
      'middle_east': 'המזרח התיכון',
      'israel': 'ישראל',
      'mediterranean': 'הים התיכון',
      'usa': 'ארה"ב'
    };
    return regions[regionCode] || regionCode;
  };
  
  const handleFollow = async () => {
    try {
      if (!user) {
        User.login();
        return;
      }

      if (isFollowing) {
        const followings = await BloggerFollowing.filter({
          user_id: user.id,
          blogger_id: bloggerId
        });
        if (followings && followings.length > 0) {
          await BloggerFollowing.delete(followings[0].id);
        }
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await BloggerFollowing.create({
          user_id: user.id,
          blogger_id: bloggerId,
          follow_date: new Date().toISOString()
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error following blogger:", error);
    }
  };

  const navigateToTrip = (tripId) => {
    navigate(createPageUrl('BloggerTrip') + `?id=${tripId}`);
  };
  
  const filterTrips = () => {
    let filtered = [...trips];
    
    if (tripStyleFilter !== 'all') {
      filtered = filtered.filter(trip => 
        trip.trip_type?.includes(tripStyleFilter)
      );
    }
    
    if (tripDestinationFilter !== 'all') {
      filtered = filtered.filter(trip => 
        trip.destination?.toLowerCase() === tripDestinationFilter.toLowerCase() ||
        trip.destinations?.some(d => d.toLowerCase() === tripDestinationFilter.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      switch (tripSortBy) {
        case 'popular':
          return b.bookings_count - a.bookings_count;
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          return a.price_from - b.price_from;
        case 'price_high':
          return b.price_from - a.price_from;
        case 'duration_short':
          return a.duration - b.duration;
        case 'duration_long':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });
    
    return filtered;
  };
  
  const filterReviews = () => {
    let filtered = [...reviews];
    
    if (reviewRatingFilter !== 'all') {
      const rating = parseInt(reviewRatingFilter);
      filtered = filtered.filter(review => review.rating === rating);
    }
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return filtered;
  };
  
  const handleSubmitReview = async () => {
    if (!user) {
      alert('עליך להתחבר כדי לכתוב חוות דעת');
      setIsReviewDialogOpen(false);
      return;
    }
    
    if (!reviewData.comment.trim()) {
      alert('אנא הוסף תוכן לחוות הדעת');
      return;
    }
    
    const newReview = {
      id: `new-${Date.now()}`,
      blogger_id: blogger.id,
      trip_id: null,
      user_id: user.id,
      user_name: user.full_name,
      user_image: "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.full_name),
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: new Date().toISOString(),
      trip_date: reviewData.trip_date || null,
      helpful_count: 0
    };
    
    setReviews([newReview, ...reviews]);
    setReviewData({
      rating: 5,
      comment: '',
      trip_date: ''
    });
    setIsReviewDialogOpen(false);
  };
  
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<StarHalf key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    
    return stars;
  };
  
  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64 w-full mb-8" />
        <div className="flex gap-6 mb-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3 mb-6" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!blogger) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">הבלוגר לא נמצא</h1>
        <p className="mb-6">לא הצלחנו למצוא את הבלוגר המבוקש</p>
        <Button onClick={() => navigate(createPageUrl('Bloggers'))}>חזרה לדף הבלוגרים</Button>
      </div>
    );
  }
  
  const filteredTrips = filterTrips();
  const filteredReviews = filterReviews();
  
  return (
    <div className="min-h-screen pb-12">
      <div className="h-80 relative overflow-hidden">
        <img 
          src={blogger.cover_image} 
          alt={`כריכה של ${blogger.name}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 text-white">
          <div className="container flex items-end">
            <div className="h-36 w-36 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <img 
                src={blogger.profile_image} 
                alt={blogger.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mr-6">
              <h1 className="text-3xl font-bold">{blogger.name}</h1>
              <div className="flex items-center mt-1 mb-2">
                <div className="flex">{renderStars(blogger.rating)}</div>
                <span className="mr-2">{blogger.rating}</span>
                <span className="mx-2">•</span>
                <span>{blogger.trip_count} מסלולי טיול</span>
                <span className="mx-2">•</span>
                <span>{followersCount.toLocaleString()} עוקבים</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {blogger.specialty?.map(spec => (
                  <Badge key={spec} className="bg-white/30 hover:bg-white/40 text-white">
                    {getSpecialtyName(spec)}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="mr-auto">
              <Button 
                variant={isFollowing ? "secondary" : "default"}
                className={isFollowing ? "" : "bg-blue-600 hover:bg-blue-700"}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    עוקב
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    עקוב
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container py-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-4">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>אודות {blogger.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">{blogger.bio}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Camera className="h-4 w-4 text-gray-500 mr-2" />
                    <span>{blogger.experience_years} שנות ניסיון</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                    <span>
                      <span className="font-medium">מתמחה ב: </span>
                      {blogger.popular_regions?.map(region => getRegionName(region)).join(', ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <ClipboardList className="h-4 w-4 text-gray-500 mr-2" />
                    <span>
                      <span className="font-medium">סוגי טיולים: </span>
                      {blogger.specialty?.map(spec => getSpecialtyName(spec)).join(', ')}
                    </span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex gap-2">
                  {blogger.social_links?.instagram && (
                    <a 
                      href={`https://instagram.com/${blogger.social_links.instagram}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon">
                        <Instagram className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  
                  {blogger.social_links?.youtube && (
                    <a 
                      href={`https://youtube.com/@${blogger.social_links.youtube}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon">
                        <Youtube className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  
                  {blogger.social_links?.facebook && (
                    <a 
                      href={`https://facebook.com/${blogger.social_links.facebook}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon">
                        <Facebook className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  
                  {blogger.social_links?.website && (
                    <a 
                      href={`https://${blogger.social_links.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon">
                        <Globe className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>הטיול הפופולרי ביותר</span>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </CardTitle>
              </CardHeader>
              
              {trips.length > 0 && (
                <div>
                  {(() => {
                    const topTrip = [...trips].sort((a, b) => b.bookings_count - a.bookings_count)[0];
                    return (
                      <div className="overflow-hidden cursor-pointer" onClick={() => navigateToTrip(topTrip.id)}>
                        <div className="h-48 relative">
                          <img 
                            src={topTrip.cover_image} 
                            alt={topTrip.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                          <div className="absolute bottom-3 left-3">
                            <Badge className="bg-orange-500 hover:bg-orange-600">הכי פופולרי</Badge>
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-1">{topTrip.title}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="h-3.5 w-3.5 mr-1" />
                            <span>{topTrip.destination}</span>
                            <span className="mx-1">•</span>
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            <span>{topTrip.duration} ימים</span>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{topTrip.short_description}</p>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex">
                              {renderStars(topTrip.rating)}
                              <span className="text-sm mr-1">({topTrip.reviews_count})</span>
                            </div>
                            
                            <div className="font-medium text-blue-600">
                              החל מ-${topTrip.price_from}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>
          </div>
          
          <div className="col-span-8">
            <Tabs defaultValue="trips" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="trips">מסלולי טיול ({trips.length})</TabsTrigger>
                <TabsTrigger value="reviews">חוות דעת ({reviews.length})</TabsTrigger>
                <TabsTrigger value="about">אודות</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trips">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">מסלולי הטיול של {blogger.name}</h2>
                  
                  <div className="flex gap-2">
                    <Select value={tripStyleFilter} onValueChange={setTripStyleFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="סינון לפי סגנון" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל הסגנונות</SelectItem>
                        <SelectItem value="adventure">הרפתקאות</SelectItem>
                        <SelectItem value="culture">תרבות</SelectItem>
                        <SelectItem value="food">אוכל</SelectItem>
                        <SelectItem value="beach">חופים</SelectItem>
                        <SelectItem value="nature">טבע</SelectItem>
                        <SelectItem value="history">היסטוריה</SelectItem>
                        <SelectItem value="romantic">רומנטי</SelectItem>
                        <SelectItem value="budget">תקציב נמוך</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={tripSortBy} onValueChange={setTripSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="מיון" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popular">פופולריות</SelectItem>
                        <SelectItem value="rating">דירוג</SelectItem>
                        <SelectItem value="price_low">מחיר: מהנמוך לגבוה</SelectItem>
                        <SelectItem value="price_high">מחיר: מהגבוה לנמוך</SelectItem>
                        <SelectItem value="duration_short">משך: מהקצר לארוך</SelectItem>
                        <SelectItem value="duration_long">משך: מהארוך לקצר</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {filteredTrips.map(trip => (
                    <Card 
                      key={trip.id} 
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigateToTrip(trip.id)}
                    >
                      <div className="h-48 relative">
                        <img 
                          src={trip.cover_image} 
                          alt={trip.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                          <div className="flex gap-1">
                            {trip.trip_type?.slice(0, 2).map(type => (
                              <Badge key={type} className="bg-white/30 hover:bg-white/40 text-white">
                                {getSpecialtyName(type)}
                              </Badge>
                            ))}
                            {trip.trip_type?.length > 2 && (
                              <Badge className="bg-white/30 hover:bg-white/40 text-white">
                                +{trip.trip_type.length - 2}
                              </Badge>
                            )}
                          </div>
                          
                          <Badge className="bg-blue-600 hover:bg-blue-700">
                            {trip.duration} ימים
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-1">{trip.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          <span>{trip.destination}</span>
                          {trip.destinations?.length > 1 && <span> ועוד {trip.destinations.length - 1}</span>}
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{trip.short_description}</p>
                        
                        {trip.highlights?.length > 0 && (
                          <div className="mb-3">
                            <ul className="text-xs text-gray-700">
                              {trip.highlights.slice(0, 3).map((highlight, idx) => (
                                <li key={idx} className="flex items-start mb-1">
                                  <span className="bg-green-100 text-green-800 rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold mr-1.5 flex-shrink-0 mt-0.5">✓</span>
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="bg-gray-50 px-4 py-3 flex justify-between">
                        <div className="flex items-center">
                          <div className="flex">
                            {renderStars(trip.rating)}
                          </div>
                          <span className="text-sm mr-1.5">{trip.reviews_count} חוות דעת</span>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-500">מחיר לאדם החל מ-</div>
                          <div className="font-medium text-blue-600">${trip.price_from}</div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {filteredTrips.length === 0 && (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-medium mb-2">לא נמצאו טיולים</h3>
                    <p className="text-muted-foreground mb-4">נסה לשנות את הסינון לקבלת יותר תוצאות</p>
                    <Button onClick={() => {
                      setTripStyleFilter('all');
                      setTripDestinationFilter('all');
                    }}>נקה סינון</Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="reviews">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">חוות דעת ({reviews.length})</h2>
                  
                  <div className="flex gap-4">
                    <Select value={reviewRatingFilter} onValueChange={setReviewRatingFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="סינון לפי דירוג" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל הדירוגים</SelectItem>
                        <SelectItem value="5">5 כוכבים</SelectItem>
                        <SelectItem value="4">4 כוכבים</SelectItem>
                        <SelectItem value="3">3 כוכבים</SelectItem>
                        <SelectItem value="2">2 כוכבים</SelectItem>
                        <SelectItem value="1">כוכב 1</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>כתיבת חוות דעת</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>כתיבת חוות דעת על {blogger.name}</DialogTitle>
                          <DialogDescription>
                            שתף את החוויה שלך עם הבלוגר. חוות דעת חיובית עוזרת לאחרים למצוא טיולים מתאימים.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <Label>דירוג</Label>
                            <div className="flex gap-6">
                              <RadioGroup 
                                value={reviewData.rating.toString()} 
                                onValueChange={(val) => setReviewData({...reviewData, rating: parseInt(val)})}
                                className="flex"
                              >
                                {[5, 4, 3, 2, 1].map((num) => (
                                  <div key={num} className="flex items-center space-x-2">
                                    <RadioGroupItem value={num.toString()} id={`rating-${num}`} />
                                    <Label htmlFor={`rating-${num}`}>{num}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="trip-date">מתי טיילת עם {blogger.name}?</Label>
                            <Input 
                              id="trip-date" 
                              type="date" 
                              value={reviewData.trip_date} 
                              onChange={(e) => setReviewData({...reviewData, trip_date: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="comment">חוות דעת</Label>
                            <Textarea 
                              id="comment" 
                              placeholder="ספר על החוויה שלך..."
                              className="min-h-[100px]"
                              value={reviewData.comment}
                              onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button type="submit" onClick={handleSubmitReview}>פרסם חוות דעת</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {filteredReviews.map(review => (
                    <Card key={review.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={review.user_image} alt={review.user_name} />
                            <AvatarFallback>{review.user_name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="mr-4">
                            <div className="font-medium">{review.user_name}</div>
                            <div className="flex mt-1 mb-3">
                              {renderStars(review.rating)}
                              
                              <span className="text-sm text-gray-500 mr-2">
                                {new Date(review.date).toLocaleDateString('he-IL')}
                              </span>
                              
                              {review.trip_id && (
                                <span className="text-sm text-blue-600 mr-2 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigateToTrip(review.trip_id);
                                      }}>
                                  {trips.find(t => t.id === review.trip_id)?.title || 'טיול'}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-700">{review.comment}</p>
                            
                            <div className="flex items-center mt-4 text-sm text-gray-500">
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                הגב
                              </Button>
                              
                              <span className="mx-2">•</span>
                              
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                <Heart className="h-4 w-4 mr-2" />
                                סמן כמועיל ({review.helpful_count})
                              </Button>
                              
                              <span className="mx-2">•</span>
                              
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                <Share2 className="h-4 w-4 mr-2" />
                                שתף
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {filteredReviews.length === 0 && (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-medium mb-2">אין עדיין חוות דעת</h3>
                    <p className="text-muted-foreground mb-4">היה הראשון לכתוב חוות דעת על בלוגר זה</p>
                    <Button onClick={() => setIsReviewDialogOpen(true)}>כתיבת חוות דעת</Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="about">
                <Card>
                  <CardHeader>
                    <CardTitle>אודות {blogger.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">ביוגרפיה</h3>
                        <p className="text-gray-700">{blogger.bio}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">סגנון טיולים</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {blogger.specialty?.map(spec => (
                            <Badge key={spec} variant="outline" className="px-3 py-1">
                              {getSpecialtyName(spec)}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-gray-700">
                          {blogger.name} הוא בלוגר טיולים עם {blogger.experience_years} שנות ניסיון, 
                          המתמחה באזורי {blogger.popular_regions?.map(region => getRegionName(region)).join(', ')}. 
                          הוא פרסם {blogger.trip_count} מסלולי טיול ייחודיים באתר שלנו, עם דירוג ממוצע של {blogger.rating} מתוך 5.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">הישגים וניסיון</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                          <li>טייל ב-{Math.floor(Math.random() * 30) + 20} מדינות שונות בעולם</li>
                          <li>כתב {Math.floor(Math.random() * 200) + 100} מאמרי טיולים</li>
                          <li>{Math.floor(Math.random() * 10000) + 5000} עוקבים ברשתות חברתיות</li>
                          <li>פרסם {Math.floor(Math.random() * 5) + 1} ספרי מסע</li>
                          <li>{blogger.bookings_count || Math.floor(Math.random() * 500) + 300} הזמנות טיולים דרך האתר</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">קישורים חיצוניים</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {blogger.social_links?.instagram && (
                            <a 
                              href={`https://instagram.com/${blogger.social_links.instagram}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Instagram className="h-6 w-6 text-pink-600 mr-3" />
                              <div>
                                <div className="font-medium">Instagram</div>
                                <div className="text-sm text-gray-500">@{blogger.social_links.instagram}</div>
                              </div>
                            </a>
                          )}
                          
                          {blogger.social_links?.youtube && (
                            <a 
                              href={`https://youtube.com/@${blogger.social_links.youtube}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Youtube className="h-6 w-6 text-red-600 mr-3" />
                              <div>
                                <div className="font-medium">YouTube</div>
                                <div className="text-sm text-gray-500">@{blogger.social_links.youtube}</div>
                              </div>
                            </a>
                          )}
                          
                          {blogger.social_links?.facebook && (
                            <a 
                              href={`https://facebook.com/${blogger.social_links.facebook}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Facebook className="h-6 w-6 text-blue-600 mr-3" />
                              <div>
                                <div className="font-medium">Facebook</div>
                                <div className="text-sm text-gray-500">{blogger.social_links.facebook}</div>
                              </div>
                            </a>
                          )}
                          
                          {blogger.social_links?.website && (
                            <a 
                              href={`https://${blogger.social_links.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Globe className="h-6 w-6 text-blue-500 mr-3" />
                              <div>
                                <div className="font-medium">אתר אישי</div>
                                <div className="text-sm text-gray-500">{blogger.social_links.website}</div>
                              </div>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
