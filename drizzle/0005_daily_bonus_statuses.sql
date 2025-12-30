-- Migration: Add day status tracking for daily bonuses
-- Created at: 2025-02-14

ALTER TABLE "daily_bonuses"
  ADD COLUMN IF NOT EXISTS "day_statuses" jsonb NOT NULL DEFAULT '{"claimedDays":[],"skippedDays":[]}';
