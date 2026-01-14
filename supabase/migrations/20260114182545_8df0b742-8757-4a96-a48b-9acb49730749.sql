-- Add business-specific fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS kvk_number TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS billing_postcode TEXT,
ADD COLUMN IF NOT EXISTS billing_city TEXT;