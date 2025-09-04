import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { dailyBonuses, users } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Только в dev режиме
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
  }

  try {
    ;

    // Находим тестового пользователя
    const testUser = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, '610936383'))
      .limit(1);

    if (testUser.length === 0) {
      return res.status(404).json({ error: 'Test user not found' });
    }

    const userId = testUser[0].id;
    ;

    // Сбрасываем состояние daily bonus
    await db
      .update(dailyBonuses)
      .set({
        currentWeek: 1,
        currentDay: 1,
        lastClaimDate: null,
        updatedAt: new Date(),
      })
      .where(eq(dailyBonuses.userId, userId));

    ;

    return res.status(200).json({ 
      success: true, 
      message: 'Test user bonus state reset successfully',
      userId
    });
  } catch (error) {
    console.error('❌ Error resetting bonus state:', error);
    return res.status(500).json({ 
      error: 'Failed to reset bonus state',
      details: error
    });
  }
} 