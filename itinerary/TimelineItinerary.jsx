import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TripItinerary } from '@/api/entities';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plane, 
  Hotel, 
  MapPin, 
  Coffee, 
  Utensils, 
  Car, 
  Clock, 
  Calendar,
  Copy,
  Printer,
  Plus,
  Save,
  RefreshCw,
  AlertOctagon,
  AlertTriangle
} from 'lucide-react';
import EditableTimelineItem from './EditableTimelineItem';
import ItineraryMapView from './ItineraryMapView';

export default function TimelineItinerary({ tripId, itineraryDays, onUpdateItinerary }) {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState(1);
  const [openDialog, setOpenDialog] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    time: "09:00",
    title: "",
    description: "",
    category: "attraction",
    location: { name: "" },
    price: 0
  });
  const [viewMode, setViewMode] = useState('timeline');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalCost, setOriginalCost] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [savingChanges, setSavingChanges] = useState(false);
  
  // Load or initialize itinerary
  useEffect(() => {
    if (itineraryDays && itineraryDays.length > 0) {
      setItinerary(itineraryDays);
      // Calculate original cost
      const total = itineraryDays.reduce((sum, day) => {
        return sum + (day.activities || []).reduce((daySum, activity) => {
          return daySum + (activity.price || 0);
        }, 0);
      }, 0);
      setOriginalCost(total);
      setCurrentCost(total);
    } else {
      // Use sample data if no real data
      setItinerary(getSampleTripDays());
      // Calculate sample cost
      const total = getSampleTripDays().reduce((sum, day) => {
        return sum + (day.activities || []).reduce((daySum, activity) => {
          return daySum + (activity.price || 0);
        }, 0);
      }, 0);
      setOriginalCost(total);
      setCurrentCost(total);
    }
    setLoading(false);
  }, [itineraryDays]);

  // Recalculate current cost whenever itinerary changes
  useEffect(() => {
    const newTotal = itinerary.reduce((sum, day) => {
      return sum + (day.activities || []).reduce((daySum, activity) => {
        return daySum + (activity.price || 0);
      }, 0);
    }, 0);
    setCurrentCost(newTotal);
  }, [itinerary]);

  const formatDateString = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'EEEE, dd/MM/yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'flight':
        return <Badge className="bg-blue-100 text-blue-800 border-none px-2 py-0.5 rounded">
          <Plane className="h-3 w-3 mr-1" /> טיסה
        </Badge>;
      case 'hotel':
        return <Badge className="bg-indigo-100 text-indigo-800 border-none px-2 py-0.5 rounded">
          <Hotel className="h-3 w-3 mr-1" /> מלון
        </Badge>;
      case 'attraction':
        return <Badge className="bg-green-100 text-green-600 border-none px-2 py-0.5 rounded">
          <MapPin className="h-3 w-3 mr-1" /> אטרקציה
        </Badge>;
      case 'restaurant':
        return <Badge className="bg-orange-100 text-orange-600 border-none px-2 py-0.5 rounded">
          <Utensils className="h-3 w-3 mr-1" /> מסעדה
        </Badge>;
      case 'transport':
        return <Badge className="bg-purple-100 text-purple-600 border-none px-2 py-0.5 rounded">
          <Car className="h-3 w-3 mr-1" /> תחבורה
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-none px-2 py-0.5 rounded">אחר</Badge>;
    }
  };

  const handleActivityClick = (activity) => {
    setOpenDialog(activity);
  };

  const handleUpdateActivity = (dayNumber, activityId, updatedActivity) => {
    setHasUnsavedChanges(true);
    const updatedItinerary = itinerary.map(day => {
      if (day.day_number === dayNumber) {
        const updatedActivities = day.activities.map(activity => {
          if ((activity.id && activity.id === activityId) || 
              (!activity.id && activity.time === activityId)) {
            return {...updatedActivity, id: activity.id || `temp-${Date.now()}`};
          }
          return activity;
        });
        return {...day, activities: updatedActivities};
      }
      return day;
    });
    setItinerary(updatedItinerary);
  };

  const handleDeleteActivity = (dayNumber, activityId) => {
    setHasUnsavedChanges(true);
    const updatedItinerary = itinerary.map(day => {
      if (day.day_number === dayNumber) {
        const updatedActivities = day.activities.filter(activity => {
          return (activity.id && activity.id !== activityId) || 
                (!activity.id && activity.time !== activityId);
        });
        return {...day, activities: updatedActivities};
      }
      return day;
    });
    setItinerary(updatedItinerary);
  };

  const handleAddActivity = () => {
    setHasUnsavedChanges(true);
    const updatedItinerary = itinerary.map(day => {
      if (day.day_number === activeDay) {
        // Create a new activity with a temporary ID
        const newActivityWithId = {
          ...newActivity,
          id: `temp-${Date.now()}`
        };
        
        // Add to activities and sort by time
        const updatedActivities = [...day.activities, newActivityWithId]
          .sort((a, b) => {
            // Convert time strings to comparable values (e.g., "09:30" -> 930)
            const timeA = parseInt(a.time.replace(':', ''));
            const timeB = parseInt(b.time.replace(':', ''));
            return timeA - timeB;
          });
        
        return {...day, activities: updatedActivities};
      }
      return day;
    });
    
    setItinerary(updatedItinerary);
    setIsAddingActivity(false);
    setNewActivity({
      time: "09:00",
      title: "",
      description: "",
      category: "attraction",
      location: { name: "" },
      price: 0
    });
  };

  const saveChanges = async () => {
    if (!tripId) {
      console.error("Cannot save changes: no trip ID provided");
      return;
    }

    setSavingChanges(true);
    try {
      // In a real app, you would update the itinerary on the server
      for (const day of itinerary) {
        await TripItinerary.update(day.id, {
          ...day,
          last_updated: new Date().toISOString()
        });
      }
      
      // Notify parent component to refresh data
      if (onUpdateItinerary) {
        await onUpdateItinerary();
      }
      
      setHasUnsavedChanges(false);
      alert("השינויים נשמרו בהצלחה!");
    } catch (error) {
      console.error("Error saving itinerary changes:", error);
      alert("אירעה שגיאה בשמירת השינויים. אנא נסה שוב מאוחר יותר.");
    } finally {
      setSavingChanges(false);
    }
  };

  // Helper to get day by number
  const getActiveDay = () => {
    return itinerary.find(day => day.day_number === activeDay) || null;
  };

  // Sample data
  const getSampleTripDays = () => [
    {
      id: "sample-day-1",
      day_number: 1,
      date: '2025-03-22',
      activities: [
        {
          id: "sample-activity-1",
          time: '09:00',
          title: 'טיסה לפריז',
          description: 'הגעה לפריז',
          category: 'flight',
          location: { name: 'שדה התעופה' },
          price: 250
        },
        {
          id: "sample-activity-2",
          time: '15:00',
          title: 'הגעה למלון',
          description: 'הגעה למלון Hôtel Louvre Richelieu',
          category: 'hotel',
          location: { name: 'Hôtel Louvre Richelieu' },
          price: 180
        },
        {
          id: "sample-activity-3",
          time: '17:00',
          title: 'טיול ליד הלובר',
          description: 'הליכה ליד הלובר',
          category: 'attraction',
          location: { name: 'הלובר' },
          price: 20
        },
        {
          id: "sample-activity-4",
          time: '19:00',
          title: 'קפה ופטיסירי ב-Pain de Sucre',
          description: 'קפה ופטיסרי ב-Pain de Sucre',
          category: 'restaurant',
          location: { name: 'Pain de Sucre' },
          price: 35
        }
      ]
    },
    {
      id: "sample-day-2",
      day_number: 2,
      date: '2025-03-23',
      activities: [
        {
          id: "sample-activity-5",
          time: '09:00',
          title: 'ארוחת בוקר במלון',
          description: 'ארוחת בוקר במלון',
          category: 'restaurant',
          location: { name: 'Hôtel Louvre Richelieu' },
          price: 0
        },
        {
          id: "sample-activity-6",
          time: '10:30',
          title: 'ביקור במוזיאון הלובר',
          description: 'ביקור במוזיאון הלובר, כולל המונה ליזה ויצירות מפתח נוספות',
          category: 'attraction',
          location: { name: 'מוזיאון הלובר' },
          price: 45
        }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* View mode selector and save changes */}
      <div className="flex justify-between items-center mb-4">
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList>
            <TabsTrigger value="timeline">
              <Clock className="h-4 w-4 ml-2" />
              צפייה כרונולוגית
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapPin className="h-4 w-4 ml-2" />
              צפייה במפה
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            {originalCost !== currentCost && (
              <div className={`text-sm flex items-center ${currentCost > originalCost ? 'text-amber-600' : 'text-green-600'}`}>
                <AlertTriangle className="h-4 w-4 ml-1" />
                {currentCost > originalCost 
                  ? `עלות חדשה: $${currentCost} (+ $${(currentCost - originalCost).toFixed(2)})`
                  : `עלות חדשה: $${currentCost} (- $${(originalCost - currentCost).toFixed(2)})`
                }
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm("שינויים שלא נשמרו יאבדו. האם להמשיך?")) {
                  // Reset itinerary to original
                  if (itineraryDays && itineraryDays.length > 0) {
                    setItinerary(itineraryDays);
                  } else {
                    setItinerary(getSampleTripDays());
                  }
                  setHasUnsavedChanges(false);
                }
              }}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              בטל שינויים
            </Button>
            
            <Button 
              onClick={saveChanges}
              disabled={savingChanges}
            >
              {savingChanges ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      
      <TabsContent value="timeline" className="mt-0">
        <div className="grid grid-cols-4 gap-6">
          {/* Left sidebar - days */}
          <div className="col-span-1">
            <div className="bg-gray-50 rounded-lg border p-4 sticky top-4">
              <h3 className="font-semibold mb-4">פריז</h3>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4 ml-1.5" />
                22/03/2025 - 31/03/2025
              </div>
              
              <div className="space-y-2">
                {itinerary.map((day) => (
                  <div
                    key={day.day_number}
                    className={`
                      p-2 rounded-md cursor-pointer transition-all
                      ${activeDay === day.day_number 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'hover:bg-gray-100'}
                    `}
                    onClick={() => setActiveDay(day.day_number)}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 ml-2" />
                      יום {day.day_number}
                      <Badge className="mr-auto" variant="secondary">
                        {day.activities?.length || 0}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex mt-6 gap-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Copy className="h-4 w-4 ml-2" />
                  העתק
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Printer className="h-4 w-4 ml-2" />
                  הדפס
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main content - itinerary */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg border p-6">
              {/* Active day header */}
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    יום {activeDay}: {getActiveDay()?.date ? formatDateString(getActiveDay().date) : ''}
                  </h3>
                  <Button onClick={() => setIsAddingActivity(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף פעילות
                  </Button>
                </div>
                
                {/* Add new activity form */}
                {isAddingActivity && (
                  <Card className="mt-4">
                    <CardContent className="pt-6">
                      <EditableTimelineItem
                        activity={newActivity}
                        dayNumber={activeDay}
                        onUpdate={(dayNumber, activityId, updatedActivity) => {
                          handleAddActivity();
                        }}
                        onDelete={() => setIsAddingActivity(false)}
                        isEditing={true}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Activities list */}
              {getActiveDay()?.activities.map((activity, index) => (
                <EditableTimelineItem
                  key={activity.id || `${activity.time}-${index}`}
                  activity={activity}
                  dayNumber={activeDay}
                  onUpdate={handleUpdateActivity}
                  onDelete={handleDeleteActivity}
                />
              ))}
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="map" className="mt-0">
        <ItineraryMapView 
          itinerary={itinerary}
          activeDay={activeDay}
          onDayChange={setActiveDay}
        />
      </TabsContent>
    </div>
  );
}