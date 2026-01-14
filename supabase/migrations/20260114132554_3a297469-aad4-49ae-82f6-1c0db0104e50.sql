-- 1. Add customer_type to orders (private/business)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'business' 
  CHECK (customer_type IN ('private', 'business'));

-- 2. Add order_type to orders (delivery/pickup)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery' 
  CHECK (order_type IN ('delivery', 'pickup'));

-- 3. Add delivery_asap flag to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_asap BOOLEAN DEFAULT FALSE;

-- 4. Add print tracking columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS print_count INTEGER DEFAULT 0;

-- 5. Create shop_settings table for configurable values
CREATE TABLE IF NOT EXISTS public.shop_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on shop_settings
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read shop settings (they're public config)
CREATE POLICY "Shop settings are publicly readable"
ON public.shop_settings
FOR SELECT
USING (true);

-- Only admins can modify shop settings
CREATE POLICY "Admins can manage shop settings"
ON public.shop_settings
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Insert default shop settings
INSERT INTO public.shop_settings (key, value, description) VALUES
  ('delivery_cost', '"4.00"', 'Standard delivery cost in EUR'),
  ('free_delivery_threshold', '"40.00"', 'Order amount for free delivery in EUR'),
  ('min_preparation_time_minutes', '60', 'Minimum preparation time in minutes'),
  ('pickup_address', '"Ons Adres 123, 1234 AB Plaats"', 'Pickup address for customers')
ON CONFLICT (key) DO NOTHING;

-- 6. Create closed_days table for holidays and recurring closures
CREATE TABLE IF NOT EXISTS public.closed_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NULL,
  day_of_week INTEGER NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  reason TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_closed_day CHECK (
    (is_recurring = TRUE AND day_of_week IS NOT NULL AND date IS NULL) OR
    (is_recurring = FALSE AND date IS NOT NULL AND day_of_week IS NULL)
  )
);

-- Enable RLS on closed_days
ALTER TABLE public.closed_days ENABLE ROW LEVEL SECURITY;

-- Anyone can read closed days (needed for checkout validation)
CREATE POLICY "Closed days are publicly readable"
ON public.closed_days
FOR SELECT
USING (true);

-- Only admins can manage closed days
CREATE POLICY "Admins can manage closed days"
ON public.closed_days
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Insert default recurring closed days (Sunday and Monday)
INSERT INTO public.closed_days (day_of_week, reason, is_recurring, is_active) VALUES
  (0, 'Zondag gesloten', true, true),
  (1, 'Maandag gesloten', true, true)
ON CONFLICT DO NOTHING;

-- 7. Create trigger for updated_at on new tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_closed_days_updated_at
  BEFORE UPDATE ON public.closed_days
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();