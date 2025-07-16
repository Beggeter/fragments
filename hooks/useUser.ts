"use client";

import { useState, useEffect } from 'react';

interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  role: 'user' | 'admin';
  currency: number;
  createdAt: string;
  lastLoginAt: string;
  record: number;
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

  const checkUserSession = async () => {
    if (typeof window === 'undefined') {
      setUserState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    console.log("Checking user session...");

    // --- Admin mode (dev only) ---
    const adminMode = localStorage.getItem('adminMode');
    console.log("Admin mode:", adminMode, "NODE_ENV:", process.env.NODE_ENV);
    if (adminMode === 'true' && process.env.NODE_ENV === 'development') {
      console.log("Using admin mode, fetching user 610936383");
      try {
        const res = await fetch('/api/users/610936383');
        const user = await res.json();
        console.log("Admin user loaded:", user);
        setUserState({
          user,
          sessionToken: null,
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      } catch (e) {
        console.error("Error loading admin user:", e);
        setUserState(prev => ({ ...prev, isLoading: false }));
        return;
      }
    }

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const userData = localStorage.getItem('userData');
      
      console.log("Session token:", sessionToken ? "exists" : "missing");
      console.log("User data:", userData ? "exists" : "missing");

      if (sessionToken && userData) {
        const user = JSON.parse(userData);
        console.log("Parsed user data:", user);
        
        // Проверяем, не истек ли токен (простая проверка)
        const tokenData = JSON.parse(atob(sessionToken));
        const now = Math.floor(Date.now() / 1000);
        
        console.log("Token expiry:", tokenData.exp, "Current time:", now);
        
        if (tokenData.exp > now) {
          console.log("Token is valid, refreshing user data from server");
          // Всегда получаем свежие данные с сервера, особенно баланс
          await refreshUserData(user.telegramId, sessionToken);
          return;
        } else {
          console.log("Token expired, logging out");
          // Токен истек, очищаем данные
          logout();
        }
      } else {
        console.log("No session token or user data found");
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      logout();
    }

    setUserState(prev => ({ ...prev, isLoading: false }));
  };

  const refreshUserData = async (telegramId: number, sessionToken: string) => {
    try {
      const res = await fetch(`/api/users/${telegramId}`);
      if (res.ok) {
        const freshUser = await res.json();
        console.log("Fresh user data loaded from server:", freshUser);
        
        // Обновляем localStorage БЕЗ currency - баланс всегда с сервера
        const userDataForStorage = { ...freshUser };
        delete userDataForStorage.currency;
        localStorage.setItem('userData', JSON.stringify(userDataForStorage));
        
        setUserState({
          user: freshUser,
          sessionToken,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        console.error('Failed to refresh user data');
        setUserState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setUserState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loginUser = (user: User, sessionToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionToken', sessionToken);
      // Сохраняем данные пользователя БЕЗ баланса
      const userDataForStorage = { ...user };
      delete userDataForStorage.currency;
      localStorage.setItem('userData', JSON.stringify(userDataForStorage));
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
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userData');
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
        const userDataForStorage = { ...updatedUser };
        delete userDataForStorage.currency;
        localStorage.setItem('userData', JSON.stringify(userDataForStorage));
      }
      
      setUserState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    }
  };

  // Функция для обновления баланса - всегда получает свежие данные с сервера
  const refreshBalance = async () => {
    if (userState.user) {
      try {
        const res = await fetch(`/api/users/${userState.user.telegramId}`);
        if (res.ok) {
          const freshUser = await res.json();
          setUserState(prev => ({
            ...prev,
            user: prev.user ? { ...prev.user, currency: freshUser.currency } : null,
          }));
          return freshUser.currency;
        }
      } catch (error) {
        console.error('Error refreshing balance:', error);
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
  };
}; 