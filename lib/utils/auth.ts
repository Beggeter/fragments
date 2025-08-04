import { NextRequest } from 'next/server';

export interface JWTPayload {
  userId: number;
  telegramId: number;
  exp: number;
}

// В реальном приложении используйте библиотеку JWT (например, jsonwebtoken)
export function generateJWT(payload: Omit<JWTPayload, 'exp'>): string {
  const tokenPayload: JWTPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 дней
  };
  
  return Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const payload: JWTPayload = JSON.parse(decoded);
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Токен истек
    }
    
    return payload;
  } catch (error) {
    return null; // Неверный токен
  }
}

export function getUserIdFromRequest(request: NextRequest): number | null {
  const userId = request.headers.get('x-user-id');
  return userId ? parseInt(userId, 10) : null;
}

export function getTelegramIdFromRequest(request: NextRequest): number | null {
  const telegramId = request.headers.get('x-telegram-id');
  return telegramId ? parseInt(telegramId, 10) : null;
}

// Функция для проверки роли пользователя
export function checkUserRole(userRole: string, requiredRole: 'user' | 'admin'): boolean {
  if (requiredRole === 'admin') {
    return userRole === 'admin';
  }
  return true; // Пользователи могут получить доступ к user endpoints
}

// Rate limiting утилита (простая реализация)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// Функция для проверки токена авторизации
export async function verifyToken(req: any): Promise<{ success: boolean; userId?: number; telegramId?: number }> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false };
    }

    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    
    if (!payload) {
      return { success: false };
    }

    return {
      success: true,
      userId: payload.userId,
      telegramId: payload.telegramId
    };
  } catch (error) {
    return { success: false };
  }
} 