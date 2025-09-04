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
    ;

    // Проверяем типы бустеров
    ;
    const allBoosterTypes = await db.select().from(boosterTypes);
    ;
    ;

    // Проверяем пользователей
    ;
    const allUsers = await db.select().from(users);
    ;
    ;

    // Проверяем бустеры пользователей
    ;
    const allUserBoosters = await db.select().from(userBoosters);
    ;
    ;

    // Проверяем конкретного пользователя (замените на ваш telegramId)
    const telegramId = process.argv[2] || '610936383';
    ;
    
    const user = await db.select().from(users).where(eq(users.telegramId, parseInt(telegramId)));
    if (user.length > 0) {
      ;
      
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
      
      ;
    } else {
      ;
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await client.end();
  }
}

checkBoosters(); 