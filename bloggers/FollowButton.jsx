import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { User } from '@/api/entities';
import { BloggerFollowing } from '@/api/entities';
import { Heart } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function FollowButton({ bloggerId, initialIsFollowing, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFollow = async () => {
    try {
      setLoading(true);
      
      // Check if user is logged in
      let currentUser;
      try {
        currentUser = await User.me();
      } catch (error) {
        // Not logged in - redirect to login
        User.login();
        return;
      }

      if (isFollowing) {
        // Unfollow
        const followings = await BloggerFollowing.filter({
          user_id: currentUser.id,
          blogger_id: bloggerId
        });
        
        if (followings && followings.length > 0) {
          await BloggerFollowing.delete(followings[0].id);
        }
        
        setIsFollowing(false);
        onFollowChange?.(false);
        
        toast({
          title: "הפסקת לעקוב אחרי הבלוגר",
          duration: 3000
        });
      } else {
        // Follow
        await BloggerFollowing.create({
          user_id: currentUser.id,
          blogger_id: bloggerId,
          follow_date: new Date().toISOString()
        });
        
        setIsFollowing(true);
        onFollowChange?.(true);
        
        toast({
          title: "התחלת לעקוב אחרי הבלוגר",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error following blogger:", error);
      toast({
        title: "שגיאה בפעולת המעקב",
        description: "אנא נסו שוב מאוחר יותר",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "default" : "outline"}
      onClick={handleFollow}
      disabled={loading}
    >
      <Heart className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
      {isFollowing ? 'עוקב' : 'עקוב'}
    </Button>
  );
}