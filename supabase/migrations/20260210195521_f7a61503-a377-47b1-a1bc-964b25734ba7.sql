
-- Table for registered print clients
CREATE TABLE public.print_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id text NOT NULL UNIQUE,
  desktop_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  printer_name text DEFAULT '',
  paper_width_mm integer NOT NULL DEFAULT 80,
  margin_mm integer NOT NULL DEFAULT 5,
  auto_print boolean NOT NULL DEFAULT true,
  poll_interval_seconds integer NOT NULL DEFAULT 10,
  copies integer NOT NULL DEFAULT 1,
  last_seen_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.print_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage print clients"
  ON public.print_clients FOR ALL
  USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_print_clients_updated_at
  BEFORE UPDATE ON public.print_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
