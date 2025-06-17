import 'dotenv/config';
import { Pool } from 'pg';

async function safeClean() {
  console.log('🧹 Safely cleaning database tables...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    
    // Список наших таблиц в правильном порядке (сначала зависимые)
    const tablesToDrop = [
      'user_boosters',
      'currency_transactions', 
      'record_history',
      'user_games',
      'booster_types',
      'users'
    ];

    console.log('🗑️  Dropping existing tables...');
    
    // Удаляем таблицы в правильном порядке
    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not drop table ${table}:`, error);
      }
    }

    // Удаляем последовательности, если они существуют
    const sequencesToDrop = [
      'users_id_seq',
      'user_games_id_seq',
      'booster_types_id_seq',
      'currency_transactions_id_seq',
      'record_history_id_seq'
    ];

    console.log('🗑️  Dropping existing sequences...');
    
    for (const sequence of sequencesToDrop) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS "${sequence}" CASCADE`);
        console.log(`✅ Dropped sequence: ${sequence}`);
      } catch (error) {
        console.log(`⚠️  Could not drop sequence ${sequence}:`, error);
      }
    }

    // Удаляем индексы, если они остались
    console.log('🗑️  Cleaning up indexes...');
    
    const indexesToDrop = [
      'telegram_id_idx',
      'role_idx',
      'user_id_idx',
      'user_booster_user_id_idx',
      'user_booster_type_idx',
      'currency_user_id_idx',
      'currency_type_idx',
      'currency_created_at_idx',
      'record_user_id_idx',
      'record_score_idx',
      'record_created_at_idx'
    ];

    for (const index of indexesToDrop) {
      try {
        await client.query(`DROP INDEX IF EXISTS "${index}"`);
        console.log(`✅ Dropped index: ${index}`);
      } catch (error) {
        // Игнорируем ошибки, если индекс не существует
      }
    }

    client.release();
    console.log('🎉 Database cleaned successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем безопасную очистку
safeClean().catch((error) => {
  console.error('Failed to clean database:', error);
  process.exit(1);
}); 