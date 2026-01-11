-- Create delivery_zones table for postcode-based delivery pricing
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  postcode_prefix VARCHAR(4) NOT NULL,
  zone_name VARCHAR(100) NOT NULL,
  delivery_cost DECIMAL(10,2) NOT NULL DEFAULT 7.50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on postcode_prefix
ALTER TABLE public.delivery_zones ADD CONSTRAINT delivery_zones_postcode_prefix_key UNIQUE (postcode_prefix);

-- Enable Row Level Security
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Create policies: everyone can read, only admins can modify
CREATE POLICY "Delivery zones are viewable by everyone" 
  ON public.delivery_zones 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can insert delivery zones" 
  ON public.delivery_zones 
  FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update delivery zones" 
  ON public.delivery_zones 
  FOR UPDATE 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete delivery zones" 
  ON public.delivery_zones 
  FOR DELETE 
  USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_delivery_zones_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default zones for Gouda area
INSERT INTO public.delivery_zones (postcode_prefix, zone_name, delivery_cost, min_order_amount) VALUES
  ('2800', 'Gouda Centrum', 5.00, 25.00),
  ('2801', 'Gouda Noord', 5.00, 25.00),
  ('2802', 'Gouda Oost', 5.00, 25.00),
  ('2803', 'Gouda Zuid', 5.00, 25.00),
  ('2804', 'Gouda West', 5.00, 25.00),
  ('2805', 'Gouda Goverwelle', 7.50, 35.00),
  ('2806', 'Gouda Bloemendaal', 7.50, 35.00),
  ('2807', 'Gouda Plaswijck', 7.50, 35.00),
  ('2808', 'Gouda Kort Haarlem', 7.50, 35.00),
  ('2809', 'Nieuwerkerk aan den IJssel', 10.00, 50.00),
  ('2811', 'Reeuwijk', 10.00, 50.00),
  ('2821', 'Stolwijk', 12.50, 75.00),
  ('2831', 'Gouderak', 12.50, 75.00);