-- Migration: Add daily bonuses table
-- Created at: 2024-12-19

CREATE TABLE IF NOT EXISTS "daily_bonuses" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "current_week" integer NOT NULL DEFAULT 1,
  "current_day" integer NOT NULL DEFAULT 1,
  "last_claim_date" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "daily_bonus_user_id_idx" ON "daily_bonuses" ("user_id");
CREATE INDEX IF NOT EXISTS "daily_bonus_last_claim_date_idx" ON "daily_bonuses" ("last_claim_date");

-- Create unique constraint to ensure one record per user
CREATE UNIQUE INDEX IF NOT EXISTS "daily_bonus_user_unique_idx" ON "daily_bonuses" ("user_id"); 