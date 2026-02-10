import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderItemOption = Database['public']['Tables']['order_item_options']['Row'];
type OrderStatus = Database['public']['Enums']['order_status_type'];
type PaymentStatus = Database['public']['Enums']['payment_status_type'];

export type OrderItemWithOptions = OrderItem & {
  order_item_options: OrderItemOption[];
};

export type OrderWithItems = Order & {
  order_items: OrderItemWithOptions[];
};

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'new', label: 'Nieuw', color: 'bg-blue-500' },
  { value: 'confirmed', label: 'Bevestigd', color: 'bg-cyan-500' },
  { value: 'preparing', label: 'In bereiding', color: 'bg-yellow-500' },
  { value: 'out_for_delivery', label: 'Onderweg', color: 'bg-orange-500' },
  { value: 'delivered', label: 'Bezorgd', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Geannuleerd', color: 'bg-red-500' },
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'In afwachting', color: 'bg-yellow-500' },
  { value: 'paid', label: 'Betaald', color: 'bg-green-500' },
  { value: 'invoiced', label: 'Gefactureerd', color: 'bg-blue-500' },
  { value: 'refunded', label: 'Terugbetaald', color: 'bg-red-500' },
];

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrderWithItems[];
    },
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as OrderWithItems;
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Status bijgewerkt',
        description: 'De bestelstatus is succesvol gewijzigd.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is iets misgegaan bij het bijwerken van de status.',
        variant: 'destructive',
      });
      console.error('Update order status error:', error);
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PaymentStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Betaalstatus bijgewerkt',
        description: 'De betaalstatus is succesvol gewijzigd.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is iets misgegaan bij het bijwerken van de betaalstatus.',
        variant: 'destructive',
      });
      console.error('Update payment status error:', error);
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Bestelling verwijderd',
        description: 'De bestelling is succesvol verwijderd.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is iets misgegaan bij het verwijderen van de bestelling.',
        variant: 'destructive',
      });
      console.error('Delete order error:', error);
    },
  });
}
