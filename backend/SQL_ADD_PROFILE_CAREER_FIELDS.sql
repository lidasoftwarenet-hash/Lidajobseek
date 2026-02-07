-- Add career identity columns to existing app.profile table
-- Run this if your profile table already exists in production.

ALTER TABLE app.profile
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS date_of_birth VARCHAR(10),
  ADD COLUMN IF NOT EXISTS title VARCHAR(120),
  ADD COLUMN IF NOT EXISTS degree VARCHAR(120),
  ADD COLUMN IF NOT EXISTS country VARCHAR(120),
  ADD COLUMN IF NOT EXISTS address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS current_workplace VARCHAR(255);
