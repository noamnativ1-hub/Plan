import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Blogger } from '@/api/entities';
import { Loader2 } from 'lucide-react';

export default function BloggerAuthGuard({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verifyBlogger = async () => {
      try {
        const sessionData = sessionStorage.getItem('bloggerSession');
        if (!sessionData) {
          throw new Error('No session');
        }

        const { bloggerId } = JSON.parse(sessionData);
        const blogger = await Blogger.get(bloggerId);
        
        if (!blogger || !blogger.is_active) {
          throw new Error('Invalid blogger');
        }

        setAuthenticated(true);
      } catch (err) {
        console.error('Auth check failed:', err);
        sessionStorage.removeItem('bloggerSession');
        navigate(createPageUrl('BloggerLogin'));
      } finally {
        setLoading(false);
      }
    };

    verifyBlogger();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return authenticated ? children : null;
}