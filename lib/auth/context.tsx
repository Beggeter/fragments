// AuthContext с провайдером
"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { initData, useLaunchParams } from "@telegram-apps/sdk-react";
import { AuthContextType, AuthState, User, TelegramAuthData } from "./types";
import { AuthService } from "./services/authService";
import { StorageService } from "./services/storageService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Reducer для управления состоянием
type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: { user: User; sessionToken: string } }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "LOGOUT" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload.user,
        sessionToken: action.payload.sessionToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "LOGOUT":
      return {
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  sessionToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const launchParams = useLaunchParams();

  // Проверка сессии и авторизация через Telegram при загрузке
  useEffect(() => {
    initializeAuth();
  }, [launchParams]);

  const initializeAuth = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Сначала проверяем существующую сессию
      const { sessionToken, userData } = StorageService.getSession();
      
      if (sessionToken && userData) {
        // Проверяем валидность токена
        try {
          const tokenData = JSON.parse(atob(sessionToken));
          const now = Math.floor(Date.now() / 1000);

          if (tokenData.exp > now) {
            // Токен валиден, обновляем данные пользователя
            const freshUser = await AuthService.refreshUser(userData.telegramId, sessionToken);
            dispatch({ type: "SET_USER", payload: { user: freshUser, sessionToken } });
            return;
          }
        } catch (error) {
          console.error("Invalid token format:", error);
        }
      }

      // Если нет валидной сессии, пытаемся авторизоваться через Telegram
      await attemptTelegramAuth();
    } catch (error) {
      console.error("Auth initialization failed:", error);
      dispatch({ type: "SET_ERROR", payload: "Ошибка инициализации авторизации" });
    }
  };

  const attemptTelegramAuth = async () => {
    try {
      // Получаем данные от Telegram через useLaunchParams
      const user = getTelegramUser();
      const hash = getTelegramHash();
      const authDate = getTelegramAuthDate();
      const raw = getTelegramRawData();

      if (!user || !hash) {
        console.warn("Telegram data incomplete, cannot login");
        dispatch({ type: "SET_LOADING", payload: false });
        return;
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

      console.log("Attempting Telegram login:", { telegramId: user.id, firstName: user.first_name });

      const { user: authUser, sessionToken } = await AuthService.loginWithTelegram(telegramData);
      
      StorageService.setSession(sessionToken, authUser);
      dispatch({ type: "SET_USER", payload: { user: authUser, sessionToken } });
    } catch (error) {
      console.error("Telegram auth failed:", error);
      dispatch({ type: "SET_ERROR", payload: "Ошибка авторизации через Telegram" });
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

  const login = async (telegramData: TelegramAuthData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const { user, sessionToken } = await AuthService.loginWithTelegram(
        telegramData
      );

      StorageService.setSession(sessionToken, user);
      dispatch({ type: "SET_USER", payload: { user, sessionToken } });
    } catch (error) {
      console.error("Login failed:", error);
      dispatch({ type: "SET_ERROR", payload: "Ошибка авторизации" });
    }
  };

  const logout = () => {
    StorageService.clearSession();
    dispatch({ type: "LOGOUT" });
  };

  const refreshUser = async () => {
    if (!state.user || !state.sessionToken) return;

    try {
      const freshUser = await AuthService.refreshUser(
        state.user.telegramId,
        state.sessionToken
      );
      dispatch({ type: "UPDATE_USER", payload: freshUser });
    } catch (error) {
      console.error("Failed to refresh user:", error);
      dispatch({ type: "SET_ERROR", payload: "Ошибка обновления данных" });
    }
  };

  const updateUser = (updates: Partial<User>) => {
    dispatch({ type: "UPDATE_USER", payload: updates });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
