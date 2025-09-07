"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUser } from "@/hooks/useUser";
import { safeLocalStorage } from "@/lib/utils/telegramSDK";

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthManagerProps {
  isInitialized: boolean;
  isInTelegram: boolean;
  shouldAutoAuth: boolean;
  onAuthStateChange: (state: {
    authState: AuthState;
    isAdmin: boolean;
    isAuthenticated: boolean;
    user: any;
    sessionToken: string | null;
  }) => void;
}

export const AuthManager: React.FC<AuthManagerProps> = ({
  isInitialized,
  isInTelegram,
  shouldAutoAuth,
  onAuthStateChange
}) => {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [autoAuthCompleted, setAutoAuthCompleted] = useState(false);
  
  const {
    isAdmin,
    isLoading: adminLoading,
    loginAsAdmin,
    logoutAdmin,
  } = useAdminAuth();
  
  const {
    user,
    isLoading: userLoading,
    isAuthenticated,
    loginUser,
    logout,
    sessionToken,
  } = useUser();

  // Автоматическая авторизация в Telegram
  const performTelegramAutoAuth = useCallback(async () => {
    if (!isInTelegram || !shouldAutoAuth) return false;
    
    const tg = window.Telegram?.WebApp;
    if (!tg) return false;
    
    const user = tg.initDataUnsafe?.user;
    if (!user) return false;
    
    try {
      console.log('🔐 Starting Telegram auto-authentication for user:', user.id);
      
      const initData = tg.initData || "";
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get("hash");
      const authDate = urlParams.get("auth_date");

      if (!hash) {
        console.warn('⚠️ No hash found in Telegram initData');
        return false;
      }

      const authData = {
        ...user,
        hash: hash,
        auth_date: authDate ? parseInt(authDate) : undefined,
        initData: initData,
      };

      console.log('📡 Sending auth request to server...');
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authData),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('✅ Auto-auth successful, setting up session...');
        safeLocalStorage.setItem("sessionToken", data.sessionToken);
        safeLocalStorage.setItem("userData", JSON.stringify(data.user));
        loginUser(data.user, data.sessionToken);
        setAutoAuthCompleted(true);
        
        // Дополнительная задержка для стабилизации состояния
        await new Promise(resolve => setTimeout(resolve, 300));
        return true;
      } else {
        console.error('❌ Auth server error:', data);
        return false;
      }
    } catch (error) {
      console.error('Auto-auth failed:', error);
      return false;
    }
  }, [isInTelegram, shouldAutoAuth, loginUser]);

  // Выполняем автоматическую авторизацию
  useEffect(() => {
    if (!isInitialized) return;
    
    const runAutoAuth = async () => {
      if (shouldAutoAuth) {
        const success = await performTelegramAutoAuth();
        if (!success) {
          setAuthState('unauthenticated');
        }
      } else {
        // Проверяем существующую авторизацию
        const existingSessionToken = safeLocalStorage.getItem("sessionToken");
        const existingAdminToken = safeLocalStorage.getItem("adminToken");
        
        if (existingAdminToken) {
          setAuthState('authenticated');
        } else if (existingSessionToken) {
          setAuthState('authenticated');
        } else {
          setAuthState('unauthenticated');
        }
      }
    };
    
    runAutoAuth();
  }, [isInitialized, shouldAutoAuth, performTelegramAutoAuth]);

  // Отслеживаем изменения состояния авторизации
  useEffect(() => {
    if (adminLoading || userLoading) {
      setAuthState('loading');
      return;
    }

    if (isAdmin || isAuthenticated) {
      setAuthState('authenticated');
    } else if (autoAuthCompleted || !shouldAutoAuth) {
      setAuthState('unauthenticated');
    }

    onAuthStateChange({
      authState,
      isAdmin,
      isAuthenticated,
      user,
      sessionToken
    });
  }, [isAdmin, isAuthenticated, user, sessionToken, adminLoading, userLoading, authState, autoAuthCompleted, shouldAutoAuth, onAuthStateChange]);

  return null; // Этот компонент не рендерит UI
};
