import { NextApiRequest, NextApiResponse } from 'next';
import { addActivePassword } from './verify-password';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Генерируем случайный 6-значный пароль
    const password = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 часов
    
    // Добавляем пароль в активные
    addActivePassword(password, expiresAt);
    
    // Выводим пароль в консоль сервера
    ;
    ;
    ;
    ;
    ;
    
    // Возвращаем успешный ответ без пароля
    res.status(200).json({ 
      success: true,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('❌ Error in generate-password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 