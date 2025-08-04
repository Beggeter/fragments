import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { users, userGames } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/utils/auth';
import { UserService } from '@/lib/db/services/userService';
import { GameService } from '@/lib/db/services/gameService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const { boardState, currentPieces, score, level, gameData } = req.body;

    // Получаем пользователя
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, parseInt(telegramId)))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentScore = score || 0;
    let recordUpdated = false;
    let newRecord = user[0].zenRecord;

    // Проверяем, является ли это новым рекордом для Zen режима
    if (currentScore > user[0].zenRecord) {
      newRecord = currentScore;
      recordUpdated = true;
    }

    // Получаем текущую активную игру
    const currentGame = await db
      .select()
      .from(userGames)
      .where(
        and(
          eq(userGames.userId, parseInt(telegramId)),
          eq(userGames.gameMode, 'zen'),
          eq(userGames.isActive, true)
        )
      )
      .limit(1);

    let updatedRecord = user[0].zenRecord;

    if (currentGame.length > 0) {
      // Обновляем существующую игру
      const updatedGame = await GameService.updateGame(
        currentGame[0].id,
        {
          boardState,
          currentPieces,
          score: currentScore,
          level,
          gameData
        },
        'zen'
      );

      if (recordUpdated) {
        // Обновляем Zen рекорд пользователя
        const userUpdateResult = await UserService.updateRecord(user[0].id, newRecord, 'zen');
        if (userUpdateResult) {
          updatedRecord = userUpdateResult.zenRecord;
          console.log('✅ Zen record updated during auto-save');
        }
      }
    } else {
      // Создаем новую игру
      const newGame = await GameService.createGame(
        user[0].id,
        {
          boardState,
          currentPieces,
          score: currentScore,
          level,
          gameData
        },
        'zen'
      );

      if (recordUpdated) {
        // Обновляем Zen рекорд пользователя
        const userUpdateResult = await UserService.updateRecord(user[0].id, newRecord, 'zen');
        if (userUpdateResult) {
          updatedRecord = userUpdateResult.zenRecord;
          console.log('✅ Zen record updated during auto-save');
        }
      }
    }

    return res.status(200).json({
      success: true,
      recordUpdated,
      newRecord: updatedRecord
    });
  } catch (error) {
    console.error('Error syncing Zen game:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 