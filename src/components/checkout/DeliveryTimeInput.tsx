import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { addMinutes, addDays, format, isToday, isBefore, getMinutes, getHours } from 'date-fns';
import { OpeningHour, isWithinOpeningHours } from '@/hooks/useOpeningHours';

interface DeliveryTimeInputProps {
  selectedDate: Date | undefined;
  deliveryTime: string;
  minPrepTimeMinutes: number;
  onTimeChange: (time: string) => void;
  onDateChange?: (date: Date) => void;
  error?: string;
  openingHours?: OpeningHour[];
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
  openingHours,
}: DeliveryTimeInputProps) {
  const [timeError, setTimeError] = useState<string | null>(null);

  // Get opening hours for selected date
  const dayOpeningHours = useMemo(() => {
    if (!selectedDate || !openingHours) return null;
    const dayOfWeek = selectedDate.getDay();
    return openingHours.find((h) => h.day_of_week === dayOfWeek) || null;
  }, [selectedDate, openingHours]);

  // Parse opening/closing times
  const openingMinutes = useMemo(() => {
    if (!dayOpeningHours || dayOpeningHours.is_closed) return null;
    const [h, m] = dayOpeningHours.open_time.split(':').map(Number);
    return h * 60 + m;
  }, [dayOpeningHours]);

  const closingMinutes = useMemo(() => {
    if (!dayOpeningHours || dayOpeningHours.is_closed) return null;
    const [h, m] = dayOpeningHours.close_time.split(':').map(Number);
    return h * 60 + m;
  }, [dayOpeningHours]);

  // Check if a time is within opening hours
  const isWithinOpeningHoursCheck = useCallback((h: number, m: number) => {
    if (!dayOpeningHours || dayOpeningHours.is_closed) return false;
    if (openingMinutes === null || closingMinutes === null) return true;
    const timeInMinutes = h * 60 + m;
    return timeInMinutes >= openingMinutes && timeInMinutes <= closingMinutes;
  }, [dayOpeningHours, openingMinutes, closingMinutes]);
  const { hours, minutes } = parseTime(deliveryTime);

  // Get minimum time for today (considering both prep time and opening hours)
  const getMinTime = useCallback(() => {
    // For non-today, use opening time if available
    if (!selectedDate || !isToday(selectedDate)) {
      if (openingMinutes !== null) {
        return { hours: Math.floor(openingMinutes / 60), minutes: openingMinutes % 60 };
      }
      return { hours: 0, minutes: 0 };
    }
    
    // For today, use the later of: earliest prep time OR opening time
    const earliest = getEarliestTime(minPrepTimeMinutes);
    const earliestInMinutes = earliest.hours * 60 + earliest.minutes;
    
    if (openingMinutes !== null && openingMinutes > earliestInMinutes) {
      return { hours: Math.floor(openingMinutes / 60), minutes: openingMinutes % 60 };
    }
    
    return earliest;
  }, [selectedDate, minPrepTimeMinutes, openingMinutes]);

  // Check if a time is valid (prep time + opening hours)
  const isTimeValid = useCallback((h: number, m: number) => {
    const timeInMinutes = h * 60 + m;
    
    // Check against opening hours
    if (openingMinutes !== null && closingMinutes !== null) {
      if (timeInMinutes < openingMinutes || timeInMinutes > closingMinutes) {
        return false;
      }
    }
    
    // Check against minimum prep time for today
    if (selectedDate && isToday(selectedDate)) {
      const minTime = getEarliestTime(minPrepTimeMinutes);
      const minTimeInMinutes = minTime.hours * 60 + minTime.minutes;
      if (timeInMinutes < minTimeInMinutes) {
        return false;
      }
    }
    
    return true;
  }, [selectedDate, minPrepTimeMinutes, openingMinutes, closingMinutes]);

  // Set initial time on mount and when date/opening hours change
  useEffect(() => {
    if (selectedDate) {
      // Always recalculate when date or opening hours change
      const minTime = getMinTime();
      const minInMinutes = minTime.hours * 60 + minTime.minutes;
      const roundedMinutes = Math.ceil(minInMinutes / 15) * 15;
      const roundedHours = Math.floor(roundedMinutes / 60);
      const roundedMins = roundedMinutes % 60;
      
      if (!deliveryTime) {
        // No time set yet, initialize it
        onTimeChange(formatTime(roundedHours, roundedMins));
      } else {
        // Time is set, but check if it's still valid
        const { hours: currentH, minutes: currentM } = parseTime(deliveryTime);
        if (!isTimeValid(currentH, currentM)) {
          onTimeChange(formatTime(roundedHours, roundedMins));
        }
      }
    }
  }, [selectedDate, openingHours]);

  // Re-calculate when minPrepTimeMinutes or opening hours change
  useEffect(() => {
    if (selectedDate && deliveryTime) {
      const { hours: currentH, minutes: currentM } = parseTime(deliveryTime);
      if (!isTimeValid(currentH, currentM)) {
        const minTime = getMinTime();
        const minInMinutes = minTime.hours * 60 + minTime.minutes;
        const roundedMinutes = Math.ceil(minInMinutes / 15) * 15;
        const roundedHours = Math.floor(roundedMinutes / 60);
        const roundedMins = roundedMinutes % 60;
        onTimeChange(formatTime(roundedHours, roundedMins));
      }
    }
  }, [minPrepTimeMinutes, openingHours, selectedDate]);

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
    if (deliveryTime && selectedDate) {
      if (!isTimeValid(hours, minutes)) {
        // Determine the reason for invalidity
        if (dayOpeningHours?.is_closed) {
          setTimeError('Winkel is gesloten op deze dag');
        } else if (openingMinutes !== null && closingMinutes !== null) {
          const timeInMinutes = hours * 60 + minutes;
          if (timeInMinutes < openingMinutes || timeInMinutes > closingMinutes) {
            const openTime = dayOpeningHours?.open_time.substring(0, 5) || '';
            const closeTime = dayOpeningHours?.close_time.substring(0, 5) || '';
            setTimeError(`Kies een tijd tussen ${openTime} en ${closeTime}`);
          } else if (isToday(selectedDate)) {
            setTimeError(`Tijd moet minimaal ${minPrepTimeMinutes} minuten in de toekomst zijn`);
          } else {
            setTimeError(null);
          }
        } else if (isToday(selectedDate)) {
          setTimeError(`Tijd moet minimaal ${minPrepTimeMinutes} minuten in de toekomst zijn`);
        } else {
          setTimeError(null);
        }
      } else {
        setTimeError(null);
      }
    } else {
      setTimeError(null);
    }
  }, [deliveryTime, selectedDate, minPrepTimeMinutes, hours, minutes, isTimeValid, dayOpeningHours, openingMinutes, closingMinutes]);

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
    const newTimeInMinutes = newHours * 60 + minutes;
    const minTimeInMinutes = minTime.hours * 60 + minTime.minutes;
    
    // Prevent going below minimum time or opening hours
    if (newTimeInMinutes < minTimeInMinutes) {
      return;
    }
    
    // Also check against opening hours
    if (openingMinutes !== null && newTimeInMinutes < openingMinutes) {
      return;
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
    
    // Check against closing hours
    const newTimeInMinutes = newHours * 60 + newMinutes;
    if (closingMinutes !== null && newTimeInMinutes > closingMinutes) {
      // Don't exceed closing time
      return;
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
    
    // Prevent going below minimum time or opening hours
    const minTime = getMinTime();
    const newTimeInMinutes = newHours * 60 + newMinutes;
    const minTimeInMinutes = minTime.hours * 60 + minTime.minutes;
    
    if (newTimeInMinutes < minTimeInMinutes) {
      return;
    }
    
    // Also check against opening hours
    if (openingMinutes !== null && newTimeInMinutes < openingMinutes) {
      return;
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

      {/* Hint for time constraints */}
      {selectedDate && !timeError && (
        <p className="text-sm text-muted-foreground text-center">
          {dayOpeningHours && !dayOpeningHours.is_closed && (
            <>Openingstijden: {dayOpeningHours.open_time.substring(0, 5)} - {dayOpeningHours.close_time.substring(0, 5)}</>
          )}
          {isToday(selectedDate) && (
            <> • Min. voorbereidingstijd: {minPrepTimeMinutes} min</>
          )}
        </p>
      )}
    </div>
  );
}
