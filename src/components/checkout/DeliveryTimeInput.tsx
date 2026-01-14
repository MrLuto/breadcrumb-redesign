import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { addMinutes, format, isToday, parse, isBefore, setMinutes, setHours, getMinutes, getHours } from 'date-fns';

interface DeliveryTimeInputProps {
  selectedDate: Date | undefined;
  deliveryTime: string;
  minPrepTimeMinutes: number;
  onTimeChange: (time: string) => void;
  error?: string;
}

// Round up to next quarter hour
const roundToNextQuarter = (date: Date): Date => {
  const minutes = getMinutes(date);
  const remainder = minutes % 15;
  
  if (remainder === 0) {
    // Already on a quarter, go to next one
    return addMinutes(date, 15);
  }
  
  // Round up to next quarter
  const minutesToAdd = 15 - remainder;
  return addMinutes(date, minutesToAdd);
};

// Get the earliest possible time (now + prep time, rounded to next quarter)
const getEarliestTime = (minPrepTimeMinutes: number): Date => {
  const now = new Date();
  const earliest = addMinutes(now, minPrepTimeMinutes);
  return roundToNextQuarter(earliest);
};

// Format time as HH:mm string
const formatTimeString = (date: Date): string => {
  return format(date, 'HH:mm');
};

export function DeliveryTimeInput({
  selectedDate,
  deliveryTime,
  minPrepTimeMinutes,
  onTimeChange,
  error,
}: DeliveryTimeInputProps) {
  const [timeError, setTimeError] = useState<string | null>(null);

  // Calculate and set default time on mount and when date changes
  const updateDefaultTime = useCallback(() => {
    if (!selectedDate) return;
    
    if (isToday(selectedDate)) {
      const earliestTime = getEarliestTime(minPrepTimeMinutes);
      const newTimeString = formatTimeString(earliestTime);
      
      // Only update if current time is invalid or empty
      if (!deliveryTime) {
        onTimeChange(newTimeString);
      } else {
        // Check if current time is still valid
        const currentTime = parse(deliveryTime, 'HH:mm', selectedDate);
        const now = new Date();
        const minTime = addMinutes(now, minPrepTimeMinutes);
        
        if (isBefore(currentTime, minTime)) {
          onTimeChange(newTimeString);
        }
      }
    }
  }, [selectedDate, minPrepTimeMinutes, deliveryTime, onTimeChange]);

  // Set initial time on mount
  useEffect(() => {
    if (selectedDate && !deliveryTime) {
      if (isToday(selectedDate)) {
        const earliestTime = getEarliestTime(minPrepTimeMinutes);
        onTimeChange(formatTimeString(earliestTime));
      } else {
        // For future dates, default to 10:00
        onTimeChange('10:00');
      }
    }
  }, []);

  // Auto-update time every minute to keep it valid (only for today)
  useEffect(() => {
    if (!selectedDate || !isToday(selectedDate)) return;

    const interval = setInterval(() => {
      updateDefaultTime();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [selectedDate, updateDefaultTime]);

  // Update time when date changes to today
  useEffect(() => {
    if (selectedDate && isToday(selectedDate)) {
      updateDefaultTime();
    }
  }, [selectedDate]);

  // Validate time when it changes
  useEffect(() => {
    if (deliveryTime && selectedDate && isToday(selectedDate)) {
      const now = new Date();
      const selectedTime = parse(deliveryTime, 'HH:mm', selectedDate);
      const earliestTime = addMinutes(now, minPrepTimeMinutes);

      if (isBefore(selectedTime, earliestTime)) {
        setTimeError(`Tijd moet minimaal ${minPrepTimeMinutes} minuten in de toekomst zijn`);
      } else {
        setTimeError(null);
      }
    } else {
      setTimeError(null);
    }
  }, [deliveryTime, selectedDate, minPrepTimeMinutes]);

  const handleTimeChange = (value: string) => {
    onTimeChange(value);
  };

  // Get min time attribute for the input
  const getMinTime = (): string | undefined => {
    if (!selectedDate || !isToday(selectedDate)) return undefined;
    const earliestTime = getEarliestTime(minPrepTimeMinutes);
    return formatTimeString(earliestTime);
  };

  return (
    <div className="space-y-2">
      <Input
        id="delivery-time"
        type="time"
        value={deliveryTime}
        onChange={(e) => handleTimeChange(e.target.value)}
        min={getMinTime()}
        step="900" // 15 minute steps
        className={timeError ? 'border-destructive' : ''}
      />
      
      {/* Time validation error */}
      {(timeError || error) && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {timeError || error}
        </p>
      )}

      {/* Hint for today */}
      {selectedDate && isToday(selectedDate) && !timeError && (
        <p className="text-sm text-muted-foreground">
          Minimale voorbereidingstijd: {minPrepTimeMinutes} minuten
        </p>
      )}
    </div>
  );
}
