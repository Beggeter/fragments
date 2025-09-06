// Хук для работы с Telegram авторизацией
import { useAuth } from '../context';
import { TelegramAuthData } from '../types';
import { initData, useLaunchParams } from '@telegram-apps/sdk-react';

export function useTelegramAuth() {
  const { login, logout, isAuthenticated, isLoading, error } = useAuth();
  const launchParams = useLaunchParams();

  const loginWithTelegram = async () => {
    try {
      const user = getTelegramUser();
      const hash = getTelegramHash();
      const authDate = getTelegramAuthDate();
      const raw = getTelegramRawData();

      if (!user || !hash) {
        throw new Error('Telegram data incomplete');
      }

      const telegramData: TelegramAuthData = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
        auth_date: authDate,
        hash,
        initData: raw,
      };

      await login(telegramData);
    } catch (error) {
      console.error('Telegram login failed:', error);
      throw error;
    }
  };

  const getTelegramUser = () => {
    // Сначала пробуем получить из initData
    if (initData && initData.user) {
      const user = initData.user();
      return user;
    }
    
    // Если initData нет, пробуем получить из launchParams
    if (launchParams && launchParams.tgWebAppData && launchParams.tgWebAppData.user) {
      return launchParams.tgWebAppData.user;
    }
    
    return null;
  };

  const getTelegramHash = () => {
    // Сначала пробуем получить из initData
    if (initData && initData.hash) {
      const hash = initData.hash();
      return hash ? String(hash) : null;
    }
    
    // Если initData нет, пробуем получить из launchParams
    if (launchParams && launchParams.tgWebAppData && launchParams.tgWebAppData.hash) {
      return String(launchParams.tgWebAppData.hash);
    }
    
    return null;
  };

  const getTelegramAuthDate = () => {
    // Сначала пробуем получить из initData
    if (initData && initData.authDate) {
      const authDate = initData.authDate();
      return authDate ? Math.floor(new Date(authDate).getTime() / 1000) : undefined;
    }
    
    // Если initData нет, пробуем получить из launchParams
    if (launchParams && launchParams.tgWebAppData && launchParams.tgWebAppData.auth_date) {
      return Math.floor(new Date(launchParams.tgWebAppData.auth_date).getTime() / 1000);
    }
    
    return undefined;
  };

  const getTelegramRawData = () => {
    // Сначала пробуем получить из initData
    if (initData && initData.raw) {
      const raw = initData.raw();
      return raw ? String(raw) : undefined;
    }
    
    // Если initData нет, пробуем получить из launchParams
    if (launchParams && launchParams.tgWebAppData) {
      return JSON.stringify(launchParams.tgWebAppData);
    }
    
    return undefined;
  };

  const isTelegramAvailable = () => {
    const user = getTelegramUser();
    const hash = getTelegramHash();
    return !!(user && hash);
  };

  const isInTelegram = () => {
    if (typeof window === "undefined") return false;
    
    // Проверяем наличие Telegram WebApp объекта
    const hasTelegramWebApp = !!(window.Telegram && window.Telegram.WebApp);
    
    // Проверяем наличие tgWebAppData в launchParams (более надежно)
    const hasTgWebAppData = launchParams && launchParams.tgWebAppData;
    
    // Проверяем наличие tgWebAppData в URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasTgWebAppDataInUrl = urlParams.has("tgWebAppData");
    
    return hasTelegramWebApp || hasTgWebAppData || hasTgWebAppDataInUrl;
  };

  return {
    loginWithTelegram,
    logout,
    isAuthenticated,
    isLoading,
    error,
    isTelegramAvailable: isTelegramAvailable(),
    isInTelegram: isInTelegram(),
    telegramUser: getTelegramUser(),
    launchParams,
  };
}
