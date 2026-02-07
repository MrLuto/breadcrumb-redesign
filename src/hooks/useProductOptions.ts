import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProductOptionGroup {
  id: string;
  product_id: string | null;
  category_id: string | null;
  name: string;
  description: string | null;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: ProductOption[];
}

export interface ProductOption {
  id: string;
  option_group_id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SelectedOption {
  optionGroupId: string;
  optionGroupName: string;
  optionId: string;
  optionName: string;
  priceAdjustment: number;
}

// Fetch option groups for a specific product (includes product-specific and category-wide)
export function useProductOptionGroups(productId: string | undefined, categoryId: string | undefined) {
  return useQuery({
    queryKey: ['product-option-groups', productId, categoryId],
    queryFn: async () => {
      if (!productId && !categoryId) return [];

      // Build OR conditions for product-specific and category-wide option groups
      let query = supabase
        .from('product_option_groups')
        .select(`
          *,
          options:product_options(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (productId && categoryId) {
        query = query.or(`product_id.eq.${productId},category_id.eq.${categoryId}`);
      } else if (productId) {
        query = query.eq('product_id', productId);
      } else if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort options within each group
      return (data as ProductOptionGroup[]).map(group => ({
        ...group,
        options: (group.options || [])
          .filter(opt => opt.is_available)
          .sort((a, b) => a.display_order - b.display_order)
      }));
    },
    enabled: !!productId || !!categoryId,
  });
}

// Admin: Fetch all option groups (with admin permissions)
export function useAllOptionGroups() {
  return useQuery({
    queryKey: ['admin-option-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_option_groups')
        .select(`
          *,
          options:product_options(*),
          product:products(id, name),
          category:categories(id, name)
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as (ProductOptionGroup & { 
        product: { id: string; name: string } | null;
        category: { id: string; name: string } | null;
      })[];
    },
  });
}

// Admin: Option group mutations
export function useOptionGroupMutations() {
  const queryClient = useQueryClient();

  const createOptionGroup = useMutation({
    mutationFn: async (group: Omit<ProductOptionGroup, 'id' | 'created_at' | 'updated_at' | 'options'>) => {
      const { data, error } = await supabase
        .from('product_option_groups')
        .insert([group])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-option-groups'] });
      queryClient.invalidateQueries({ queryKey: ['product-option-groups'] });
      toast({ title: 'Optiegroep toegevoegd' });
    },
    onError: () => {
      toast({ title: 'Fout bij toevoegen', variant: 'destructive' });
    },
  });

  const updateOptionGroup = useMutation({
    mutationFn: async ({ id, ...group }: Partial<ProductOptionGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_option_groups')
        .update(group)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-option-groups'] });
      queryClient.invalidateQueries({ queryKey: ['product-option-groups'] });
      toast({ title: 'Optiegroep bijgewerkt' });
    },
    onError: () => {
      toast({ title: 'Fout bij bijwerken', variant: 'destructive' });
    },
  });

  const deleteOptionGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_option_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-option-groups'] });
      queryClient.invalidateQueries({ queryKey: ['product-option-groups'] });
      toast({ title: 'Optiegroep verwijderd' });
    },
    onError: () => {
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    },
  });

  return { createOptionGroup, updateOptionGroup, deleteOptionGroup };
}

// Admin: Option mutations
export function useOptionMutations() {
  const queryClient = useQueryClient();

  const createOption = useMutation({
    mutationFn: async (option: Omit<ProductOption, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('product_options')
        .insert([option])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-option-groups'] });
      queryClient.invalidateQueries({ queryKey: ['product-option-groups'] });
      toast({ title: 'Optie toegevoegd' });
    },
    onError: () => {
      toast({ title: 'Fout bij toevoegen', variant: 'destructive' });
    },
  });

  const updateOption = useMutation({
    mutationFn: async ({ id, ...option }: Partial<ProductOption> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_options')
        .update(option)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-option-groups'] });
      queryClient.invalidateQueries({ queryKey: ['product-option-groups'] });
      toast({ title: 'Optie bijgewerkt' });
    },
    onError: () => {
      toast({ title: 'Fout bij bijwerken', variant: 'destructive' });
    },
  });

  const deleteOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-option-groups'] });
      queryClient.invalidateQueries({ queryKey: ['product-option-groups'] });
      toast({ title: 'Optie verwijderd' });
    },
    onError: () => {
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    },
  });

  return { createOption, updateOption, deleteOption };
}
