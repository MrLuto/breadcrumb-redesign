-- Add confirmation token column for secure order access
ALTER TABLE public.orders ADD COLUMN confirmation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- Drop the insecure 24-hour access policy
DROP POLICY IF EXISTS "Recent orders viewable for confirmation" ON public.orders;
DROP POLICY IF EXISTS "Order items viewable for recent orders" ON public.order_items;

-- Create a secure function to verify order access via token
-- This function checks if the provided token matches the order's confirmation_token
CREATE OR REPLACE FUNCTION public.verify_order_token(order_id UUID, token TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
      AND o.confirmation_token = token
      AND o.confirmation_token IS NOT NULL
  )
$$;

-- Create policy for order access via token (passed as header)
CREATE POLICY "Orders viewable with valid confirmation token"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (
    confirmation_token IS NOT NULL AND
    confirmation_token = COALESCE(
      current_setting('request.headers', true)::json->>'x-confirmation-token',
      ''
    )
  );

-- Create policy for order items access (linked to orders with valid token)
CREATE POLICY "Order items viewable with valid order token"
  ON public.order_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.confirmation_token IS NOT NULL
        AND o.confirmation_token = COALESCE(
          current_setting('request.headers', true)::json->>'x-confirmation-token',
          ''
        )
    )
  );

-- Ensure existing orders have confirmation tokens
UPDATE public.orders 
SET confirmation_token = encode(gen_random_bytes(32), 'hex')
WHERE confirmation_token IS NULL;