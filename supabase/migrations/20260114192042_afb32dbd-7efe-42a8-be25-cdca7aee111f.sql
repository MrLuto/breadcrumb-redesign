-- Drop the old constraint that only supports weekly and one-time
ALTER TABLE closed_days DROP CONSTRAINT valid_closed_day;

-- Drop the old day_of_week constraint that requires it to be NOT NULL
ALTER TABLE closed_days DROP CONSTRAINT closed_days_day_of_week_check;

-- Add new constraint that supports all recurrence types
ALTER TABLE closed_days ADD CONSTRAINT valid_closed_day CHECK (
  (recurrence_type = 'none' AND date IS NOT NULL) OR
  (recurrence_type = 'weekly' AND day_of_week IS NOT NULL AND day_of_week >= 0 AND day_of_week <= 6) OR
  (recurrence_type = 'monthly' AND day_of_month IS NOT NULL) OR
  (recurrence_type = 'yearly' AND day_of_month IS NOT NULL AND month IS NOT NULL)
);