import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Blogger } from '@/api/entities';
import { BloggerProfile } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, BadgeCheck, Users, Clock } from 'lucide-react';
import { useLanguage } from '../components/contexts/LanguageContext';

export default function BloggersPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [bloggers, setBloggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadBloggers();
  }, []);

  const loadBloggers = async () => {
    try {
      setLoading(true);
      const data = await Blogger.list();
      
      // סינון רק בלוגרים פעילים שהשלימו פרופיל
      const activeBloggers = [];
      
      for (const blogger of (data || [])) {
        if (blogger.is_active) {
          // בדיקה אם יש פרופיל מושלם
          const profiles = await BloggerProfile.filter({ 
            blogger_id: blogger.id,
            is_profile_complete: true
          });
          
          if (profiles && profiles.length > 0) {
            activeBloggers.push({
              ...blogger,
              profile: profiles[0]
            });
          }
        }
      }
      
      setBloggers(activeBloggers);
    } catch (err) {
      console.error('Error loading bloggers:', err);
      setError(t('error') + ': Failed to load bloggers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBlogger = (bloggerId) => {
    navigate(createPageUrl('PublicBloggerProfile') + '?id=' + bloggerId);
  };

  // Safe getter functions to prevent null errors
  const getFollowersCount = (blogger) => {
    return blogger?.followers_count ? blogger.followers_count.toLocaleString() : '0';
  };

  const getTripCount = (blogger) => {
    return blogger?.trip_count || 0;
  };

  const getSpecialty = (blogger) => {
    return blogger?.specialty ? 
      (Array.isArray(blogger.specialty) ? blogger.specialty[0] : blogger.specialty) : 
      t('trips');
  };

  const filteredBloggers = bloggers
    .filter(blogger => {
      const matchesSearch = blogger?.name?.toLowerCase().includes(search.toLowerCase()) ||
                           blogger?.specialty?.some(s => s.toLowerCase().includes(search.toLowerCase()));
      
      const matchesFilter = activeFilter === 'all' ||
                           (activeFilter === 'featured' && blogger?.featured) ||
                           (activeFilter === 'popular' && (blogger?.followers_count || 0) > 5000);
      
      return matchesSearch && matchesFilter;
    });

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">{t('travelBloggers')}</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder={t('searchBloggers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">{t('all')}</TabsTrigger>
              <TabsTrigger value="featured">{t('featured')}</TabsTrigger>
              <TabsTrigger value="popular">{t('popular')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="opacity-60 animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadBloggers}>{t('tryAgain')}</Button>
        </div>
      ) : filteredBloggers.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500 mb-2">{t('noBloggersFound')}</p>
          <Button variant="outline" onClick={() => setSearch('')}>{t('clearSearch')}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredBloggers.map((blogger) => (
            <Card 
              key={blogger.id} 
              className="overflow-hidden cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-md"
              onClick={() => handleViewBlogger(blogger.id)}
            >
              <div className="relative h-48 w-full overflow-hidden">
                <img 
                  src={blogger.profile_image || "https://images.unsplash.com/photo-1584697964358-7e24ca6a0be5?auto=format&fit=crop&w=800&q=80"} 
                  alt={blogger?.name || "בלוגר"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {blogger?.featured && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-blue-500 text-white">
                      <BadgeCheck className="h-3 w-3 mr-1" />
                      {t('featured')}
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="text-lg font-bold mb-1">{blogger?.name || "בלוגר ללא שם"}</h3>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{getSpecialty(blogger)}</span>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{getFollowersCount(blogger)} {t('followers')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{getTripCount(blogger)} {t('trips')}</span>
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