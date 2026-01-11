-- Add RLS INSERT policies for anonymous order creation
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Add time-limited SELECT policy for order confirmation (24 hours)
-- This allows customers to view their order on the confirmation page
CREATE POLICY "Recent orders viewable for confirmation"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (
    created_at > now() - interval '24 hours'
  );

-- Add corresponding SELECT policy for order_items (linked to recent orders)
CREATE POLICY "Order items viewable for recent orders"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.created_at > now() - interval '24 hours'
    )
  );