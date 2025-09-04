"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { init, useLaunchParams, initData, miniApp } from "@telegram-apps/sdk-react";
import { useUserStore } from "@/store/user";
import { safeLocalStorage } from "@/lib/utils/telegramSDK";

interface AuthContextType {
  isInitialized: boolean;
  isTelegramReady: boolean;
  error: string | null;
  launchParams: any;
  initData: any;
  loginUser: (user: any, sessionToken: string) => Promise<void>;
  loginAdmin: (adminToken: string, expiresAt: string) => Promise<void>;
  logout: () => void;
  refreshUserData: (telegramId: number, sessionToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
  isTelegramReady: false,
  error: null,
  launchParams: null,
  initData: null,
  loginUser: async () => {},
  loginAdmin: async () => {},
  logout: () => {},
  refreshUserData: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTelegramReady, setIsTelegramReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Используем новые хуки Telegram SDK v3
  const launchParams = useLaunchParams();

  const {
    setUser,
    setAdmin,
    setSessionToken,
    setAdminToken,
    setLoading,
    setAuthenticated,
    setAdminStatus,
    clearAuth,
  } = useUserStore();

  // Инициализация Telegram SDK
  useEffect(() => {
    const initializeTelegram = async () => {
      try {
        setLoading(true);
        setError(null);

        // Инициализируем новый Telegram SDK v3
        await init();
        
        // Правильное монтирование компонентов
        if (miniApp.mountSync.isAvailable()) {
          miniApp.mountSync();
          console.log("MiniApp mounted:", miniApp.isMounted());
        }
        
        setIsTelegramReady(true);
        
        // Проверяем кешированную авторизацию
        await checkCachedAuth();
        
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize Telegram SDK:", err);
        setError(err instanceof Error ? err.message : "Initialization failed");
        setIsInitialized(true); // Продолжаем работу даже при ошибке
      } finally {
        setLoading(false);
      }
    };

    initializeTelegram();
  }, []);

  // Проверка кешированной авторизации
  const checkCachedAuth = async () => {
    try {
      // Проверяем админ-токен
      const adminToken = safeLocalStorage.getItem("adminToken");
      const adminExpiresAt = safeLocalStorage.getItem("adminExpiresAt");
      
      if (adminToken && adminExpiresAt) {
        const expirationDate = new Date(adminExpiresAt);
        if (new Date() < expirationDate) {
          // Админ-токен валиден
          setAdminToken(adminToken);
          setAdminStatus(true);
          setAuthenticated(true);
          return;
        } else {
          // Токен истек, очищаем
          safeLocalStorage.removeItem("adminToken");
          safeLocalStorage.removeItem("adminExpiresAt");
        }
      }

      // Проверяем пользовательскую сессию
      const sessionToken = safeLocalStorage.getItem("sessionToken");
      const userData = safeLocalStorage.getItem("userData");
      
      if (sessionToken && userData) {
        try {
          const user = JSON.parse(userData);
          
          // Валидируем токен
          const tokenData = JSON.parse(atob(sessionToken));
          const now = Math.floor(Date.now() / 1000);
          
          if (tokenData.exp > now && user.telegramId) {
            // Токен валиден, обновляем данные с сервера
            await refreshUserData(user.telegramId, sessionToken);
            return;
          } else {
            // Токен истек
            clearAuth();
          }
        } catch (err) {
          console.error("Invalid cached data:", err);
          clearAuth();
        }
      }
    } catch (err) {
      console.error("Error checking cached auth:", err);
      clearAuth();
    }
  };

  // Обновление данных пользователя с сервера
  const refreshUserData = async (telegramId: number, sessionToken: string) => {
    try {
      const response = await fetch(`/api/users/${telegramId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (response.ok) {
        const freshUser = await response.json();
        
        // Обновляем localStorage (без currency)
        const { currency, ...userDataForStorage } = freshUser;
        safeLocalStorage.setItem('userData', JSON.stringify(userDataForStorage));
        
        // Обновляем store
        setUser(freshUser);
        setSessionToken(sessionToken);
        setAuthenticated(true);
        setAdminStatus(false);
      } else {
        // Ошибка сервера, очищаем авторизацию
        clearAuth();
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
      clearAuth();
    }
  };

  // Авторизация пользователя через Telegram
  const loginUser = async (user: any, sessionToken: string) => {
    try {
      // Сохраняем в localStorage
      safeLocalStorage.setItem('sessionToken', sessionToken);
      const { currency, ...userDataForStorage } = user;
      safeLocalStorage.setItem('userData', JSON.stringify(userDataForStorage));
      
      // Обновляем store
      setUser(user);
      setSessionToken(sessionToken);
      setAuthenticated(true);
      setAdminStatus(false);
    } catch (err) {
      console.error("Error saving user data:", err);
      clearAuth();
    }
  };

  // Авторизация админа
  const loginAdmin = async (adminToken: string, expiresAt: string) => {
    try {
      // Сохраняем в localStorage
      safeLocalStorage.setItem('adminToken', adminToken);
      safeLocalStorage.setItem('adminExpiresAt', expiresAt);
      
      // Обновляем store
      setAdminToken(adminToken);
      setAdminStatus(true);
      setAuthenticated(true);
    } catch (err) {
      console.error("Error saving admin data:", err);
      clearAuth();
    }
  };

  // Выход из системы
  const logout = () => {
    // Очищаем localStorage
    safeLocalStorage.removeItem('sessionToken');
    safeLocalStorage.removeItem('userData');
    safeLocalStorage.removeItem('adminToken');
    safeLocalStorage.removeItem('adminExpiresAt');
    
    // Очищаем store
    clearAuth();
  };

  // Экспортируем методы для использования в компонентах
  const contextValue: AuthContextType & {
    loginUser: typeof loginUser;
    loginAdmin: typeof loginAdmin;
    logout: typeof logout;
    refreshUserData: typeof refreshUserData;
  } = {
    isInitialized,
    isTelegramReady,
    error,
    launchParams,
    initData,
    loginUser,
    loginAdmin,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
