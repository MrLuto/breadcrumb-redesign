import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator';
  created_at: string;
  email?: string;
}

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // First get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Then get user emails from a secure edge function
      const { data: usersData, error: usersError } = await supabase.functions.invoke('get-admin-users');
      
      if (usersError) {
        console.error('Error fetching admin users:', usersError);
        // Return roles without emails if the function fails
        return roles as AdminUser[];
      }

      // Merge email data with roles
      const usersMap = new Map(usersData?.users?.map((u: any) => [u.id, u.email]) || []);
      
      return roles.map((role) => ({
        ...role,
        email: usersMap.get(role.user_id) || 'Onbekend',
      })) as AdminUser[];
    },
  });
};

export const useRemoveAdminRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('remove-admin', {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Admin verwijderd',
        description: 'De admin rechten zijn ingetrokken.',
      });
    },
    onError: (error) => {
      console.error('Error removing admin:', error);
      toast({
        title: 'Fout bij verwijderen',
        description: error instanceof Error ? error.message : 'Er is iets misgegaan.',
        variant: 'destructive',
      });
    },
  });
};
