-- Create opening_hours table for managing business hours
CREATE TABLE public.opening_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Enable RLS
ALTER TABLE public.opening_hours ENABLE ROW LEVEL SECURITY;

-- Everyone can read opening hours
CREATE POLICY "Opening hours are publicly readable"
ON public.opening_hours
FOR SELECT
USING (true);

-- Only admins can modify opening hours
CREATE POLICY "Admins can manage opening hours"
ON public.opening_hours
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_opening_hours_updated_at
BEFORE UPDATE ON public.opening_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default opening hours (Monday-Friday 8:00-17:00, Saturday 9:00-14:00, Sunday closed)
INSERT INTO public.opening_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '00:00', '00:00', true),  -- Sunday - closed
  (1, '08:00', '17:00', false), -- Monday
  (2, '08:00', '17:00', false), -- Tuesday
  (3, '08:00', '17:00', false), -- Wednesday
  (4, '08:00', '17:00', false), -- Thursday
  (5, '08:00', '17:00', false), -- Friday
  (6, '09:00', '14:00', false); -- Saturday