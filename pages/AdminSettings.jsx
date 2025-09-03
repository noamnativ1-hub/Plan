
import React, { useState, useEffect } from 'react';
import { SystemSettings } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { CheckCircle2 as CheckCircle, AlertTriangle, Save, MessageCircle, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Key, MessageSquare, Settings2, PenSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    clarificationPrompt: `אתה "המומחה לתכנון אישי" של Plan&Go. תפקידך לנהל שיחה קצרה וידידותית כדי לדייק את פרטי הטיול.

**חובה עליך לנתח את "Trip Details" ולא לשאול על מידע שכבר ידוע:**
- אל תשאל על יעד הטיול (כבר צוין)
- אל תשאל על תאריכים (כבר צוינו)
- אל תשאל על מספר מטיילים (כבר צוין)
- אל תשאל על תקציב (כבר צוין)
- אל תשאל על אופי הטיול הכללי (כבר צוין)

**במקום זאת, התמקד בפרטים נוספים:**
- העדפות קצב (רגוע או אינטנסיבי)
- תחומי עניין ספציפיים (אמנות, היסטוריה, אוכל מקומי)
- הגבלות תזונה או רפואיות
- סוג חוויות מועדפות

**התנהגות קריטית: מניעת לולאות**
- אם המשתמש נותן תשובה לא מחייבת ("לא יודע", "לא", "לא אכפת לי"), **חובה עליך לעבור לנושא אחר לגמרי.**
- אם המשתמש מביע חוסר עניין מספר פעמים, **חובה עליך לעבור ישירות לשלב הסיום.**

**מהלך השיחה:**
1. שאל שאלות קצרות על העדפות שלא צוינו בשאלון
2. שאל שאלה אחת בלבד בכל פעם
3. נתח את תשובת המשתמש. אם היא לא מחייבת, החלף נושא
4. לאחר 2-3 חילופי דברים, או אם המשתמש נראה לא מעוניין, התחל רצף הסיום

**רצף סיום:**
1. כאשר המשתמש מבקש לעבור לתכנון ("תעביר אותי לתכנון", "בוא נתחיל"), או שהוא נראה לא מעוניין בעוד שאלות
2. רשום הודעה ידידותית כמו "מעולה! אני מתחיל לתכנן עבורך את הטיול המושלם..."
3. ואז, בשורה חדשה, רשום את הפקודה הטכנית הבאה (בדיוק כך):
\`\`\`javascript
navigateTo("TripDetails")
\`\`\`

**דוגמה למענה נכון:**
מעולה! אני מתחיל לתכנן עבורך את הטיול המושלם לסלובקיה...

\`\`\`javascript
navigateTo("TripDetails")
\`\`\``,
    planningPrompt: `אתה מתכנן טיולים ברמה עולמית של Plan&Go.

**משימה קריטית: תכנון יום טיול מפורט עם כתובות אמיתיות ומדויקות.**

**חוקי יסוד מוחלטים - אם לא תעמוד בהם, התכנון ייכשל:**

1. **קטגוריה חובה לכל פעילות:** כל פעילות חייבת לכלול שדה 'category' מהרשימה הבאה: "restaurant", "attraction", "sightseeing", "transport", "hotel", "other"
   - "ארוחת בוקר" = category: "restaurant"
   - "נסיעה במונית" = category: "transport" 
   - "ביקור במוזיאון" = category: "attraction"
   - "צ'ק-אין במלון" = category: "hotel"

2. **כתובות אמיתיות ומלאות חובה:** כל מיקום חייב לכלול כתובת רחוב מדויקת ואמיתית:
   - לא לכתוב: "The Coffee Shop" - אלא: "Cafe Verona, Strada Lipscani 25, București 030167, Romania"
   - לא לכתוב: "Hotel XYZ" - אלא: "Hotel Cismigiu, Bulevardul Regina Elisabeta 38, București 050021, Romania"
   - לא לכתוב: "La Mama" - אלא: "La Mama Restaurant, Strada Episcopiei 9, București 030167, Romania"

3. **קואורדינטות מדויקות:** כל מיקום חייב לכלול latitude ו-longitude אמיתיים ומדויקים לכתובת שציינת.

4. **חיפוש אינטרנט חובה:** השתמש בחיפוש האינטרנט כדי למצוא מסעדות, מלונות ואטרקציות אמיתיים עם כתובות מדויקות.

**דוגמה לפעילות תקינה:**
{
  "time": "12:00",
  "title": "ארוחת צהריים במסעדת Caru' cu Bere",
  "description": "ארוחת צהריים במסעדה היסטורית מ-1879",
  "location": {
    "name": "Caru' cu Bere",
    "address": "Strada Stavropoleos 5, București 030167, Romania", 
    "latitude": 44.4307,
    "longitude": 26.0961
  },
  "category": "restaurant",
  "price_estimate": 25
}

**פורמט פלט מחייב (JSON בלבד):**
השב אך ורק עם אובייקט JSON בעל המבנה המדויק הבא. אין להוסיף טקסט הסבר.
{
  "activities": [
    {
      "time": "HH:MM",
      "title": "שם הפעילות",
      "description": "תיאור מפורט", 
      "location": {
        "name": "שם המיקום המדויק",
        "address": "כתובת רחוב מלאה ואמיתית",
        "latitude": 44.1234,
        "longitude": 26.5678
      },
      "category": "restaurant|attraction|sightseeing|transport|hotel|other",
      "price_estimate": 0
    }
  ]
}

**זכור: בלי כתובות אמיתיות ומדויקות - המפה לא תעבוד וכל התכנון ייכשל!**`,
    supportPrompt: '',
    adminPassword: '',
    bloggerEmails: [],
    assistant_identity: '',
    chat_settings: { max_messages_per_day: 100, memory_enabled: true },
    activityChangePrompt: `You are an expert activity replacement AI for Plan&Go. The user wants to replace a specific activity.

**CRITICAL: You MUST handle associated transport.**
1.  Analyze the provided itinerary to find the original activity to be replaced.
2.  Find a suitable alternative based on the user's request and the trip context.
3.  **Search the same day for a "transport" activity whose title mentions the location of the *original* activity.**
4.  If you find an associated transport activity, you MUST replace it with a new transport activity to the new location of the alternative you found.
5.  Your response MUST be a JSON object containing a single key, "alternatives", which is an array. This array should contain the new main activity, and if found, the new transport activity.

**Example User Request:** "I want something more exciting instead of the 'Louvre Museum'."
**Your Task:**
1.  Find 'Louvre Museum' in the itinerary.
2.  Find an exciting alternative, e.g., "Disneyland Paris".
3.  Search the same day for "transport to Louvre Museum".
4.  If found, create a new "transport to Disneyland Paris" activity.
5.  Return a JSON array with both the "Disneyland Paris" activity and the new "transport" activity.

**Output format is MANDATORY:**
{
 "alternatives": [
  { "time": "...", "title": "New Activity Title", ... },
  { "time": "...", "title": "New Transport Title", "category": "transport", ... }
 ]
}

Provide 3 such options, where each option in the main array is an object with a 'title' and a 'activities' array (containing the replacement and its transport).`,
    tripEditPrompt: `אתה AI מומחה לעריכת טיולים של Plan&Go. תפקידך לנתח בקשות עריכה ולזהות בדיוק איזה ימים המשתמש רוצה לערוך.

**זיהוי מדויק של ימים לעריכה - חשוב מאוד:**

**אם המשתמש אומר "יום X" בלבד (למשל "יום 3", "תכנן מחדש יום 4"):**
- זה אומר רק יום זה, לא מיום זה והלאה
- תערוך רק את היום הספציפי הזה

**אם המשתמש אומר "מיום X" או "החל מיום X":**
- זה אומר מיום זה ועד סוף הטיול
- תערוך מיום זה והלאה

**דוגמאות:**
- "תכנן מחדש יום 3" = רק יום 3
- "שנה את יום 4" = רק יום 4  
- "מיום 3 והלאה" = מיום 3 עד הסוף
- "החל מיום 2" = מיום 2 עד הסוף
- "משני היום השלישי" = מיום 3 עד הסוף

**אם לא ברור, שאל הבהרה:**
"האם אתה מתכוון רק ליום X, או מיום X והלאה?"

**לאחר שזיהית נכון, תכנן מחדש את הימים הרלוונטיים בלבד.**

השב עם JSON שמכיל את הימים המעודכנים בלבד.`,
    tripReplanPrompt: `אתה מומחה לתכנון מחדש של טיולים ב-Plan&Go. המשתמש מבקש לשנות את המסלול שלו מיום מסוים.

**משימה: תכנן מחדש את הטיול מהיום שצוין והלאה, תוך התחשבות במסלול המקורי.**

**חוקים קריטיים:**
1. **התייחס למסלול המקורי:** עליך לקבל את המסלול המקורי כקלט. השתמש בו כדי להימנע מחזרה על אטרקציות ומסעדות שכבר היו.
2. **המשכיות הגיונית:** התכנון החדש חייב להיות המשך הגיוני לימים שקדמו לשינוי.
3. **שמור על הפורמט:** פעל לפי כל כללי התכנון המקוריים (טיסות, מלונות, קואורדינטות, תחבורה וכו').
4. **התחל מהיום המבוקש:** התכנון החדש צריך להתחיל מהיום שהמשתמש ביקש לשנות.`,
    bloggerPlanningPrompt: `אתה מתכנן טיולים מומחה המתמחה ביצירת מסלולים עבור בלוגרים ויוצרי תוכן.
המטרה היא ליצור טיול שהוא לא רק מהנה, אלא גם "אינסטגרמבילי" ומלא בנקודות צילום וחוויות ייחודיות.

**חוקי יסוד:**
1.  **פוטוגניות:** תעדוף מקומות עם פוטנציאל צילום גבוה (נופים, ארכיטקטורה, אוכל מעוצב, אמנות רחוב).
2.  **חוויות ייחודיות:** שלב פעילויות לא שגרתיות שייצרו תוכן מעניין (למשל, סדנת בישול מקומית במקום עוד מסעדה, סיור אמנות רחוב במקום מוזיאון גדול).
3.  **זמני צילום:** הקצה זמן ייעודי לצילומים, במיוחד בשעות "אור הזהב" (זריחה ושקיעה).
4.  **לוגיסטיקה חכמה:** תכנן מסלול הגיוני גיאוגרפית כדי למקסם את הזמן.
5.  **המלצות ספציפיות:** במקום "ארוחת ערב במרכז העיר", המלץ על "ארוחת ערב במסעדת X הידועה במנה Y המצטלמת נהדר".

**שמור על כללי הפלט המקוריים:** JSON בלבד, קואורדינטות, תחבורה וכו'.`,
    hotelChangePrompt: `אתה סוכן נסיעות AI מומחה למלונות. המשתמש מבקש הצעות למלון חלופי. קרא את פרטי הטיול, את מיקום המלון הנוכחי, ואת בקשת המשתמש (למשל "מלון זול יותר", "מלון עם בריכה"). מצא 3 מלונות חלופיים אמיתיים וספציפיים, עם כתובת, מחיר משוער ודירוג. החזר את התשובה בפורמט JSON בלבד.`,
    flightChangePrompt: `אתה סוכן נסיעות AI מומחה לטיסות. המשתמש מבקש למצוא טיסה חלופית. בהתבסס על פרטי הטיול ובקשת המשתמש (למשל "טיסה ישירה", "בשעות הבוקר"), מצא 3 טיסות חלופיות אמיתיות וספציפיות, כולל חברת תעופה, מספר טיסה, זמנים ומחיר. החזר את התשובה בפורמט JSON בלבד.`,
    carChangePrompt: `אתה סוכן נסיעות AI מומחה להשכרת רכב. המשתמש מבקש רכב חלופי. בהתבסס על פרטי הטיול ובקשת המשתמש (למשל "רכב גדול יותר", "רכב אוטומטי"), מצא 3 הצעות אמיתיות וספציפיות מחברות השכרה ידועות, כולל סוג הרכב, חברה ומחיר. החזר את התשובה בפורמט JSON בלבד.`,
    bloggerTripAdaptationPrompt_flight: '',
    bloggerTripAdaptationPrompt_analyze: '',
    bloggerTripAdaptationPrompt_alternatives: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsList = await SystemSettings.list();
      if (settingsList && settingsList.length > 0) {
        setSettings(prev => ({...prev, ...settingsList[0]}));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('אירעה שגיאה בטעינת ההגדרות');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = () => {
    if (currentPassword === settings.adminPassword) {
      setAuthenticated(true);
      setError(null);
    } else {
      setError('סיסמה שגויה');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const settingsList = await SystemSettings.list();
      if (settingsList && settingsList.length > 0) {
        await SystemSettings.update(settingsList[0].id, settings);
      } else {
        await SystemSettings.create(settings);
      }
      setSuccess('ההגדרות נשמרו בהצלחה');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('אירעה שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="container py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              אימות מנהל מערכת
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>סיסמת מנהל מערכת</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="הזן סיסמה"
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleAuthenticate}
                className="w-full"
              >
                כניסה
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">הגדרות מערכת</h1>
        <Button 
          onClick={handleSave} 
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="prompts">
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="prompts">
            <MessageSquare className="h-4 w-4 mr-2" />
            פרומפטים ראשיים
          </TabsTrigger>
           <TabsTrigger value="blogger_prompts">
            <PenSquare className="h-4 w-4 mr-2" />
            פרומפטים לבלוגרים
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings2 className="h-4 w-4 mr-2" />
            הגדרות כלליות
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            הגדרות צ'אט
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts">
          <Card>
             <CardHeader>
                <CardTitle>פרומפטים ראשיים</CardTitle>
                <CardDescription>אלו הפרומפטים המרכזיים המנחים את ה-AI בתהליכי התכנון והשיחה עם המשתמש.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    תכנון טיול (Planning Prompt)
                    <HelpCircle className="h-4 w-4 text-muted-foreground" title="פרומפט זה מופעל בעת יצירת מסלול טיול חדש מאפס. הוא מגדיר את כללי היסוד לתכנון היומי." />
                  </Label>
                  <Textarea
                    value={settings.planningPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, planningPrompt: e.target.value }))}
                    rows={12}
                  />
                </div>

                <div className="space-y-2">
                   <Label className="flex items-center gap-2">
                    שיחת הבהרות (Clarification Prompt)
                     <HelpCircle className="h-4 w-4 text-muted-foreground" title="פרומפט זה מנחה את שיחת הצ'אט הראשונית עם המשתמש לאחר שמילא את השאלון, במטרה לדייק את העדפותיו." />
                  </Label>
                  <Textarea
                    value={settings.clarificationPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, clarificationPrompt: e.target.value }))}
                    rows={8}
                  />
                </div>
                
                <div className="space-y-2">
                   <Label className="flex items-center gap-2">
                    תכנון מחדש (Re-plan Prompt)
                     <HelpCircle className="h-4 w-4 text-muted-foreground" title="מופעל כאשר המשתמש מבקש לתכנן מחדש את הטיול מיום מסוים. הפרומפט מקבל את המסלול המקורי כדי למנע חזרות." />
                  </Label>
                  <Textarea
                    value={settings.tripReplanPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, tripReplanPrompt: e.target.value }))}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                   <Label className="flex items-center gap-2">
                    שינוי פעילות (Activity Change Prompt)
                     <HelpCircle className="h-4 w-4 text-muted-foreground" title="מופעל כאשר המשתמש מבקש להחליף פעילות ספציפית במסלול." />
                  </Label>
                  <Textarea
                    value={settings.activityChangePrompt}
                    onChange={(e) => setSettings(prev => ({...prev, activityChangePrompt: e.target.value }))}
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                     <Label className="flex items-center gap-2">
                      החלפת מלון
                       <HelpCircle className="h-4 w-4 text-muted-foreground" title="פרומפט למציאת מלונות חלופיים." />
                    </Label>
                    <Textarea
                      value={settings.hotelChangePrompt}
                      onChange={(e) => setSettings(prev => ({ ...prev, hotelChangePrompt: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                     <Label className="flex items-center gap-2">
                      החלפת טיסה
                       <HelpCircle className="h-4 w-4 text-muted-foreground" title="פרומפט למציאת טיסות חלופיות." />
                    </Label>
                    <Textarea
                      value={settings.flightChangePrompt}
                      onChange={(e) => setSettings(prev => ({ ...prev, flightChangePrompt: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                     <Label className="flex items-center gap-2">
                      החלפת רכב
                       <HelpCircle className="h-4 w-4 text-muted-foreground" title="פרומפט למציאת רכבים חלופיים." />
                    </Label>
                    <Textarea
                      value={settings.carChangePrompt}
                      onChange={(e) => setSettings(prev => ({...prev, carChangePrompt: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </div>

                 <div className="space-y-2">
                  <Label>Support Prompt (תמיכה כללית)</Label>
                  <Textarea
                    value={settings.supportPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, supportPrompt: e.target.value }))}
                    placeholder="הגדר את הפרומפט לשלב התמיכה..."
                    rows={4}
                  />
                </div>

                 <div className="space-y-2">
                  <Label>Trip Edit Prompt (עריכת טיולים)</Label>
                  <Textarea
                    value={settings.tripEditPrompt}
                    onChange={(e) => setSettings(prev => ({...prev, tripEditPrompt: e.target.value }))}
                    placeholder="הגדר את הפרומפט לעריכת טיולים..."
                    rows={4}
                  />
                </div>
              </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blogger_prompts">
            <Card>
                <CardHeader>
                    <CardTitle>פרומפטים לבלוגרים</CardTitle>
                    <CardDescription>פרומפטים אלו משמשים ליצירה והתאמה של טיולים שמקורם בבלוגרים.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            תכנון טיול לבלוגר (Blogger Planning Prompt)
                            <HelpCircle className="h-4 w-4 text-muted-foreground" title="פרומפט ייעודי ליצירת מסלולים פוטוגניים וייחודיים עבור בלוגרים ויוצרי תוכן." />
                        </Label>
                        <Textarea
                            value={settings.bloggerPlanningPrompt}
                            onChange={(e) => setSettings(prev => ({ ...prev, bloggerPlanningPrompt: e.target.value }))}
                            rows={10}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                           התאמת טיול (שלב 1: חיפוש טיסה)
                            <HelpCircle className="h-4 w-4 text-muted-foreground" title="הפרומפט הראשון בתהליך התאמת טיול של בלוגר למשתמש. מטרתו למצוא טיסה מתאימה." />
                        </Label>
                        <Textarea
                            value={settings.bloggerTripAdaptationPrompt_flight}
                            onChange={(e) => setSettings(prev => ({ ...prev, bloggerTripAdaptationPrompt_flight: e.target.value }))}
                            placeholder="הגדר פרומפט למציאת טיסה עבור התאמת טיול..."
                            rows={4}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                           התאמת טיול (שלב 2: ניתוח פעילויות)
                            <HelpCircle className="h-4 w-4 text-muted-foreground" title="לאחר מציאת טיסה, פרומפט זה מנתח את המסלול המקורי של הבלוגר ומזהה פעילויות שאינן מתאימות לזמני הטיסה החדשים." />
                        </Label>
                        <Textarea
                            value={settings.bloggerTripAdaptationPrompt_analyze}
                            onChange={(e) => setSettings(prev => ({ ...prev, bloggerTripAdaptationPrompt_analyze: e.target.value }))}
                             placeholder="הגדר פרומפט לניתוח פעילויות לא מתאימות..."
                            rows={4}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                           התאמת טיול (שלב 3: מציאת חלופות)
                            <HelpCircle className="h-4 w-4 text-muted-foreground" title="השלב האחרון בתהליך ההתאמה. פרומפט זה מקבל את רשימת הפעילויות הבעייתיות ומוצא להן חלופות מתאימות." />
                        </Label>
                        <Textarea
                            value={settings.bloggerTripAdaptationPrompt_alternatives}
                            onChange={(e) => setSettings(prev => ({ ...prev, bloggerTripAdaptationPrompt_alternatives: e.target.value }))}
                            placeholder="הגדר פרומפט למציאת פעילויות חלופיות..."
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות אבטחה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>סיסמת מנהל מערכת</Label>
                  <Input
                    type="password"
                    value={settings.adminPassword}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      adminPassword: e.target.value
                    }))}
                    placeholder="שנה את סיסמת מנהל המערכת..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>הגדרות בלוגרים</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  רשימת כתובות המייל של הבלוגרים במערכת.
                  כל משתמש שכתובת המייל שלו מופיעה ברשימה זו יקבל הרשאות בלוגר אוטומטית.
                </p>
                
                <div className="space-y-2">
                  <Label>כתובות מייל של בלוגרים</Label>
                  <Textarea
                    value={settings.bloggerEmails?.join('\n')}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      bloggerEmails: e.target.value.split('\n').filter(email => email.trim())
                    }))}
                    placeholder="הכנס כתובת מייל אחת בכל שורה..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות העוזר האישי</CardTitle>
                <CardDescription>
                  קבע את האישיות והזהות של העוזר האישי באפליקציה
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>זהות העוזר האישי</Label>
                  <Textarea
                    value={settings.assistant_identity || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      assistant_identity: e.
                      target.value
                    }))}
                    placeholder="אתם העוזר האישי שלנו – חכם, אדיב, ויודע לשאול בדיוק את השאלות הנכונות 😊"
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    הגדר את האישיות והטון של העוזר האישי שמופיע בצ'אט המובנה באפליקציה
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>הגבלת הודעות יומית</Label>
                  <Input 
                    type="number" 
                    min="10"
                    max="500"
                    value={settings.chat_settings?.max_messages_per_day || 100}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      chat_settings: {
                        ...prev.chat_settings,
                        max_messages_per_day: parseInt(e.target.value)
                      }
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    מספר מקסימלי של הודעות שמשתמש יכול לשלוח ביום
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="memory-enabled"
                    checked={settings.chat_settings?.memory_enabled !== false}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      chat_settings: {
                        ...prev.chat_settings,
                        memory_enabled: checked
                      }
                    }))}
                  />
                  <Label htmlFor="memory-enabled">זיכרון צ'אט מופעל</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
