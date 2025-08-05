import { db, closeConnection } from '../lib/db';
import { users } from '../lib/db/schema';

async function createTestUser() {
  try {
    console.log('🚀 Creating test user...');
    
    // Создаем тестового пользователя
    const testUser = await db.insert(users).values({
      telegramId: '123456789',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      currency: 1000,
    }).returning();
    
    console.log('✅ Test user created:', testUser[0]);
    
    // Создаем еще одного пользователя с premium ролью
    const premiumUser = await db.insert(users).values({
      telegramId: '987654321',
      username: 'premiumuser',
      firstName: 'Premium',
      lastName: 'User',
      role: 'premium',
      currency: 5000,
    }).returning();
    
    console.log('✅ Premium test user created:', premiumUser[0]);
    
    console.log('🎉 Test users created successfully!');
    console.log('');
    console.log('You can now test the API with:');
    console.log('GET  http://localhost:3000/api/users/123456789/bonus');
    console.log('POST http://localhost:3000/api/users/123456789/bonus');
    console.log('');
    console.log('Or test with premium user:');
    console.log('GET  http://localhost:3000/api/users/987654321/bonus');
    console.log('POST http://localhost:3000/api/users/987654321/bonus');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

createTestUser()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 