import React, { useState } from 'react';
import { BloggerProfile } from '@/api/entities';
import { Blogger } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, Plus, X } from 'lucide-react';

const AVAILABLE_INTERESTS = [
  'אוכל ומטבח מקומי',
  'תרבות והיסטוריה', 
  'טבע ונופים',
  'הרפתקאות וספורט',
  'אמנות וארכיטקטורה',
  'חיי לילה ובידור',
  'משפחות וילדים',
  'יוקרה ופינוק',
  'תקציב נמוך',
  'צילום',
  'רוחניות ומדיטציה',
  'קניות ושווקים'
];

const AVAILABLE_LANGUAGES = [
  'עברית', 'אנגלית', 'ספרדית', 'צרפתית', 'גרמנית', 'איטלקית', 'פורטוגזית', 'רוסית', 'ערבית'
];

export default function BloggerProfileCompletion({ blogger, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    cover_image: blogger.cover_image || '',
    areas_of_interest: blogger.specialty || [],
    experience_years: 0,
    travel_philosophy: '',
    languages: ['עברית'],
    social_media: {
      instagram: '',
      facebook: '',
      youtube: '',
      website: ''
    }
  });
  
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (profileData.areas_of_interest.length === 0) {
      newErrors.areas_of_interest = 'יש לבחור לפחות תחום עניין אחד';
    }
    
    if (profileData.experience_years < 1 || profileData.experience_years > 50) {
      newErrors.experience_years = 'מספר שנות הניסיון חייב להיות בין 1 ל-50';
    }
    
    if (!profileData.travel_philosophy.trim()) {
      newErrors.travel_philosophy = 'יש להזין את פילוסופיית הטיול שלך';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInterestToggle = (interest) => {
    setProfileData(prev => ({
      ...prev,
      areas_of_interest: prev.areas_of_interest.includes(interest)
        ? prev.areas_of_interest.filter(i => i !== interest)
        : [...prev.areas_of_interest, interest]
    }));
  };

  const handleLanguageToggle = (language) => {
    setProfileData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // יצירת פרופיל ציבורי
      await BloggerProfile.create({
        blogger_id: blogger.id,
        ...profileData,
        is_profile_complete: true,
        profile_created_date: new Date().toISOString()
      });
      
      // עדכון פרטי הבלוגר
      await Blogger.update(blogger.id, {
        specialty: profileData.areas_of_interest,
        cover_image: profileData.cover_image
      });
      
      onComplete();
    } catch (error) {
      console.error('Error creating blogger profile:', error);
      setErrors({ general: 'אירעה שגיאה בשמירת הפרופיל' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">השלמת פרופיל ציבורי</CardTitle>
            <p className="opacity-90">השלם את הפרטים כדי ליצור פרופיל ציבורי מרשים שיעזור למטיילים למצוא אותך</p>
          </CardHeader>
          
          <CardContent className="p-8">
            <Alert className="mb-6">
              <AlertDescription>
                <strong>חשוב:</strong> הפרופיל הציבורי שלך לא יוצג למטיילים עד שתשלים את כל הפרטים הנדרשים.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* תמונת רקע */}
              <div>
                <Label className="text-lg font-medium">תמונת רקע לפרופיל</Label>
                <div className="mt-2">
                  <Input
                    type="url"
                    placeholder="הכנס קישור לתמונה (אופציונלי)"
                    value={profileData.cover_image}
                    onChange={(e) => setProfileData(prev => ({...prev, cover_image: e.target.value}))}
                    className="mb-2"
                  />
                  {profileData.cover_image && (
                    <div className="h-32 rounded-lg overflow-hidden">
                      <img 
                        src={profileData.cover_image} 
                        alt="תצוגה מקדימה" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* תחומי עניין */}
              <div>
                <Label className="text-lg font-medium">תחומי עניין *</Label>
                <p className="text-sm text-gray-600 mb-4">בחר את תחומי העניין שלך (לפחות אחד)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {AVAILABLE_INTERESTS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-2 rounded-lg border text-sm transition-colors ${
                        profileData.areas_of_interest.includes(interest)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                {errors.areas_of_interest && (
                  <p className="text-red-500 text-sm mt-1">{errors.areas_of_interest}</p>
                )}
              </div>

              {/* שנות ניסיון */}
              <div>
                <Label className="text-lg font-medium">שנות ניסיון בטיולים *</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={profileData.experience_years}
                  onChange={(e) => setProfileData(prev => ({...prev, experience_years: parseInt(e.target.value) || 0}))}
                  className="mt-2"
                />
                {errors.experience_years && (
                  <p className="text-red-500 text-sm mt-1">{errors.experience_years}</p>
                )}
              </div>

              {/* פילוסופיית טיול */}
              <div>
                <Label className="text-lg font-medium">פילוסופיית הטיול שלך *</Label>
                <p className="text-sm text-gray-600 mb-2">ספר במה אתה מאמין בתחום הטיולים ומה מייחד אותך</p>
                <Textarea
                  placeholder="לדוגמה: אני מאמין בטיולים אותנטיים שמתחברים לתרבות המקומית..."
                  value={profileData.travel_philosophy}
                  onChange={(e) => setProfileData(prev => ({...prev, travel_philosophy: e.target.value}))}
                  rows={4}
                  className="mt-2"
                />
                {errors.travel_philosophy && (
                  <p className="text-red-500 text-sm mt-1">{errors.travel_philosophy}</p>
                )}
              </div>

              {/* שפות */}
              <div>
                <Label className="text-lg font-medium">שפות שאתה דובר</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {AVAILABLE_LANGUAGES.map(language => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => handleLanguageToggle(language)}
                      className={`p-2 rounded-lg border text-sm transition-colors ${
                        profileData.languages.includes(language)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>

              {/* רשתות חברתיות */}
              <div>
                <Label className="text-lg font-medium">רשתות חברתיות (אופציונלי)</Label>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm">אינסטגרם</Label>
                    <Input
                      placeholder="@username"
                      value={profileData.social_media.instagram}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev, 
                        social_media: {...prev.social_media, instagram: e.target.value}
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">פייסבוק</Label>
                    <Input
                      placeholder="facebook.com/username"
                      value={profileData.social_media.facebook}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev, 
                        social_media: {...prev.social_media, facebook: e.target.value}
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">יוטיוב</Label>
                    <Input
                      placeholder="youtube.com/@username"
                      value={profileData.social_media.youtube}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev, 
                        social_media: {...prev.social_media, youtube: e.target.value}
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">אתר אישי</Label>
                    <Input
                      placeholder="www.example.com"
                      value={profileData.social_media.website}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev, 
                        social_media: {...prev.social_media, website: e.target.value}
                      }))}
                    />
                  </div>
                </div>
              </div>

              {errors.general && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-4">
                <Button type="submit" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    'שמור ויצור פרופיל ציבורי'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}