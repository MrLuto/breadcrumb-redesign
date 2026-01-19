import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OpeningHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

const DAY_NAMES = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

export const getDayName = (dayOfWeek: number): string => {
  return DAY_NAMES[dayOfWeek] || '';
};

export const useOpeningHours = () => {
  return useQuery({
    queryKey: ['opening-hours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opening_hours')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return data as OpeningHour[];
    },
  });
};

export const useUpdateOpeningHour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      open_time,
      close_time,
      is_closed,
    }: {
      id: string;
      open_time: string;
      close_time: string;
      is_closed: boolean;
    }) => {
      // Ensure time format includes seconds (HH:MM:SS)
      const formatTime = (time: string) => {
        const parts = time.split(':');
        if (parts.length === 2) {
          return `${parts[0]}:${parts[1]}:00`;
        }
        return time;
      };
      
      const { data, error } = await supabase
        .from('opening_hours')
        .update({ 
          open_time: formatTime(open_time), 
          close_time: formatTime(close_time), 
          is_closed 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opening-hours'] });
      toast({
        title: 'Openingstijd bijgewerkt',
        description: 'De openingstijd is succesvol opgeslagen.',
      });
    },
    onError: (error) => {
      console.error('Error updating opening hour:', error);
      toast({
        title: 'Fout bij opslaan',
        description: 'Er is iets misgegaan. Probeer het opnieuw.',
        variant: 'destructive',
      });
    },
  });
};

// Helper function to check if a specific time is within opening hours
export const isWithinOpeningHours = (
  openingHours: OpeningHour[] | undefined,
  date: Date,
  time: string
): { isOpen: boolean; openTime?: string; closeTime?: string; isClosed?: boolean } => {
  if (!openingHours) return { isOpen: true };

  const dayOfWeek = date.getDay();
  const dayHours = openingHours.find((h) => h.day_of_week === dayOfWeek);

  if (!dayHours) return { isOpen: true };
  if (dayHours.is_closed) return { isOpen: false, isClosed: true };

  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;

  const [openHours, openMinutes] = dayHours.open_time.split(':').map(Number);
  const openInMinutes = openHours * 60 + openMinutes;

  const [closeHours, closeMinutes] = dayHours.close_time.split(':').map(Number);
  const closeInMinutes = closeHours * 60 + closeMinutes;

  const isOpen = timeInMinutes >= openInMinutes && timeInMinutes <= closeInMinutes;

  return {
    isOpen,
    openTime: dayHours.open_time,
    closeTime: dayHours.close_time,
  };
};
