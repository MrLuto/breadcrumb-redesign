-- Allow separate payment methods besides 'direct'
DO $$
BEGIN
  ALTER TYPE public.payment_method_type ADD VALUE IF NOT EXISTS 'ideal';
  ALTER TYPE public.payment_method_type ADD VALUE IF NOT EXISTS 'pin';
  ALTER TYPE public.payment_method_type ADD VALUE IF NOT EXISTS 'cash';
END $$;