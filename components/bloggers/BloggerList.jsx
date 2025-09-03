import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Users, BadgeCheck } from 'lucide-react';

export default function BloggerList({ bloggers = [], onSelectBlogger }) {
  if (!bloggers || bloggers.length ===  0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">לא נמצאו בלוגרים</h3>
        <p className="text-muted-foreground">נסו שוב עם חיפוש אחר</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {bloggers.map(blogger => (
        <Card 
          key={blogger.id} 
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectBlogger && onSelectBlogger(blogger)}
        >
          <div className="flex flex-col md:flex-row">
            <div className="relative h-40 md:h-auto md:w-40 flex-shrink-0">
              <img 
                src={blogger.profile_image} 
                alt={blogger.name}
                className="w-full h-full object-cover"
              />
              {blogger.featured && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-blue-500/90 text-white">
                    <BadgeCheck className="h-3 w-3 mr-1" /> מומלץ
                  </Badge>
                </div>
              )}
            </div>
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold flex items-center">
                    {blogger.name}
                    {blogger.featured && (
                      <BadgeCheck className="h-4 w-4 ml-1 text-blue-500" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {blogger.bio}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                    <span>{blogger.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {blogger.trip_count} טיולים
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {blogger.specialty.slice(0, 3).map((spec, i) => (
                  <Badge key={i} variant="secondary" className="font-normal">
                    {spec}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span>מתמחה ב: {blogger.popular_regions.slice(0, 3).join(', ')}</span>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Users className="h-4 w-4 mr-1" />
                <span>{blogger.followers_count.toLocaleString()} עוקבים</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}