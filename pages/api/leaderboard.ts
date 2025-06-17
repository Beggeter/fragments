import { NextApiRequest, NextApiResponse } from 'next';
import { GameService, UserService, CurrencyService } from '@/lib/db/services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        const { type = 'records', limit = 10 } = req.query;
        
        if (type === 'records') {
          // Глобальные рекорды
          const records = await GameService.getGlobalRecords(Number(limit));
          
          // Получаем информацию о пользователях для каждого рекорда
          const recordsWithUsers = await Promise.all(
            records.map(async (record) => {
              const user = await UserService.getUserById(record.userId);
              return {
                ...record,
                user: user ? {
                  id: user.id,
                  username: user.username,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatarUrl: user.avatarUrl,
                } : null,
              };
            })
          );

          return res.status(200).json(recordsWithUsers);

        } else if (type === 'currency') {
          // Топ пользователей по валюте
          const topUsers = await CurrencyService.getTopUsersByCurrency(Number(limit));
          
          // Получаем полную информацию о пользователях
          const topUsersWithInfo = await Promise.all(
            topUsers.map(async ({ userId, currency }) => {
              const user = await UserService.getUserById(userId);
              return {
                userId,
                currency,
                user: user ? {
                  id: user.id,
                  username: user.username,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatarUrl: user.avatarUrl,
                } : null,
              };
            })
          );

          return res.status(200).json(topUsersWithInfo);

        } else if (type === 'stats') {
          // Общая статистика
          const [topUsers, globalStats, currencyStats] = await Promise.all([
            UserService.getTopUsers(10),
            GameService.getGlobalRecords(1), // Для получения лучшего рекорда
            CurrencyService.getGlobalCurrencyStats(),
          ]);

          return res.status(200).json({
            topUsers,
            bestRecord: globalStats[0] || null,
            currencyStats,
          });

        } else {
          return res.status(400).json({ error: 'Invalid type. Use "records", "currency", or "stats"' });
        }

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 