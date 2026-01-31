-- Fix security issues for orders, companies, and user_roles tables

-- 1. ORDERS TABLE: The current policies allow guest access via confirmation token (which is correct)
-- But we need to ensure INSERT is properly restricted
-- Current policies:
-- - Admins can manage orders (ALL)
-- - Orders viewable with valid confirmation token (SELECT)
-- - Users can view own orders (SELECT)
-- This is actually correct - let's verify no INSERT policy exists for anonymous users

-- 2. COMPANIES TABLE: Add explicit SELECT restriction (currently only admin can access via ALL policy)
-- The ALL policy is restrictive (is_admin check), so anonymous users cannot SELECT
-- However, let's make this more explicit by adding a SELECT policy for admins only

-- Drop existing ALL policy and create specific policies for better clarity
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;

-- Create specific policies for companies table
CREATE POLICY "Only admins can select companies" 
  ON public.companies 
  FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can insert companies" 
  ON public.companies 
  FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update companies" 
  ON public.companies 
  FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete companies" 
  ON public.companies 
  FOR DELETE 
  USING (is_admin(auth.uid()));

-- 3. USER_ROLES TABLE: Add explicit INSERT, UPDATE, DELETE restrictions
-- Currently only has SELECT policy for admins
-- Need to add explicit denial/restriction for other operations

CREATE POLICY "Only admins can insert user_roles" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update user_roles" 
  ON public.user_roles 
  FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete user_roles" 
  ON public.user_roles 
  FOR DELETE 
  USING (is_admin(auth.uid()));

-- Add comments for documentation
COMMENT ON TABLE public.companies IS 'Business client information - admin access only via RLS';
COMMENT ON TABLE public.user_roles IS 'User permission assignments - admin access only via RLS';
COMMENT ON TABLE public.orders IS 'Customer orders - accessible to admins, order owners (via user_id), and guests (via confirmation token)';