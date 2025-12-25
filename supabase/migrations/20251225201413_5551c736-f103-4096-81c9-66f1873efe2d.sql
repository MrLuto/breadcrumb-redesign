-- Remove public RLS policies from ip_postcodes table
-- Edge functions use service_role which bypasses RLS

DROP POLICY IF EXISTS "Anyone can read ip_postcodes" ON public.ip_postcodes;
DROP POLICY IF EXISTS "Anyone can insert ip_postcodes" ON public.ip_postcodes;
DROP POLICY IF EXISTS "Anyone can update ip_postcodes" ON public.ip_postcodes;