import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Clock } from 'lucide-react';
import { addMinutes, format, isToday, parse, isBefore } from 'date-fns';

interface DeliveryTimeInputProps {
  selectedDate: Date | undefined;
  deliveryAsap: boolean;
  deliveryTime: string;
  minPrepTimeMinutes: number;
  onAsapChange: (asap: boolean) => void;
  onTimeChange: (time: string) => void;
  error?: string;
}

export function DeliveryTimeInput({
  selectedDate,
  deliveryAsap,
  deliveryTime,
  minPrepTimeMinutes,
  onAsapChange,
  onTimeChange,
  error,
}: DeliveryTimeInputProps) {
  const [timeError, setTimeError] = useState<string | null>(null);

  // Calculate earliest possible time
  const getEarliestTime = () => {
    const now = new Date();
    const earliest = addMinutes(now, minPrepTimeMinutes);
    return format(earliest, 'HH:mm');
  };

  // Validate time when it changes
  useEffect(() => {
    if (!deliveryAsap && deliveryTime && selectedDate && isToday(selectedDate)) {
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
  }, [deliveryTime, deliveryAsap, selectedDate, minPrepTimeMinutes]);

  const handleAsapChange = (checked: boolean) => {
    onAsapChange(checked);
    if (checked) {
      onTimeChange('');
      setTimeError(null);
    }
  };

  const handleTimeChange = (value: string) => {
    onTimeChange(value);
    if (value) {
      onAsapChange(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ASAP Option */}
      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 border">
        <Checkbox
          id="delivery-asap"
          checked={deliveryAsap}
          onCheckedChange={handleAsapChange}
        />
        <div className="flex-1">
          <Label htmlFor="delivery-asap" className="cursor-pointer font-medium">
            Zo snel mogelijk bezorgen
          </Label>
          {deliveryAsap && selectedDate && isToday(selectedDate) && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Vroegst mogelijke tijd: {getEarliestTime()}
            </p>
          )}
        </div>
      </div>

      {/* Manual Time Input */}
      <div className="space-y-2">
        <Label htmlFor="delivery-time">Of kies een specifieke tijd</Label>
        <Input
          id="delivery-time"
          type="time"
          value={deliveryTime}
          onChange={(e) => handleTimeChange(e.target.value)}
          disabled={deliveryAsap}
          min={selectedDate && isToday(selectedDate) ? getEarliestTime() : undefined}
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
        {selectedDate && isToday(selectedDate) && !deliveryAsap && !timeError && (
          <p className="text-sm text-muted-foreground">
            Minimale voorbereidingstijd: {minPrepTimeMinutes} minuten
          </p>
        )}
      </div>
    </div>
  );
}
