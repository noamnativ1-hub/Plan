import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, StarHalf, ThumbsUp } from 'lucide-react';

export default function BloggerReviews({ reviews = [] }) {
  const [filter, setFilter] = useState('all');
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">אין ביקורות עדיין</h3>
        <p className="text-muted-foreground">הבלוגר טרם קיבל ביקורות</p>
      </div>
    );
  }
  
  // Filter reviews based on selection
  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(review => {
        if (filter === 'positive') return review.rating >= 4;
        if (filter === 'neutral') return review.rating >= 3 && review.rating < 4;
        if (filter === 'negative') return review.rating < 3;
        return true;
      });
  
  // Calculate average rating
  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
  
  // Count reviews by rating
  const ratingCounts = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating >= 4 && r.rating < 5).length,
    3: reviews.filter(r => r.rating >= 3 && r.rating < 4).length,
    2: reviews.filter(r => r.rating >= 2 && r.rating < 3).length,
    1: reviews.filter(r => r.rating < 2).length
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>סיכום ביקורות</CardTitle>
            <div className="flex items-center">
              <Star className="h-6 w-6 text-amber-500 fill-current" />
              <span className="text-2xl font-bold ml-1">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground ml-1">({reviews.length} ביקורות)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center">
                  <div className="w-16 text-sm flex items-center">
                    {rating} <Star className="h-3 w-3 text-amber-500 fill-current ml-1" />
                  </div>
                  <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(ratingCounts[rating] / reviews.length) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-right text-muted-foreground">
                    {ratingCounts[rating]}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">סינון ביקורות:</h4>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="כל הביקורות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הביקורות</SelectItem>
                    <SelectItem value="positive">חיוביות (4-5 כוכבים)</SelectItem>
                    <SelectItem value="neutral">ניטרליות (3 כוכבים)</SelectItem>
                    <SelectItem value="negative">שליליות (1-2 כוכבים)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">צבירת ניסיון:</h4>
                <p className="text-sm text-muted-foreground">
                  הבלוגר צבר ניסיון וביקורות מ-{reviews.length} נוסעים שהזמינו את הטיולים שלו.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map(review => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={review.user_image} alt={review.user_name} />
                      <AvatarFallback>{review.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{review.user_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                        {review.trip_date && (
                          <span className="ml-2">
                            • טייל ב-{new Date(review.trip_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = i + 1;
                      const roundedRating = Math.round(review.rating * 2) / 2;
                      
                      if (value <= roundedRating) {
                        return <Star key={i} className="h-4 w-4 text-amber-500 fill-current" />;
                      } else if (value === Math.ceil(roundedRating) && !Number.isInteger(roundedRating)) {
                        return <StarHalf key={i} className="h-4 w-4 text-amber-500 fill-current" />;
                      } else {
                        return <Star key={i} className="h-4 w-4 text-gray-300" />;
                      }
                    })}
                  </div>
                </div>
                
                <p className="mb-4">{review.comment}</p>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="text-muted-foreground">
                    {review.helpful_count > 0 && (
                      <span>{review.helpful_count} אנשים מצאו את הביקורת הזו מועילה</span>
                    )}
                  </div>
                  <button className="flex items-center text-blue-600 hover:text-blue-700">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span>מועיל</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">אין ביקורות התואמות את הסינון</h3>
            <p className="text-muted-foreground">נסו לבחור קריטריון סינון אחר</p>
          </div>
        )}
      </div>
    </div>
  );
}