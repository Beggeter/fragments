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

  const checkUserSession = () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const userData = localStorage.getItem('userData');

      if (sessionToken && userData) {
        const user = JSON.parse(userData);
        
        // Проверяем, не истек ли токен (простая проверка)
        const tokenData = JSON.parse(atob(sessionToken));
        const now = Math.floor(Date.now() / 1000);
        
        if (tokenData.exp > now) {
          setUserState({
            user,
            sessionToken,
            isLoading: false,
            isAuthenticated: true,
          });
          return;
        } else {
          // Токен истек, очищаем данные
          logout();
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      logout();
    }

    setUserState(prev => ({ ...prev, isLoading: false }));
  };

  const loginUser = (user: User, sessionToken: string) => {
    localStorage.setItem('sessionToken', sessionToken);
    localStorage.setItem('userData', JSON.stringify(user));
    
    setUserState({
      user,
      sessionToken,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userData');
    
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
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      setUserState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    }
  };

  const updateCurrency = (newAmount: number) => {
    updateUser({ currency: newAmount });
  };

  return {
    ...userState,
    loginUser,
    logout,
    updateUser,
    updateCurrency,
    checkUserSession,
  };
}; 