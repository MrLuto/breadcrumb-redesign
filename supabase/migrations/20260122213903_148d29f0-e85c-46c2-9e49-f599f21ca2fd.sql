-- Add documentation comment to rate_limits table explaining its security design
-- This table intentionally has RLS enabled with no policies to block all client access
-- Edge functions use service_role key which bypasses RLS for legitimate access
COMMENT ON TABLE public.rate_limits IS 'Internal rate limiting table - no public access by design. Edge functions access via service_role key which bypasses RLS. Client-side access is intentionally blocked.';

-- Add documentation to product-images bucket (via function comment)
COMMENT ON FUNCTION public.is_admin IS 'Security definer function to check if a user has admin role. Used by RLS policies and protected routes.';

COMMENT ON FUNCTION public.has_role IS 'Security definer function to check if a user has a specific role. Used by RLS policies to avoid infinite recursion.';