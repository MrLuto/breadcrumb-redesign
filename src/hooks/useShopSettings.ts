import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShopSettings {
  delivery_cost: number;
  free_delivery_threshold: number;
  min_preparation_time_minutes: number;
  pickup_address: string;
}

const DEFAULT_SETTINGS: ShopSettings = {
  delivery_cost: 4,
  free_delivery_threshold: 40,
  min_preparation_time_minutes: 60,
  pickup_address: 'Ons Adres 123, 1234 AB Plaats',
};

export function useShopSettings() {
  return useQuery({
    queryKey: ['shop-settings'],
    queryFn: async (): Promise<ShopSettings> => {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('key, value');

      if (error) {
        console.error('Error fetching shop settings:', error);
        return DEFAULT_SETTINGS;
      }

      const settings = { ...DEFAULT_SETTINGS };
      
      data?.forEach((row) => {
        const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        switch (row.key) {
          case 'delivery_cost':
            settings.delivery_cost = parseFloat(value);
            break;
          case 'free_delivery_threshold':
            settings.free_delivery_threshold = parseFloat(value);
            break;
          case 'min_preparation_time_minutes':
            settings.min_preparation_time_minutes = parseInt(value);
            break;
          case 'pickup_address':
            settings.pickup_address = value;
            break;
        }
      });

      return settings;
    },
  });
}

export function calculateDeliveryCost(subtotal: number, settings: ShopSettings): number {
  if (subtotal >= settings.free_delivery_threshold) {
    return 0;
  }
  return settings.delivery_cost;
}
