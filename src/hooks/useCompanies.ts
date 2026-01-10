import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Company = Database['public']['Tables']['companies']['Row'];
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Company[];
    },
  });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Company;
    },
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (company: CompanyInsert) => {
      const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: 'Bedrijf aangemaakt',
        description: 'Het bedrijf is succesvol toegevoegd.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is iets misgegaan bij het aanmaken van het bedrijf.',
        variant: 'destructive',
      });
      console.error('Create company error:', error);
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...company }: CompanyUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('companies')
        .update(company)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: 'Bedrijf bijgewerkt',
        description: 'Het bedrijf is succesvol bijgewerkt.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is iets misgegaan bij het bijwerken van het bedrijf.',
        variant: 'destructive',
      });
      console.error('Update company error:', error);
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: 'Bedrijf verwijderd',
        description: 'Het bedrijf is succesvol verwijderd.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is iets misgegaan bij het verwijderen van het bedrijf.',
        variant: 'destructive',
      });
      console.error('Delete company error:', error);
    },
  });
}
