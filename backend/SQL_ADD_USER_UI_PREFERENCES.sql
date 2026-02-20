-- Add per-user UI preferences for theme + font size
-- Run this once in your PostgreSQL database

ALTER TABLE app."user"
  ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10),
  ADD COLUMN IF NOT EXISTS font_size_preference INTEGER,
  ADD COLUMN IF NOT EXISTS country_preference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_format_preference VARCHAR(10),
  ADD COLUMN IF NOT EXISTS salary_currency_preference VARCHAR(10);

-- Defaults for new rows
ALTER TABLE app."user"
  ALTER COLUMN theme_preference SET DEFAULT 'light',
  ALTER COLUMN font_size_preference SET DEFAULT 14,
  ALTER COLUMN country_preference SET DEFAULT '',
  ALTER COLUMN date_format_preference SET DEFAULT 'DD/MM/YYYY',
  ALTER COLUMN salary_currency_preference SET DEFAULT 'USD';

-- Optional safety constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_theme_preference_chk'
      AND conrelid = 'app."user"'::regclass
  ) THEN
    ALTER TABLE app."user"
      ADD CONSTRAINT user_theme_preference_chk
      CHECK (theme_preference IN ('light', 'dark', 'auto') OR theme_preference IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_font_size_preference_chk'
      AND conrelid = 'app."user"'::regclass
  ) THEN
    ALTER TABLE app."user"
      ADD CONSTRAINT user_font_size_preference_chk
      CHECK (
        (font_size_preference BETWEEN 12 AND 18)
        OR font_size_preference IS NULL
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_date_format_preference_chk'
      AND conrelid = 'app."user"'::regclass
  ) THEN
    ALTER TABLE app."user" DROP CONSTRAINT user_date_format_preference_chk;
  END IF;

  ALTER TABLE app."user"
    ADD CONSTRAINT user_date_format_preference_chk
    CHECK (
      date_format_preference IN (
        'MM/DD/YYYY',
        'DD/MM/YYYY',
        'YYYY-MM-DD',
        'YYYY/MM/DD',
        'DD-MM-YYYY',
        'MM-DD-YYYY',
        'DD.MM.YYYY',
        'MM.DD.YYYY',
        'YYYY.MM.DD'
      )
      OR date_format_preference IS NULL
    );
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_salary_currency_preference_chk'
      AND conrelid = 'app."user"'::regclass
  ) THEN
    ALTER TABLE app."user"
      ADD CONSTRAINT user_salary_currency_preference_chk
      CHECK (
        salary_currency_preference IN (
          'USD','EUR','GBP','JPY','CNY','AUD','CAD','CHF','HKD','SGD','INR','RUB','ILS','RON'
        )
        OR salary_currency_preference IS NULL
      );
  END IF;
END $$;

-- Backfill existing users
UPDATE app."user"
SET
  theme_preference = COALESCE(theme_preference, 'light'),
  font_size_preference = COALESCE(font_size_preference, 14),
  country_preference = COALESCE(country_preference, ''),
  date_format_preference = COALESCE(date_format_preference, 'DD/MM/YYYY'),
  salary_currency_preference = COALESCE(salary_currency_preference, 'USD')
WHERE theme_preference IS NULL
   OR font_size_preference IS NULL
   OR country_preference IS NULL
   OR date_format_preference IS NULL
   OR salary_currency_preference IS NULL;
