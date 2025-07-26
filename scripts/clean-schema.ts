import 'dotenv/config';
import { Pool } from 'pg';

async function cleanSchema() {
  console.log('🧹 Cleaning database schema...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    
    // Полностью очищаем схему public
    console.log('🗑️  Dropping all objects in public schema...');
    
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    
    console.log('✅ Schema cleaned successfully!');
    client.release();
    
  } catch (error) {
    console.error('❌ Error cleaning schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем очистку схемы
cleanSchema().catch((error) => {
  console.error('Failed to clean schema:', error);
  process.exit(1);
}); 