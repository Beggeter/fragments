import { db, closeConnection } from '../lib/db';
import { users } from '../lib/db/schema';

async function createTestUser() {
  try {
    
    
    // Создаем тестового пользователя
    const testUser = await db.insert(users).values({
      telegramId: '123456789',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      currency: 1000,
    }).returning();
    
    
    
    // Создаем еще одного пользователя с premium ролью
    const premiumUser = await db.insert(users).values({
      telegramId: '987654321',
      username: 'premiumuser',
      firstName: 'Premium',
      lastName: 'User',
      role: 'premium',
      currency: 5000,
    }).returning();
    
    
    
    
    
    
    
    
    
    
    
    
    
  } catch (error) {
    
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

createTestUser()
  .then(() => {
    
    process.exit(0);
  })
  .catch((error) => {
    
    process.exit(1);
  }); 