-- Add recurrence_type column to closed_days
ALTER TABLE closed_days 
ADD COLUMN recurrence_type text NOT NULL DEFAULT 'weekly';

-- Add day_of_month for monthly recurrence (1-31)
ALTER TABLE closed_days 
ADD COLUMN day_of_month integer;

-- Add month for yearly recurrence (1-12)
ALTER TABLE closed_days 
ADD COLUMN month integer;

-- Add constraint for day_of_month
ALTER TABLE closed_days 
ADD CONSTRAINT closed_days_day_of_month_check 
CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31));

-- Add constraint for month
ALTER TABLE closed_days 
ADD CONSTRAINT closed_days_month_check 
CHECK (month IS NULL OR (month >= 1 AND month <= 12));

-- Update existing recurring entries to have recurrence_type = 'weekly'
UPDATE closed_days SET recurrence_type = 'weekly' WHERE is_recurring = true;

-- Update existing non-recurring entries to have recurrence_type = 'none' (one-time)
UPDATE closed_days SET recurrence_type = 'none' WHERE is_recurring = false;