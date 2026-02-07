-- Add registration and activation fields to app.user table
-- Run this once in your PostgreSQL database

ALTER TABLE app."user"
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS activation_token_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_user_activation_token
  ON app."user" (activation_token);
