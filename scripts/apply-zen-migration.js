const { db } = require('../lib/db');

async function applyZenMigration() {
  try {
    console.log('🔄 Applying ZEN subscription migration...');
    
    // Добавляем поля для ZEN подписки
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS has_zen_subscription BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS zen_subscription_end_date TIMESTAMP;
    `);
    
    console.log('✅ ZEN subscription migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
  } finally {
    process.exit(0);
  }
}

applyZenMigration(); 