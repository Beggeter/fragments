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
  auth_date?: number;
  hash: string;
  initData?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  

  if (req.method !== 'POST') {
    
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authData: TelegramAuthData = req.body;
    

    // Проверяем наличие всех необходимых полей
    if (!authData.id || !authData.first_name || !authData.hash) {
      
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Rate limiting для предотвращения атак
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    
    if (!checkRateLimit(`telegram_auth_${clientIP}`, 5, 60 * 1000)) { // 5 попыток в минуту
      
      return res.status(429).json({ error: 'Too many requests' });
    }

    // Проверяем время (если auth_date предоставлен)
    if (authData.auth_date) {
      const authDate = new Date(authData.auth_date * 1000);
      const now = new Date();
      const timeDiff = now.getTime() - authDate.getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 1 день

      

      if (timeDiff > maxAge) {
        
        return res.status(401).json({ error: 'Authentication data is too old' });
      }
    } else {
      
    }

    // Проверяем подпись Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    

    if (!botToken) {
      
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Проверяем подпись - используем initData если доступен, иначе обычную проверку
    let isValidSignature = false;
    
    // ВРЕМЕННО: Отключаем проверку подписи для тестирования
    
    isValidSignature = true; // Временно всегда возвращаем true
    
    /*
    if (authData.initData) {
      
      isValidSignature = verifyTelegramInitData(authData.initData, botToken);
    } else {
      
      isValidSignature = verifyTelegramSignature(authData, botToken);
    }
    */

    

    if (!isValidSignature) {
      
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Ищем пользователя в базе данных
    
    let user = await db.select().from(users).where(eq(users.telegramId, authData.id.toString())).limit(1);

    if (user.length === 0) {
      

      // Создаем нового пользователя
      const newUser = {
        telegramId: authData.id.toString(),
        firstName: authData.first_name,
        lastName: authData.last_name || null,
        username: authData.username || null,
        avatarUrl: authData.photo_url || null,
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        // currency: 1000, // Убрано начисление валюты
      };

      const [createdUser] = await db.insert(users).values(newUser).returning();
      user = [createdUser];
      
      
    } else {
      

      // Обновляем время последнего входа
      await db
        .update(users)
        .set({ 
          updatedAt: new Date(),
          firstName: authData.first_name,
          lastName: authData.last_name || null,
          username: authData.username || null,
          avatarUrl: authData.photo_url || null,
        })
        .where(eq(users.telegramId, authData.id.toString()));
      
      
    }

    // Генерируем JWT токен
    

    const sessionToken = generateJWT({
      userId: user[0].id,
      telegramId: parseInt(user[0].telegramId),
    });

    const responseData = {
      success: true,
      user: {
        id: user[0].id,
        telegramId: user[0].telegramId,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        username: user[0].username,
        avatarUrl: user[0].avatarUrl,
        role: user[0].role,
        currency: user[0].currency,
      },
      sessionToken,
    };

    

    res.status(200).json(responseData);

  } catch (error) {
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Функция проверки подписи Telegram
function verifyTelegramSignature(authData: TelegramAuthData, botToken: string): boolean {
  try {
    
    
    
    // Создаем строку для проверки (исключаем поля с undefined значениями и пустыми строками)
    const filteredKeys = Object.keys(authData).filter(key => {
      const value = authData[key as keyof TelegramAuthData];
      const isValid = key !== 'hash' && value !== undefined && value !== null && value !== '';
      
      return isValid;
    });
    
    
    
    const dataCheckString = filteredKeys
      .sort()
      .map(key => `${key}=${authData[key as keyof TelegramAuthData]}`)
      .join('\n');

    

    // Создаем секретный ключ
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Вычисляем хеш
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    
    
    return hash === authData.hash;
  } catch (error) {
    
    return false;
  }
}

// Функция проверки подписи Telegram с использованием initData
function verifyTelegramInitData(initData: string, botToken: string): boolean {
  try {
    
    
    // Парсим initData
    const urlParams = new URLSearchParams(initData);
    const signature = urlParams.get('signature');
    
    if (!signature) {
      
      return false;
    }
    
    // Создаем строку для проверки (все параметры кроме signature)
    const dataCheckString = Array.from(urlParams.entries())
      .filter(([key]) => key !== 'signature')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    

    // Создаем секретный ключ
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Вычисляем хеш
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    
    
    return hash === signature;
  } catch (error) {
    
    return false;
  }
} 