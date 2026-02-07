-- Add column for zone-specific minimum preparation time
ALTER TABLE delivery_zones 
ADD COLUMN IF NOT EXISTS min_preparation_time_minutes INTEGER DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN delivery_zones.min_preparation_time_minutes IS 'Zone-specific minimum preparation time in minutes. If NULL, uses global shop setting.';