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
  console.log('🔐 TELEGRAM AUTH: Request received', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  if (req.method !== 'POST') {
    console.log('❌ TELEGRAM AUTH: Method not allowed', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authData: TelegramAuthData = req.body;
    console.log('📋 TELEGRAM AUTH: Processing auth data', {
      telegramId: authData.id,
      firstName: authData.first_name,
      hasHash: !!authData.hash,
      authDate: new Date(authData.auth_date * 1000).toISOString()
    });

    // Проверяем наличие всех необходимых полей
    if (!authData.id || !authData.first_name || !authData.auth_date || !authData.hash) {
      console.log('❌ TELEGRAM AUTH: Missing required fields', {
        hasId: !!authData.id,
        hasFirstName: !!authData.first_name,
        hasAuthDate: !!authData.auth_date,
        hasHash: !!authData.hash
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Rate limiting для предотвращения атак
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    console.log('🌐 TELEGRAM AUTH: Client IP', clientIP);
    
    if (!checkRateLimit(`telegram_auth_${clientIP}`, 5, 60 * 1000)) { // 5 попыток в минуту
      console.log('⚠️ TELEGRAM AUTH: Rate limit exceeded for IP', clientIP);
      return res.status(429).json({ error: 'Too many requests' });
    }

    // Проверяем время (данные не должны быть старше 1 дня)
    const authDate = new Date(authData.auth_date * 1000);
    const now = new Date();
    const timeDiff = now.getTime() - authDate.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 1 день

    console.log('⏰ TELEGRAM AUTH: Time validation', {
      authDate: authDate.toISOString(),
      now: now.toISOString(),
      timeDiff: timeDiff,
      maxAge: maxAge,
      isValid: timeDiff <= maxAge
    });

    if (timeDiff > maxAge) {
      console.log('❌ TELEGRAM AUTH: Authentication data is too old');
      return res.status(401).json({ error: 'Authentication data is too old' });
    }

    // Проверяем подпись Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    console.log('🔑 TELEGRAM AUTH: Bot token check', {
      hasToken: !!botToken,
      tokenLength: botToken?.length || 0
    });

    if (!botToken) {
      console.error('❌ TELEGRAM AUTH: TELEGRAM_BOT_TOKEN not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const isValidSignature = verifyTelegramSignature(authData, botToken);
    console.log('🔐 TELEGRAM AUTH: Signature verification', {
      isValid: isValidSignature,
      telegramId: authData.id
    });

    if (!isValidSignature) {
      console.error('❌ TELEGRAM AUTH: Invalid Telegram signature for user:', authData.id);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Ищем пользователя в базе данных
    console.log('🔍 TELEGRAM AUTH: Looking for user in database', authData.id);
    let user = await db.select().from(users).where(eq(users.telegramId, authData.id)).limit(1);

    if (user.length === 0) {
      console.log('👤 TELEGRAM AUTH: Creating new user', {
        telegramId: authData.id,
        firstName: authData.first_name
      });

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
      
      console.log('✅ TELEGRAM AUTH: New user created', {
        telegramId: authData.id,
        userId: createdUser.id,
        firstName: authData.first_name
      });
    } else {
      console.log('👤 TELEGRAM AUTH: Updating existing user', {
        telegramId: authData.id,
        userId: user[0].id,
        firstName: authData.first_name
      });

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
      
      console.log('✅ TELEGRAM AUTH: User updated successfully');
    }

    // Генерируем JWT токен
    console.log('🎫 TELEGRAM AUTH: Generating JWT token', {
      userId: user[0].id,
      telegramId: user[0].telegramId
    });

    const sessionToken = generateJWT({
      userId: user[0].id,
      telegramId: user[0].telegramId,
    });

    const responseData = {
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
    };

    console.log('✅ TELEGRAM AUTH: Success response', {
      telegramId: user[0].telegramId,
      userId: user[0].id,
      hasSessionToken: !!sessionToken
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error('💥 TELEGRAM AUTH: Error in handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Функция проверки подписи Telegram
function verifyTelegramSignature(authData: TelegramAuthData, botToken: string): boolean {
  try {
    console.log('🔐 TELEGRAM AUTH: Starting signature verification');
    
    // Создаем строку для проверки
    const dataCheckString = Object.keys(authData)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => `${key}=${authData[key as keyof TelegramAuthData]}`)
      .join('\n');

    console.log('📝 TELEGRAM AUTH: Data check string', dataCheckString);

    // Создаем секретный ключ
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Вычисляем хеш
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    console.log('🔐 TELEGRAM AUTH: Hash comparison', {
      calculatedHash: hash,
      receivedHash: authData.hash,
      isValid: hash === authData.hash
    });
    
    return hash === authData.hash;
  } catch (error) {
    console.error('💥 TELEGRAM AUTH: Error verifying signature:', error);
    return false;
  }
} 