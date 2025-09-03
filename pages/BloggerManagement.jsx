import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Blogger } from '@/api/entities';
import { BloggerApplication } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Check, X, User as UserIcon, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BloggerManagement() {
  const navigate = useNavigate();
  const [bloggers, setBloggers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedBlogger, setSelectedBlogger] = useState(null);
  const [commissionRate, setCommissionRate] = useState(20);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadData();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setIsAdmin(userData.role === 'admin');
      
      if (userData.role !== 'admin') {
        setError('אין לך הרשאות לצפות בדף זה');
        setTimeout(() => {
          navigate(createPageUrl('Home'));
        }, 3000);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('אירעה שגיאה בטעינת נתוני המשתמש');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load bloggers
      const bloggersList = await Blogger.list();
      setBloggers(bloggersList || []);
      
      // Load applications
      const applicationsList = await BloggerApplication.filter({ status: 'pending' });
      setApplications(applicationsList || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('אירעה שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlogger = (blogger) => {
    setSelectedBlogger(blogger);
    setCommissionRate(blogger.commission_rate || 20);
  };

  const handleSaveCommission = async () => {
    try {
      await Blogger.update(selectedBlogger.id, {
        ...selectedBlogger,
        commission_rate: commissionRate
      });
      
      setSuccessMessage('אחוז העמלה עודכן בהצלחה');
      setSelectedBlogger(null);
      
      // Refresh bloggers list
      loadData();
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating blogger:', err);
      setError('אירעה שגיאה בעדכון אחוז העמלה');
      
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handleDeleteBlogger = async (bloggerId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק בלוגר זה?')) {
      try {
        await Blogger.delete(bloggerId);
        setSuccessMessage('הבלוגר נמחק בהצלחה');
        
        // Refresh bloggers list
        loadData();
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (err) {
        console.error('Error deleting blogger:', err);
        setError('אירעה שגיאה במחיקת הבלוגר');
        
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
    }
  };

  const handleApproveApplication = async (application) => {
    try {
      // Update application status
      await BloggerApplication.update(application.id, {
        ...application,
        status: 'approved'
      });
      
      // Create new blogger
      await Blogger.create({
        name: application.full_name,
        email: application.email,
        biography: application.biography,
        profile_image: application.profile_image || '',
        website: application.website || '',
        social_media: application.social_media || {},
        commission_rate: 20, // Default commission rate
        status: 'active',
        created_date: new Date().toISOString()
      });
      
      setSuccessMessage('הבקשה אושרה והבלוגר נוסף למערכת');
      
      // Refresh data
      loadData();
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error approving application:', err);
      setError('אירעה שגיאה באישור הבקשה');
      
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handleRejectApplication = async (application) => {
    try {
      await BloggerApplication.update(application.id, {
        ...application,
        status: 'rejected'
      });
      
      setSuccessMessage('הבקשה נדחתה בהצלחה');
      
      // Refresh data
      loadData();
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error rejecting application:', err);
      setError('אירעה שגיאה בדחיית הבקשה');
      
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  if (!isAdmin && user) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertDescription>
            אין לך הרשאות לצפות בדף זה. מעביר אותך לדף הבית...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">ניהול בלוגרים</h1>
        <Button variant="outline" onClick={() => navigate(createPageUrl('AdminPanel'))}>
          חזרה ללוח בקרה
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="bloggers">
        <TabsList className="mb-6">
          <TabsTrigger value="bloggers">בלוגרים פעילים</TabsTrigger>
          <TabsTrigger value="applications">בקשות חדשות {applications.length > 0 && `(${applications.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="bloggers">
          <Card>
            <CardHeader>
              <CardTitle>ניהול בלוגרים פעילים</CardTitle>
              <CardDescription>צפייה ועריכת פרטי הבלוגרים במערכת</CardDescription>
            </CardHeader>
            <CardContent>
              {bloggers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  אין בלוגרים פעילים במערכת כרגע
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>בלוגר</TableHead>
                      <TableHead>אימייל</TableHead>
                      <TableHead>אחוז עמלה</TableHead>
                      <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bloggers.map((blogger) => (
                      <TableRow key={blogger.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={blogger.profile_image} />
                              <AvatarFallback>
                                <UserIcon className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{blogger.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(blogger.created_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{blogger.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{blogger.commission_rate || 20}%</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditBlogger(blogger)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteBlogger(blogger.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>בקשות הצטרפות לתוכנית הבלוגרים</CardTitle>
              <CardDescription>בקשות ממתינות לאישור</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  אין בקשות חדשות ממתינות לאישור
                </div>
              ) : (
                <div className="space-y-6">
                  {applications.map((application) => (
                    <Card key={application.id} className="overflow-hidden">
                      <CardHeader className="bg-muted">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={application.profile_image} />
                              <AvatarFallback>
                                <UserIcon className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{application.full_name}</CardTitle>
                              <CardDescription>{application.email}</CardDescription>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            הוגש בתאריך: {new Date(application.created_date).toLocaleDateString()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-1">תיאור:</h4>
                            <p className="text-muted-foreground">{application.biography}</p>
                          </div>
                          
                          {application.website && (
                            <div>
                              <h4 className="font-medium mb-1">אתר:</h4>
                              <p className="text-muted-foreground">{application.website}</p>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-medium mb-1">ניסיון:</h4>
                            <p className="text-muted-foreground">{application.experience}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1">מוטיבציה:</h4>
                            <p className="text-muted-foreground">{application.motivation}</p>
                          </div>
                          
                          <div className="flex justify-end gap-3 mt-6">
                            <Button 
                              variant="destructive"
                              onClick={() => handleRejectApplication(application)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              דחה בקשה
                            </Button>
                            <Button 
                              onClick={() => handleApproveApplication(application)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              אשר בקשה
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit commission dialog */}
      <Dialog open={selectedBlogger !== null} onOpenChange={(open) => !open && setSelectedBlogger(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת אחוז עמלה</DialogTitle>
            <DialogDescription>
              הגדר את אחוז העמלה עבור {selectedBlogger?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commission-rate">אחוז עמלה: {commissionRate}%</Label>
              <Slider
                id="commission-rate"
                min={0}
                max={50}
                step={1}
                value={[commissionRate]}
                onValueChange={(value) => setCommissionRate(value[0])}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBlogger(null)}>ביטול</Button>
            <Button onClick={handleSaveCommission}>שמור שינויים</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}