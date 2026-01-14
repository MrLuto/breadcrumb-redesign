import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface CustomerProfile {
  id: string;
  user_id: string;
  customer_type: 'private' | 'business';
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  delivery_address: string | null;
  postcode: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustomerProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer-profile', user?.id],
    queryFn: async (): Promise<CustomerProfile | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching customer profile:', error);
        return null;
      }

      return data as CustomerProfile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<CustomerProfile>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('customer_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      toast({
        title: 'Profiel bijgewerkt',
        description: 'Je gegevens zijn opgeslagen.',
      });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast({
        title: 'Fout',
        description: 'Kon profiel niet bijwerken.',
        variant: 'destructive',
      });
    },
  });
}

export function useCustomerOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['customer-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
