import { NextApiRequest, NextApiResponse } from 'next';
import { UserService } from '@/lib/db/services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { limit = 20, userId } = req.query;
    
    // Получаем пользователей отсортированных по рекорду
    const users = await UserService.getTopUsers(Number(limit));
    console.log('Users from DB:', users);
    
    // Формируем простой список с именами, рекордами и аватарками
    const leaderboard = users.map(user => {
      const username = user.username || user.firstName || `User${user.id}`;
      
      return {
        id: user.id,
        username,
        record: user.record,
        avatarUrl: user.avatarUrl
      };
    });

    // Если запрашивается позиция конкретного пользователя
    let userPosition = null;
    console.log('Requested userId:', userId);
    if (userId) {
      console.log('Getting position for userId:', userId);
      // Быстрый способ получить позицию пользователя
      userPosition = await UserService.getUserPosition(Number(userId));
      console.log('Calculated userPosition:', userPosition);
    }

    console.log('Final leaderboard:', leaderboard);
    console.log('User position:', userPosition);
    
    return res.status(200).json({
      leaderboard,
      userPosition
    });
    
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 