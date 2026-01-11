import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DeliveryZone {
  id: string;
  postcode_prefix: string;
  zone_name: string;
  delivery_cost: number;
  is_active: boolean;
  min_order_amount: number | null;
  created_at: string;
  updated_at: string;
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('postcode_prefix', { ascending: true });

      if (error) throw error;
      return data as DeliveryZone[];
    },
  });
}

export function useActiveDeliveryZones() {
  return useQuery({
    queryKey: ['delivery-zones', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true)
        .order('postcode_prefix', { ascending: true });

      if (error) throw error;
      return data as DeliveryZone[];
    },
  });
}

export function useDeliveryZoneMutations() {
  const queryClient = useQueryClient();

  const createZone = useMutation({
    mutationFn: async (zone: Omit<DeliveryZone, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .insert([zone])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast({ title: 'Bezorgzone toegevoegd' });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast({ title: 'Deze postcode bestaat al', variant: 'destructive' });
      } else {
        toast({ title: 'Fout bij toevoegen', variant: 'destructive' });
      }
    },
  });

  const updateZone = useMutation({
    mutationFn: async ({ id, ...zone }: Partial<DeliveryZone> & { id: string }) => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .update(zone)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast({ title: 'Bezorgzone bijgewerkt' });
    },
    onError: () => {
      toast({ title: 'Fout bij bijwerken', variant: 'destructive' });
    },
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast({ title: 'Bezorgzone verwijderd' });
    },
    onError: () => {
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    },
  });

  return { createZone, updateZone, deleteZone };
}

export function getDeliveryZoneForPostcode(zones: DeliveryZone[] | undefined, postcode: string): DeliveryZone | null {
  if (!zones || !postcode) return null;
  
  // Extract the 4-digit prefix from postcode
  const prefix = postcode.replace(/\s/g, '').substring(0, 4);
  
  return zones.find(zone => zone.postcode_prefix === prefix && zone.is_active) || null;
}