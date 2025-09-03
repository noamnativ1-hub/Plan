import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Star, MapPin } from 'lucide-react';

export default function FeaturedBloggers() {
  const navigate = useNavigate();

  const featuredBloggers = [
    {
      id: 1,
      username: "tamar_travels",
      name: "תמר לוינסון",
      image: "https://images.unsplash.com/photo-1616002411355-49593fd89721?auto=format&fit=crop&w=250&q=80",
      featuredTripImage: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
      featuredTripTitle: "מסע בדרום-מזרח אסיה",
      featuredTripDestination: "תאילנד, ויאטנם וקמבודיה",
      trips: 12,
      followers: 5300,
      rating: 4.8,
      featured: true,
      specialty: "אסיה ואפריקה"
    },
    {
      id: 3,
      username: "michal_family",
      name: "מיכל ברק",
      image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=250&q=80",
      featuredTripImage: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80",
      featuredTripTitle: "אירופה למשפחות",
      featuredTripDestination: "ספרד ופורטוגל",
      trips: 15,
      followers: 7800,
      rating: 4.9,
      featured: true,
      specialty: "טיולי משפחות"
    },
    {
      id: 4,
      username: "omer_adventure",
      name: "עומר אדלר",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80",
      featuredTripImage: "https://images.unsplash.com/photo-1493606278519-11aa9f86e40a?auto=format&fit=crop&w=800&q=80",
      featuredTripTitle: "הרפתקה בניו זילנד",
      featuredTripDestination: "ניו זילנד",
      trips: 21,
      followers: 9400,
      rating: 4.7,
      featured: true,
      specialty: "הרפתקאות ותרמילאות"
    }
  ];

  const handleBloggerClick = (username) => {
    navigate(createPageUrl("BloggerProfile") + "?username=" + username);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {featuredBloggers.map((blogger) => (
        <Card 
          key={blogger.id} 
          className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleBloggerClick(blogger.username)}
        >
          <div className="relative">
            <div className="h-48 overflow-hidden">
              <img 
                src={blogger.featuredTripImage} 
                alt={blogger.featuredTripTitle}
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            </div>
            
            <div className="absolute -bottom-8 left-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                <img 
                  src={blogger.image} 
                  alt={blogger.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/80 text-black">
                {blogger.specialty}
              </Badge>
            </div>
            
            {blogger.featured && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-blue-500/80 text-white">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  מובחר
                </Badge>
              </div>
            )}
          </div>
          
          <CardContent className="pt-10 pb-4">
            <h3 className="font-semibold flex items-center">
              {blogger.name}
              {blogger.featured && <BadgeCheck className="h-4 w-4 ml-1 text-blue-500" />}
            </h3>
            
            <div className="flex items-center mt-1 text-sm">
              <Star className="h-3 w-3 mr-1 text-amber-500 fill-current" />
              <span>{blogger.rating.toFixed(1)}</span>
              <span className="text-muted-foreground mx-1">•</span>
              <span className="text-muted-foreground">{blogger.trips} טיולים</span>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium">{blogger.featuredTripTitle}</h4>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {blogger.featuredTripDestination}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-0">
            <Button variant="link" className="p-0 h-auto text-blue-600" size="sm">
              לפרופיל המלא ולכל הטיולים
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}