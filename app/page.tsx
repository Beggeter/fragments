"use client";

import React, { useState, useEffect } from "react";
import GameBoard from "../components/GameBoard";
import MainMenu from "@/components/MainMenu";
import AdminLogin from "@/components/AdminLogin";
import TelegramLogin from "@/components/TelegramLogin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUser } from "@/hooks/useUser";

type Screen = "loading" | "admin login" | "telegram login" | "main menu" | "classic mode" | "settings";

// Функция для надежного определения Telegram WebApp
const isLaunchedInTelegram = (): boolean => {
  if (typeof window === 'undefined') {
    console.log('🔍 SSR: window не определен');
    return false;
  }

  // Проверяем наличие Telegram WebApp объекта
  const hasTelegramWebApp = !!(window.Telegram && window.Telegram.WebApp);
  
  // Проверяем наличие tgWebAppData в URL (самый надежный способ)
  const urlParams = new URLSearchParams(window.location.search);
  const hasTgWebAppData = urlParams.has('tgWebAppData');
  
  // Проверяем наличие initData в Telegram WebApp
  const hasInitData = !!(window.Telegram?.WebApp?.initData);
  
  // Проверяем наличие пользователя в initDataUnsafe
  const hasUser = !!(window.Telegram?.WebApp?.initDataUnsafe?.user);
  
  // Проверяем, что initData не пустая строка
  const hasValidInitData = !!(window.Telegram?.WebApp?.initData && window.Telegram.WebApp.initData.length > 0);
  
  // Дополнительная отладка
  console.log('🔍 Детальная проверка контекста запуска:');
  console.log('  - window.Telegram:', window.Telegram);
  console.log('  - window.Telegram?.WebApp:', window.Telegram?.WebApp);
  console.log('  - window.Telegram?.WebApp?.initData:', window.Telegram?.WebApp?.initData);
  console.log('  - window.Telegram?.WebApp?.initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);
  console.log('  - URL:', window.location.href);
  console.log('  - URL params:', urlParams.toString());
  console.log('  - Telegram WebApp объект:', hasTelegramWebApp);
  console.log('  - tgWebAppData в URL:', hasTgWebAppData);
  console.log('  - initData:', hasInitData);
  console.log('  - hasValidInitData:', hasValidInitData);
  console.log('  - user в initDataUnsafe:', hasUser);
  
  // Считаем Telegram WebApp только если есть tgWebAppData в URL ИЛИ валидные данные в объекте
  // Это более строгая проверка, которая исключает ложные срабатывания в браузере
  const isTelegram = hasTgWebAppData || (hasTelegramWebApp && (hasValidInitData || hasUser));
  
  console.log('📱 Итоговый результат:', isTelegram ? 'Telegram WebApp' : 'Обычный браузер');
  
  return isTelegram;
};

const HomePage: React.FC = () => {
  const [score, setScore] = useState(0);
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading");
  const [isTelegramAutoAuth, setIsTelegramAutoAuth] = useState(false);
  const [autoAuthCompleted, setAutoAuthCompleted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { isAdmin, isLoading: adminLoading, loginAsAdmin, logoutAdmin, getTimeRemaining } = useAdminAuth();
  const { user, isLoading: userLoading, isAuthenticated, loginUser, logout } = useUser();

  // Инициализация: определяем контекст и показываем соответствующий экран
  useEffect(() => {
    const initializeApp = async () => {
      // Проверяем, что мы на клиенте
      if (typeof window === 'undefined') {
        return;
      }

      console.log('🚀 Инициализация приложения...');

      // Проверяем, есть ли уже авторизованный пользователь
      const existingSessionToken = localStorage.getItem('sessionToken');
      const existingAdminToken = localStorage.getItem('adminToken');

      if (existingSessionToken || existingAdminToken) {
        console.log('✅ Найден существующий токен, пропускаем инициализацию');
        setIsInitialized(true);
        return;
      }

      // Определяем контекст: Telegram WebApp или браузер
      const isInTelegram = isLaunchedInTelegram();

      if (isInTelegram) {
        // В Telegram: пытаемся автоматическую авторизацию
        console.log('📱 Telegram: запускаем автоматическую авторизацию');
        setIsTelegramAutoAuth(true);
        
        const tg = window.Telegram?.WebApp;
        if (tg) {
          const user = tg.initDataUnsafe?.user;
          if (user) {
            try {
              const initData = tg.initData || '';
              const urlParams = new URLSearchParams(initData);
              const hash = urlParams.get('hash');
              const authDate = urlParams.get('auth_date');
              
              if (hash) {
                console.log('🔐 Telegram: пытаемся авторизовать пользователя');
                const authData = {
                  ...user,
                  hash: hash,
                  auth_date: authDate ? parseInt(authDate) : undefined,
                  initData: initData,
                };
                
                const response = await fetch('/api/auth/telegram', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(authData),
                });
                
                const data = await response.json();
                if (response.ok) {
                  console.log('✅ Telegram: автоматическая авторизация успешна');
                  localStorage.setItem('sessionToken', data.sessionToken);
                  localStorage.setItem('userData', JSON.stringify(data.user));
                  loginUser(data.user, data.sessionToken);
                  setAutoAuthCompleted(true);
                  setCurrentScreen("main menu");
                  setIsInitialized(true);
                  return;
                } else {
                  console.log('❌ Telegram: автоматическая авторизация не удалась');
                }
              }
            } catch (error) {
              console.error('💥 Telegram: ошибка автоматической авторизации:', error);
            }
          }
        }
        
        // Если автоматическая авторизация не удалась, показываем Telegram login
        console.log('📱 Telegram: показываем экран Telegram login');
        setCurrentScreen("telegram login");
      } else {
        // В браузере: сразу показываем админ-логин
        console.log('🌐 Браузер: показываем админ-логин');
        setCurrentScreen("admin login");
      }
      
      setIsInitialized(true);
    };

    initializeApp();
  }, []); // Запускаем только один раз при монтировании

  // useEffect для управления экраном на основе статуса авторизации
  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') {
      return;
    }

    // Если пользователь авторизован, переключаем на главное меню
    if (
      (isAuthenticated || isAdmin) &&
      currentScreen !== "main menu" &&
      currentScreen !== "classic mode" &&
      currentScreen !== "settings"
    ) {
      console.log('✅ Пользователь авторизован, переключаем на главное меню');
      setCurrentScreen("main menu");
    }
    
    // Если пользователь не авторизован и приложение инициализировано, 
    // но экран не установлен, показываем соответствующий экран
    if (
      !isAuthenticated &&
      !isAdmin &&
      isInitialized &&
      !currentScreen
    ) {
      const isInTelegram = isLaunchedInTelegram();
      if (isInTelegram) {
        console.log('📱 Telegram: показываем Telegram login');
        setCurrentScreen("telegram login");
      } else {
        console.log('🌐 Браузер: показываем админ-логин');
        setCurrentScreen("admin login");
      }
    }
  }, [isAuthenticated, isAdmin, isInitialized, currentScreen]);

  const handleAdminLoginSuccess = (adminToken: string, expiresAt: string) => {
    loginAsAdmin(adminToken, expiresAt);
    setCurrentScreen("main menu");
  };

  const handleTelegramLoginSuccess = (user: any, sessionToken: string) => {
    loginUser(user, sessionToken);
    setCurrentScreen("main menu");
  };

  const handleLogout = () => {
    if (isAdmin) {
      logoutAdmin();
    } else {
      logout();
    }
    setAutoAuthCompleted(false);
    setIsTelegramAutoAuth(false);
    
    // Показываем соответствующий экран в зависимости от контекста
    if (typeof window !== 'undefined' && isLaunchedInTelegram()) {
      setCurrentScreen("telegram login");
    } else {
      setCurrentScreen("admin login");
    }
  };

  const hadleStartClassic = () => {
    setCurrentScreen("classic mode");
  };

  const handleGoToMenu = () => {
    setCurrentScreen("main menu");
  };

  // Показываем загрузку пока проверяем статус авторизации или инициализируем приложение
  if (!isInitialized || (adminLoading || userLoading) && !autoAuthCompleted && !isAuthenticated && !isAdmin) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">
          {isTelegramAutoAuth ? "Подключение к Telegram..." : "Загрузка..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900">
      {/* Отладочная информация */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs shadow-lg">
          <div>Screen: {currentScreen}</div>
          <div>Initialized: {isInitialized ? 'true' : 'false'}</div>
          <div>AutoAuth: {isTelegramAutoAuth ? 'true' : 'false'}</div>
          <div>Completed: {autoAuthCompleted ? 'true' : 'false'}</div>
          <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
          <div>Admin: {isAdmin ? 'true' : 'false'}</div>
          <div>Context: {typeof window !== 'undefined' && isLaunchedInTelegram() ? 'Telegram' : 'Browser'}</div>
          <div>Telegram Obj: {typeof window !== 'undefined' && !!(window.Telegram?.WebApp) ? 'Yes' : 'No'}</div>
          <div>tgWebAppData: {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tgWebAppData') ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* Статус пользователя */}
      {(isAdmin || isAuthenticated) && (
        <div className="fixed top-4 right-4 z-50 bg-green-600/90 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm shadow-lg">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <span>👑 Админ</span>
                <span className="text-xs opacity-75">
                  {getTimeRemaining() ? `Осталось: ${getTimeRemaining()}` : 'Истекло'}
                </span>
              </>
            ) : (
              <>
                <span>👤 {user?.firstName}</span>
                <span className="text-xs opacity-75">
                  💰 {user?.currency}
                </span>
              </>
            )}
            <button
              onClick={handleLogout}
              className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      )}

      {currentScreen === "admin login" && (
        <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
      )}
      
      {currentScreen === "telegram login" && !autoAuthCompleted && (
        <TelegramLogin onLoginSuccess={handleTelegramLoginSuccess} seamless={isTelegramAutoAuth} />
      )}
      
      {currentScreen === "main menu" && (
        <MainMenu onStartClassic={hadleStartClassic} />
      )}
      
      {/* Дополнительная проверка для отображения главного меню */}
      {!currentScreen && (isAuthenticated || isAdmin) && (
        <MainMenu onStartClassic={hadleStartClassic} />
      )}
      
      {currentScreen === "classic mode" && (
        <GameBoard
          onExitGame={handleGoToMenu}
          onScoreUpdate={(newScore) => setScore(newScore)}
          onGameOver={() => console.log("Game Over")}
        />
      )}

      {/* Fallback для отладки */}
      {!currentScreen && (
        <div className="min-h-screen bg-blue-900 flex items-center justify-center">
          <div className="text-white text-xl">
            Ошибка: currentScreen не установлен
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;