import { AlertTriangle } from 'lucide-react';
import { useOpeningHours } from '@/hooks/useOpeningHours';
import { useActiveClosedDays, isDateClosed } from '@/hooks/useClosedDays';

const ClosedTodayBanner = () => {
  const { data: openingHours, isLoading: loadingHours } = useOpeningHours();
  const { data: closedDays, isLoading: loadingClosed } = useActiveClosedDays();

  if (loadingHours || loadingClosed) return null;

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
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Vandaag zijn wij gesloten{reason !== 'Gesloten' ? ` (${reason})` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClosedTodayBanner;