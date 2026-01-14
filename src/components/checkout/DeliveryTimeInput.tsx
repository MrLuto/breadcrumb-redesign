import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { addMinutes, addDays, format, isToday, isBefore, getMinutes, getHours } from 'date-fns';

interface DeliveryTimeInputProps {
  selectedDate: Date | undefined;
  deliveryTime: string;
  minPrepTimeMinutes: number;
  onTimeChange: (time: string) => void;
  onDateChange?: (date: Date) => void;
  error?: string;
}

// Round up to next quarter hour
const roundToNextQuarter = (date: Date): Date => {
  const minutes = getMinutes(date);
  const remainder = minutes % 15;
  
  if (remainder === 0) {
    return addMinutes(date, 15);
  }
  
  const minutesToAdd = 15 - remainder;
  return addMinutes(date, minutesToAdd);
};

// Get the earliest possible time (now + prep time, rounded to next quarter)
const getEarliestTime = (minPrepTimeMinutes: number): { hours: number; minutes: number } => {
  const now = new Date();
  const earliest = addMinutes(now, minPrepTimeMinutes);
  const rounded = roundToNextQuarter(earliest);
  return { hours: getHours(rounded), minutes: getMinutes(rounded) };
};

// Parse HH:mm string to hours and minutes
const parseTime = (timeString: string): { hours: number; minutes: number } => {
  if (!timeString) return { hours: 10, minutes: 0 };
  const [h, m] = timeString.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
};

