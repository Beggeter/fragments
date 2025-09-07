"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AppInitializer } from "./AppInitializer";
import { AuthManager } from "./AuthManager";
import { ScreenManager, Screen } from "./ScreenManager";
import { GameFlowManager } from "./GameFlowManager";

// Типы для контекста
interface AppState {
  isInitialized: boolean;
  appState: 'idle' | 'transitioning' | 'error' | 'loading';
  isInTelegram: boolean;
  hasValidCache: boolean;
  shouldAutoAuth: boolean;
}

interface AuthState {
  authState: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  isAdmin: boolean;
  isAuthenticated: boolean;
  user: any;
  sessionToken: string | null;
  autoAuthCompleted: boolean;
}

interface GameState {
  score: number;
  shopReturnTo: string | null;
  isIntentionalRestart: boolean;
}

interface AppContextType {
  // App state
  appState: AppState | null;
  
  // Auth state
  authState: AuthState | null;
  
  // Screen state
  currentScreen: Screen | "";
  
  // Game state
  gameState: GameState | null;
  
  // Actions
  changeScreen: (screen: Screen) => void;
  handleGameOver: () => void;
  handleScoreUpdate: (score: number) => void;
  handleRestartComplete: () => void;
  setShopReturn: (screen: string | null) => void;
  setIntentionalRestart: (value: boolean) => void;
  
  // Auth actions
  handleAdminLogin: (adminToken: string, expiresAt: string) => void;
  handleTelegramLogin: (user: any, sessionToken: string) => void;
  handleLogout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppStateProvider');
  }
  return context;
};

interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  // App state
  const [appState, setAppState] = useState<AppState | null>(null);
  
  // Auth state
  const [authState, setAuthState] = useState<AuthState | null>(null);
  
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<Screen | "">("");
  
  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Обработчики
  const handleInitializationComplete = useCallback((state: AppState) => {
    setAppState(state);
  }, []);

  const handleAuthStateChange = useCallback((state: AuthState) => {
    setAuthState(state);
  }, []);

  const handleScreenChange = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const handleGameOver = useCallback(() => {
    setCurrentScreen("gameover");
  }, []);

  const handleScoreUpdate = useCallback((score: number) => {
    setGameState(prev => prev ? { ...prev, score } : { score, shopReturnTo: null, isIntentionalRestart: false });
  }, []);

  const handleRestartComplete = useCallback(() => {
    setGameState(prev => prev ? { ...prev, isIntentionalRestart: false } : null);
  }, []);

  const setShopReturn = useCallback((screen: string | null) => {
    setGameState(prev => prev ? { ...prev, shopReturnTo: screen } : { score: 0, shopReturnTo: screen, isIntentionalRestart: false });
  }, []);

  const setIntentionalRestart = useCallback((value: boolean) => {
    setGameState(prev => prev ? { ...prev, isIntentionalRestart: value } : { score: 0, shopReturnTo: null, isIntentionalRestart: value });
  }, []);

  const changeScreen = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  // Auth actions (будут реализованы в AuthManager)
  const handleAdminLogin = useCallback((adminToken: string, expiresAt: string) => {
    // Логика будет в AuthManager
  }, []);

  const handleTelegramLogin = useCallback((user: any, sessionToken: string) => {
    // Логика будет в AuthManager
  }, []);

  const handleLogout = useCallback(() => {
    // Логика будет в AuthManager
  }, []);

  const contextValue: AppContextType = {
    appState,
    authState,
    currentScreen,
    gameState,
    changeScreen,
    handleGameOver,
    handleScoreUpdate,
    handleRestartComplete,
    setShopReturn,
    setIntentionalRestart,
    handleAdminLogin,
    handleTelegramLogin,
    handleLogout
  };

  return (
    <AppContext.Provider value={contextValue}>
      <AppInitializer onInitializationComplete={handleInitializationComplete} />
      
      {appState?.isInitialized && (
        <AuthManager
          isInitialized={appState.isInitialized}
          isInTelegram={appState.isInTelegram}
          shouldAutoAuth={appState.shouldAutoAuth}
          onAuthStateChange={handleAuthStateChange}
        />
      )}
      
      {authState && (
        <ScreenManager
          authState={authState.authState}
          isAdmin={authState.isAdmin}
          isAuthenticated={authState.isAuthenticated}
          isInitialized={appState?.isInitialized || false}
          shouldAutoAuth={appState?.shouldAutoAuth || false}
          onScreenChange={handleScreenChange}
        />
      )}
      
      <GameFlowManager
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
      />
      
      {children}
    </AppContext.Provider>
  );
};
