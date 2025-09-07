"use client";

import React, { useEffect } from "react";
import { AppStateProvider, useAppContext } from "@/components/providers/AppStateProvider";
import GameBoard from "../components/GameBoard";
import { ZenGameBoard } from "../components/ZenGameBoard";
import MainMenu from "@/components/MainMenu";
import AdminLogin from "@/components/AdminLogin";
import TelegramLogin from "@/components/TelegramLogin";
import { GameOver } from "@/components/GameOver";
import { LoadingScreen } from "@/components/LoadingScreen";
import ShopScreen from "../components/ShopScreen";
import LeaderboardScreen from "../components/LeaderboardScreen";
import PieceReturnAnimation from "../components/board/PieceReturnAnimation";
import { ResourceLoader } from "@/utils/ResourceLoader";
import { BlockColor } from "@/lib/data/types";
import { useGameStore } from "../lib/state/store";

// Компонент для отключения контекстного меню
const ContextMenuDisabler: React.FC = () => {
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", preventContextMenu);
    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);

  return null;
};

// Компонент для отображения экранов
const AppContent: React.FC = () => {
  const { 
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
  } = useAppContext();

  // Состояние для анимаций
  const [boardRect, setBoardRect] = React.useState<DOMRect | null>(null);
  const [pieceReturnAnimation, setPieceReturnAnimation] = React.useState<{
    piece: any;
    fromPosition: { x: number; y: number };
    targetRect: DOMRect | null;
    cellSize: number;
    gap: number;
  } | null>(null);

  // Обработчики
  const handleStartClassic = () => {
    changeScreen("classic mode");
  };

  const handleStartZen = () => {
    changeScreen("zen mode");
  };

  const handleGoToMenu = () => {
    changeScreen("main menu");
  };

  const handleOpenShop = (initialTab?: string) => {
    if (currentScreen === "classic mode" || currentScreen === "zen mode") {
      setShopReturn(currentScreen);
    } else {
      setShopReturn("main menu");
    }
    changeScreen("shop");
  };

  const handleShopBack = () => {
    if (gameState?.shopReturnTo === "classic mode" || gameState?.shopReturnTo === "zen mode") {
      changeScreen(gameState.shopReturnTo as any);
    } else {
      changeScreen("main menu");
    }
    setShopReturn(null);
  };

  const handleOpenLeaderboard = () => {
    changeScreen("leaderboard");
  };

  const handleLeaderboardBack = () => {
    changeScreen("main menu");
  };

  const handlePieceReturnAnimation = (animationData: {
    piece: any;
    fromPosition: { x: number; y: number };
    targetRect: DOMRect | null;
    cellSize: number;
    gap: number;
  }) => {
    setPieceReturnAnimation(animationData);
  };

  // Показываем загрузку если приложение не инициализировано
  if (!appState?.isInitialized || authState?.authState === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <div
      className={`${
        currentScreen === "classic mode" || currentScreen === "zen mode"
          ? "bg-[var(--game-background)]"
          : "menu-bg"
      } min-h-screen`}
      style={{
        paddingTop: "var(--tg-content-safe-area-inset-top)",
        overflow: "hidden",
      }}
    >
      {/* Piece Return Animation */}
      {pieceReturnAnimation && boardRect && (
        <PieceReturnAnimation
          piece={pieceReturnAnimation.piece}
          fromPosition={pieceReturnAnimation.fromPosition}
          targetRect={pieceReturnAnimation.targetRect}
          cellSize={pieceReturnAnimation.cellSize}
          gap={pieceReturnAnimation.gap}
          onComplete={() => setPieceReturnAnimation(null)}
          boardRect={boardRect}
        />
      )}

      {/* Экраны приложения */}
      {currentScreen === "admin login" && (
        <AdminLogin onLoginSuccess={handleAdminLogin} />
      )}

      {currentScreen === "telegram login" && !authState?.autoAuthCompleted && (
        <TelegramLogin
          onLoginSuccess={handleTelegramLogin}
          seamless={appState?.shouldAutoAuth || false}
        />
      )}

      {currentScreen === "main menu" && (
        <MainMenu
          onStartClassic={handleStartClassic}
          onStartZen={handleStartZen}
          onOpenShop={handleOpenShop}
          onOpenLeaderboard={handleOpenLeaderboard}
          isTransitioning={false}
          isInitialized={appState?.isInitialized || false}
        />
      )}

      {currentScreen === "classic mode" && (
        <GameBoard
          onExitGame={handleGoToMenu}
          onScoreUpdate={handleScoreUpdate}
          onGameOver={handleGameOver}
          onBoardRectChange={setBoardRect}
          clearedLine={null}
          onGoHome={handleGoToMenu}
          isIntentionalRestart={gameState?.isIntentionalRestart || false}
          onRestartComplete={handleRestartComplete}
          onOpenShop={handleOpenShop}
          onPieceReturnAnimation={handlePieceReturnAnimation}
          gameMode="classic"
        />
      )}

      {currentScreen === "zen mode" && (
        <ZenGameBoard
          onBackToMenu={handleGoToMenu}
          onOpenShop={handleOpenShop}
        />
      )}

      {currentScreen === "gameover" && (
        <GameOver
          onPlayAgain={() => {
            setIntentionalRestart(true);
            const previousScreen = gameState?.shopReturnTo || "classic mode";
            changeScreen(previousScreen as any);
            useGameStore.getState().resetGame();
          }}
          onBackToMenu={() => {
            setIntentionalRestart(true);
            useGameStore.getState().resetGame();
            changeScreen("main menu");
          }}
          gameMode={gameState?.shopReturnTo === "zen mode" ? "zen" : "classic"}
        />
      )}

      {currentScreen === "shop" && (
        <ShopScreen
          onBack={handleShopBack}
          initialTab={gameState?.shopReturnTo === "zen mode" ? "zen" : "shards"}
        />
      )}

      {currentScreen === "leaderboard" && (
        <LeaderboardScreen onBack={handleLeaderboardBack} />
      )}

      {/* Fallback для отладки */}
      {!currentScreen && <LoadingScreen />}
    </div>
  );
};

// Главный компонент приложения
const HomePage: React.FC = () => {
  const [resourcesLoaded, setResourcesLoaded] = React.useState(false);

  const handleResourcesLoaded = () => {
    setResourcesLoaded(true);
  };

  if (!resourcesLoaded) {
    const allColors: BlockColor[] = [
      "red", "blue", "green", "yellow", "purple", "orange"
    ];

    return (
      <ResourceLoader
        colors={allColors}
        onLoadingComplete={handleResourcesLoaded}
      >
        <LoadingScreen />
      </ResourceLoader>
    );
  }

  return (
    <AppStateProvider>
      <ContextMenuDisabler />
      <AppContent />
    </AppStateProvider>
  );
};

export default HomePage;
