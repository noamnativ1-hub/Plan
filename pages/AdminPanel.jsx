
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Bell, 
  Briefcase, 
  ShieldCheck,
  Plane,
  UserCheck,
  Map,
  Video // Import Video icon
} from 'lucide-react';
import { useLanguage } from '../components/contexts/LanguageContext';

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const adminMenuItems = [
    {
      title: 'ניהול משתמשים',
      description: 'ניהול משתמשי המערכת והרשאות',
      icon: <Users className="h-8 w-8" />,
      action: () => navigate(createPageUrl('AdminUsers'))
    },
    {
      title: t('bloggerManagement'),
      description: 'ניהול בלוגרים ובקשות הצטרפות',
      icon: <UserCheck className="h-8 w-8" />,
      action: () => navigate(createPageUrl('AdminBloggerManager'))
    },
    {
      title: 'ניהול טיולים',
      description: 'צפייה ועריכת טיולים',
      icon: <Plane className="h-8 w-8" />,
      action: () => navigate(createPageUrl('AdminTrips'))
    },
    {
      title: 'ניהול יעדים',
      description: 'יצירה ועריכת יעדים',
      icon: <Map className="h-8 w-8" />,
      action: () => navigate(createPageUrl('AdminDestinations'))
    },
    {
      title: 'עיבוד סרטוני בלוגרים',
      description: 'ניהול ותמלול סרטונים שהועלו',
      icon: <Video className="h-8 w-8" />,
      action: () => navigate(createPageUrl('AdminVideoSubmissions'))
    },
    {
      title: 'סטטיסטיקות',
      description: 'צפייה בנתוני שימוש ומכירות',
      icon: <BarChart3 className="h-8 w-8" />,
      action: () => navigate(createPageUrl('AdminAnalytics'))
    },
    {
      title: 'הודעות מערכת',
      description: 'ניהול הודעות והתראות',
      icon: <Bell className="h-8 w-8" />,
      action: () => navigate(createPageUrl('AdminNotifications'))
    },
    {
      title: t('systemSettings'),
      description: 'הגדרות כלליות למערכת',
      icon: <Settings className="h-8 w-8" />,
      action: () => navigate(createPageUrl('AdminSettings'))
    },
    {
      title: 'אבטחה',
      description: 'הגדרות אבטחה ופרטיות',
      icon: <ShieldCheck className="h-8 w-8" />,
      action: () => navigate(createPageUrl('AdminSecurity'))
    }
  ];
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">פאנל ניהול</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminMenuItems.map((item, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={item.action}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
