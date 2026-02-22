-- =============================================================================
-- NORMALIZE USER TABLES - Refactor for better database design
-- =============================================================================
-- This script creates separate tables for:
-- 1. user_settings - All UI preferences (theme, font size, date format, etc.)
-- 2. user_process_stages - Custom process stages per user
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Create user_settings table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES app."user"(id) ON DELETE CASCADE,
    theme_preference VARCHAR(10) DEFAULT 'light',
    font_size_preference INTEGER DEFAULT 14,
    country_preference VARCHAR(100) DEFAULT '',
    date_format_preference VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format_preference VARCHAR(2) DEFAULT '24',
    salary_currency_preference VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON app.user_settings(user_id);

-- -----------------------------------------------------------------------------
-- STEP 2: Create user_process_stages table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.user_process_stages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES app."user"(id) ON DELETE CASCADE,
    stages JSONB DEFAULT '["Applied","Phone Screen","Interview","Offer","Rejected","Unknown"]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_process_stages_user_id ON app.user_process_stages(user_id);

-- -----------------------------------------------------------------------------
-- STEP 3: Migrate existing data from user table to new tables
-- -----------------------------------------------------------------------------

-- Migrate user preferences to user_settings
INSERT INTO app.user_settings (user_id, theme_preference, font_size_preference, country_preference, date_format_preference, time_format_preference, salary_currency_preference)
SELECT 
    id,
    COALESCE(theme_preference, 'light'),
    COALESCE(font_size_preference, 14),
    COALESCE(country_preference, ''),
    COALESCE(date_format_preference, 'DD/MM/YYYY'),
    COALESCE(time_format_preference, '24'),
    COALESCE(salary_currency_preference, 'USD')
FROM app."user"
WHERE NOT EXISTS (SELECT 1 FROM app.user_settings WHERE user_id = app."user".id);

-- Migrate process_stages to user_process_stages
INSERT INTO app.user_process_stages (user_id, stages)
SELECT 
    id,
    COALESCE(process_stages, '["Applied","Phone Screen","Interview","Offer","Rejected","Unknown"]'::jsonb)
FROM app."user"
WHERE NOT EXISTS (SELECT 1 FROM app.user_process_stages WHERE user_id = app."user".id);

-- -----------------------------------------------------------------------------
-- STEP 4: Add constraints for data validation
-- -----------------------------------------------------------------------------

-- Theme preference constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_theme_preference_chk'
    ) THEN
        ALTER TABLE app.user_settings
          ADD CONSTRAINT user_settings_theme_preference_chk
          CHECK (theme_preference IN ('light', 'dark', 'auto'));
    END IF;
END $$;

-- Font size constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_font_size_chk'
    ) THEN
        ALTER TABLE app.user_settings
          ADD CONSTRAINT user_settings_font_size_chk
          CHECK (font_size_preference BETWEEN 12 AND 18);
    END IF;
END $$;

-- Date format constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_date_format_chk'
    ) THEN
        ALTER TABLE app.user_settings
          ADD CONSTRAINT user_settings_date_format_chk
          CHECK (date_format_preference IN (
              'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'YYYY/MM/DD',
              'DD-MM-YYYY', 'MM-DD-YYYY', 'DD.MM.YYYY', 'MM.DD.YYYY', 'YYYY.MM.DD'
          ));
    END IF;
END $$;

-- Time format constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_time_format_chk'
    ) THEN
        ALTER TABLE app.user_settings
          ADD CONSTRAINT user_settings_time_format_chk
          CHECK (time_format_preference IN ('12', '24'));
    END IF;
END $$;

-- Salary currency constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_salary_currency_chk'
    ) THEN
        ALTER TABLE app.user_settings
          ADD CONSTRAINT user_settings_salary_currency_chk
          CHECK (salary_currency_preference IN (
              'USD','EUR','GBP','JPY','CNY','AUD','CAD','CHF','HKD','SGD','INR','RUB','ILS','RON'
          ));
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- STEP 5: Verify migration
-- -----------------------------------------------------------------------------
SELECT 'Migration completed successfully!' as status;

-- Check data counts
SELECT 
    (SELECT COUNT(*) FROM app."user") as total_users,
    (SELECT COUNT(*) FROM app.user_settings) as settings_migrated,
    (SELECT COUNT(*) FROM app.user_process_stages) as stages_migrated;
