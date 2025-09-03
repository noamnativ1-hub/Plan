import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/components/utils';

export function TimePicker({ setTime, initTime, className }) {
  // Generate hours and minutes
  const hours = Array.from({ length: 24 }, (_, i) => 
    i < 10 ? `0${i}` : `${i}`
  );
  
  const minutes = ['00', '15', '30', '45'];
  
  // Parse initial time
  const parseInitTime = () => {
    if (!initTime) return { hour: '09', minute: '00' };
    
    try {
      const [hour, minute] = initTime.split(':');
      return {
        hour: hour || '09',
        minute: minute || '00'
      };
    } catch (e) {
      return { hour: '09', minute: '00' };
    }
  };
  
  const [selectedTime, setSelectedTime] = useState(parseInitTime());
  
  const handleHourClick = (hour) => {
    const newTime = { ...selectedTime, hour };
    setSelectedTime(newTime);
    setTime(`${newTime.hour}:${newTime.minute}`);
  };
  
  const handleMinuteClick = (minute) => {
    const newTime = { ...selectedTime, minute };
    setSelectedTime(newTime);
    setTime(`${newTime.hour}:${newTime.minute}`);
  };
  
  return (
    <div className={cn('flex p-2 space-x-2 border rounded-md', className)}>
      {/* Hours */}
      <div className="pr-2">
        <div className="text-sm font-medium mb-2 text-center">שעה</div>
        <ScrollArea className="h-52 w-16">
          <div className="flex flex-col space-y-1 p-1">
            {hours.map((hour) => (
              <Button
                key={hour}
                variant={selectedTime.hour === hour ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleHourClick(hour)}
              >
                {hour}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Minutes */}
      <div className="pl-2 border-l">
        <div className="text-sm font-medium mb-2 text-center">דקות</div>
        <div className="flex flex-col space-y-1 p-1">
          {minutes.map((minute) => (
            <Button
              key={minute}
              variant={selectedTime.minute === minute ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMinuteClick(minute)}
            >
              {minute}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}