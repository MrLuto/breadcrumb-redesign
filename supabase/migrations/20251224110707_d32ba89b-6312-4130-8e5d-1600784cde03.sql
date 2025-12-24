-- Create table to store IP addresses with postal codes
CREATE TABLE public.ip_postcodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  city TEXT,
  in_delivery_area BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster IP lookups
CREATE INDEX idx_ip_postcodes_ip ON public.ip_postcodes(ip_address);

-- Create unique constraint to avoid duplicates (one entry per IP)
CREATE UNIQUE INDEX idx_ip_postcodes_unique_ip ON public.ip_postcodes(ip_address);

-- Enable RLS but allow public read/write since this is anonymous visitor data
ALTER TABLE public.ip_postcodes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read IP postcode data
CREATE POLICY "Anyone can read ip_postcodes"
ON public.ip_postcodes
FOR SELECT
USING (true);

-- Allow anyone to insert their own IP postcode
CREATE POLICY "Anyone can insert ip_postcodes"
ON public.ip_postcodes
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update ip_postcodes
CREATE POLICY "Anyone can update ip_postcodes"
ON public.ip_postcodes
FOR UPDATE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ip_postcodes_updated_at
BEFORE UPDATE ON public.ip_postcodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();