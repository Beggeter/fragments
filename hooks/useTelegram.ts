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
    return !!(window.Telegram && window.Telegram.WebApp);
  };

  // Получаем данные пользователя из Telegram
  const getTelegramUser = () => {
    if (!isInTelegram() || !initData) return null;
    
    // initData уже готовый объект в v3
    return initData.user || null;
  };

  // Автоматическая авторизация через Telegram
  const autoAuth = async () => {
    if (!isInTelegram() || !initData || isAuthenticated || isAdmin) {
      return false;
    }

    const user = getTelegramUser();
    if (!user) return false;

    try {
      // Подготавливаем данные для авторизации
      const authData = {
        ...user,
        hash: initData.hash,
        auth_date: initData.authDate,
        initData: initData.raw,
      };

      // Отправляем запрос на сервер
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authData),
      });

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
    initData,
    launchParams,
    hasLaunchParams: launchParams && Object.keys(launchParams).length > 0,
    
    // Методы
    autoAuth,
  };
};