// Format hours and minutes to HH:mm string
const formatTime = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export function DeliveryTimeInput({
  selectedDate,
  deliveryTime,
  minPrepTimeMinutes,
  onTimeChange,
  onDateChange,
  error,
}: DeliveryTimeInputProps) {
  const [timeError, setTimeError] = useState<string | null>(null);
  const { hours, minutes } = parseTime(deliveryTime);

  // Get minimum time for today
  const getMinTime = useCallback(() => {
    if (!selectedDate || !isToday(selectedDate)) {
      return { hours: 0, minutes: 0 };
    }
    return getEarliestTime(minPrepTimeMinutes);
  }, [selectedDate, minPrepTimeMinutes]);

  // Check if a time is valid
  const isTimeValid = useCallback((h: number, m: number) => {
    if (!selectedDate || !isToday(selectedDate)) return true;
    const minTime = getMinTime();
    const timeInMinutes = h * 60 + m;
    const minTimeInMinutes = minTime.hours * 60 + minTime.minutes;
    return timeInMinutes >= minTimeInMinutes;
  }, [selectedDate, getMinTime]);

  // Set initial time on mount
  useEffect(() => {
    if (selectedDate && !deliveryTime) {
      if (isToday(selectedDate)) {
        const earliest = getEarliestTime(minPrepTimeMinutes);
        onTimeChange(formatTime(earliest.hours, earliest.minutes));
      } else {
        onTimeChange('10:00');
      }
    }
  }, []);

  // Auto-update time every minute to keep it valid (only for today)
  useEffect(() => {
    if (!selectedDate || !isToday(selectedDate)) return;

    const checkAndUpdateTime = () => {
      if (!isTimeValid(hours, minutes)) {
        const earliest = getEarliestTime(minPrepTimeMinutes);
        onTimeChange(formatTime(earliest.hours, earliest.minutes));
      }
    };

    const interval = setInterval(checkAndUpdateTime, 60000);
    return () => clearInterval(interval);
  }, [selectedDate, hours, minutes, minPrepTimeMinutes, onTimeChange, isTimeValid]);

  // Update time when date changes to today
  useEffect(() => {
    if (selectedDate && isToday(selectedDate) && !isTimeValid(hours, minutes)) {
      const earliest = getEarliestTime(minPrepTimeMinutes);
      onTimeChange(formatTime(earliest.hours, earliest.minutes));
    }
  }, [selectedDate]);

  // Validate time when it changes
  useEffect(() => {
    if (deliveryTime && selectedDate && isToday(selectedDate)) {
      if (!isTimeValid(hours, minutes)) {
        setTimeError(`Tijd moet minimaal ${minPrepTimeMinutes} minuten in de toekomst zijn`);
      } else {
        setTimeError(null);
      }
    } else {
      setTimeError(null);
    }
  }, [deliveryTime, selectedDate, minPrepTimeMinutes, hours, minutes, isTimeValid]);

  const incrementHours = () => {
    if (hours >= 23) {
      // Wrap to next day
      if (selectedDate && onDateChange) {
        const nextDay = addDays(selectedDate, 1);
        onDateChange(nextDay);
        onTimeChange(formatTime(0, minutes));
      } else {
        onTimeChange(formatTime(0, minutes));
      }
    } else {
      onTimeChange(formatTime(hours + 1, minutes));
    }
  };

  const decrementHours = () => {
    const newHours = hours <= 0 ? 23 : hours - 1;
    const minTime = getMinTime();
    
    // Prevent going below minimum time for today
    if (selectedDate && isToday(selectedDate)) {
      if (newHours < minTime.hours || (newHours === minTime.hours && minutes < minTime.minutes)) {
        return;
      }
    }
    
    onTimeChange(formatTime(newHours, minutes));
  };

  const incrementMinutes = () => {
    let newMinutes = minutes + 15;
    let newHours = hours;
    
    if (newMinutes >= 60) {
      newMinutes = 0;
      if (newHours >= 23) {
        // Wrap to next day
        if (selectedDate && onDateChange) {
          const nextDay = addDays(selectedDate, 1);
          onDateChange(nextDay);
          onTimeChange(formatTime(0, newMinutes));
          return;
        } else {
          newHours = 0;
        }
      } else {
        newHours = hours + 1;
      }
    }
    
    onTimeChange(formatTime(newHours, newMinutes));
  };

  const decrementMinutes = () => {
    let newMinutes = minutes - 15;
    let newHours = hours;
    
    if (newMinutes < 0) {
      newMinutes = 45;
      newHours = hours <= 0 ? 23 : hours - 1;
    }
    
    // Prevent going below minimum time for today
    if (selectedDate && isToday(selectedDate)) {
      const minTime = getMinTime();
      const newTimeInMinutes = newHours * 60 + newMinutes;
      const minTimeInMinutes = minTime.hours * 60 + minTime.minutes;
      
      if (newTimeInMinutes < minTimeInMinutes) {
        return;
      }
    }
    
    const newTime = formatTime(newHours, newMinutes);
    onTimeChange(newTime);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4">
        {/* Hours Counter */}
        <div className="flex flex-col items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-14 rounded-b-none border-b-0"
            onClick={incrementHours}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <input
            type="text"
            inputMode="numeric"
            value={hours.toString().padStart(2, '0')}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              const num = Math.min(23, Math.max(0, parseInt(val) || 0));
              onTimeChange(formatTime(num, minutes));
            }}
            onFocus={(e) => e.target.select()}
            className="h-14 w-14 text-center bg-muted border text-2xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={2}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-14 rounded-t-none border-t-0"
            onClick={decrementHours}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Separator */}
        <span className="text-3xl font-bold text-muted-foreground">:</span>

        {/* Minutes Counter */}
        <div className="flex flex-col items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-14 rounded-b-none border-b-0"
            onClick={incrementMinutes}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <input
            type="text"
            inputMode="numeric"
            value={minutes.toString().padStart(2, '0')}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              const num = Math.min(59, Math.max(0, parseInt(val) || 0));
              onTimeChange(formatTime(hours, num));
            }}
            onFocus={(e) => e.target.select()}
            className="h-14 w-14 text-center bg-muted border text-2xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={2}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-14 rounded-t-none border-t-0"
            onClick={decrementMinutes}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Time validation error */}
      {(timeError || error) && (
        <p className="text-sm text-destructive flex items-center justify-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {timeError || error}
        </p>
      )}

      {/* Hint for today */}
      {selectedDate && isToday(selectedDate) && !timeError && (
        <p className="text-sm text-muted-foreground text-center">
          Minimale voorbereidingstijd: {minPrepTimeMinutes} minuten
        </p>
      )}
    </div>
  );
}
