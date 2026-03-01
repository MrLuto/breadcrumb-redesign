
-- Add test print request fields to print_clients
ALTER TABLE public.print_clients
  ADD COLUMN test_print_requested_at timestamptz DEFAULT NULL,
  ADD COLUMN test_print_template text DEFAULT 'receipt';
