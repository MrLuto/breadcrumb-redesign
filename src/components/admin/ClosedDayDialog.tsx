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
import { ClosedDay, RecurrenceType, getDayName, getMonthName } from '@/hooks/useClosedDays';

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

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maart' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Augustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const RECURRENCE_TYPES = [
  { value: 'none', label: 'Eenmalig (specifieke datum)' },
  { value: 'weekly', label: 'Wekelijks (elke week dezelfde dag)' },
  { value: 'monthly', label: 'Maandelijks (elke maand dezelfde dag)' },
  { value: 'yearly', label: 'Jaarlijks (elk jaar dezelfde datum)' },
];

export function ClosedDayDialog({ open, onOpenChange, onSave, closedDay }: ClosedDayDialogProps) {
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [reason, setReason] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (closedDay) {
      setRecurrenceType(closedDay.recurrence_type);
      setDayOfWeek(closedDay.day_of_week);
      setDayOfMonth(closedDay.day_of_month);
      setMonth(closedDay.month);
      setDate(closedDay.date ? new Date(closedDay.date) : undefined);
      setReason(closedDay.reason);
      setIsActive(closedDay.is_active);
    } else {
      setRecurrenceType('none');
      setDayOfWeek(null);
      setDayOfMonth(null);
      setMonth(null);
      setDate(undefined);
      setReason('');
      setIsActive(true);
    }
  }, [closedDay, open]);

  const handleSave = () => {
    const data: Omit<ClosedDay, 'id' | 'created_at' | 'updated_at'> = {
      recurrence_type: recurrenceType,
      is_recurring: recurrenceType !== 'none',
      day_of_week: recurrenceType === 'weekly' ? dayOfWeek : null,
      day_of_month: recurrenceType === 'monthly' || recurrenceType === 'yearly' ? dayOfMonth : null,
      month: recurrenceType === 'yearly' ? month : null,
      date: recurrenceType === 'none' && date ? format(date, 'yyyy-MM-dd') : null,
      reason,
      is_active: isActive,
    };

    onSave(data);
    onOpenChange(false);
  };

  const isValid = () => {
    if (!reason.trim()) return false;
    
    switch (recurrenceType) {
      case 'none':
        return date !== undefined;
      case 'weekly':
        return dayOfWeek !== null;
      case 'monthly':
        return dayOfMonth !== null;
      case 'yearly':
        return dayOfMonth !== null && month !== null;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {closedDay ? 'Gesloten dag bewerken' : 'Nieuwe gesloten dag'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recurrence type */}
          <div className="space-y-2">
            <Label>Type herhaling</Label>
            <Select
              value={recurrenceType}
              onValueChange={(val) => setRecurrenceType(val as RecurrenceType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer type" />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fields based on recurrence type */}
          {recurrenceType === 'none' && (
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

          {recurrenceType === 'weekly' && (
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
          )}

          {recurrenceType === 'monthly' && (
            <div className="space-y-2">
              <Label>Dag van de maand</Label>
              <Select
                value={dayOfMonth?.toString() ?? ''}
                onValueChange={(val) => setDayOfMonth(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een dag" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}e
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {recurrenceType === 'yearly' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dag van de maand</Label>
                <Select
                  value={dayOfMonth?.toString() ?? ''}
                  onValueChange={(val) => setDayOfMonth(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een dag" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Maand</Label>
                <Select
                  value={month?.toString() ?? ''}
                  onValueChange={(val) => setMonth(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een maand" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reden</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bijv. Kerst, Koningsdag, Vakantie, etc."
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
          <Button onClick={handleSave} disabled={!isValid()}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}