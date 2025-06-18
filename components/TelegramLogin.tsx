"use client";

import React, { useEffect, useState } from 'react';
import { Button } from './UI/Button';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
}

interface TelegramLoginProps {
  onLoginSuccess: (user: any, sessionToken: string) => void;
  seamless?: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
        };
      };
    };
  }
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({ onLoginSuccess, seamless = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Функция для отправки отладочной информации
  const sendDebugLog = async (action: string, data: any) => {
    try {
      await fetch('/api/debug-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });
    } catch (err) {
      console.error('Failed to send debug log:', err);
    }
  };

  useEffect(() => {
    const checkTelegramWebApp = async () => {
      // Добавляем небольшую задержку для загрузки скрипта
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const hasTelegram = !!window.Telegram?.WebApp;
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      const debugData = {
        hasTelegram,
        user: user ? {
          id: user.id,
          firstName: user.first_name,
          username: user.username
        } : null,
        initData: window.Telegram?.WebApp?.initData || 'No initData',
        telegramObject: !!window.Telegram,
        webAppObject: !!window.Telegram?.WebApp
      };

      setDebugInfo(debugData);
      await sendDebugLog('check_telegram_webapp', debugData);

      if (hasTelegram) {
        const tg = window.Telegram.WebApp;
        
        // Инициализируем Telegram Web App
        tg.ready();
        tg.expand();

        // Получаем данные пользователя
        if (user) {
          setTelegramUser(user);
          
          // В бесшовном режиме автоматически авторизуемся
          if (seamless) {
            console.log('🚀 SEAMLESS MODE: Auto-authorizing user');
            handleTelegramLogin();
          }
        }

        // Настраиваем главную кнопку только если не в бесшовном режиме
        if (!seamless) {
          tg.MainButton.text = 'Войти в игру';
          tg.MainButton.color = '#0088cc';
          tg.MainButton.textColor = '#ffffff';
          tg.MainButton.show();
          tg.MainButton.enable();

          // Обработчик нажатия на кнопку
          tg.MainButton.onClick(handleTelegramLogin);
        }
      }
    };

    checkTelegramWebApp();
  }, [seamless]);

  const handleTelegramLogin = async () => {
    if (!telegramUser) {
      setError('Данные пользователя Telegram не найдены');
      await sendDebugLog('auth_error', {
        error: 'No user data',
        telegramId: null
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Парсим initData для получения хеша и auth_date
      const initData = window.Telegram?.WebApp.initData || '';
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      const authDate = urlParams.get('auth_date');
      
      console.log('🔐 Hash from initData:', hash);
      console.log('⏰ Auth date from initData:', authDate);
      
      if (!hash) {
        console.error('❌ Hash not found in initData');
        throw new Error('Hash не найден в данных Telegram');
      }

      await sendDebugLog('auth_attempt', {
        telegramId: telegramUser.id,
        firstName: telegramUser.first_name,
        hasHash: !!hash,
        hasAuthDate: !!authDate
      });

      // Подготавливаем данные для авторизации
      const authData = {
        ...telegramUser,
        hash: hash,
        auth_date: authDate ? parseInt(authDate) : undefined,
        initData: initData,
      };

      // Отправляем запрос на сервер
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });

      await sendDebugLog('api_request', {
        endpoint: '/api/auth/telegram',
        method: 'POST',
        status: response.status,
        response: response.ok ? 'Success' : 'Error'
      });

      const data = await response.json();

      if (response.ok) {
        await sendDebugLog('auth_success', {
          telegramId: telegramUser.id,
          userId: data.user.id,
          sessionToken: !!data.sessionToken
        });

        // Сохраняем токен сессии
        localStorage.setItem('sessionToken', data.sessionToken);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        onLoginSuccess(data.user, data.sessionToken);
      } else {
        await sendDebugLog('auth_error', {
          error: data.error,
          telegramId: telegramUser.id,
          details: data
        });
        setError(data.error || 'Ошибка авторизации');
      }
    } catch (err) {
      console.error('Telegram login error:', err);
      await sendDebugLog('auth_error', {
        error: 'Network error',
        telegramId: telegramUser?.id,
        details: err instanceof Error ? err.message : 'Unknown error'
      });
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  // Если приложение не запущено в Telegram, показываем инструкцию
  if (!window.Telegram?.WebApp) {
    // В бесшовном режиме не показываем ничего, если не Telegram
    if (seamless) {
      return null;
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">📱 Telegram Login</h1>
            <p className="text-gray-300">Для входа используйте Telegram</p>
          </div>
          
          {/* Отладочная информация */}
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-left">
            <h3 className="text-red-300 font-semibold mb-2">🔍 Отладка:</h3>
            <p className="text-red-200 text-sm">
              Telegram WebApp не найден<br/>
              Telegram объект: {debugInfo.telegramObject ? '✅' : '❌'}<br/>
              WebApp объект: {debugInfo.webAppObject ? '✅' : '❌'}<br/>
              hasTelegram: {debugInfo.hasTelegram ? '✅' : '❌'}<br/>
              initData: {debugInfo.initData ? '✅' : '❌'}
            </p>
          </div>
          
          <div className="space-y-4 text-left">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-300 font-semibold mb-2">Как войти:</h3>
              <ol className="text-gray-300 text-sm space-y-2">
                <li>1. Откройте Telegram</li>
                <li>2. Найдите нашего бота</li>
                <li>3. Нажмите кнопку "Играть"</li>
                <li>4. Авторизуйтесь в игре</li>
              </ol>
            </div>
            
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-yellow-300 font-semibold mb-2">⚠️ Важно:</h3>
              <p className="text-gray-300 text-sm">
                Это приложение работает только внутри Telegram Web App. 
                Откройте его через бота для полного доступа к функциям.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован в Telegram
  if (!telegramUser) {
    // В бесшовном режиме не показываем ничего, если нет пользователя
    if (seamless) {
      return null;
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-white mb-4">🔐 Авторизация</h1>
          <p className="text-gray-300 mb-6">
            Для входа в игру необходимо авторизоваться в Telegram
          </p>
          
          {/* Отладочная информация */}
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-left">
            <h3 className="text-red-300 font-semibold mb-2">🔍 Отладка:</h3>
            <p className="text-red-200 text-sm">
              Telegram WebApp не найден<br/>
              Telegram объект: {debugInfo.telegramObject ? '✅' : '❌'}<br/>
              WebApp объект: {debugInfo.webAppObject ? '✅' : '❌'}<br/>
              hasTelegram: {debugInfo.hasTelegram ? '✅' : '❌'}<br/>
              initData: {debugInfo.initData ? '✅' : '❌'}
            </p>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm mb-4">
              {error}
            </div>
          )}
          
          <Button
            onClick={handleTelegramLogin}
            disabled={isLoading}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {isLoading ? 'Авторизация...' : 'Войти через Telegram'}
          </Button>
        </div>
      </div>
    );
  }

  // В бесшовном режиме не показываем интерфейс, если авторизация прошла успешно
  if (seamless) {
    return null;
  }

  // Показываем информацию о пользователе
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full text-center">
        <div className="mb-6">
          {telegramUser.photo_url && (
            <img
              src={telegramUser.photo_url}
              alt="Profile"
              className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white/20"
            />
          )}
          <h1 className="text-2xl font-bold text-white mb-2">
            Привет, {telegramUser.first_name}!
          </h1>
          {telegramUser.username && (
            <p className="text-gray-300">@{telegramUser.username}</p>
          )}
        </div>
        
        {/* Отладочная информация */}
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4 text-left">
          <h3 className="text-green-300 font-semibold mb-2">🔍 Отладка:</h3>
          <p className="text-green-200 text-sm">
            Telegram WebApp найден ✅<br/>
            Данные пользователя: ✅<br/>
            ID: {telegramUser.id}<br/>
            Имя: {telegramUser.first_name}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm mb-4">
            {error}
          </div>
        )}
        
        <Button
          onClick={handleTelegramLogin}
          disabled={isLoading}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {isLoading ? 'Вход в игру...' : 'Войти в игру'}
        </Button>
      </div>
    </div>
  );
};

export default TelegramLogin; 