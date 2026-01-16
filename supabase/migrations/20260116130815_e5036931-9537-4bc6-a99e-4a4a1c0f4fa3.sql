-- Add new payment method values to the enum
ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'ideal';
ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'pin';
ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'cash';