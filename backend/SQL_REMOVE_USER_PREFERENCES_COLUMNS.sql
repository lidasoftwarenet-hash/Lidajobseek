-- ============================================================================
-- Migration Script: Remove unnecessary preference columns from user table
-- 
-- This script moves user preferences from the "user" table to the new 
-- "user_settings" and "user_process_stages" tables, then removes the 
-- redundant columns from the user table.
--
-- BEFORE RUNNING: Ensure the new tables (user_settings, user_process_stages) 
-- already exist with data migrated. This script will:
-- 1. Migrate any remaining data from user table to user_settings
-- 2. Migrate any remaining data from user table to user_process_stages  
-- 3. Drop the preference columns from user table
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Migrate settings data from user table to user_settings
-- (Only for users who don't have settings yet)
-- ============================================================================

-- Insert missing user_settings records for users who have preference data in user table
INSERT INTO app.user_settings (
    user_id,
    theme_preference,
    font_size_preference,
    country_preference,
    date_format_preference,
    time_format_preference,
    salary_currency_preference,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(u.theme_preference, 'light'),
    COALESCE(u.font_size_preference, 14),
    COALESCE(u.country_preference, ''),
    COALESCE(u.date_format_preference, 'DD/MM/YYYY'),
    COALESCE(u.time_format_preference, '24'),
    COALESCE(u.salary_currency_preference, 'USD'),
    NOW(),
    NOW()
FROM app."user" u
LEFT JOIN app.user_settings us ON us.user_id = u.id
WHERE us.id IS NULL
AND (
    u.theme_preference IS NOT NULL 
    OR u.font_size_preference IS NOT NULL 
    OR u.country_preference IS NOT NULL 
    OR u.date_format_preference IS NOT NULL 
    OR u.time_format_preference IS NOT NULL 
    OR u.salary_currency_preference IS NOT NULL
);

-- ============================================================================
-- Step 2: Migrate process stages from user table to user_process_stages
-- (Only for users who don't have stages yet)
-- ============================================================================

INSERT INTO app.user_process_stages (
    user_id,
    stages,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(u.process_stages, '["Applied","Phone Screen","Interview","Offer","Rejected","Unknown"]'::jsonb),
    NOW(),
    NOW()
FROM app."user" u
LEFT JOIN app.user_process_stages ups ON ups.user_id = u.id
WHERE ups.id IS NULL
AND u.process_stages IS NOT NULL;

-- ============================================================================
-- Step 3: Drop the preference columns from user table
-- ============================================================================

ALTER TABLE app."user" 
DROP COLUMN IF EXISTS process_stages,
DROP COLUMN IF EXISTS theme_preference,
DROP COLUMN IF EXISTS font_size_preference,
DROP COLUMN IF EXISTS country_preference,
DROP COLUMN IF EXISTS date_format_preference,
DROP COLUMN IF EXISTS time_format_preference,
DROP COLUMN IF EXISTS salary_currency_preference;

COMMIT;

-- ============================================================================
-- Verification Query: Check remaining columns in user table
-- ============================================================================

-- Show current columns in user table
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'app' AND table_name = 'user'
-- ORDER BY ordinal_position;

-- Show count of records in new tables
-- SELECT 
--     (SELECT COUNT(*) FROM app."user") as total_users,
--     (SELECT COUNT(*) FROM app.user_settings) as user_settings,
--     (SELECT COUNT(*) FROM app.user_process_stages) as user_process_stages;
