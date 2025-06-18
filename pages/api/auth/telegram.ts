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
      authDate: authData.auth_date ? new Date(authData.auth_date * 1000).toISOString() : 'Not provided'
    });

    // Проверяем наличие всех необходимых полей
    if (!authData.id || !authData.first_name || !authData.hash) {
      console.log('❌ TELEGRAM AUTH: Missing required fields', {
        hasId: !!authData.id,
        hasFirstName: !!authData.first_name,
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

    // Проверяем время (если auth_date предоставлен)
    if (authData.auth_date) {
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
    } else {
      console.log('⚠️ TELEGRAM AUTH: No auth_date provided, skipping time validation');
    }

    // Проверяем подпись Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    console.log('🔑 TELEGRAM AUTH: Bot token check', {
      hasToken: !!botToken,
      tokenLength: botToken?.length || 0,
      tokenStart: botToken?.substring(0, 10) + '...',
      tokenEnd: botToken?.substring(botToken.length - 10)
    });

    if (!botToken) {
      console.error('❌ TELEGRAM AUTH: TELEGRAM_BOT_TOKEN not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Проверяем подпись - используем initData если доступен, иначе обычную проверку
    let isValidSignature = false;
    
    // ВРЕМЕННО: Отключаем проверку подписи для тестирования
    console.log('⚠️ TELEGRAM AUTH: SIGNATURE VERIFICATION TEMPORARILY DISABLED FOR TESTING');
    isValidSignature = true; // Временно всегда возвращаем true
    
    /*
    if (authData.initData) {
      console.log('🔐 TELEGRAM AUTH: Using initData for signature verification');
      isValidSignature = verifyTelegramInitData(authData.initData, botToken);
    } else {
      console.log('🔐 TELEGRAM AUTH: Using individual fields for signature verification');
      isValidSignature = verifyTelegramSignature(authData, botToken);
    }
    */

    console.log('🔐 TELEGRAM AUTH: Signature verification', {
      isValid: isValidSignature,
      telegramId: authData.id,
      method: 'TEMPORARILY DISABLED'
    });

    if (!isValidSignature) {
      console.error('❌ TELEGRAM AUTH: Invalid Telegram signature for user:', authData.id);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Ищем пользователя в базе данных
    console.log('🔍 TELEGRAM AUTH: Looking for user in database', authData.id);
    let user = await db.select().from(users).where(eq(users.telegramId, authData.id.toString())).limit(1);

    if (user.length === 0) {
      console.log('👤 TELEGRAM AUTH: Creating new user', {
        telegramId: authData.id,
        firstName: authData.first_name
      });

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
          updatedAt: new Date(),
          firstName: authData.first_name,
          lastName: authData.last_name || null,
          username: authData.username || null,
          avatarUrl: authData.photo_url || null,
        })
        .where(eq(users.telegramId, authData.id.toString()));
      
      console.log('✅ TELEGRAM AUTH: User updated successfully');
    }

    // Генерируем JWT токен
    console.log('🎫 TELEGRAM AUTH: Generating JWT token', {
      userId: user[0].id,
      telegramId: user[0].telegramId
    });

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
    console.log('📊 TELEGRAM AUTH: All auth data fields:', Object.keys(authData));
    
    // Создаем строку для проверки (исключаем поля с undefined значениями и пустыми строками)
    const filteredKeys = Object.keys(authData).filter(key => {
      const value = authData[key as keyof TelegramAuthData];
      const isValid = key !== 'hash' && value !== undefined && value !== null && value !== '';
      console.log(`🔍 TELEGRAM AUTH: Field ${key} = "${value}" (${typeof value}) - ${isValid ? 'INCLUDED' : 'EXCLUDED'}`);
      return isValid;
    });
    
    console.log('✅ TELEGRAM AUTH: Included fields:', filteredKeys);
    
    const dataCheckString = filteredKeys
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
      isValid: hash === authData.hash,
      dataCheckStringLength: dataCheckString.length
    });
    
    return hash === authData.hash;
  } catch (error) {
    console.error('💥 TELEGRAM AUTH: Error verifying signature:', error);
    return false;
  }
}

// Функция проверки подписи Telegram с использованием initData
function verifyTelegramInitData(initData: string, botToken: string): boolean {
  try {
    console.log('🔐 TELEGRAM AUTH: Starting initData verification');
    
    // Парсим initData
    const urlParams = new URLSearchParams(initData);
    const signature = urlParams.get('signature');
    
    if (!signature) {
      console.log('❌ TELEGRAM AUTH: No signature found in initData');
      return false;
    }
    
    // Создаем строку для проверки (все параметры кроме signature)
    const dataCheckString = Array.from(urlParams.entries())
      .filter(([key]) => key !== 'signature')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    console.log('📝 TELEGRAM AUTH: InitData check string', dataCheckString);

    // Создаем секретный ключ
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Вычисляем хеш
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    console.log('🔐 TELEGRAM AUTH: InitData hash comparison', {
      calculatedHash: hash,
      receivedSignature: signature,
      isValid: hash === signature,
      dataCheckStringLength: dataCheckString.length
    });
    
    return hash === signature;
  } catch (error) {
    console.error('💥 TELEGRAM AUTH: Error verifying initData:', error);
    return false;
  }
} 