import { NextApiRequest, NextApiResponse } from 'next';
import { UserService } from '@/lib/db/services';
import { getRedis, leaderboardKey, userPositionKey, redisGetWithTimeout, redisSetWithTimeout } from '@/lib/utils/redis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { limit = 20, userId, gameMode = 'classic' } = req.query;
    
    // Валидируем gameMode
    if (gameMode !== 'classic' && gameMode !== 'zen') {
      return res.status(400).json({ error: 'Invalid gameMode. Must be "classic" or "zen"' });
    }
    
    const mode = (gameMode as 'classic' | 'zen');
    const lbKey = leaderboardKey(mode);
    let leaderboard: Array<{ id: number; username: string; record: number; avatarUrl?: string }>|null = null;

    // Пытаемся отдать из кэша
    leaderboard = await redisGetWithTimeout(lbKey, 100);

    if (!leaderboard) {
      // Получаем пользователей отсортированных по рекорду
      const users = await UserService.getTopUsers(Number(limit), mode);
      // Формируем простой список с именами, рекордами и аватарками
      leaderboard = users.map(user => {
        const username = user.firstName || `User${user.id}`;
        const record = mode === 'zen' ? user.zenRecord : user.record;
        return {
          id: user.id,
          username,
          record,
          avatarUrl: user.avatarUrl || "/blue.svg"
        };
      });
      // Кладём в кэш на 60 сек
      await redisSetWithTimeout(lbKey, leaderboard, 60, 100);
    }

    // Если запрашивается позиция конкретного пользователя
    let userPosition = null;
    if (userId) {
      const uid = Number(userId);
      // сначала пробуем кэш позиции на 60 сек
      const cachedPos = await redisGetWithTimeout<string>(userPositionKey(uid, mode), 80);
      if (cachedPos) userPosition = Number(cachedPos);
      if (!userPosition) {
        userPosition = await UserService.getUserPosition(uid, mode);
        if (userPosition) await redisSetWithTimeout(userPositionKey(uid, mode), String(userPosition), 60, 80);
      }
    }

    // Edge CDN cache headers (если за CDN)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

    return res.status(200).json({
      leaderboard,
      userPosition,
      gameMode
    });
    
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 