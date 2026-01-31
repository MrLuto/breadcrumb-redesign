import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from './useCategories';

interface PopularCategory extends Category {
  order_count: number;
}

export function usePopularCategories(limit: number = 3) {
  return useQuery({
    queryKey: ['popular-categories', limit],
    queryFn: async (): Promise<PopularCategory[]> => {
      // First, get order items with product info to determine popular categories
      // We need to count how many times products from each category were ordered
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          product_id,
          products!inner (
            category_id
          )
        `)
        .not('products.category_id', 'is', null);

      if (orderError) {
        console.error('Error fetching order items:', orderError);
        // Fall back to regular categories if order data fails
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(limit);
        
        return (categories || []).map(c => ({ ...c, order_count: 0 }));
      }

      // Count orders per category
      const categoryOrderCounts: Record<string, number> = {};
      
      if (orderItems) {
        for (const item of orderItems) {
          const categoryId = (item.products as any)?.category_id;
          if (categoryId) {
            categoryOrderCounts[categoryId] = (categoryOrderCounts[categoryId] || 0) + item.quantity;
          }
        }
      }

      // Get all active categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);

      if (catError) throw catError;

      // If we have order data, sort by popularity; otherwise by display_order
      const hasOrderData = Object.keys(categoryOrderCounts).length > 0;
      
      const categoriesWithCounts = (categories || []).map(cat => ({
        ...cat,
        order_count: categoryOrderCounts[cat.id] || 0,
      }));

      if (hasOrderData) {
        // Sort by order count (descending), then by display_order
        categoriesWithCounts.sort((a, b) => {
          if (b.order_count !== a.order_count) {
            return b.order_count - a.order_count;
          }
          return a.display_order - b.display_order;
        });
      } else {
        // No order data yet, sort by display_order
        categoriesWithCounts.sort((a, b) => a.display_order - b.display_order);
      }

      return categoriesWithCounts.slice(0, limit);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Check if there are any orders in the system
export function useHasOrders() {
  return useQuery({
    queryKey: ['has-orders'],
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error checking orders:', error);
        return false;
      }

      return (count || 0) > 0;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}
