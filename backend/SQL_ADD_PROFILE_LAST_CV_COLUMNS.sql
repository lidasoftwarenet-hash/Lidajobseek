-- Add last CV tracking columns to app.profile
-- Run this on your PostgreSQL database to fix: column "last_cv_url" of relation "profile" does not exist
-- Schema: app (table app.profile)

ALTER TABLE app.profile ADD COLUMN IF NOT EXISTS last_cv_url VARCHAR(500);
ALTER TABLE app.profile ADD COLUMN IF NOT EXISTS last_cv_generated_at TIMESTAMP;
ALTER TABLE app.profile ADD COLUMN IF NOT EXISTS last_cv_ai BOOLEAN;

-- Verify (optional)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'profile' AND column_name LIKE 'last_cv%';
