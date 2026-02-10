
ALTER TABLE public.print_clients
ADD COLUMN print_template text NOT NULL DEFAULT 'receipt';
-- Values: 'receipt' (huidige bon), 'invoice_a4' (A4 factuur/pakbon)
