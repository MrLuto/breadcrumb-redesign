import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useOpeningHours } from '@/hooks/useOpeningHours';
import { useActiveClosedDays, isDateClosed } from '@/hooks/useClosedDays';
import { Button } from '@/components/ui/button';

const ClosedTodayBanner = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: openingHours, isLoading: loadingHours } = useOpeningHours();
  const { data: closedDays, isLoading: loadingClosed } = useActiveClosedDays();

  if (loadingHours || loadingClosed || isDismissed) return null;

  const today = new Date();
  const dayOfWeek = today.getDay();

  // Check regular opening hours
  const todayHours = openingHours?.find((h) => h.day_of_week === dayOfWeek);
  const isRegularClosed = todayHours?.is_closed ?? false;

  // Check special closed days
  const closedDayResult = closedDays ? isDateClosed(today, closedDays) : { isClosed: false };

  const isClosed = isRegularClosed || closedDayResult.isClosed;

  if (!isClosed) return null;

  const reason = closedDayResult.reason || 'Gesloten';

  return (
    <div className="bg-destructive text-destructive-foreground">
      <div className="container py-2">
        <div className="flex items-center justify-center gap-2 text-sm font-medium relative">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Vandaag zijn wij gesloten{reason !== 'Gesloten' ? ` (${reason})` : ''}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 h-6 w-6 hover:bg-destructive-foreground/10 text-destructive-foreground"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClosedTodayBanner;