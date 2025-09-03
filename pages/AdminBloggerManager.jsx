
import React, { useState, useEffect } from 'react';
import { Blogger } from '@/api/entities';
import { BloggerTrip } from '@/api/entities';
import { BloggerApplication } from '@/api/entities';
import { BloggerProfile } from '@/api/entities'; // Added import for BloggerProfile
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  FileText, 
  AlertTriangle,
  Eye
} from 'lucide-react';

export default function AdminBloggerManagerPage() {
  const [bloggers, setBloggers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [pendingTrips, setPendingTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bloggersData, applicationsData, tripsData] = await Promise.all([
        Blogger.list(),
        BloggerApplication.list(),
        BloggerTrip.filter({ status: 'pending_approval' })
      ]);

      setBloggers(bloggersData || []);
      setApplications(applicationsData || []);
      setPendingTrips(tripsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      
      // Create blogger account
      const newBlogger = await Blogger.create({
        name: application.full_name,
        email: application.email,
        username: application.username,
        password: application.password,
        profile_image: application.profile_image,
        bio: application.bio,
        is_active: true,
        specialty: [], // יתמלא בהשלמת הפרופיל
        rating: 0,
        followers_count: 0,
        trip_count: 0,
        featured: false
      });

      // יצירת פרופיל ריק שיחכה להשלמה
      await BloggerProfile.create({
        blogger_id: newBlogger.id,
        is_profile_complete: false,
        profile_created_date: new Date().toISOString()
      });

      // Update application status
      await BloggerApplication.update(applicationId, { status: 'approved' });
      
      loadData();
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      await BloggerApplication.update(applicationId, { 
        status: 'rejected',
        rejection_reason: rejectionReason
      });
      
      setReviewDialog(false);
      setRejectionReason('');
      loadData();
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  const handleApproveTrip = async (tripId) => {
    try {
      await BloggerTrip.update(tripId, { status: 'approved' });
      loadData();
    } catch (error) {
      console.error('Error approving trip:', error);
    }
  };

  const handleRejectTrip = async (tripId) => {
    try {
      await BloggerTrip.update(tripId, { 
        status: 'rejected',
        rejection_reason: rejectionReason
      });
      
      setReviewDialog(false);
      setRejectionReason('');
      loadData();
    } catch (error) {
      console.error('Error rejecting trip:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />מאושר</Badge>;
      case 'pending':
      case 'pending_approval':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />ממתין</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />נדחה</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">ניהול בלוגרים</h1>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="applications">
            <Users className="w-4 h-4 mr-2" />
            בקשות הצטרפות ({applications.filter(app => app.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="trips">
            <FileText className="w-4 h-4 mr-2" />
            טיולים לאישור ({pendingTrips.length})
          </TabsTrigger>
          <TabsTrigger value="bloggers">
            <Users className="w-4 h-4 mr-2" />
            בלוגרים פעילים ({bloggers.filter(b => b.is_active).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>בקשות הצטרפות לבלוגרים</CardTitle>
              <CardDescription>בדוק ואשר בקשות חדשות</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {applications.filter(app => app.status === 'pending').map(application => (
                <Card key={application.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{application.full_name}</h3>
                        <p className="text-sm text-gray-600">{application.email}</p>
                        <p className="text-sm mt-2">{application.bio}</p>
                        <div className="mt-2">{getStatusBadge(application.status)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(application);
                            setReviewDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApproveApplication(application.id)}
                        >
                          אשר
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            setSelectedItem(application);
                            setReviewDialog(true);
                          }}
                        >
                          דחה
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {applications.filter(app => app.status === 'pending').length === 0 && (
                <p className="text-center text-gray-500 py-8">אין בקשות ממתינות</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips">
          <Card>
            <CardHeader>
              <CardTitle>טיולים לאישור</CardTitle>
              <CardDescription>בדוק ואשר טיולים שנוצרו על ידי בלוגרים</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingTrips.map(trip => (
                <Card key={trip.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{trip.title}</h3>
                        <p className="text-sm text-gray-600">{trip.destination}</p>
                        <p className="text-sm mt-2">{trip.description}</p>
                        <div className="mt-2">{getStatusBadge(trip.status)}</div>
                        {trip.rejection_reason && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              נדחה: {trip.rejection_reason}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(trip);
                            setReviewDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApproveTrip(trip.id)}
                        >
                          אשר
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            setSelectedItem(trip);
                            setReviewDialog(true);
                          }}
                        >
                          דחה
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingTrips.length === 0 && (
                <p className="text-center text-gray-500 py-8">אין טיולים ממתינים לאישור</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bloggers">
          <Card>
            <CardHeader>
              <CardTitle>בלוגרים פעילים</CardTitle>
              <CardDescription>נהל בלוגרים קיימים</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bloggers.filter(blogger => blogger.is_active).map(blogger => (
                <Card key={blogger.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{blogger.name}</h3>
                        <p className="text-sm text-gray-600">{blogger.email}</p>
                        <p className="text-sm mt-2">{blogger.bio}</p>
                        <Badge className="mt-2 bg-green-500">פעיל</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            await Blogger.update(blogger.id, { is_active: false });
                            loadData();
                          }}
                        >
                          השבת
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.title ? 'בדיקת טיול' : 'בדיקת בקשת בלוגר'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem && (
              <div>
                <h3 className="font-semibold">
                  {selectedItem.title || selectedItem.full_name}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {selectedItem.description || selectedItem.bio}
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">
                סיבת דחייה (אופציונלי)
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="הסבר מדוע הבקשה נדחתה..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReviewDialog(false)}>
                ביטול
              </Button>
              <Button 
                onClick={() => {
                  if (selectedItem?.title) {
                    handleApproveTrip(selectedItem.id);
                  } else {
                    handleApproveApplication(selectedItem.id);
                  }
                }}
              >
                אשר
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (selectedItem?.title) {
                    handleRejectTrip(selectedItem.id);
                  } else {
                    handleRejectApplication(selectedItem.id);
                  }
                }}
              >
                דחה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
