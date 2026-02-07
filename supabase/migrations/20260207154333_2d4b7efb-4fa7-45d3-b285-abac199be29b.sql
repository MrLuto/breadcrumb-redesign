-- Fix: Orders Table Exposes Sensitive Customer Data via Token
-- Solution: Reduce token validity from 7 days to 48 hours and create a safer view

-- Step 1: Drop existing token-based policies
DROP POLICY IF EXISTS "Orders viewable with valid confirmation token" ON public.orders;
DROP POLICY IF EXISTS "Order items viewable with valid order token" ON public.order_items;
DROP POLICY IF EXISTS "Order item options viewable with valid order token" ON public.order_item_options;

-- Step 2: Create new policies with 48-hour validity window (instead of 7 days)
CREATE POLICY "Orders viewable with valid confirmation token"
ON public.orders FOR SELECT
USING (
  confirmation_token IS NOT NULL
  AND confirmation_token = COALESCE(
    (current_setting('request.headers'::text, true)::json->>'x-confirmation-token'),
    ''
  )
  AND created_at > (now() - interval '48 hours')
);

CREATE POLICY "Order items viewable with valid order token"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.id = order_items.order_id
      AND o.confirmation_token IS NOT NULL
      AND o.confirmation_token = COALESCE(
        (current_setting('request.headers'::text, true)::json->>'x-confirmation-token'),
        ''
      )
      AND o.created_at > (now() - interval '48 hours')
  )
);

CREATE POLICY "Order item options viewable with valid order token"
ON public.order_item_options FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_options.order_item_id
      AND o.confirmation_token IS NOT NULL
      AND o.confirmation_token = COALESCE(
        (current_setting('request.headers'::text, true)::json->>'x-confirmation-token'),
        ''
      )
      AND o.created_at > (now() - interval '48 hours')
  )
);