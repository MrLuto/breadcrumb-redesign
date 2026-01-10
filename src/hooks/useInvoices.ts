import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceStatus = Database['public']['Enums']['invoice_status_type'];

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Concept', color: 'bg-gray-500' },
  { value: 'sent', label: 'Verzonden', color: 'bg-blue-500' },
  { value: 'paid', label: 'Betaald', color: 'bg-green-500' },
  { value: 'overdue', label: 'Verlopen', color: 'bg-red-500' },
  { value: 'cancelled', label: 'Geannuleerd', color: 'bg-gray-400' },
];

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!id,
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const updates: Partial<Invoice> = { status };
      
      // Auto-set timestamps based on status
      if (status === 'sent') {
        updates.sent_at = new Date().toISOString();
      } else if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Status bijgewerkt',
        description: 'De factuurstatus is succesvol gewijzigd.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is iets misgegaan bij het bijwerken van de status.',
        variant: 'destructive',
      });
      console.error('Update invoice status error:', error);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Factuur verwijderd',
        description: 'De factuur is succesvol verwijderd.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is iets misgegaan bij het verwijderen van de factuur.',
        variant: 'destructive',
      });
      console.error('Delete invoice error:', error);
    },
  });
}
