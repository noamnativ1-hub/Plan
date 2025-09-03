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
import { Loader2, Camera, Plus, X, AlertTriangle } from 'lucide-react';

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
    experience_years: 1,
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
        is_profile_complete: true,
        profile_created_date: new Date().toISOString(),
        ...profileData
      });

      // עדכון פרטי הבלוגר
      await Blogger.update(blogger.id, {
        specialty: profileData.areas_of_interest,
        cover_image: profileData.cover_image
      });
      
      onComplete();
    } catch (error) {
      console.error('Error completing profile:', error);
      setErrors({ general: 'אירעה שגיאה בשמירת הפרופיל. אנא נסה שוב.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-800">
              🌟 השלמת הפרופיל הציבורי
            </CardTitle>
            <p className="text-gray-600 mt-2">
              כדי שהפרופיל שלך יוצג באתר, יש להשלים את הפרטים הבאים
            </p>
          </CardHeader>

          <CardContent className="space-y-8 p-8">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>חשוב:</strong> הפרופיל הציבורי שלך יוצג רק לאחר השלמת כל השדות הנדרשים.
                המידע יעזור למשתמשים להכיר אותך ולבחור בטיולים שלك.
              </AlertDescription>
            </Alert>

            {errors.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* תמונת רקע */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">תמונת רקע לפרופיל</Label>
                <Input
                  type="url"
                  placeholder="הכנס קישור לתמונת רקע (אופציונלי)"
                  value={profileData.cover_image}
                  onChange={(e) => setProfileData(prev => ({...prev, cover_image: e.target.value}))}
                />
                <p className="text-sm text-gray-500">
                  תמונה יפה שמייצגת את סגנון הטיולים שלך
                </p>
              </div>

              {/* תחומי עניין */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  תחומי העניין שלך <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_INTERESTS.map((interest) => (
                    <div
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        profileData.areas_of_interest.includes(interest)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white hover:border-blue-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{interest}</span>
                    </div>
                  ))}
                </div>
                {errors.areas_of_interest && (
                  <p className="text-red-500 text-sm">{errors.areas_of_interest}</p>
                )}
              </div>

              {/* שנות ניסיון */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  שנות ניסיון בתכנון טיולים <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={profileData.experience_years}
                  onChange={(e) => setProfileData(prev => ({...prev, experience_years: parseInt(e.target.value) || 1}))}
                />
                {errors.experience_years && (
                  <p className="text-red-500 text-sm">{errors.experience_years}</p>
                )}
              </div>

              {/* פילוסופיית הטיול */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  פילוסופיית הטיול שלך <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="ספר בכמה מילים על הגישה שלך לתכנון טיולים, מה מייחד אותך, ומה חשוב לך בטיול..."
                  value={profileData.travel_philosophy}
                  onChange={(e) => setProfileData(prev => ({...prev, travel_philosophy: e.target.value}))}
                  rows={4}
                />
                {errors.travel_philosophy && (
                  <p className="text-red-500 text-sm">{errors.travel_philosophy}</p>
                )}
              </div>

              {/* שפות */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">שפות שאתה דובר</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {AVAILABLE_LANGUAGES.map((language) => (
                    <div
                      key={language}
                      onClick={() => handleLanguageToggle(language)}
                      className={`p-2 border rounded-lg cursor-pointer transition-all text-center ${
                        profileData.languages.includes(language)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white hover:border-green-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{language}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* רשתות חברתיות */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">רשתות חברתיות (אופציונלי)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="url"
                    placeholder="קישור לאינסטגרם"
                    value={profileData.social_media.instagram}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      social_media: {...prev.social_media, instagram: e.target.value}
                    }))}
                  />
                  <Input
                    type="url"
                    placeholder="קישור לפייסבוק"
                    value={profileData.social_media.facebook}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      social_media: {...prev.social_media, facebook: e.target.value}
                    }))}
                  />
                  <Input
                    type="url"
                    placeholder="קישור ליוטיוב"
                    value={profileData.social_media.youtube}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      social_media: {...prev.social_media, youtube: e.target.value}
                    }))}
                  />
                  <Input
                    type="url"
                    placeholder="אתר אישי"
                    value={profileData.social_media.website}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      social_media: {...prev.social_media, website: e.target.value}
                    }))}
                  />
                </div>
              </div>

              {/* כפתור שליחה */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      שומר פרופיל...
                    </>
                  ) : (
                    'שמור והפעל פרופיל ציבורי'
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