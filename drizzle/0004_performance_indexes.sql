-- Performance indexes for leaderboard and active game lookups

-- Speed up ORDER BY record DESC queries and position calculations
CREATE INDEX IF NOT EXISTS idx_users_record_desc ON users (record DESC);
CREATE INDEX IF NOT EXISTS idx_users_zen_record_desc ON users (zen_record DESC);

-- Composite index for active game lookup by user and mode
CREATE INDEX IF NOT EXISTS idx_user_games_user_mode_active
  ON user_games (user_id, game_mode, is_active);

-- Optional: partial indexes to skip zero records (uncomment if needed)
-- CREATE INDEX IF NOT EXISTS idx_users_record_pos ON users (record) WHERE record > 0;
-- CREATE INDEX IF NOT EXISTS idx_users_zen_record_pos ON users (zen_record) WHERE zen_record > 0;


