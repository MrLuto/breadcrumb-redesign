-- Fix get_user_company_id to use empty search_path for consistency with other SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT company_id
  FROM public.customer_profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;