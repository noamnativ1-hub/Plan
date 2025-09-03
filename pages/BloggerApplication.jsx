import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BloggerApplication } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Upload
} from 'lucide-react';

export default function BloggerApplicationPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    profile_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    social_links: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    },
    bio: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);

  useEffect(() => {
    checkUserAndApplication();
  }, []);

  const checkUserAndApplication = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        full_name: userData.full_name || '',
        email: userData.email || ''
      }));
      
      // Check if user already has an application
      const applications = await BloggerApplication.filter({ email: userData.email });
      if (applications && applications.length > 0) {
        setExistingApplication(applications[0]);
      }
    } catch (err) {
      console.error('Not logged in or error fetching user:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'שם מלא הוא שדה חובה';
    if (!formData.email.trim()) newErrors.email = 'אימייל הוא שדה חובה';
    if (!formData.username.trim()) newErrors.username = 'שם משתמש הוא שדה חובה';
    if (formData.username.trim().includes(' ')) newErrors.username = 'שם משתמש לא יכול להכיל רווחים';
    
    if (!formData.password.trim()) {
      newErrors.password = 'סיסמה היא שדה חובה';
    } 
    
    if (!formData.bio.trim()) newErrors.bio = 'תיאור קצר הוא שדה חובה';
    if (!formData.profile_image.trim()) newErrors.profile_image = 'תמונת פרופיל היא שדה חובה';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      await BloggerApplication.create({
        ...formData,
        status: 'pending',
        application_date: new Date().toISOString()
      });
      
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting application:', err);
      setErrors({ submit: 'אירעה שגיאה בשליחת הבקשה. נסה שוב מאוחר יותר.' });
    } finally {
      setLoading(false);
    }
  };

  if (existingApplication) {
    return (
      <div className="container py-8 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">בקשתך להיות בלוגר כבר הוגשה</CardTitle>
            {existingApplication.status === 'pending' ? (
              <CardDescription className="text-center">
                הבקשה שלך נמצאת בתהליך בדיקה
              </CardDescription>
            ) : existingApplication.status === 'approved' ? (
              <CardDescription className="text-center text-green-500">
                הבקשה שלך אושרה! אתה כבר בלוגר במערכת.
              </CardDescription>
            ) : (
              <CardDescription className="text-center text-red-500">
                הבקשה שלך נדחתה.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {existingApplication.status === 'pending' && (
              <div className="bg-blue-50 p-4 rounded-lg text-blue-800 mb-4">
                <p className="text-center">
                  לאחר שנבדוק את הבקשה שלך, ניצור איתך קשר לגבי המשך התהליך.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">סטטוס:</span>
                <span className="font-medium">
                  {existingApplication.status === 'pending' ? 'ממתין לאישור' : 
                   existingApplication.status === 'approved' ? 'אושר' : 'נדחה'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">תאריך הגשה:</span>
                <span className="font-medium">
                  {new Date(existingApplication.application_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full flex gap-2">
              <Button 
                className="w-full" 
                onClick={() => navigate(existingApplication.status === 'approved' 
                  ? createPageUrl('BloggerDashboard') 
                  : createPageUrl('Home')
                )}
              >
                {existingApplication.status === 'approved' 
                  ? 'עבור לאזור הבלוגרים' 
                  : 'חזור לדף הבית'
                }
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container py-8 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-center mt-4">הבקשה נשלחה בהצלחה!</CardTitle>
            <CardDescription className="text-center">
              הבקשה שלך להפוך לבלוגר נשלחה בהצלחה למערכת
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              לאחר שנבדוק את הבקשה שלך, ניצור איתך קשר לגבי המשך התהליך.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => navigate(createPageUrl('Home'))}
            >
              חזור לדף הבית
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">הצטרף כבלוגר ל-PlanGo</h1>
          <p className="text-muted-foreground">
            שתף את החוויות וההמלצות שלך עם קהילת המטיילים, וצור הכנסה נוספת
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>פרטי הבקשה</CardTitle>
            <CardDescription>
              מלא את הפרטים הבאים כדי להגיש בקשה להפוך לבלוגר מוביל
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors.submit && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <form id="blogger-application-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">שם מלא</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="השם המלא שלך"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={errors.full_name ? "border-red-500" : ""}
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-xs">{errors.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">כתובת אימייל</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={user?.email}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">שם משתמש</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="בחר שם משתמש ייחודי"
                    value={formData.username}
                    onChange={handleChange}
                    className={errors.username ? "border-red-500" : ""}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">סיסמה</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="בחר סיסמה חזקה"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs">{errors.password}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">תיאור קצר</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="ספר לנו על עצמך, הניסיון שלך בטיולים, ותחומי ההתמחות שלך (מקסימום 250 תווים)"
                  value={formData.bio}
                  onChange={handleChange}
                  className={errors.bio ? "border-red-500" : ""}
                  maxLength={250}
                />
                <div className="flex justify-between">
                  {errors.bio && (
                    <p className="text-red-500 text-xs">{errors.bio}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/250
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>תמונת פרופיל</Label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 rounded-full overflow-hidden border">
                    <img 
                      src={formData.profile_image} 
                      alt="תמונת פרופיל" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      name="profile_image"
                      placeholder="הזן URL של תמונה"
                      value={formData.profile_image}
                      onChange={handleChange}
                      className={errors.profile_image ? "border-red-500" : ""}
                    />
                    {errors.profile_image && (
                      <p className="text-red-500 text-xs">{errors.profile_image}</p>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full gap-2"
                      disabled
                    >
                      <Upload className="h-4 w-4" />
                      העלה תמונה (בקרוב)
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>קישורים לרשתות חברתיות (אופציונלי)</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-muted-foreground" />
                    <Input
                      name="social_links.instagram"
                      placeholder="Instagram URL"
                      value={formData.social_links.instagram}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-muted-foreground" />
                    <Input
                      name="social_links.facebook"
                      placeholder="Facebook URL"
                      value={formData.social_links.facebook}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-muted-foreground" />
                    <Input
                      name="social_links.twitter"
                      placeholder="Twitter URL"
                      value={formData.social_links.twitter}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-muted-foreground" />
                    <Input
                      name="social_links.linkedin"
                      placeholder="LinkedIn URL"
                      value={formData.social_links.linkedin}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">מספר טלפון (אופציונלי)</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="מספר טלפון ליצירת קשר"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit"
              form="blogger-application-form"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  שולח בקשה...
                </span>
              ) : (
                'שלח בקשה'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate(createPageUrl('Home'))}
            >
              ביטול
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}