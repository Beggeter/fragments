import 'dotenv/config';
import { Pool } from 'pg';

async function cleanSchema() {
  

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    
    // Полностью очищаем схему public
    
    
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    
    
    client.release();
    
  } catch (error) {
    
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем очистку схемы
cleanSchema().catch((error) => {
  
  process.exit(1);
}); 