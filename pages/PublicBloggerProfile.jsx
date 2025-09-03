import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Blogger } from '@/api/entities';
import { BloggerProfile } from '@/api/entities';
import { BloggerTrip } from '@/api/entities';
import { BloggerFollowing } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import {
  ArrowLeft, Heart, Users, Calendar, MapPin, Star, Globe,
  Instagram, Facebook, Youtube, Search, Filter, Eye, Clock
} from 'lucide-react';

export default function PublicBloggerProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bloggerId = searchParams.get('id');

  const [blogger, setBlogger] = useState(null);
  const [bloggerProfile, setBloggerProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadBloggerData();
  }, [bloggerId]);

  useEffect(() => {
    filterAndSortTrips();
  }, [trips, searchTerm, sortBy]);

  const loadBloggerData = async () => {
    try {
      if (!bloggerId) {
        setError('מזהה בלוגר חסר');
        return;
      }

      // טעינת פרטי הבלוגר
      const bloggerData = await Blogger.get(bloggerId);
      if (!bloggerData || !bloggerData.is_active) {
        setError('בלוגר לא נמצא או לא פעיל');
        return;
      }
      setBlogger(bloggerData);

      // טעינת פרופיל הבלוגר
      const profiles = await BloggerProfile.filter({ 
        blogger_id: bloggerId,
        is_profile_complete: true 
      });
      if (!profiles || profiles.length === 0) {
        setError('פרופיל בלוגר לא מושלם');
        return;
      }
      setBloggerProfile(profiles[0]);

      // טעינת טיולי הבלוגר
      const bloggerTrips = await BloggerTrip.filter({ 
        blogger_id: bloggerId,
        status: 'approved' 
      });
      setTrips(bloggerTrips || []);

      // בדיקת סטטוס מעקב
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        const following = await BloggerFollowing.filter({
          user_id: currentUser.id,
          blogger_id: bloggerId
        });
        setIsFollowing(following && following.length > 0);
      } catch (err) {
        // משתמש לא מחובר
        console.log('User not authenticated');
      }

    } catch (err) {
      console.error('Error loading blogger data:', err);
      setError('שגיאה בטעינת פרטי הבלוגר');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTrips = () => {
    let filtered = trips;

    // סינון לפי חיפוש
    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // מיון
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.bookings_count || 0) - (a.bookings_count || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_low':
        filtered.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    setFilteredTrips(filtered);
  };

  const handleFollowToggle = async () => {
    if (!user) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      if (isFollowing) {
        const following = await BloggerFollowing.filter({
          user_id: user.id,
          blogger_id: bloggerId
        });
        if (following && following.length > 0) {
          await BloggerFollowing.delete(following[0].id);
        }
        // עדכון מספר העוקבים
        await Blogger.update(bloggerId, {
          followers_count: Math.max(0, (blogger.followers_count || 0) - 1)
        });
        setBlogger(prev => ({
          ...prev,
          followers_count: Math.max(0, (prev.followers_count || 0) - 1)
        }));
      } else {
        await BloggerFollowing.create({
          user_id: user.id,
          blogger_id: bloggerId
        });
        // עדכון מספר העוקבים
        await Blogger.update(bloggerId, {
          followers_count: (blogger.followers_count || 0) + 1
        });
        setBlogger(prev => ({
          ...prev,
          followers_count: (prev.followers_count || 0) + 1
        }));
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const handleTripClick = (trip) => {
    navigate(createPageUrl('BloggerTripDetails') + `?id=${trip.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">שגיאה</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate(createPageUrl('Bloggers'))}>
            חזרה לרשימת הבלוגרים
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* באנר עליון */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={bloggerProfile.cover_image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"}
          alt="תמונת רקע"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* ניווט */}
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* פרטי הבלוגר */}
        <div className="absolute bottom-6 right-6 left-6">
          <div className="flex items-end gap-6">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarImage src={blogger.profile_image} alt={blogger.name} />
              <AvatarFallback className="text-3xl">
                {blogger.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-white pb-4">
              <h1 className="text-4xl font-bold mb-2">{blogger.name}</h1>
              
              <div className="flex items-center gap-6 text-lg mb-3">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {blogger.followers_count || 0} עוקבים
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {trips.length} טיולים
                </span>
                {blogger.rating && (
                  <span className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    {blogger.rating.toFixed(1)} דירוג
                  </span>
                )}
              </div>
              
              <p className="text-lg opacity-90 mb-4">{blogger.bio}</p>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleFollowToggle}
                  className={`${isFollowing ? 'bg-white/20 hover:bg-white/30' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                  {isFollowing ? 'עוקב' : 'עקוב'}
                </Button>
                
                {/* קישורים לרשתות חברתיות */}
                {bloggerProfile.social_media?.instagram && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => window.open(bloggerProfile.social_media.instagram, '_blank')}
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                )}
                {bloggerProfile.social_media?.facebook && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => window.open(bloggerProfile.social_media.facebook, '_blank')}
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                )}
                {bloggerProfile.social_media?.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => window.open(bloggerProfile.social_media.website, '_blank')}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* תוכן ראשי */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="trips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="trips">מסלולי טיול</TabsTrigger>
            <TabsTrigger value="about">אודות</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>אודות {blogger.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">שנות ניסיון</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {bloggerProfile.experience_years} שנים
                    </p>
                  </div>

                  {bloggerProfile.travel_philosophy && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">פילוסופיית הטיול</h3>
                      <p className="text-gray-600">{bloggerProfile.travel_philosophy}</p>
                    </div>
                  )}

                  {bloggerProfile.languages && bloggerProfile.languages.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">שפות</h3>
                      <div className="flex flex-wrap gap-2">
                        {bloggerProfile.languages.map((lang, index) => (
                          <Badge key={index} variant="outline">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>תחומי עניין</CardTitle>
                </CardHeader>
                <CardContent>
                  {bloggerProfile.areas_of_interest && bloggerProfile.areas_of_interest.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {bloggerProfile.areas_of_interest.map((interest, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">לא הוגדרו תחומי עניין</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            {/* כלי חיפוש וסינון */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="חפש טיולים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="מיון לפי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">החדשים ביותר</SelectItem>
                  <SelectItem value="popular">הפופולריים ביותר</SelectItem>
                  <SelectItem value="rating">דירוג גבוה</SelectItem>
                  <SelectItem value="price_low">מחיר נמוך</SelectItem>
                  <SelectItem value="price_high">מחיר גבוה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* רשימת הטיולים */}
            {filteredTrips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrips.map((trip) => (
                  <Card 
                    key={trip.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleTripClick(trip)}
                  >
                    <div className="relative h-48">
                      <img
                        src={trip.cover_image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80"}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {trip.featured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                          מומלץ
                        </Badge>
                      )}

                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
                        <p className="text-sm opacity-90 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {trip.destination}
                        </p>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {trip.short_description || trip.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {trip.duration} ימים
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {trip.bookings_count || 0} צפיות
                        </span>
                        {trip.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            {trip.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800">
                          החל מ ${trip.price_from}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(trip.created_date), 'dd/MM/yy')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  לא נמצאו טיולים
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'נסה לשנות את מילות החיפוש' : 'הבלוגר עדיין לא פרסם טיולים'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}