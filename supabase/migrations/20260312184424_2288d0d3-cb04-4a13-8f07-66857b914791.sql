-- Allow admins to read all customer profiles
CREATE POLICY "Admins can view all customer profiles"
ON public.customer_profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to update customer profiles
CREATE POLICY "Admins can update all customer profiles"
ON public.customer_profiles FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));