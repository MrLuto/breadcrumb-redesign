-- Task 2: Add RLS policy for companies to view their own invoices
-- First, we need to link users to companies via customer_profiles
-- Since customer_profiles has company_name but not company_id, we'll add the link

-- Add company_id to customer_profiles to link users to companies
ALTER TABLE public.customer_profiles 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_company_id ON public.customer_profiles(company_id);

-- Create function to get user's company_id (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.customer_profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Add RLS policy for users to view invoices for their company
CREATE POLICY "Users can view own company invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL 
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Task 3: Add is_public column to shop_settings to control visibility
ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Update existing settings to mark which should be public
-- Delivery/pricing info should be public for customers
UPDATE public.shop_settings 
SET is_public = true 
WHERE key IN ('free_delivery_threshold', 'min_order_amount', 'delivery_cost');

-- Internal business settings should be private
UPDATE public.shop_settings 
SET is_public = false 
WHERE key NOT IN ('free_delivery_threshold', 'min_order_amount', 'delivery_cost');

-- Drop existing public read policy
DROP POLICY IF EXISTS "Shop settings are publicly readable" ON public.shop_settings;

-- Create new policy that only exposes public settings
CREATE POLICY "Public settings are readable by everyone"
ON public.shop_settings
FOR SELECT
USING (is_public = true OR is_admin(auth.uid()));