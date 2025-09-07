"use client";

import { useEffect, useState, useCallback } from "react";
import { init } from "@telegram-apps/sdk";
import { initializeTelegramWebApp, isLaunchedInTelegram, safeLocalStorage } from "@/lib/utils/telegramSDK";

export type AppState = 'idle' | 'transitioning' | 'error' | 'loading';

interface AppInitializerProps {
  onInitializationComplete: (state: {
    isInitialized: boolean;
    appState: AppState;
    isInTelegram: boolean;
    hasValidCache: boolean;
    shouldAutoAuth: boolean;
  }) => void;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ onInitializationComplete }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [appState, setAppState] = useState<AppState>('loading');

  const initializeApp = useCallback(async () => {
    console.log('🚀 Starting app initialization...');
    setAppState('loading');
    
    try {
      // Инициализируем TMA SDK
      await init();
      console.log('✅ TMA SDK initialized');
    } catch (error) {
      console.warn('Failed to initialize @telegram-apps/sdk:', error);
      setAppState('error');
      onInitializationComplete({
        isInitialized: false,
        appState: 'error',
        isInTelegram: false,
        hasValidCache: false,
        shouldAutoAuth: false
      });
      return;
    }
    
    // Инициализируем Telegram WebApp
    let telegramSuccess = false;
    try {
      telegramSuccess = await initializeTelegramWebApp();
      console.log('📱 Telegram WebApp initialization:', telegramSuccess ? 'success' : 'failed');
    } catch (error) {
      console.error('❌ Error during Telegram initialization:', error);
      telegramSuccess = false;
    }
    
    // Проверяем кеш пользователя
    const existingSessionToken = safeLocalStorage.getItem("sessionToken");
    const existingAdminToken = safeLocalStorage.getItem("adminToken");
    const cachedUser = safeLocalStorage.getItem("userData");
    
    let hasValidCache = false;
    if (existingSessionToken && cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed && typeof parsed.telegramId !== 'undefined' && parsed.telegramId !== null) {
          hasValidCache = true;
        }
      } catch {
        // битый кеш — игнорируем
      }
    }
    
    const isInTelegram = isLaunchedInTelegram();
    const shouldAutoAuth = isInTelegram && telegramSuccess && !hasValidCache && !existingAdminToken;
    
    setIsInitialized(true);
    setAppState('idle');
    
    onInitializationComplete({
      isInitialized: true,
      appState: 'idle',
      isInTelegram,
      hasValidCache,
      shouldAutoAuth
    });
  }, [onInitializationComplete]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return null; // Этот компонент не рендерит UI
};
