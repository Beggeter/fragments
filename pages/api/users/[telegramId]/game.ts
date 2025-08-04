import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { users, userGames } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/utils/auth';
import { UserService } from '@/lib/db/services/userService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { telegramId } = req.query;

  if (!telegramId || typeof telegramId !== 'string') {
    return res.status(400).json({ error: 'Invalid telegramId' });
  }

  // Проверяем авторизацию
  const authResult = await verifyToken(req);
  if (!authResult.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Получаем текущую Classic игру пользователя
      const currentGame = await db
        .select()
        .from(userGames)
        .where(
          and(
            eq(userGames.userId, parseInt(telegramId)),
            eq(userGames.gameMode, 'classic'),
            eq(userGames.isActive, true)
          )
        )
        .limit(1);

      if (currentGame.length === 0) {
        return res.status(404).json({ error: 'No active Classic game found' });
      }

      return res.status(200).json({
        currentGame: currentGame[0]
      });
    } else if (req.method === 'DELETE') {
      // Завершаем Classic игру
      const { finalScore, level, gameData } = req.body;

      // Получаем пользователя
      const user = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, parseInt(telegramId)))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Получаем текущую активную игру
      const currentGame = await db
        .select()
        .from(userGames)
        .where(
          and(
            eq(userGames.userId, parseInt(telegramId)),
            eq(userGames.gameMode, 'classic'),
            eq(userGames.isActive, true)
          )
        )
        .limit(1);

      let newRecord = user[0].record;
      let recordUpdated = false;

      // Проверяем, является ли это новым рекордом для Classic режима
      if (finalScore > user[0].record) {
        newRecord = finalScore;
        recordUpdated = true;

        // Обновляем Classic рекорд пользователя
        const updatedUser = await UserService.updateRecord(user[0].id, newRecord, 'classic');
        if (!updatedUser) {
          console.error('Failed to update Classic record for user:', user[0].id);
        }
      }

      // Деактивируем текущую игру
      if (currentGame.length > 0) {
        await db
          .update(userGames)
          .set({ 
            isActive: false,
            finalScore: finalScore,
            level: level,
            gameData: gameData,
            endedAt: new Date()
          })
          .where(eq(userGames.id, currentGame[0].id));
      }

      return res.status(200).json({
        success: true,
        recordUpdated,
        newRecord
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling Classic game:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 