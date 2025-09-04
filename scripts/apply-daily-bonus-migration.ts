import { db, closeConnection } from '../lib/db';
import { sql } from 'drizzle-orm';

async function applyMigration() {
  try {
    ;
    
    // Создаем таблицу daily_bonuses
    ;
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "daily_bonuses" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "current_week" integer NOT NULL DEFAULT 1,
        "current_day" integer NOT NULL DEFAULT 1,
        "last_claim_date" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    ;
    
    // Создаем индексы
    ;
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "daily_bonus_user_id_idx" ON "daily_bonuses" ("user_id");
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "daily_bonus_last_claim_date_idx" ON "daily_bonuses" ("last_claim_date");
    `);
    
    // Создаем уникальный индекс
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "daily_bonus_user_unique_idx" ON "daily_bonuses" ("user_id");
    `);
    
    ;
    
    // Проверяем, что таблица создалась
    ;
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'daily_bonuses'
      ) as exists;
    `);
    
    if (result.rows[0]?.exists) {
      ;
    } else {
      ;
    }
    
    ;
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

applyMigration()
  .then(() => {
    ;
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }); 