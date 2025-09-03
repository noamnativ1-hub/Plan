import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function TimePickerDemo({
  value,
  onChange,
  className,
}) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [time, setTime] = React.useState(value || "12:00");

  // Parse hours and minutes from the time string
  const [hours, minutes] = time.split(':').map(Number);

  // Handle hour changes
  const handleHoursChange = (e) => {
    const newHours = parseInt(e.target.value) || 0;
    const clampedHours = Math.max(0, Math.min(23, newHours));
    setTime(`${clampedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  // Handle minute changes
  const handleMinutesChange = (e) => {
    const newMinutes = parseInt(e.target.value) || 0;
    const clampedMinutes = Math.max(0, Math.min(59, newMinutes));
    setTime(`${hours.toString().padStart(2, '0')}:${clampedMinutes.toString().padStart(2, '0')}`);
  };

  // Apply time change
  const handleApply = () => {
    if (onChange) {
      onChange(time);
    }
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-[110px] justify-start text-left font-normal", className)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs text-center">שעות</span>
              <Input
                type="number"
                min={0}
                max={23}
                value={hours}
                onChange={handleHoursChange}
                className="w-16 text-center"
              />
            </div>
            <div className="text-xl">:</div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs text-center">דקות</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={handleMinutesChange}
                className="w-16 text-center"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleApply}>
              אישור
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}