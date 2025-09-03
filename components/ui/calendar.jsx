"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { he } from 'date-fns/locale';
import { format, addDays, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, isAfter, isBefore } from 'date-fns';
import { cn } from "@/components/utils";
import { Button } from "@/components/ui/button";

function Calendar({ 
  className, 
  selected, 
  onSelect, 
  disabled, 
  initialFocus,
  month,
  onMonthChange,
  ...props 
}) {
  const [currentMonth, setCurrentMonth] = React.useState(month || new Date());

  React.useEffect(() => {
    if (month) {
      setCurrentMonth(month);
    }
  }, [month]);

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    if (onMonthChange) {
      onMonthChange(newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    if (onMonthChange) {
      onMonthChange(newMonth);
    }
  };

  const handleDayClick = (day) => {
    if (onSelect) {
      onSelect(day);
    }
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handlePrevMonth}
        className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <h2 className="text-sm font-medium">
        {format(currentMonth, 'MMMM yyyy', { locale: he })}
      </h2>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleNextMonth}
        className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderDays = () => {
    const weekdaysShort = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    return (
      <div className="flex w-full">
        {weekdaysShort.map((day, index) => (
          <div key={index} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center flex-1">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        days.push(
          <div 
            key={day.toString()}
            className={cn(
              "text-center text-sm p-0 relative flex-1",
              isSameMonth(day, monthStart) ? "" : "text-muted-foreground opacity-50"
            )}
          >
            <Button
              variant="ghost"
              className={cn(
                "h-9 w-9 p-0 font-normal",
                isToday(day) && "bg-accent text-accent-foreground",
                selected && isSameDay(day, selected) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                !isSameMonth(day, monthStart) && "text-muted-foreground opacity-50",
                disabled && disabled(day) && "text-muted-foreground opacity-50 pointer-events-none"
              )}
              disabled={disabled && disabled(day)}
              onClick={() => isSameMonth(cloneDay, monthStart) && handleDayClick(cloneDay)}
            >
              {format(day, 'd')}
            </Button>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="flex w-full mt-2">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className={cn("p-3", className)} {...props}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
export default Calendar;