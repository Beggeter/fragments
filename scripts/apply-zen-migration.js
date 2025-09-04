const { db } = require('../lib/db');

async function applyZenMigration() {
  try {
    ;
    
    // Добавляем поля для ZEN подписки
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS has_zen_subscription BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS zen_subscription_end_date TIMESTAMP;
    `);
    
    ;
  } catch (error) {
    console.error('❌ Error applying migration:', error);
  } finally {
    process.exit(0);
  }
}

applyZenMigration(); 