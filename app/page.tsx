"use client";

import React, { useState, useEffect } from "react";
import GameBoard from "../components/GameBoard";
import MainMenu from "@/components/MainMenu";
import AdminLogin from "@/components/AdminLogin";
import TelegramLogin from "@/components/TelegramLogin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUser } from "@/hooks/useUser";

type Screen = "login choice" | "admin login" | "telegram login" | "main menu" | "classic mode" | "settings";

const HomePage: React.FC = () => {
  const [score, setScore] = useState(0);
  const [currentScreen, setCurrentScreen] = useState<Screen>("login choice");
  
  const { isAdmin, isLoading: adminLoading, loginAsAdmin, logoutAdmin, getTimeRemaining } = useAdminAuth();
  const { user, isLoading: userLoading, isAuthenticated, loginUser, logout } = useUser();

  // Проверяем, какой способ входа использовать
  useEffect(() => {
    if (!adminLoading && !userLoading) {
      if (isAdmin) {
        setCurrentScreen("main menu");
      } else if (isAuthenticated) {
        setCurrentScreen("main menu");
      } else {
        setCurrentScreen("login choice");
      }
    }
  }, [isAdmin, isAuthenticated, adminLoading, userLoading]);

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
    setCurrentScreen("login choice");
  };

  const hadleStartClassic = () => {
    setCurrentScreen("classic mode");
  };

  const handleGoToMenu = () => {
    setCurrentScreen("main menu");
  };

  // Показываем загрузку пока проверяем статус авторизации
  if (adminLoading || userLoading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
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
      
      {currentScreen === "telegram login" && (
        <TelegramLogin onLoginSuccess={handleTelegramLoginSuccess} />
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