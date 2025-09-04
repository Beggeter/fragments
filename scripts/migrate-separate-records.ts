import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function migrateSeparateRecords() {
  ;

  try {
    // Add zen_record column to users table
    ;
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS zen_record INTEGER NOT NULL DEFAULT 0
    `);

    // Add game_mode column to record_history table
    ;
    await db.execute(sql`
      ALTER TABLE record_history 
      ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) NOT NULL DEFAULT 'classic'
    `);

    // Create index for record_history game_mode
    ;
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS record_game_mode_idx ON record_history (game_mode)
    `);

    // Update existing record_history records to have game_mode = 'classic'
    ;
    await db.execute(sql`
      UPDATE record_history 
      SET game_mode = 'classic' 
      WHERE game_mode IS NULL OR game_mode = ''
    `);

    ;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSeparateRecords()
    .then(() => {
      ;
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateSeparateRecords }; 