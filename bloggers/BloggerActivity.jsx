import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MapPin, Camera, Calendar, MessageSquare, Heart, Share2, Globe } from 'lucide-react';

export default function BloggerActivity({ blogger }) {
  // Sample activity data - in a real app, this would come from the database
  const activitiesData = [
    {
      id: 'a1',
      type: 'post',
      title: 'טיול חדש לתאילנד!',
      content: 'שמחה לשתף את מסלול הטיול החדש שלי לתאילנד! כולל את האיים הכי יפים, חופים מדהימים ומקדשים עתיקים. לפרטים נוספים בקרו בפרופיל שלי.',
      image: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=1200&q=80',
      date: '2023-07-15T12:00:00Z',
      likes: 124,
      comments: 32
    },
    {
      id: 'a2',
      type: 'trip',
      title: 'מסלול חדש: חופשה למשפחות ביפן',
      content: 'השקתי היום מסלול חדש ליפן שמיועד במיוחד למשפחות! כולל פארקי שעשועים, מוזיאונים אינטראקטיביים, ופעילויות חווייתיות לילדים ולמבוגרים.',
      date: '2023-08-22T10:30:00Z',
      destination: 'יפן',
      duration: 10
    },
    {
      id: 'a3',
      type: 'photo',
      title: 'זריחה מדהימה באנגקור ואט',
      image: 'https://images.unsplash.com/photo-1463695970743-ae65cca05743?auto=format&fit=crop&w=1200&q=80',
      date: '2023-09-01T14:15:00Z',
      location: 'קמבודיה, אנגקור ואט',
      likes: 312
    },
    {
      id: 'a4',
      type: 'post',
      title: 'טיפים לנסיעה לדרום-מזרח אסיה בעונת הגשמים',
      content: 'רבים חוששים לנסוע לדרום-מזרח אסיה בעונת הגשמים, אבל האמת היא שיש גם יתרונות רבים! פחות תיירים, מחירים נוחים יותר, והנוף ירוק ומרהיב. הנה כמה טיפים שיעזרו לכם להתמודד עם הגשם ולהפוך את החופשה למוצלחת.',
      date: '2023-09-15T08:45:00Z',
      likes: 98,
      comments: 24
    }
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">פוסטים</TabsTrigger>
          <TabsTrigger value="photos">תמונות</TabsTrigger>
          <TabsTrigger value="trips">טיולים חדשים</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-6 space-y-6">
          {activitiesData
            .filter(a => a.type === 'post')
            .map(activity => (
              <Card key={activity.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={blogger.profile_image} alt={blogger.name} />
                      <AvatarFallback>{blogger.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{blogger.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Globe className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <h4 className="font-medium mt-2">{activity.title}</h4>
                      <p className="mt-2 text-sm">{activity.content}</p>
                      
                      {activity.image && (
                        <div className="mt-4 rounded-md overflow-hidden">
                          <img 
                            src={activity.image} 
                            alt={activity.title}
                            className="w-full h-auto"
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-4 pt-2 border-t">
                        <div className="flex space-x-4 space-x-reverse">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Heart className="h-4 w-4 mr-1" />
                            <span className="text-xs">{activity.likes}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span className="text-xs">{activity.comments}</span>
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
        
        <TabsContent value="photos" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {activitiesData
              .filter(a => a.type === 'photo')
              .map(activity => (
                <Card key={activity.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img 
                      src={activity.image} 
                      alt={activity.title}
                      className="w-full h-48 object-cover transition-transform group-hover:scale-105 duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-medium text-sm">{activity.title}</h3>
                      {activity.location && (
                        <div className="flex items-center text-white/80 text-xs mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{activity.location}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      <div className="bg-black/50 rounded-full p-1.5">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="absolute top-3 left-3 flex items-center">
                      <div className="bg-black/50 rounded-full p-1 px-2 flex items-center">
                        <Heart className="h-3 w-3 text-white mr-1" />
                        <span className="text-white text-xs">{activity.likes}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
            {/* Add a few more sample photos */}
            <Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80" 
                  alt="כפר איטלקי"
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105 duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-medium text-sm">כפר קטן בטוסקנה</h3>
                  <div className="flex items-center text-white/80 text-xs mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>איטליה, טוסקנה</span>
                  </div>
                </div>
                
                <div className="absolute top-3 right-3">
                  <div className="bg-black/50 rounded-full p-1.5">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div className="absolute top-3 left-3 flex items-center">
                  <div className="bg-black/50 rounded-full p-1 px-2 flex items-center">
                    <Heart className="h-3 w-3 text-white mr-1" />
                    <span className="text-white text-xs">156</span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1596392927852-2a18c336fb78?auto=format&fit=crop&w=800&q=80" 
                  alt="חוף ים"
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105 duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-medium text-sm">חופי פורטוגל היפים</h3>
                  <div className="flex items-center text-white/80 text-xs mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>פורטוגל, אלגרבה</span>
                  </div>
                </div>
                
                <div className="absolute top-3 right-3">
                  <div className="bg-black/50 rounded-full p-1.5">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div className="absolute top-3 left-3 flex items-center">
                  <div className="bg-black/50 rounded-full p-1 px-2 flex items-center">
                    <Heart className="h-3 w-3 text-white mr-1" />
                    <span className="text-white text-xs">204</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trips" className="mt-6 space-y-4">
          {activitiesData
            .filter(a => a.type === 'trip')
            .map(activity => (
              <Card key={activity.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 text-blue-700 rounded-md p-2 flex-shrink-0">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{activity.title}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{activity.destination}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <p className="mt-2 text-sm">{activity.content}</p>
                      
                      <div className="flex items-center mt-3 text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                        <span>{activity.duration} ימים</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 text-green-700 rounded-md p-2 flex-shrink-0">
                  <Globe className="h-6 w-6" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">מסע קולינרי בדרום איטליה</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>איטליה</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date('2023-06-10').toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="mt-2 text-sm">השקתי טיול חדש שמתמקד בחוויות קולינריות בדרום איטליה - מנאפולי דרך פוליה ועד לסיציליה. כולל סדנאות בישול, ביקורים אצל יצרנים מקומיים וארוחות במסעדות נבחרות.</p>
                  
                  <div className="flex items-center mt-3 text-sm">
                    <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                    <span>9 ימים</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}