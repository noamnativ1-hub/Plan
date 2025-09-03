import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Blogger } from '@/api/entities';
import { BloggerTrip } from '@/api/entities';
import { BloggerProfile } from '@/api/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Video, Edit, Settings, Package, Loader2, AlertTriangle, CheckCircle, Clock, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import BloggerProfileCompletion from '@/components/BloggerProfileCompletion';
import { useLanguage } from '../components/contexts/LanguageContext';
import VideoSubmissionDialog from '../components/bloggers/VideoSubmissionDialog';

export default function BloggerDashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [blogger, setBlogger] = useState(null);
  const [bloggerProfile, setBloggerProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({ total: 0, approved: 0, pending: 0 });

  useEffect(() => {
    const loadBloggerData = async () => {
      try {
        const session = sessionStorage.getItem('bloggerSession');
        if (!session) {
          navigate(createPageUrl('BloggerLogin'));
          return;
        }

        const { bloggerId } = JSON.parse(session);
        const bloggerData = await Blogger.get(bloggerId);
        if (!bloggerData) {
          throw new Error('Blogger not found');
        }

        setBlogger(bloggerData);

        const profiles = await BloggerProfile.filter({ blogger_id: bloggerId });
        if (profiles && profiles.length > 0 && profiles[0].is_profile_complete) {
          setBloggerProfile(profiles[0]);
        } else {
          setShowProfileCompletion(true);
        }

        const bloggerTrips = await BloggerTrip.filter({ blogger_id: bloggerId }, '-created_date');
        setTrips(bloggerTrips || []);

        // Calculate stats
        const stats = {
          total: bloggerTrips.length,
          approved: bloggerTrips.filter(t => t.status === 'approved').length,
          pending: bloggerTrips.filter(t => t.status === 'pending_approval').length,
        };
        setDashboardStats(stats);

      } catch (err) {
        console.error("Failed to load blogger data:", err);
        setError(t('failedToLoadData'));
        sessionStorage.removeItem('bloggerSession');
      } finally {
        setLoading(false);
      }
    };

    loadBloggerData();
  }, [navigate, t]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved': return { badge: <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">{t('approved')}</Badge>, icon: <CheckCircle className="h-4 w-4 text-green-500" /> };
      case 'pending_approval': return { badge: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t('pendingApproval')}</Badge>, icon: <Clock className="h-4 w-4 text-yellow-500" /> };
      case 'rejected': return { badge: <Badge variant="destructive">{t('rejected')}</Badge>, icon: <AlertTriangle className="h-4 w-4 text-red-500" /> };
      default: return { badge: <Badge variant="outline">{t('draft')}</Badge>, icon: <Edit className="h-4 w-4 text-gray-500" /> };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <VideoSubmissionDialog open={showVideoDialog} onOpenChange={setShowVideoDialog} />
      <div className="min-h-screen bg-gray-100/50">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">

          {showProfileCompletion && (
              <Alert className="mb-6 border-blue-500 text-blue-800 bg-blue-50">
                <AlertTriangle className="h-4 w-4 !text-blue-500" />
                <AlertTitle className="font-bold">השלמת פרופיל</AlertTitle>
                <AlertDescription className="flex justify-between items-center">
                  כדי שהפרופיל והטיולים שלך יוצגו באתר, יש להשלים את פרטי הפרופיל הציבורי.
                  <Button onClick={() => navigate(createPageUrl('BloggerProfileCompletion'))} size="sm">השלם פרופיל</Button>
                </AlertDescription>
              </Alert>
          )}

          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                <AvatarImage src={blogger?.profile_image} />
                <AvatarFallback>{blogger?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {language === 'he' ? `ברוך שובך, ${blogger?.name}` : `Welcome back, ${blogger?.name}`}
                </h1>
                <p className="text-gray-500">זהו מרכז הבקרה שלך, מכאן תוכל לנהל את כל הטיולים.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0 self-start sm:self-center">
              <Button 
                onClick={() => setShowVideoDialog(true)}
                variant="outline"
                className="gap-2"
              >
                <Video className="h-4 w-4" />
                {t('createFromVideo')}
              </Button>
              <Button 
                onClick={() => navigate(createPageUrl('BloggerCreateTrip'))}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                {t('createNewTrip')}
              </Button>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">סך הכל טיולים</CardTitle>
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">טיולים מאושרים</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ממתינים לאישור</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.pending}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="trips" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="trips">
                <Package className="mr-2 h-4 w-4" />
                {t('myTrips')}
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                {t('settings')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="trips" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('tripsList')}</CardTitle>
                  <CardDescription>{t('manageTripsYouCreated')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trips.length > 0 ? (
                    trips.map(trip => {
                      const statusInfo = getStatusInfo(trip.status);
                      return (
                      <Card key={trip.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                        <div className="md:col-span-2">
                          {trip.cover_image ? (
                            <img src={trip.cover_image} alt={trip.title} className="rounded-md aspect-video w-full object-cover"/>
                          ) : (
                            <div className="rounded-md aspect-video w-full bg-gray-200 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-5">
                          <h3 className="font-semibold text-lg">{trip.title}</h3>
                          <p className="text-sm text-gray-500">{trip.destination}</p>
                           <p className="text-xs text-gray-400 mt-1">{t('createdOn')}: {new Date(trip.created_date).toLocaleDateString()}</p>
                        </div>
                        <div className="md:col-span-3 flex items-center gap-2">
                            {statusInfo.icon}
                            {statusInfo.badge}
                        </div>
                        <div className="md:col-span-2 flex justify-start md:justify-end">
                          <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl(`BloggerCreateTrip?id=${trip.id}`))}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('edit')}
                          </Button>
                        </div>
                         {trip.status === 'rejected' && trip.rejection_reason && (
                              <div className="md:col-span-12">
                                <Alert variant="destructive" className="mt-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      <span className="font-semibold">{t('rejectionReason')}:</span> {trip.rejection_reason}
                                    </AlertDescription>
                                </Alert>
                              </div>
                          )}
                      </Card>
                    )})
                  ) : (
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noTripsCreatedYet')}</h3>
                        <p className="mt-1 text-sm text-gray-500">התחל ליצור את הטיול הראשון שלך.</p>
                        <div className="mt-6">
                            <Button onClick={() => navigate(createPageUrl('BloggerCreateTrip'))}>
                                <Plus className="-ml-1 mr-2 h-5 w-5" />
                                {t('createNewTrip')}
                            </Button>
                        </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('profileSettings')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('personalDetails')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label>{t('name')}</Label>
                        <p className="text-gray-800">{blogger?.name}</p>
                      </div>
                       <div>
                        <Label>{t('email')}</Label>
                        <p className="text-gray-800">{blogger?.email}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{t('contactSupportToChange')}</p>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('paymentDetails')}</h3>
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">{t('paymentManagementComingSoon')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}