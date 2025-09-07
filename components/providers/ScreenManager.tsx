"use client";

import { useState, useEffect, useCallback } from "react";

export type Screen =
  | "admin login"
  | "telegram login"
  | "main menu"
  | "classic mode"
  | "zen mode"
  | "settings"
  | "gameover"
  | "shop"
  | "leaderboard"
  | "zen";

interface ScreenManagerProps {
  authState: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  isAdmin: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  shouldAutoAuth: boolean;
  onScreenChange: (screen: Screen) => void;
}

export const ScreenManager: React.FC<ScreenManagerProps> = ({
  authState,
  isAdmin,
  isAuthenticated,
  isInitialized,
  shouldAutoAuth,
  onScreenChange
}) => {
  const [currentScreen, setCurrentScreen] = useState<Screen | "">("");

  // Определяем начальный экран на основе состояния авторизации
  useEffect(() => {
    if (!isInitialized) return;

    if (authState === 'loading') {
      return; // Ждем завершения загрузки
    }

    if (authState === 'error') {
      onScreenChange("admin login");
      return;
    }

    if (isAdmin || isAuthenticated) {
      onScreenChange("main menu");
    } else if (shouldAutoAuth) {
      onScreenChange("telegram login");
    } else {
      onScreenChange("admin login");
    }
  }, [authState, isAdmin, isAuthenticated, isInitialized, shouldAutoAuth, onScreenChange]);

  // Fail-safe watchdog
  useEffect(() => {
    if (!isInitialized) return;
    
    const timer = setTimeout(() => {
      if (!currentScreen) {
        if (shouldAutoAuth) {
          onScreenChange("telegram login");
        } else {
          onScreenChange("admin login");
        }
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isInitialized, currentScreen, shouldAutoAuth, onScreenChange]);

  return null; // Этот компонент не рендерит UI
};
