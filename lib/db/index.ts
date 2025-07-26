import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Создаем пул соединений
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Создаем экземпляр Drizzle с нашей схемой
export const db = drizzle(pool, { schema });

// Экспортируем схему для использования в других частях приложения
export * from './schema';

// Функция для закрытия соединения (полезно для тестов)
export const closeConnection = async () => {
  await pool.end();
}; 