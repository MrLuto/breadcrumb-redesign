import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type CustomerProfile = Database['public']['Tables']['customer_profiles']['Row'];

export function useAllCustomerProfiles() {
  return useQuery({
    queryKey: ['admin-customer-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerProfile[];
    },
  });
}
