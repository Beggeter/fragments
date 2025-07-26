import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function resetDatabase() {
  console.log('🗑️  Resetting database...');

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

    console.log('📋 Dropping existing tables...');
    
    // Удаляем таблицы (в правильном порядке из-за foreign keys)
    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not drop table ${table}:`, error);
      }
    }

    console.log('📋 Dropping existing sequences...');
    
    // Удаляем последовательности
    for (const sequence of sequencesToDrop) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS "${sequence}" CASCADE`);
        console.log(`✅ Dropped sequence: ${sequence}`);
      } catch (error) {
        console.log(`⚠️  Could not drop sequence ${sequence}:`, error);
      }
    }

    // Также удаляем все остальные объекты, которые могут конфликтовать
    console.log('🧹 Cleaning up other database objects...');
    
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
      console.log('✅ Cleaned up all tables and related objects');
    } catch (error) {
      console.log('⚠️  Could not clean up all objects:', error);
    }

    client.release();
    console.log('🎉 Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем сброс базы данных
resetDatabase().catch((error) => {
  console.error('Failed to reset database:', error);
  process.exit(1);
}); 