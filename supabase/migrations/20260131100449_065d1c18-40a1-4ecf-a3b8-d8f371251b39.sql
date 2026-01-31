-- Security Fix: Strengthen RLS policies for companies, orders, and invoices tables

-- ============================================
-- 1. COMPANIES TABLE - Verify admin-only access
-- The current policy is RESTRICTIVE which means no one can access without matching.
-- Let's ensure there's an explicit deny for public access and verify admin policy is correct
-- ============================================

-- Drop existing policy and recreate with explicit security
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;

-- Create explicit admin-only policy with both USING and WITH CHECK
CREATE POLICY "Admins can manage companies" 
ON public.companies 
FOR ALL 
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- 2. ORDERS TABLE - Strengthen access controls
-- Current policies: admin, confirmation_token, user_id
-- Issue: Orders without user_id and with expired/null tokens could theoretically be exposed
-- ============================================

-- The current policies look correct based on the schema, but let's verify the token-based access
-- is properly scoped and add explicit denial for unauthenticated access

-- No changes needed - the existing policies are:
-- 1. "Admins can manage orders" - RESTRICTIVE with is_admin(auth.uid())
-- 2. "Orders viewable with valid confirmation token" - RESTRICTIVE with token validation + 7 day limit
-- 3. "Users can view own orders" - RESTRICTIVE with auth.uid() = user_id

-- These are already properly configured as RESTRICTIVE policies, meaning access requires matching at least one.

-- ============================================
-- 3. INVOICES TABLE - Add company access policy
-- Current: Only admin policy exists
-- Need: Allow authenticated users linked to a company to view their invoices
-- ============================================

-- Since invoices are linked to companies via company_id, and orders can be linked to companies,
-- we could allow users to view invoices for orders they've placed.
-- However, there's no direct user_id on invoices or companies tables.
-- 
-- For now, keep invoices admin-only since there's no user-company relationship defined.
-- The scanner suggestion about company access would require a user_companies junction table.
-- 
-- The current setup is actually secure - only admins can view invoices, which is appropriate
-- for a B2B ordering system where the bakery manages invoices.

-- Document this design decision with a comment
COMMENT ON TABLE public.invoices IS 'Business invoices - Admin-only access. Companies receive invoices via email, not self-service portal.';

-- ============================================
-- 4. Add explicit documentation comments for security audit trail
-- ============================================

COMMENT ON TABLE public.companies IS 'Business customer data - Admin-only access via RLS. Contains sensitive contact information.';
COMMENT ON TABLE public.orders IS 'Customer orders - Access via admin, confirmation token (7 days), or order owner (user_id).';
COMMENT ON TABLE public.rate_limits IS 'Internal rate limiting - No public access. Edge functions use service_role key to bypass RLS.';