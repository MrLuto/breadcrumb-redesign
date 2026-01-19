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
        // Handle both JSON-stringified and raw values
        let value = row.value;
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if not valid JSON
          }
        }
        
        switch (row.key) {
          case 'delivery_cost':
            settings.delivery_cost = parseFloat(String(value)) || 4;
            break;
          case 'free_delivery_threshold':
            settings.free_delivery_threshold = parseFloat(String(value)) || 40;
            break;
          case 'min_preparation_time_minutes':
            settings.min_preparation_time_minutes = parseInt(String(value)) || 60;
            break;
          case 'pickup_address':
            settings.pickup_address = String(value);
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
