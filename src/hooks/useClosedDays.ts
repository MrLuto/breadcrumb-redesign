import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type RecurrenceType = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface ClosedDay {
  id: string;
  date: string | null;
  day_of_week: number | null;
  day_of_month: number | null;
  month: number | null;
  reason: string;
  is_recurring: boolean;
  recurrence_type: RecurrenceType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useClosedDays() {
  return useQuery({
    queryKey: ['closed-days'],
    queryFn: async (): Promise<ClosedDay[]> => {
      const { data, error } = await supabase
        .from('closed_days')
        .select('*')
        .order('is_recurring', { ascending: false })
        .order('day_of_week', { ascending: true })
        .order('date', { ascending: true });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        recurrence_type: d.recurrence_type as RecurrenceType
      }));
    },
  });
}

export function useActiveClosedDays() {
  return useQuery({
    queryKey: ['closed-days', 'active'],
    queryFn: async (): Promise<ClosedDay[]> => {
      const { data, error } = await supabase
        .from('closed_days')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        recurrence_type: d.recurrence_type as RecurrenceType
      }));
    },
  });
}

export function useClosedDaysMutations() {
  const queryClient = useQueryClient();

  const createClosedDay = useMutation({
    mutationFn: async (closedDay: Omit<ClosedDay, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('closed_days')
        .insert(closedDay)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closed-days'] });
      toast({
        title: 'Gesloten dag toegevoegd',
        description: 'De gesloten dag is succesvol opgeslagen.',
      });
    },
    onError: (error) => {
      console.error('Error creating closed day:', error);
      toast({
        title: 'Fout',
        description: 'Kon gesloten dag niet toevoegen.',
        variant: 'destructive',
      });
    },
  });

  const updateClosedDay = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClosedDay> & { id: string }) => {
      const { data, error } = await supabase
        .from('closed_days')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closed-days'] });
      toast({
        title: 'Gesloten dag bijgewerkt',
        description: 'De wijzigingen zijn opgeslagen.',
      });
    },
    onError: (error) => {
      console.error('Error updating closed day:', error);
      toast({
        title: 'Fout',
        description: 'Kon gesloten dag niet bijwerken.',
        variant: 'destructive',
      });
    },
  });

  const deleteClosedDay = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('closed_days')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closed-days'] });
      toast({
        title: 'Gesloten dag verwijderd',
        description: 'De gesloten dag is verwijderd.',
      });
    },
    onError: (error) => {
      console.error('Error deleting closed day:', error);
      toast({
        title: 'Fout',
        description: 'Kon gesloten dag niet verwijderen.',
        variant: 'destructive',
      });
    },
  });

  return {
    createClosedDay,
    updateClosedDay,
    deleteClosedDay,
  };
}

// Helper function to check if a date is closed
export function isDateClosed(date: Date, closedDays: ClosedDay[]): { isClosed: boolean; reason?: string } {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = date.getDate(); // 1-31
  const month = date.getMonth() + 1; // 1-12
  const dateString = date.toISOString().split('T')[0];

  for (const closedDay of closedDays) {
    if (!closedDay.is_active) continue;

    // Check one-time closure (specific date)
    if (closedDay.recurrence_type === 'none' && closedDay.date === dateString) {
      return { isClosed: true, reason: closedDay.reason };
    }

    // Check weekly recurring (e.g., every Sunday)
    if (closedDay.recurrence_type === 'weekly' && closedDay.day_of_week === dayOfWeek) {
      return { isClosed: true, reason: closedDay.reason };
    }

    // Check monthly recurring (e.g., every 1st of the month)
    if (closedDay.recurrence_type === 'monthly' && closedDay.day_of_month === dayOfMonth) {
      return { isClosed: true, reason: closedDay.reason };
    }

    // Check yearly recurring (e.g., every December 25th)
    if (closedDay.recurrence_type === 'yearly' && 
        closedDay.day_of_month === dayOfMonth && 
        closedDay.month === month) {
      return { isClosed: true, reason: closedDay.reason };
    }
  }

  return { isClosed: false };
}

// Get month name in Dutch
export function getMonthName(month: number): string {
  const months = ['', 'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 
                  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
  return months[month] || '';
}

// Get day name in Dutch
export function getDayName(dayOfWeek: number): string {
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  return days[dayOfWeek] || '';
}
