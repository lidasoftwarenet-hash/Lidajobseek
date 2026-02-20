-- Add global per-user process stages storage
-- Run this once in your PostgreSQL database

ALTER TABLE app."user"
  ADD COLUMN IF NOT EXISTS process_stages JSONB;

-- Backfill existing users with default stages (and ensure Unknown is first)
UPDATE app."user"
SET process_stages =
  '["Unknown","Initial Call Scheduled","Awaiting Next Interview (after Initial Call)","Interview Scheduled","Waiting for Interview Feedback","Home Task Assigned","References Requested","Final HR Interview Scheduled","Offer Received","Withdrawn","Rejected","No Response (14+ Days)"]'::jsonb
WHERE process_stages IS NULL;
