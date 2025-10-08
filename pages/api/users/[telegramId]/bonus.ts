import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/db';
import { users } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { DailyBonusService } from '../../../../lib/db/services/dailyBonusService';
import { DailyBonusResponse } from '../../../../lib/data/dailyBonusTypes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { telegramId } = req.query;

  if (!telegramId || typeof telegramId !== 'string') {
    return res.status(400).json({ error: 'Invalid telegram ID' });
  }

  try {
    // Получаем пользователя по telegram ID
    const user = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user[0].id;

    if (req.method === 'GET') {
      // GET - возвращаем состояние бонусов
      const bonusState = await DailyBonusService.getUserBonusState(userId);
      const bonusConfig = DailyBonusService.getBonusConfig();

      const response: DailyBonusResponse = {
        weeks: bonusConfig.weeks,
        currentWeek: bonusState.currentWeek,
        currentDay: bonusState.currentDay,
        canClaimToday: bonusState.canClaimToday,
        isClaimedToday: bonusState.isClaimedToday,
        streakLength: bonusState.streakLength,
        lastClaimDate: bonusState.lastClaimDate,
        nextClaimAvailableAt: bonusState.nextClaimAvailableAt,
        todayReward: bonusState.todayReward,
      };

      return res.status(200).json(response);
    } else if (req.method === 'POST') {
      // POST - получаем бонус
      try {
        const reward = await DailyBonusService.claimBonus(userId);
        const updatedState = await DailyBonusService.getUserBonusState(userId);
        
        return res.status(200).json({
          success: true,
          reward,
          message: 'Bonus claimed successfully',
          state: {
            currentWeek: updatedState.currentWeek,
            currentDay: updatedState.currentDay,
            canClaimToday: updatedState.canClaimToday,
            isClaimedToday: updatedState.isClaimedToday,
            streakLength: updatedState.streakLength,
            lastClaimDate: updatedState.lastClaimDate,
            nextClaimAvailableAt: updatedState.nextClaimAvailableAt,
            todayReward: updatedState.todayReward,
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          return res.status(400).json({
            success: false,
            error: error.message,
          });
        }
        return res.status(500).json({
          success: false,
          error: 'Failed to claim bonus',
        });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 