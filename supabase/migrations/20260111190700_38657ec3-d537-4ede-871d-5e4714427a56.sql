-- 1. Add RLS policies for rate_limits table (system-only access via service role)
-- rate_limits should only be accessible by edge functions using service role key
CREATE POLICY "No public access to rate_limits"
ON public.rate_limits
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 2. Add RLS policies for ip_postcodes table
CREATE POLICY "No public access to ip_postcodes"
ON public.ip_postcodes
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 3. Drop overly permissive INSERT policies for orders and order_items
-- These tables are now managed via edge function with service role
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- 4. Add token expiration check to orders SELECT policy
-- Tokens are only valid for 7 days after order creation
DROP POLICY IF EXISTS "Orders viewable with valid confirmation token" ON public.orders;
CREATE POLICY "Orders viewable with valid confirmation token"
ON public.orders
FOR SELECT
USING (
  confirmation_token IS NOT NULL
  AND confirmation_token = COALESCE(
    (current_setting('request.headers'::text, true)::json->>'x-confirmation-token'),
    ''
  )
  AND created_at > (now() - interval '7 days')
);

-- 5. Update order_items SELECT policy with token expiration
DROP POLICY IF EXISTS "Order items viewable with valid order token" ON public.order_items;
CREATE POLICY "Order items viewable with valid order token"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.confirmation_token IS NOT NULL
      AND o.confirmation_token = COALESCE(
        (current_setting('request.headers'::text, true)::json->>'x-confirmation-token'),
        ''
      )
      AND o.created_at > (now() - interval '7 days')
  )
);

-- 6. Update SECURITY DEFINER functions to use empty search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- 7. Update verify_order_token function with expiration check and empty search_path
CREATE OR REPLACE FUNCTION public.verify_order_token(order_id UUID, token TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
      AND o.confirmation_token = token
      AND o.confirmation_token IS NOT NULL
      AND o.created_at > (now() - interval '7 days')
  )
$$;

-- 8. Update cleanup function with empty search_path
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 hour';
END;
$$;