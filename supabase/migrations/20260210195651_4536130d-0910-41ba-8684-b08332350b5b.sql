-- Allow admins to delete print clients
CREATE POLICY "Admins can delete print clients"
  ON public.print_clients FOR DELETE
  USING (is_admin(auth.uid()));
