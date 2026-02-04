-- Add pricingPlan column to users table
-- Run this SQL script to add the pricing plan feature to existing database

ALTER TABLE users ADD COLUMN IF NOT EXISTS pricing_plan VARCHAR(50) DEFAULT 'free';

-- Update existing users to have 'free' plan
UPDATE users SET pricing_plan = 'free' WHERE pricing_plan IS NULL;

-- Optional: Set a specific user to premium for testing
-- UPDATE users SET pricing_plan = 'premium' WHERE email = 'your-test-email@example.com';

-- Verify the changes
SELECT id, email, pricing_plan FROM users;