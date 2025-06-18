"use client";

import React, { useState, useEffect } from "react";
import GameBoard from "../components/GameBoard";
import MainMenu from "@/components/MainMenu";
import AdminLogin from "@/components/AdminLogin";
import TelegramLogin from "@/components/TelegramLogin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUser } from "@/hooks/useUser";

type Screen = "loading" | "login choice" | "admin login" | "telegram login" | "main menu" | "classic mode" | "settings";

const HomePage: React.FC = () => {
  const [score, setScore] = useState(0);
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading");
  const [isTelegramAutoAuth, setIsTelegramAutoAuth] = useState(false);
  const [autoAuthCompleted, setAutoAuthCompleted] = useState(false);
  
  const { isAdmin, isLoading: adminLoading, loginAsAdmin, logoutAdmin, getTimeRemaining } = useAdminAuth();
  const { user, isLoading: userLoading, isAuthenticated, loginUser, logout } = useUser();

  // Автоматическое определение Telegram и скрытная авторизация
  useEffect(() => {
    const checkTelegramAndAutoAuth = async () => {
      // Небольшая задержка для загрузки скрипта Telegram
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (window.Telegram?.WebApp) {
        console.log('🚀 TELEGRAM AUTO AUTH: Telegram Web App detected, starting auto auth');
        setIsTelegramAutoAuth(true);
        
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
          console.log('👤 TELEGRAM AUTO AUTH: User data found, attempting auto login');
          
          try {
            // Парсим initData для получения хеша и auth_date
            const initData = tg.initData || '';
            const urlParams = new URLSearchParams(initData);
            const hash = urlParams.get('hash');
            const authDate = urlParams.get('auth_date');
            
            if (hash) {
              // Подготавливаем данные для авторизации
              const authData = {
                ...user,
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

              const data = await response.json();

              if (response.ok) {
                console.log('✅ TELEGRAM AUTO AUTH: Auto login successful');
                // Сохраняем токен сессии
                localStorage.setItem('sessionToken', data.sessionToken);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                loginUser(data.user, data.sessionToken);
                setAutoAuthCompleted(true);
                setCurrentScreen("main menu");
                return;
              } else {
                console.log('❌ TELEGRAM AUTO AUTH: Auto login failed:', data.error);
              }
            }
          } catch (error) {
            console.error('💥 TELEGRAM AUTO AUTH: Error during auto login:', error);
          }
        }
        
        // Если автоматическая авторизация не удалась, показываем Telegram Login
        console.log('⚠️ TELEGRAM AUTO AUTH: Auto login failed, showing Telegram Login');
        setCurrentScreen("telegram login");
        return;
      }
      
      // Если не Telegram, проверяем обычную авторизацию
      console.log('🌐 TELEGRAM AUTO AUTH: Not Telegram Web App, checking normal auth');
      setIsTelegramAutoAuth(false);
    };

    checkTelegramAndAutoAuth();
  }, [loginUser]);

  // Проверяем, какой способ входа использовать
  useEffect(() => {
    if (!adminLoading && !userLoading && !isTelegramAutoAuth && !autoAuthCompleted) {
      if (isAdmin) {
        setCurrentScreen("main menu");
      } else if (isAuthenticated) {
        setCurrentScreen("main menu");
      } else {
        setCurrentScreen("login choice");
      }
    }
  }, [isAdmin, isAuthenticated, adminLoading, userLoading, isTelegramAutoAuth, autoAuthCompleted]);

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
    setCurrentScreen("login choice");
  };

  const hadleStartClassic = () => {
    setCurrentScreen("classic mode");
  };

  const handleGoToMenu = () => {
    setCurrentScreen("main menu");
  };

  // Показываем загрузку пока проверяем статус авторизации
  if ((adminLoading || userLoading || currentScreen === "loading") && !autoAuthCompleted) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">
          {isTelegramAutoAuth ? "Подключение к Telegram..." : "Загрузка..."}
        </div>
      </div>
    );
  }

  // Компонент выбора способа входа
  const LoginChoice = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🎮 Добро пожаловать!</h1>
          <p className="text-gray-300">Выберите способ входа в игру</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentScreen("telegram login")}
            className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-xl">📱</span>
            <span>Войти через Telegram</span>
          </button>

          <button
            onClick={() => setCurrentScreen("admin login")}
            className="w-full p-4 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-3"
          >
            <span className="text-xl">🔐</span>
            <span>Войти как админ</span>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20 text-center">
          <p className="text-xs text-gray-400">
            Telegram - для обычных игроков<br />
            Админ - для администраторов
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-900">
      {/* Статус пользователя */}
      {(isAdmin || isAuthenticated) && currentScreen !== "login choice" && (
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

      {currentScreen === "login choice" && <LoginChoice />}
      
      {currentScreen === "admin login" && (
        <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
      )}
      
      {currentScreen === "telegram login" && !autoAuthCompleted && (
        <TelegramLogin onLoginSuccess={handleTelegramLoginSuccess} seamless={isTelegramAutoAuth} />
      )}
      
      {currentScreen === "main menu" && (
        <MainMenu onStartClassic={hadleStartClassic} />
      )}
      
      {currentScreen === "classic mode" && (
        <GameBoard
          onExitGame={handleGoToMenu}
          onScoreUpdate={(newScore) => setScore(newScore)}
          onGameOver={() => console.log("Game Over")}
        />
      )}
    </div>
  );
};

export default HomePage;