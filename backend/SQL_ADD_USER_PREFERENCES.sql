-- Add user preference columns to app.user table
-- Run this SQL script to add the preferences feature to an existing database

ALTER TABLE "app"."user" ADD COLUMN IF NOT EXISTS "theme_preference" VARCHAR(20) DEFAULT 'light';
ALTER TABLE "app"."user" ADD COLUMN IF NOT EXISTS "country_preference" VARCHAR(255) DEFAULT '';
ALTER TABLE "app"."user" ADD COLUMN IF NOT EXISTS "date_format_preference" VARCHAR(20) DEFAULT 'DD/MM/YYYY';
ALTER TABLE "app"."user" ADD COLUMN IF NOT EXISTS "time_format_preference" VARCHAR(5) DEFAULT '24';

-- Update existing users to have default preferences if they are NULL
UPDATE "app"."user" SET "theme_preference" = 'light' WHERE "theme_preference" IS NULL;
UPDATE "app"."user" SET "country_preference" = '' WHERE "country_preference" IS NULL;
UPDATE "app"."user" SET "date_format_preference" = 'DD/MM/YYYY' WHERE "date_format_preference" IS NULL;
UPDATE "app"."user" SET "time_format_preference" = '24' WHERE "time_format_preference" IS NULL;

-- Verify the changes
SELECT id, email, theme_preference, country_preference, date_format_preference, time_format_preference FROM "app"."user" LIMIT 5;
