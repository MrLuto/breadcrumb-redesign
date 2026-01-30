-- Documentation for RLS confirmation token requirement
-- The orders and order_items tables use Row-Level Security policies that require
-- a valid confirmation token passed via the x-confirmation-token HTTP header.
--
-- SECURITY DESIGN:
-- - Orders can be viewed by admins (is_admin check)
-- - Orders can be viewed by the user who placed them (auth.uid() = user_id)
-- - Orders can be viewed with a valid confirmation token for 7 days after creation
--
-- The confirmation token is:
-- 1. Generated automatically by the database (32 random bytes, hex encoded)
-- 2. Returned in the create-order response
-- 3. Must be passed in the x-confirmation-token header to access order details
-- 4. Expires after 7 days from order creation
--
-- AUDIT: Invalid token attempts are handled gracefully - RLS simply returns no rows

-- Add comments to document the token requirement
COMMENT ON COLUMN public.orders.confirmation_token IS 
'Secure token for guest order access. Pass via x-confirmation-token header. Valid for 7 days.';

COMMENT ON POLICY "Orders viewable with valid confirmation token" ON public.orders IS 
'Allows order viewing with valid x-confirmation-token header. Token expires 7 days after creation.';