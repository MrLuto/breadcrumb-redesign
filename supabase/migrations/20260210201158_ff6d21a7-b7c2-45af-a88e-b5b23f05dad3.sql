
-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Admins can manage print clients" ON public.print_clients;
DROP POLICY IF EXISTS "Admins can delete print clients" ON public.print_clients;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage print clients"
  ON public.print_clients
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
