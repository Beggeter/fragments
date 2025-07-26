const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { boosterTypes, userBoosters, users } = require('../lib/db/schema');
const { eq } = require('drizzle-orm');

// Подключение к базе данных
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/fragments';
const client = postgres(connectionString);
const db = drizzle(client);

async function checkBoosters() {
  try {
    console.log('=== Проверка бустеров в базе данных ===\n');

    // Проверяем типы бустеров
    console.log('1. Типы бустеров:');
    const allBoosterTypes = await db.select().from(boosterTypes);
    console.log(allBoosterTypes);
    console.log('\n');

    // Проверяем пользователей
    console.log('2. Пользователи:');
    const allUsers = await db.select().from(users);
    console.log(allUsers);
    console.log('\n');

    // Проверяем бустеры пользователей
    console.log('3. Бустеры пользователей:');
    const allUserBoosters = await db.select().from(userBoosters);
    console.log(allUserBoosters);
    console.log('\n');

    // Проверяем конкретного пользователя (замените на ваш telegramId)
    const telegramId = process.argv[2] || '610936383';
    console.log(`4. Бустеры пользователя с telegramId ${telegramId}:`);
    
    const user = await db.select().from(users).where(eq(users.telegramId, parseInt(telegramId)));
    if (user.length > 0) {
      console.log('Пользователь найден:', user[0]);
      
      const userBoosterData = await db
        .select({
          userId: userBoosters.userId,
          boosterTypeId: userBoosters.boosterTypeId,
          quantity: userBoosters.quantity,
          boosterName: boosterTypes.name,
          boosterDescription: boosterTypes.description,
        })
        .from(userBoosters)
        .innerJoin(boosterTypes, eq(userBoosters.boosterTypeId, boosterTypes.id))
        .where(eq(userBoosters.userId, user[0].id));
      
      console.log('Бустеры пользователя:', userBoosterData);
    } else {
      console.log('Пользователь не найден');
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await client.end();
  }
}

checkBoosters(); 