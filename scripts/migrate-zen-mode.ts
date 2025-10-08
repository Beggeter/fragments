import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function migrateZenMode() {
  

  try {
    // Добавляем новые колонки в таблицу user_games
    
    
    await db.execute(sql`
      ALTER TABLE user_games 
      ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) NOT NULL DEFAULT 'classic',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS final_score INTEGER,
      ADD COLUMN IF NOT EXISTS game_data JSONB,
      ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
    `);

    

    // Создаем индексы
    
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS game_mode_idx ON user_games(game_mode);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS is_active_idx ON user_games(is_active);
    `);

    

    // Обновляем существующие записи
    
    
    await db.execute(sql`
      UPDATE user_games 
      SET game_mode = 'classic', is_active = true 
      WHERE game_mode IS NULL OR is_active IS NULL;
    `);

    

    
    
  } catch (error) {
    
    process.exit(1);
  }
}

// Запускаем миграцию
migrateZenMode()
  .then(() => {
    
    process.exit(0);
  })
  .catch((error) => {
    
    process.exit(1);
  }); 