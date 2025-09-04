"use client";

import { initData, useLaunchParams } from "@telegram-apps/sdk-react";
import { useAuth } from "@/components/AuthProvider";
import { useUserStore } from "@/store/user";

export const useTelegram = () => {
  const launchParams = useLaunchParams();
  const { isTelegramReady, loginUser } = useAuth();
  const { isAuthenticated, isAdmin, isLoading } = useUserStore();

  // Проверяем, запущено ли приложение в Telegram
  const isInTelegram = () => {
    if (typeof window === "undefined") return false;
    
    // Проверяем наличие Telegram WebApp объекта
    const hasTelegramWebApp = !!(window.Telegram && window.Telegram.WebApp);
    
    // Проверяем наличие tgWebAppData в launchParams (более надежно)
    const hasTgWebAppData = launchParams && launchParams.tgWebAppData;
    
    // Проверяем наличие tgWebAppData в URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasTgWebAppDataInUrl = urlParams.has("tgWebAppData");
    
    console.log('isInTelegram debug:', {
      hasTelegramWebApp,
      hasTgWebAppData,
      hasTgWebAppDataInUrl,
      launchParams: !!launchParams,
      windowTelegram: !!window.Telegram
    });
    
    return hasTelegramWebApp || hasTgWebAppData || hasTgWebAppDataInUrl;
  };

  // Получаем данные пользователя из Telegram
  const getTelegramUser = () => {
    if (!isInTelegram()) {
      console.log('getTelegramUser: not in Telegram');
      return null;
    }
    
    console.log('getTelegramUser debug:', {
      initData: !!initData,
      initDataUser: !!(initData && initData.user),
      launchParams: !!launchParams,
      tgWebAppData: !!(launchParams && launchParams.tgWebAppData),
      tgWebAppDataUser: !!(launchParams && launchParams.tgWebAppData && launchParams.tgWebAppData.user)
    });
    
    // Сначала пробуем получить из initData
    if (initData && initData.user) {
      console.log('getTelegramUser: using initData.user');
      return initData.user;
    }
    
    // Если initData нет, пробуем получить из launchParams
    if (launchParams && launchParams.tgWebAppData && launchParams.tgWebAppData.user) {
      console.log('getTelegramUser: using launchParams.tgWebAppData.user');
      return launchParams.tgWebAppData.user;
    }
    
    console.log('getTelegramUser: no user data found');
    return null;
  };

  // Автоматическая авторизация через Telegram
  const autoAuth = async () => {
    if (!isInTelegram() || isAuthenticated || isAdmin) {
      return false;
    }

    const user = getTelegramUser();
    if (!user) return false;

    try {
      console.log('autoAuth debug:', {
        user,
        initData: !!initData,
        launchParams: !!launchParams,
        tgWebAppData: !!(launchParams && launchParams.tgWebAppData)
      });
      
      // Подготавливаем данные для авторизации
      let authData;
      
      if (initData && initData.hash) {
        // Используем initData если доступен
        console.log('Using initData for auth');
        authData = {
          ...user,
          hash: String(initData.hash),
          auth_date: initData.authDate ? new Date(initData.authDate).getTime() : undefined,
          initData: String(initData.raw),
        };
      } else if (launchParams && launchParams.tgWebAppData) {
        // Используем launchParams если initData недоступен
        console.log('Using launchParams for auth');
        const tgData = launchParams.tgWebAppData;
        authData = {
          ...user,
          hash: String(tgData.hash),
          auth_date: new Date(tgData.auth_date).getTime(),
          initData: JSON.stringify(tgData),
        };
      } else {
        console.error('No auth data available');
        return false;
      }
      
      console.log('Auth data prepared:', authData);
      console.log('Auth data keys:', Object.keys(authData));
      console.log('Auth data values:', {
        id: authData.id,
        first_name: authData.first_name,
        hash: authData.hash,
        auth_date: authData.auth_date
      });

      // Проверяем, что у нас есть все необходимые поля
      if (!authData.id || !authData.first_name || !authData.hash) {
        console.error('Missing required fields in authData:', {
          hasId: !!authData.id,
          hasFirstName: !!authData.first_name,
          hasHash: !!authData.hash
        });
        return false;
      }

      // Отправляем запрос на сервер
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        await loginUser(data.user, data.sessionToken);
        return true;
      } else {
        console.error("Auto-auth failed:", await response.text());
        return false;
      }
    } catch (error) {
      console.error("Auto-auth error:", error);
      return false;
    }
  };


  return {
    // Состояние
    isInTelegram: isInTelegram(),
    isTelegramReady,
    isAuthenticated,
    isAdmin,
    isLoading,
    
    // Данные
    telegramUser: getTelegramUser(),
    initData: initData || null,
    launchParams: launchParams || null,
    hasLaunchParams: launchParams && Object.keys(launchParams).length > 0,
    
    // Методы
    autoAuth,
  };
};
