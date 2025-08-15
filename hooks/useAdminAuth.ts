"use client";

import { useState, useEffect } from 'react';
import { safeLocalStorage } from '@/lib/utils/telegramSDK';

interface AdminAuthState {
  isAdmin: boolean;
  adminToken: string | null;
  expiresAt: string | null;
  isLoading: boolean;
}

export const useAdminAuth = () => {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAdmin: false,
    adminToken: null,
    expiresAt: null,
    isLoading: true,
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') {
      setAuthState({
        isAdmin: false,
        adminToken: null,
        expiresAt: null,
        isLoading: false,
      });
      return;
    }

    try {
      const adminToken = safeLocalStorage.getItem('adminToken');
      const expiresAt = safeLocalStorage.getItem('adminExpiresAt');

      if (!adminToken || !expiresAt) {
        setAuthState({
          isAdmin: false,
          adminToken: null,
          expiresAt: null,
          isLoading: false,
        });
        return;
      }

      // Проверяем, не истек ли срок действия
      const expirationDate = new Date(expiresAt);
      const now = new Date();

      if (now > expirationDate) {
        // Срок действия истек, очищаем данные
        safeLocalStorage.removeItem('adminToken');
        safeLocalStorage.removeItem('adminExpiresAt');
        
        setAuthState({
          isAdmin: false,
          adminToken: null,
          expiresAt: null,
          isLoading: false,
        });
        return;
      }

      // Админ-статус действителен
      setAuthState({
        isAdmin: true,
        adminToken,
        expiresAt,
        isLoading: false,
      });
    } catch (error) {
      // console.error('Error checking admin status:', error);
      setAuthState({
        isAdmin: false,
        adminToken: null,
        expiresAt: null,
        isLoading: false,
      });
    }
  };

  const loginAsAdmin = (adminToken: string, expiresAt: string) => {
    safeLocalStorage.setItem('adminToken', adminToken);
    safeLocalStorage.setItem('adminExpiresAt', expiresAt);
    
    setAuthState({
      isAdmin: true,
      adminToken,
      expiresAt,
      isLoading: false,
    });
  };

  const logoutAdmin = () => {
    safeLocalStorage.removeItem('adminToken');
    safeLocalStorage.removeItem('adminExpiresAt');
    
    setAuthState({
      isAdmin: false,
      adminToken: null,
      expiresAt: null,
      isLoading: false,
    });
  };

  const getTimeRemaining = (): string | null => {
    if (!authState.expiresAt) return null;
    
    const expirationDate = new Date(authState.expiresAt);
    const now = new Date();
    const diff = expirationDate.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}ч ${minutes}м`;
  };

  return {
    ...authState,
    loginAsAdmin,
    logoutAdmin,
    getTimeRemaining,
    checkAdminStatus,
  };
}; 