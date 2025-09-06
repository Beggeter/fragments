"use client";

import { useAuth } from "@/lib/auth/context";
import { useTelegramAuth } from "@/lib/auth/hooks/useTelegramAuth";
import { AuthTest } from "@/components/AuthTest";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, user, isLoading, error } = useAuth();
  const { isInTelegram, telegramUser, isTelegramAvailable } = useTelegramAuth();

  useEffect(() => {
    console.log("Auth state:", { isAuthenticated, user, isLoading, error });
    console.log("Telegram state:", { isInTelegram, telegramUser, isTelegramAvailable });
  }, [isAuthenticated, user, isLoading, error, isInTelegram, telegramUser, isTelegramAvailable]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Тест новой системы авторизации</h1>
        
        <AuthTest />
        
        {isLoading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="text-blue-600">Загрузка...</div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <div className="text-red-600">Ошибка: {error}</div>
          </div>
        )}

        {!isAuthenticated && !isLoading && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-yellow-800">
              <div className="font-semibold mb-2">Не авторизован</div>
              <div className="text-sm">
                {isInTelegram 
                  ? "Запустите приложение в Telegram для авторизации" 
                  : "Приложение должно быть запущено в Telegram"
                }
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && user && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <div className="text-green-800">
              <div className="font-semibold mb-2">Добро пожаловать!</div>
              <div className="text-sm">
                {user.firstName} {user.lastName} ({user.username || "без username"})
              </div>
              <div className="text-xs text-gray-600 mt-1">
                ID: {user.telegramId} | Валюта: {user.currency} | Роль: {user.role}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
