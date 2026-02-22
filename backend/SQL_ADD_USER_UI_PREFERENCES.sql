no
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
    WHERE conname = 'user_time_format_preference_chk'
      AND conrelid = 'app."user"'::regclass
  ) THEN
    ALTER TABLE app."user"
      ADD CONSTRAINT user_time_format_preference_chk
      CHECK (time_format_preference IN ('12', '24') OR time_format_preference IS NULL);
  END IF;
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
  time_format_preference = COALESCE(time_format_preference, '24'),
  salary_currency_preference = COALESCE(salary_currency_preference, 'USD')
WHERE theme_preference IS NULL
   OR font_size_preference IS NULL
   OR country_preference IS NULL
   OR date_format_preference IS NULL
   OR time_format_preference IS NULL
   OR salary_currency_preference IS NULL;
