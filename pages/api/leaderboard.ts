import { NextApiRequest, NextApiResponse } from 'next';
import { UserService } from '@/lib/db/services';

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
    
    // Получаем пользователей отсортированных по рекорду для указанного режима
    const users = await UserService.getTopUsers(Number(limit), gameMode as 'classic' | 'zen');
    console.log(`Users from DB for ${gameMode} mode:`, users);
    
    // Формируем простой список с именами, рекордами и аватарками
    const leaderboard = users.map(user => {
      const username = user.firstName || `User${user.id}`;
      const record = gameMode === 'zen' ? user.zenRecord : user.record;
      
      return {
        id: user.id,
        username,
        record,
        avatarUrl: user.avatarUrl || "/blue.svg"
      };
    });

    // Если запрашивается позиция конкретного пользователя
    let userPosition = null;
    console.log('Requested userId:', userId, 'gameMode:', gameMode);
    if (userId) {
      console.log('Getting position for userId:', userId, 'in', gameMode, 'mode');
      // Быстрый способ получить позицию пользователя для указанного режима
      userPosition = await UserService.getUserPosition(Number(userId), gameMode as 'classic' | 'zen');
      console.log('Calculated userPosition:', userPosition);
    }

    console.log(`Final ${gameMode} leaderboard:`, leaderboard);
    console.log('User position:', userPosition);
    
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