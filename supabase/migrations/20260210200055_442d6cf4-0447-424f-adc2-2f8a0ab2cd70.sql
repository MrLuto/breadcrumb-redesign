ALTER TABLE public.print_clients
  ADD COLUMN available_printers jsonb NOT NULL DEFAULT '[]'::jsonb;