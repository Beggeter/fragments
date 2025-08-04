import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function migrateZenMode() {
  console.log('🚀 Starting Zen mode migration...');

  try {
    // Добавляем новые колонки в таблицу user_games
    console.log('📝 Adding new columns to user_games table...');
    
    await db.execute(sql`
      ALTER TABLE user_games 
      ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) NOT NULL DEFAULT 'classic',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS final_score INTEGER,
      ADD COLUMN IF NOT EXISTS game_data JSONB,
      ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
    `);

    console.log('✅ Columns added successfully');

    // Создаем индексы
    console.log('🔍 Creating indexes...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS game_mode_idx ON user_games(game_mode);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS is_active_idx ON user_games(is_active);
    `);

    console.log('✅ Indexes created successfully');

    // Обновляем существующие записи
    console.log('🔄 Updating existing records...');
    
    await db.execute(sql`
      UPDATE user_games 
      SET game_mode = 'classic', is_active = true 
      WHERE game_mode IS NULL OR is_active IS NULL;
    `);

    console.log('✅ Existing records updated');

    console.log('🎉 Zen mode migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Запускаем миграцию
migrateZenMode()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }); 