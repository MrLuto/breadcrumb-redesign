-- Add new fields to customer_profiles for all checkout fields
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS kvk_number text;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS billing_address text;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS billing_postcode text;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS billing_city text;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS same_billing_address boolean DEFAULT true;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS preferred_payment_method text;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS default_notes text;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS default_order_type text DEFAULT 'delivery';

-- Create RLS policy for orders if not exists (ensure customers can view their own orders)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view own orders'
  ) THEN
    CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());
  END IF;
END
$$;