import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClosedDay, getDayName } from '@/hooks/useClosedDays';

interface ClosedDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (closedDay: Omit<ClosedDay, 'id' | 'created_at' | 'updated_at'>) => void;
  closedDay?: ClosedDay | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Zondag' },
  { value: 1, label: 'Maandag' },
  { value: 2, label: 'Dinsdag' },
  { value: 3, label: 'Woensdag' },
  { value: 4, label: 'Donderdag' },
  { value: 5, label: 'Vrijdag' },
  { value: 6, label: 'Zaterdag' },
];

export function ClosedDayDialog({ open, onOpenChange, onSave, closedDay }: ClosedDayDialogProps) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [reason, setReason] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (closedDay) {
      setIsRecurring(closedDay.is_recurring);
      setDayOfWeek(closedDay.day_of_week);
      setDate(closedDay.date ? new Date(closedDay.date) : undefined);
      setReason(closedDay.reason);
      setIsActive(closedDay.is_active);
    } else {
      setIsRecurring(false);
      setDayOfWeek(null);
      setDate(undefined);
      setReason('');
      setIsActive(true);
    }
  }, [closedDay, open]);

  const handleSave = () => {
    const data: Omit<ClosedDay, 'id' | 'created_at' | 'updated_at'> = {
      is_recurring: isRecurring,
      day_of_week: isRecurring ? dayOfWeek : null,
      date: !isRecurring && date ? format(date, 'yyyy-MM-dd') : null,
      reason,
      is_active: isActive,
    };

    onSave(data);
    onOpenChange(false);
  };

  const isValid = reason.trim() && (isRecurring ? dayOfWeek !== null : date !== undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {closedDay ? 'Gesloten dag bewerken' : 'Nieuwe gesloten dag'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recurring toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is-recurring">Terugkerend (wekelijks)</Label>
            <Switch
              id="is-recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Day of week or specific date */}
          {isRecurring ? (
            <div className="space-y-2">
              <Label>Dag van de week</Label>
              <Select
                value={dayOfWeek?.toString() ?? ''}
                onValueChange={(val) => setDayOfWeek(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een dag" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: nl }) : 'Selecteer een datum'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={nl}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reden</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bijv. Vakantie, Feestdag, etc."
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is-active">Actief</Label>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
