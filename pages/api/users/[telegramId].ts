import { NextApiRequest, NextApiResponse } from 'next';
import { UserService } from '@/lib/db/services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { telegramId } = req.query;

  if (!telegramId || typeof telegramId !== 'string') {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Получение пользователя
        const user = await UserService.getUserByTelegramId(telegramId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(user);

      case 'POST':
        // Создание нового пользователя
        const { username, firstName, lastName, avatarUrl, role = 'user' } = req.body;
        
        if (!username) {
          return res.status(400).json({ error: 'Username is required' });
        }

        const existingUser = await UserService.getUserByTelegramId(telegramId);
        if (existingUser) {
          return res.status(409).json({ error: 'User already exists' });
        }

        const newUser = await UserService.createUser({
          telegramId,
          username,
          firstName,
          lastName,
          avatarUrl,
          role,
        });

        return res.status(201).json(newUser);

      case 'PUT':
        // Обновление пользователя
        const updates = req.body;
        const userToUpdate = await UserService.getUserByTelegramId(telegramId);
        
        if (!userToUpdate) {
          return res.status(404).json({ error: 'User not found' });
        }

        const updatedUser = await UserService.updateUser(userToUpdate.id, updates);
        return res.status(200).json(updatedUser);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 