-- Add per-user UI preferences for theme + font size
-- Run this once in your PostgreSQL database

ALTER TABLE app."user"
  ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10),
  ADD COLUMN IF NOT EXISTS font_size_preference INTEGER;

-- Defaults for new rows
ALTER TABLE app."user"
  ALTER COLUMN theme_preference SET DEFAULT 'light',
  ALTER COLUMN font_size_preference SET DEFAULT 14;

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

-- Backfill existing users
UPDATE app."user"
SET
  theme_preference = COALESCE(theme_preference, 'light'),
  font_size_preference = COALESCE(font_size_preference, 14)
WHERE theme_preference IS NULL
   OR font_size_preference IS NULL;
