import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plane,
  Hotel,
  MapPin,
  Coffee,
  Car,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

export default function EditableTimelineItem({ 
  activity, 
  onUpdate, 
  onDelete, 
  dayNumber, 
  isEditing = false 
}) {
  const [isEditable, setIsEditable] = useState(isEditing);
  const [editedActivity, setEditedActivity] = useState({...activity});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showPriceWarning, setShowPriceWarning] = useState(false);
  
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
          <Coffee className="h-3 w-3 mr-1" /> מסעדה
        </Badge>;
      case 'transport':
        return <Badge className="bg-purple-100 text-purple-600 border-none px-2 py-0.5 rounded">
          <Car className="h-3 w-3 mr-1" /> תחבורה
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-none px-2 py-0.5 rounded">אחר</Badge>;
    }
  };
  
  const handleSave = () => {
    onUpdate(dayNumber, activity.id || activity.time, editedActivity);
    setIsEditable(false);
    setShowPriceWarning(false);
  };
  
  const handleCancel = () => {
    setEditedActivity({...activity});
    setIsEditable(false);
    setShowPriceWarning(false);
  };
  
  const handlePriceChange = (value) => {
    const newPrice = parseFloat(value);
    if (newPrice !== activity.price) {
      setShowPriceWarning(true);
    } else {
      setShowPriceWarning(false);
    }
    setEditedActivity({...editedActivity, price: newPrice});
  };
  
  const confirmDelete = () => {
    onDelete(dayNumber, activity.id || activity.time);
    setIsDeleteDialogOpen(false);
  };
  
  if (isEditable) {
    return (
      <div className="relative mt-8 first:mt-0">
        <div className="flex items-start">
          {/* Time circle */}
          <div className="relative mr-4">
            <div className="absolute top-0 left-0 -ml-[9px] h-full w-[2px] bg-gray-200"></div>
            <div className="relative z-10 flex items-center justify-center w-5 h-5 text-xs bg-white border-2 border-blue-500 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          
          {/* Time and content */}
          <div className="flex-1 pt-0.5">
            <div className="flex items-center">
              <div className="text-sm font-medium text-gray-500 w-16">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      {editedActivity.time || "בחר שעה"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker
                      setTime={(time) => 
                        setEditedActivity({...editedActivity, time})
                      }
                      initTime={editedActivity.time}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Card className="flex-1 p-4 bg-white border rounded-lg shadow-sm ml-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">כותרת</label>
                      <Input
                        value={editedActivity.title || ''}
                        onChange={(e) => 
                          setEditedActivity({...editedActivity, title: e.target.value})
                        }
                        placeholder="כותרת הפעילות"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">קטגוריה</label>
                      <Select
                        value={editedActivity.category || 'attraction'}
                        onValueChange={(value) => 
                          setEditedActivity({...editedActivity, category: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר קטגוריה" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flight">טיסה</SelectItem>
                          <SelectItem value="hotel">מלון</SelectItem>
                          <SelectItem value="attraction">אטרקציה</SelectItem>
                          <SelectItem value="restaurant">מסעדה</SelectItem>
                          <SelectItem value="transport">תחבורה</SelectItem>
                          <SelectItem value="other">אחר</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">תיאור</label>
                    <Textarea
                      value={editedActivity.description || ''}
                      onChange={(e) => 
                        setEditedActivity({...editedActivity, description: e.target.value})
                      }
                      placeholder="תיאור הפעילות"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">מיקום</label>
                      <Input
                        value={editedActivity.location?.name || ''}
                        onChange={(e) => 
                          setEditedActivity({
                            ...editedActivity, 
                            location: {...(editedActivity.location || {}), name: e.target.value}
                          })
                        }
                        placeholder="שם המקום"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">מחיר מוערך</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="number"
                          value={editedActivity.price || ''}
                          onChange={(e) => handlePriceChange(e.target.value)}
                          placeholder="מחיר"
                          className="pl-8"
                        />
                      </div>
                      {showPriceWarning && (
                        <div className="text-xs text-amber-600 flex items-center mt-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          שינוי מחיר ישפיע על העלות הכוללת של הטיול
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4 ml-1" />
                      ביטול
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                    >
                      <Check className="h-4 w-4 ml-1" />
                      שמור
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative mt-8 first:mt-0">
      <div className="flex items-start">
        {/* Time circle */}
        <div className="relative mr-4">
          <div className="absolute top-0 left-0 -ml-[9px] h-full w-[2px] bg-gray-200"></div>
          <div className="relative z-10 flex items-center justify-center w-5 h-5 text-xs bg-white border-2 border-blue-500 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        
        {/* Time and content */}
        <div className="flex-1 pt-0.5">
          <div className="flex items-center">
            <div className="text-sm font-medium text-gray-500 w-16">
              {activity.time}
            </div>
            
            <div className="flex-1 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium mb-1">{activity.title}</div>
                  <div className="text-sm text-gray-600">{activity.description}</div>
                  
                  {activity.location && activity.location.name && (
                    <div className="flex items-center mt-2 text-sm text-blue-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="underline">{activity.location.name}</span>
                    </div>
                  )}
                  
                  {activity.price && (
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <DollarSign className="h-3 w-3 mr-1" />
                      <span>${activity.price}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {getCategoryBadge(activity.category)}
                  
                  <div className="flex gap-1 mt-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsEditable(true)}
                      className="h-7 w-7"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>האם למחוק פעילות זו?</DialogTitle>
            <DialogDescription>
              פעולה זו אינה ניתנת לביטול. האם אתה בטוח שברצונך למחוק את הפעילות "{activity.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              מחק פעילות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}