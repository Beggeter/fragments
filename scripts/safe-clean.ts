import 'dotenv/config';
import { Pool } from 'pg';

async function safeClean() {
  

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

    
    
    // Удаляем таблицы в правильном порядке
    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        
      } catch (error) {
        
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

    
    
    for (const sequence of sequencesToDrop) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS "${sequence}" CASCADE`);
        
      } catch (error) {
        
      }
    }

    // Удаляем индексы, если они остались
    
    
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
        
      } catch (error) {
        // Игнорируем ошибки, если индекс не существует
      }
    }

    client.release();
    
    
  } catch (error) {
    
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем безопасную очистку
safeClean().catch((error) => {
  
  process.exit(1);
}); 