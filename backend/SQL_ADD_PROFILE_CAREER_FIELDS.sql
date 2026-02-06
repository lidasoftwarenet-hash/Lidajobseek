-- Add career identity columns to existing app.profile table
-- Run this if your profile table already exists in production.

ALTER TABLE app.profile
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS address VARCHAR(500),
  ADD COLUMN IF NOT EXISTS id_number VARCHAR(120);
