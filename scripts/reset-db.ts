import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function resetDatabase() {
  

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    
    // Список всех таблиц, которые нужно удалить
    const tablesToDrop = [
      'user_boosters',
      'user_games', 
      'currency_transactions',
      'record_history',
      'booster_types',
      'users'
    ];

    // Список всех последовательностей, которые нужно удалить
    const sequencesToDrop = [
      'users_id_seq',
      'user_games_id_seq',
      'booster_types_id_seq',
      'currency_transactions_id_seq',
      'record_history_id_seq'
    ];

    
    
    // Удаляем таблицы (в правильном порядке из-за foreign keys)
    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        
      } catch (error) {
        
      }
    }

    
    
    // Удаляем последовательности
    for (const sequence of sequencesToDrop) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS "${sequence}" CASCADE`);
        
      } catch (error) {
        
      }
    }

    // Также удаляем все остальные объекты, которые могут конфликтовать
    
    
    try {
      // Удаляем все индексы
      await client.query(`
        DO $$ 
        DECLARE 
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) 
          LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);
      
    } catch (error) {
      
    }

    client.release();
    
    
  } catch (error) {
    
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем сброс базы данных
resetDatabase().catch((error) => {
  
  process.exit(1);
}); 