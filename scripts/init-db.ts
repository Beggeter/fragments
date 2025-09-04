import 'dotenv/config';
import { BoosterService } from '../lib/db/services';

async function initializeDatabase() {
  ;

  try {
    // Инициализируем стандартные бустеры
    ;
    await BoosterService.initializeDefaultBoosters();
    ;

    ;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Запускаем инициализацию
initializeDatabase(); 