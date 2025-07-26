import 'dotenv/config';
import { BoosterService } from '../lib/db/services';

async function initializeDatabase() {
  console.log('🚀 Initializing database...');

  try {
    // Инициализируем стандартные бустеры
    console.log('📦 Creating default boosters...');
    await BoosterService.initializeDefaultBoosters();
    console.log('✅ Default boosters created successfully');

    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Запускаем инициализацию
initializeDatabase(); 