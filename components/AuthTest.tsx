// Компонент для тестирования новой системы авторизации
"use client";

import { useAuth } from "@/lib/auth/context";
import { useTelegramAuth } from "@/lib/auth/hooks/useTelegramAuth";
import { useUser } from "@/lib/auth/hooks/useUser";

export function AuthTest() {
  const { isAuthenticated, user, isLoading, error, logout, clearError } = useAuth();
  const { isInTelegram, isTelegramAvailable, telegramUser, loginWithTelegram } = useTelegramAuth();
  const { updateCurrency, refreshBalance } = useUser();

  const handleTestCurrency = async () => {
    if (user) {
      // Тестируем обновление валюты
      updateCurrency(user.currency + 100);
      
      // Тестируем обновление с сервера
      setTimeout(async () => {
        const newBalance = await refreshBalance();
        console.log("New balance from server:", newBalance);
      }, 2000);
    }
  };

  const handleTestLogin = async () => {
    try {
      await loginWithTelegram();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <div className="text-blue-600">Загрузка авторизации...</div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
      <h3 className="text-lg font-semibold">Тест авторизации</h3>
      
      {/* Статус авторизации */}
      <div className="space-y-2">
        <div className="text-sm">
          <strong>Авторизован:</strong> {isAuthenticated ? "✅ Да" : "❌ Нет"}
        </div>
        <div className="text-sm">
          <strong>В Telegram:</strong> {isInTelegram ? "✅ Да" : "❌ Нет"}
        </div>
        <div className="text-sm">
          <strong>Данные Telegram доступны:</strong> {isTelegramAvailable ? "✅ Да" : "❌ Нет"}
        </div>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="p-2 bg-red-100 border border-red-300 rounded text-red-700">
          <div className="font-semibold">Ошибка:</div>
          <div>{error}</div>
          <button 
            onClick={clearError}
            className="mt-2 px-2 py-1 bg-red-200 rounded text-sm hover:bg-red-300"
          >
            Очистить ошибку
          </button>
        </div>
      )}

      {/* Данные пользователя */}
      {user && (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <div className="font-semibold text-green-800 mb-2">Данные пользователя:</div>
          <div className="text-sm space-y-1">
            <div><strong>ID:</strong> {user.id}</div>
            <div><strong>Telegram ID:</strong> {user.telegramId}</div>
            <div><strong>Имя:</strong> {user.firstName} {user.lastName}</div>
            <div><strong>Username:</strong> {user.username || "Не указан"}</div>
            <div><strong>Роль:</strong> {user.role}</div>
            <div><strong>Валюта:</strong> {user.currency}</div>
            <div><strong>Рекорд:</strong> {user.record}</div>
            <div><strong>Zen рекорд:</strong> {user.zenRecord}</div>
          </div>
        </div>
      )}

      {/* Данные Telegram */}
      {telegramUser && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="font-semibold text-blue-800 mb-2">Данные Telegram:</div>
          <div className="text-sm space-y-1">
            <div><strong>ID:</strong> {telegramUser.id}</div>
            <div><strong>Имя:</strong> {telegramUser.first_name} {telegramUser.last_name}</div>
            <div><strong>Username:</strong> {telegramUser.username || "Не указан"}</div>
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="space-y-2">
        {!isAuthenticated && isTelegramAvailable && (
          <button
            onClick={handleTestLogin}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Войти через Telegram
          </button>
        )}
        
        {isAuthenticated && (
          <>
            <button
              onClick={handleTestCurrency}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Тест валюты (+100)
            </button>
            
            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Выйти
            </button>
          </>
        )}
      </div>
    </div>
  );
}