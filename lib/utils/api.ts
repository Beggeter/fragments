import { safeLocalStorage } from '@/utils/helpers';

// Вспомогательная функция для авторизованных API запросов
export const authorizedFetch = async (url: string, options: RequestInit = {}) => {
  const sessionToken = typeof window !== 'undefined' ? safeLocalStorage.getItem('sessionToken') : null;
  
  if (!sessionToken) {
    throw new Error('No session token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

// Проверяет, требует ли URL авторизации
export const isProtectedPath = (url: string): boolean => {
  const protectedPaths = ['/api/users', '/api/games', '/api/currency', '/api/boosters', '/api/leaderboard'];
  return protectedPaths.some(path => url.includes(path));
}; 

// Simple Redis client wrapper (lazy). The actual server-side usage will import a server-side module.