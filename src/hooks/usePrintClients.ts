import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PrintClient {
  id: string;
  machine_id: string;
  desktop_name: string;
  is_active: boolean;
  printer_name: string;
  paper_width_mm: number;
  margin_mm: number;
  auto_print: boolean;
  poll_interval_seconds: number;
  copies: number;
  print_template: string;
  available_printers: string[];
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePrintClients() {
  return useQuery({
    queryKey: ['print-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('print_clients')
        .select('*')
        .order('desktop_name');
      if (error) throw error;
      return data as PrintClient[];
    },
  });
}

export function useUpdatePrintClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PrintClient> & { id: string }) => {
      const { error } = await supabase
        .from('print_clients')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-clients'] });
    },
  });
}

export function useDeletePrintClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('print_clients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-clients'] });
    },
  });
}
