import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DailyBonusService } from '@/lib/db/services/dailyBonusService';

const ALLOWED_TELEGRAM_ID = '610936383';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Daily bonus tools disabled in production' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, telegramId, payload } = req.body ?? {};

  if (!telegramId || telegramId !== ALLOWED_TELEGRAM_ID) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  if (user.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userId = user[0].id;

  try {
    switch (action) {
      case 'get-state': {
        const state = await DailyBonusService.getUserBonusState(userId);
        return res.status(200).json({ success: true, state });
      }
      case 'reset': {
        await DailyBonusService.forceReset(userId);
        const state = await DailyBonusService.getUserBonusState(userId);
        return res.status(200).json({ success: true, state });
      }
      case 'set-progress': {
        const { week, day } = payload || {};
        if (!Number.isFinite(week) || !Number.isFinite(day)) {
          return res.status(400).json({ error: 'Week and day must be provided' });
        }
        await DailyBonusService.setProgress(userId, week, day);
        if (payload?.allowClaimNow) {
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
          await DailyBonusService.setLastClaimDate(userId, yesterday);
        } else if (typeof payload?.lastClaimDate === 'string') {
          await DailyBonusService.setLastClaimDate(userId, new Date(payload.lastClaimDate));
        } else {
          await DailyBonusService.setLastClaimDate(userId, null);
        }
        const state = await DailyBonusService.getUserBonusState(userId);
        return res.status(200).json({ success: true, state });
      }
      case 'set-last-claim': {
        const { daysAgo, clear } = payload || {};
        if (clear) {
          await DailyBonusService.setLastClaimDate(userId, null);
        } else {
          if (typeof daysAgo !== 'number') {
            return res.status(400).json({ error: 'daysAgo must be a number' });
          }
          const targetDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          await DailyBonusService.setLastClaimDate(userId, targetDate);
        }
        const state = await DailyBonusService.getUserBonusState(userId);
        return res.status(200).json({ success: true, state });
      }
      case 'prepare-for-claim': {
        const { week, day } = payload || {};
        if (!Number.isFinite(week) || !Number.isFinite(day)) {
          return res.status(400).json({ error: 'Week and day must be provided' });
        }
        await DailyBonusService.prepareForClaim(userId, week, day);
        const state = await DailyBonusService.getUserBonusState(userId);
        return res.status(200).json({ success: true, state });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
