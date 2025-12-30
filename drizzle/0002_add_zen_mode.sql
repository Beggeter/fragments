-- Добавляем поддержку Zen режима в таблицу user_games
ALTER TABLE user_games 
ADD COLUMN game_mode VARCHAR(20) NOT NULL DEFAULT 'classic',
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN final_score INTEGER,
ADD COLUMN game_data JSONB,
ADD COLUMN ended_at TIMESTAMP;

-- Создаем индексы для оптимизации запросов
CREATE INDEX game_mode_idx ON user_games(game_mode);
CREATE INDEX is_active_idx ON user_games(is_active); 