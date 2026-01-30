-- Feature flags for delivery/pickup toggles
INSERT INTO shop_settings (key, value, description)
VALUES 
  ('delivery_enabled', 'true', 'Enable/disable delivery option'),
  ('pickup_enabled', 'true', 'Enable/disable pickup option')
ON CONFLICT (key) DO NOTHING;