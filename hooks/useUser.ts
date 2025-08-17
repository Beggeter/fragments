"use client";

import { useState, useEffect } from 'react';
import { safeLocalStorage } from '@/lib/utils/telegramSDK';
import { cachedFetch, resourceCache } from '@/lib/utils/resourceCache';

interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'tester' | 'premium';
  currency: number;
  createdAt: string;
  lastLoginAt: string;
  record: number; // Classic mode record
  zenRecord: number; // Zen mode record
  hasZenSubscription: boolean; // Статус ZEN подписки
  zenSubscriptionEndDate?: string; // Дата окончания ZEN подписки
}

interface UserState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useUser = () => {
  const [userState, setUserState] = useState<UserState>({
    user: null,
    sessionToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    checkUserSession();
  }, []);

  // Обработчик события обновления рекорда из автосохранения
  useEffect(() => {
    const handleRecordUpdated = (event: CustomEvent) => {
      const { newRecord, gameMode = 'classic' } = event.detail;
      // console.log('🎯 Received recordUpdated event:', newRecord, 'for gameMode:', gameMode);
      
      setUserState(prev => {
        if (prev.user) {
          const currentRecord = gameMode === 'zen' ? prev.user.zenRecord : prev.user.record;
          if (newRecord > currentRecord) {
            // console.log(`📈 Updating local user ${gameMode} record from`, currentRecord, 'to', newRecord);
            return {
              ...prev,
              user: {
                ...prev.user,
                ...(gameMode === 'zen' ? { zenRecord: newRecord } : { record: newRecord })
              }
            };
          }
        }
        return prev;
      });
    };

    window.addEventListener('recordUpdated', handleRecordUpdated as EventListener);
    
    return () => {
      window.removeEventListener('recordUpdated', handleRecordUpdated as EventListener);
    };
  }, []);

  const checkUserSession = async () => {
    if (typeof window === 'undefined') {
      setUserState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // console.log("Checking user session...");

    // --- Admin mode (dev only) ---
    const adminMode = safeLocalStorage.getItem('adminMode');
    // console.log("Admin mode:", adminMode, "NODE_ENV:", process.env.NODE_ENV);
    if (adminMode === 'true' && process.env.NODE_ENV === 'development') {
      // console.log("Using admin mode, fetching user 610936383");
      try {
        const res = await fetch('/api/users/610936383');
        const user = await res.json();
        // console.log("Admin user loaded:", user);
        
        setUserState({
          user,
          sessionToken: null,
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      } catch (e) {
        // console.error("Error loading admin user:", e);
        setUserState(prev => ({ ...prev, isLoading: false }));
        return;
      }
    }

    try {
      const sessionToken = safeLocalStorage.getItem('sessionToken');
      const userData = safeLocalStorage.getItem('userData');
      
      // console.log("Session token:", sessionToken ? "exists" : "missing");
      // console.log("User data:", userData ? "exists" : "missing");

      if (sessionToken && userData) {
        const user = JSON.parse(userData);
        // console.log("Parsed user data:", user);
        
        // Проверяем, не истек ли токен (простая проверка)
        const tokenData = JSON.parse(atob(sessionToken));
        const now = Math.floor(Date.now() / 1000);
        
        // console.log("Token expiry:", tokenData.exp, "Current time:", now);
        
        if (tokenData.exp > now) {
          // console.log("Token is valid, refreshing user data from server");
          // Всегда получаем свежие данные с сервера, особенно баланс
          await refreshUserData(user.telegramId, sessionToken);
          return;
        } else {
          // console.log("Token expired, logging out");
          // Токен истек, очищаем данные
          logout();
        }
      } else {
        // console.log("No session token or user data found");
      }
    } catch (error) {
      // console.error('Error checking user session:', error);
      logout();
    }

    setUserState(prev => ({ ...prev, isLoading: false }));
  };

  const refreshUserData = async (telegramId: number, sessionToken: string) => {
    try {
      // ✅ Добавляем таймаут для запросов на медленных соединениях
      const connection = (navigator as any)?.connection;
      const isSlowConnection = connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType);
      const timeoutMs = isSlowConnection ? 15000 : 8000;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      // ✅ Используем кэшированный запрос для лучшей производительности
      const userData = await cachedFetch<User>(`/api/users/${telegramId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        },
        signal: controller.signal
      }, 60000); // Кэшируем на 1 минуту
      
      clearTimeout(timeoutId);
      
      // console.log("Fresh user data loaded from server:", userData);
      
      // Обновляем localStorage БЕЗ currency - баланс всегда с сервера
      const { currency, ...userDataForStorage } = userData;
      safeLocalStorage.setItem('userData', JSON.stringify(userDataForStorage));
      
      setUserState({
        user: userData,
        sessionToken,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      // console.error('Error refreshing user data:', error);
      // ✅ Даже при ошибке сети показываем данные из localStorage если они есть
      const userData = safeLocalStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserState({
            user,
            sessionToken,
            isLoading: false,
            isAuthenticated: true,
          });
          return;
        } catch (parseError) {
          // Ignore parse error and continue with error state
        }
      }
      setUserState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loginUser = (user: User, sessionToken: string) => {
    if (typeof window !== 'undefined') {
      safeLocalStorage.setItem('sessionToken', sessionToken);
      // Сохраняем данные пользователя БЕЗ баланса
      const { currency, ...userDataForStorage } = user;
      safeLocalStorage.setItem('userData', JSON.stringify(userDataForStorage));
    }
    
    setUserState({
      user,
      sessionToken,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      safeLocalStorage.removeItem('sessionToken');
      safeLocalStorage.removeItem('userData');
    }
    
    setUserState({
      user: null,
      sessionToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const updateUser = (updates: Partial<User>) => {
    if (userState.user) {
      const updatedUser = { ...userState.user, ...updates };
      
      // Обновляем localStorage БЕЗ currency
      if (typeof window !== 'undefined') {
        const { currency, ...userDataForStorage } = updatedUser;
        safeLocalStorage.setItem('userData', JSON.stringify(userDataForStorage));
      }
      
      setUserState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    }
  };

  // Функция для обновления баланса - всегда получает свежие данные с сервера
  const refreshBalance = async () => {
    if (userState.user && userState.sessionToken) {
      try {
        const res = await fetch(`/api/users/${userState.user.telegramId}`, {
          headers: {
            'Authorization': `Bearer ${userState.sessionToken}`
          }
        });
        if (res.ok) {
          const freshUser = await res.json();
          setUserState(prev => ({
            ...prev,
            user: prev.user ? { ...prev.user, currency: freshUser.currency } : null,
          }));
          return freshUser.currency;
        }
      } catch (error) {
        // console.error('Error refreshing balance:', error);
      }
    }
    return userState.user?.currency || 0;
  };

  // Функция для обновления валюты - теперь НЕ сохраняет в localStorage
  const updateCurrency = (newAmount: number) => {
    if (userState.user) {
      setUserState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, currency: newAmount } : null,
      }));
    }
  };

  return {
    ...userState,
    loginUser,
    logout,
    updateUser,
    updateCurrency,
    refreshBalance,
    checkUserSession,
    sessionToken: userState.sessionToken,
  };
}; 