import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Разрешаем всё в dev-режиме
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  // Защищенные API endpoints
  const protectedPaths = [
    '/api/users',
    '/api/games', 
    '/api/currency',
    '/api/boosters',
    '/api/leaderboard',
  ];

  // Исключения - endpoints которые не требуют авторизации
  const excludedPaths = [
    '/api/auth/', // все endpoints авторизации
    '/api/admin/', // админские endpoints
    '/api/telegram', // telegram webhook
    '/api/debug', // отладочные endpoints
    '/api/test-', // тестовые endpoints
  ];

  // Проверяем, является ли путь защищенным
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Проверяем, является ли путь исключением  
  const isExcludedPath = excludedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Применяем защиту только если путь защищен И НЕ является исключением
  if (isProtectedPath && !isExcludedPath) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      // Декодируем токен (в реальном приложении используйте JWT библиотеку)
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      const now = Math.floor(Date.now() / 1000);
      
      if (tokenData.exp < now) {
        return NextResponse.json(
          { error: 'Unauthorized - Token expired' },
          { status: 401 }
        );
      }

      // Добавляем данные пользователя в заголовки для использования в API
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', tokenData.userId.toString());
      requestHeaders.set('x-telegram-id', tokenData.telegramId.toString());

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/users/:path*',
    '/api/games/:path*',
    '/api/currency/:path*',
    '/api/boosters/:path*',
    '/api/leaderboard/:path*',
  ],
}; 