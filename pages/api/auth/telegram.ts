import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateJWT, checkRateLimit } from '@/lib/utils/auth';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authData: TelegramAuthData = req.body;

    // Проверяем наличие всех необходимых полей
    if (!authData.id || !authData.first_name || !authData.auth_date || !authData.hash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Rate limiting для предотвращения атак
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`telegram_auth_${clientIP}`, 5, 60 * 1000)) { // 5 попыток в минуту
      return res.status(429).json({ error: 'Too many requests' });
    }

    // Проверяем время (данные не должны быть старше 1 дня)
    const authDate = new Date(authData.auth_date * 1000);
    const now = new Date();
    const timeDiff = now.getTime() - authDate.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 1 день

    if (timeDiff > maxAge) {
      return res.status(401).json({ error: 'Authentication data is too old' });
    }

    // Проверяем подпись Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const isValidSignature = verifyTelegramSignature(authData, botToken);
    if (!isValidSignature) {
      console.error('Invalid Telegram signature for user:', authData.id);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Ищем пользователя в базе данных
    let user = await db.select().from(users).where(eq(users.telegramId, authData.id)).limit(1);

    if (user.length === 0) {
      // Создаем нового пользователя
      const newUser = {
        telegramId: authData.id,
        firstName: authData.first_name,
        lastName: authData.last_name || null,
        username: authData.username || null,
        photoUrl: authData.photo_url || null,
        role: 'user' as const,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        currency: 1000, // Начальная валюта
      };

      const [createdUser] = await db.insert(users).values(newUser).returning();
      user = [createdUser];
      
      console.log('👤 New user created via Telegram:', authData.id, authData.first_name);
    } else {
      // Обновляем время последнего входа
      await db
        .update(users)
        .set({ 
          lastLoginAt: new Date(),
          firstName: authData.first_name,
          lastName: authData.last_name || null,
          username: authData.username || null,
          photoUrl: authData.photo_url || null,
        })
        .where(eq(users.telegramId, authData.id));
      
      console.log('👤 User logged in via Telegram:', authData.id, authData.first_name);
    }

    // Генерируем JWT токен
    const sessionToken = generateJWT({
      userId: user[0].id,
      telegramId: user[0].telegramId,
    });

    res.status(200).json({
      success: true,
      user: {
        id: user[0].id,
        telegramId: user[0].telegramId,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        username: user[0].username,
        photoUrl: user[0].photoUrl,
        role: user[0].role,
        currency: user[0].currency,
      },
      sessionToken,
    });

  } catch (error) {
    console.error('Error in Telegram auth:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Функция проверки подписи Telegram
function verifyTelegramSignature(authData: TelegramAuthData, botToken: string): boolean {
  try {
    // Создаем строку для проверки
    const dataCheckString = Object.keys(authData)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => `${key}=${authData[key as keyof TelegramAuthData]}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Вычисляем хеш
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return hash === authData.hash;
  } catch (error) {
    console.error('Error verifying Telegram signature:', error);
    return false;
  }
} 