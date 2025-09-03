import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Documentation() {
  return (
    <ScrollArea className="h-screen p-8 bg-white">
      <div className="max-w-4xl mx-auto prose prose-blue">
        <h1 className="text-4xl font-bold mb-8">PlanGo - תכנון טיולים חכם 🌍</h1>

        <h2 className="text-2xl font-semibold mt-8 mb-4">חזון המוצר</h2>
        <p>
          PlanGo היא פלטפורמה חכמה לתכנון טיולים המשלבת בינה מלאכותית כדי להתאים אישית כל טיול לצרכי המשתמש. 
          המערכת מנתחת העדפות אישיות, היסטוריית טיולים, ומגמות עולמיות כדי ליצור חוויות טיול מותאמות אישית.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">תפקידי משתמשים</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium">✅ משתמש רגיל</h3>
            <ul className="list-disc list-inside">
              <li>צפייה וחיפוש טיולים</li>
              <li>יצירת טיולים אישיים</li>
              <li>שיתוף והתייעצות</li>
              <li>הזמנת שירותים</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-medium">✅ בלוגר מאושר</h3>
            <ul className="list-disc list-inside">
              <li>כל הרשאות משתמש רגיל</li>
              <li>יצירת מסלולי טיולים למכירה</li>
              <li>ניהול הזמנות ותשלומים</li>
              <li>צפייה בסטטיסטיקות</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-medium">✅ מנהל מערכת</h3>
            <ul className="list-disc list-inside">
              <li>ניהול משתמשים ובלוגרים</li>
              <li>הגדרות מערכת</li>
              <li>ניהול תוכן</li>
              <li>צפייה בנתונים ודוחות</li>
            </ul>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">קבוצות תכונות</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-medium">ניהול טיולים</h3>
            <ul className="list-disc list-inside">
              <li>✅ יצירת טיול חדש עם אשף מונחה</li>
              <li>✅ עריכת פרטי טיול</li>
              <li>✅ שיתוף טיולים</li>
              <li>✅ חיפוש וסינון טיולים</li>
              <li>🔧 יצוא טיול ל-PDF</li>
              <li>🚧 סנכרון עם יומן</li>
            </ul>
          </div>

          {/* Continue with all other sections from the previous documentation,
              formatted as React JSX with proper styling classes */}
        </div>

        {/* Schema section with proper code formatting */}
        <h2 className="text-2xl font-semibold mt-8 mb-4">מודל נתונים / טבלאות Supabase</h2>
        <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            {`
// Users
users (
  id uuid primary key,
  created_at timestamp,
  email text unique,
  full_name text,
  role text,
  preferences jsonb
)

// ... rest of the schema definitions
            `}
          </pre>
        </div>

        {/* Continue with the rest of the sections */}
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">סטנדרטים עיצוביים</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium">טיפוגרפיה</h3>
            <ul className="list-disc list-inside">
              <li>כותרות: Rubik</li>
              <li>טקסט: Open Sans</li>
              <li>כיווניות: RTL</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-medium">צבעים</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#3B82F6]"></div>
                <span>ראשי: #3B82F6</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#1D4ED8]"></div>
                <span>משני: #1D4ED8</span>
              </div>
              {/* Add other color samples */}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">תכונות עתידיות</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium">שלב 2 (Q2 2024)</h3>
            <ul className="list-disc list-inside">
              <li>🚧 אפליקציית מובייל</li>
              <li>🚧 מערכת המלצות AI משופרת</li>
              <li>🚧 תמיכה במסלולים משולבים</li>
              <li>🚧 אינטגרציה עם ספקי תיירות</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-medium">שלב 3 (Q3 2024)</h3>
            <ul className="list-disc list-inside">
              <li>🚧 קהילת מטיילים</li>
              <li>🚧 מערכת נקודות והטבות</li>
              <li>🚧 שילוב AR/VR</li>
              <li>🚧 תמיכה במטבעות קריפטו</li>
            </ul>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}