import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Blogger } from '@/api/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function BloggerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // בדיקת סשן קיים
  useEffect(() => {
    const checkSession = () => {
      const session = sessionStorage.getItem('bloggerSession');
      if (session) {
        try {
          const data = JSON.parse(session);
          if (data.bloggerId) {
            navigate(createPageUrl('BloggerDashboard'));
          }
        } catch (err) {
          sessionStorage.removeItem('bloggerSession');
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('נא למלא את כל השדות');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login for:', email);
      
      // שליפת כל הבלוגרים
      const bloggers = await Blogger.list();
      console.log('All bloggers in system:', bloggers.length);
      
      // חיפוש מדויק לפי אימייל
      const normalizedEmail = email.toLowerCase().trim();
      const blogger = bloggers.find(b => {
        const bloggerEmail = b.email?.toLowerCase().trim();
        console.log(`Comparing "${normalizedEmail}" with "${bloggerEmail}"`);
        return bloggerEmail === normalizedEmail;
      });
      
      if (!blogger) {
        console.log('Blogger not found');
        setError('פרטי התחברות שגויים');
        return;
      }
      
      console.log('Found blogger:', { id: blogger.id, email: blogger.email, active: blogger.is_active });
      
      if (!blogger.is_active) {
        setError('חשבון הבלוגר שלך ממתין לאישור מנהל');
        return;
      }
      
      // בדיקת סיסמה - לצורכי פיתוח
      if (password.length < 6) {
        setError('פרטי התחברות שגויים');
        return;
      }
      
      // שמירת סשן
      const sessionData = {
        bloggerId: blogger.id,
        email: blogger.email,
        name: blogger.name,
        loginTime: new Date().toISOString()
      };
      
      sessionStorage.setItem('bloggerSession', JSON.stringify(sessionData));
      console.log('Session saved, redirecting to dashboard');
      
      // ניווט לדשבורד
      navigate(createPageUrl('BloggerDashboard'));
      
    } catch (error) {
      console.error('Login error:', error);
      setError('אירעה שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">כניסת בלוגרים</CardTitle>
            <CardDescription className="text-center">
              התחבר לאזור הבלוגרים שלך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="הכנס את האימייל שלך"
                  disabled={loading}
                  className="text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הכנס את הסיסמה שלך"
                  disabled={loading}
                  className="text-left"
                  dir="ltr"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  'התחבר'
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => navigate(createPageUrl('BloggerApplication'))}
              >
                רוצה להצטרף כבלוגר? הגש בקשה
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}