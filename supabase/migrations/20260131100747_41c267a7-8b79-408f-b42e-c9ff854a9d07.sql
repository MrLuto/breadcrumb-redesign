-- Add free_delivery_threshold column to delivery_zones table
-- This allows per-zone configuration of the amount needed for free delivery

ALTER TABLE public.delivery_zones 
ADD COLUMN IF NOT EXISTS free_delivery_threshold numeric DEFAULT NULL;

-- Comment to explain the column
COMMENT ON COLUMN public.delivery_zones.free_delivery_threshold IS 'Minimum order amount for free delivery in this zone. NULL means use global setting.';