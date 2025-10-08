"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import GameBoard from "../components/GameBoard";
import { ZenGameBoard } from "../components/ZenGameBoard";
import MainMenu from "@/components/MainMenu";
import AdminLogin from "@/components/AdminLogin";
import TelegramLogin from "@/components/TelegramLogin";
import { GameOver } from "@/components/GameOver";
import { useGameStore } from "../lib/state/store";
import { ResourceLoader } from "@/utils/ResourceLoader";
import { BlockColor } from "@/lib/data/types";
import { LoadingScreen } from "@/components/LoadingScreen";
import ShopScreen from "../components/ShopScreen";
import LeaderboardScreen from "../components/LeaderboardScreen";
import PieceReturnAnimation from "../components/board/PieceReturnAnimation";
import { useTelegramApp } from "@/hooks/useTelegramApp";
import { useDisableContextMenu } from "@/hooks/useDisableContextMenu";
import { useWindowErrorLogger } from "@/hooks/useWindowErrorLogger";
import { usePointerOverlayGuard } from "@/hooks/usePointerOverlayGuard";
import { HomeScreen } from "@/types/home";
import { SlowStartupToast } from "@/components/UI/SlowStartupToast";

const WATCHDOG_THRESHOLD = 4000; // milliseconds without progress before marking a stall
const WATCHDOG_INTERVAL = 500; // watchdog polling interval
const WATCHDOG_LOG_INTERVAL = 4000; // limit repeated stall logs
const IS_DEV_ENV = process.env.NODE_ENV !== "production";

const HomePage: React.FC = () => {
  // --- все хуки должны быть до любых return! ---
  const [score, setScore] = useState(0);
  const [devScreen, setDevScreen] = useState<HomeScreen | "">("");
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null);

  // Track where the shop was opened from
  const [shopReturnTo, setShopReturnTo] = useState<HomeScreen | null>(null);
  const [shopInitialTab, setShopInitialTab] = useState<"shards" | "boosters" | "zen">("shards");
  // Piece return animation state
  const [pieceReturnAnimation, setPieceReturnAnimation] = useState<{
    piece: any;
    fromPosition: { x: number; y: number };
    targetRect: DOMRect | null;
    cellSize: number;
    gap: number;
  } | null>(null);

  // Добавляем состояние для отслеживания намеренного перезапуска
  const [isIntentionalRestart, setIsIntentionalRestart] = useState(false);

  useDisableContextMenu();
  useWindowErrorLogger();
  usePointerOverlayGuard();

  const {
    adminAuth,
    userState,
    appState,
    setAppState,
    currentScreen,
    setCurrentScreen,
    isInitialized,
    isFullyReady,
    isTelegramAutoAuth,
    autoAuthCompleted,
    handleAdminLoginSuccess,
    handleTelegramLoginSuccess,
    slowStartup,
  } = useTelegramApp();

  const { isAdmin, isLoading: adminLoading } = adminAuth;
  const {
    user,
    isLoading: userLoading,
    isAuthenticated,
    refreshBalance,
    updateUser,
    sessionToken,
  } = userState;

  const [watchdogActive, setWatchdogActive] = useState(false);
  const lastProgressRef = useRef<number>(Date.now());
  const statusSnapshotRef = useRef({
    appState,
    isFullyReady,
    currentScreen,
    slowStartupActive: slowStartup.active,
    isInitialized,
    resourcesLoaded,
    userLoading,
    adminLoading,
    autoAuthCompleted,
    isAppInteractive: isFullyReady && appState === 'idle',
  });
  const watchdogRef = useRef(false);
  const lastWatchdogLogRef = useRef(0);

  const handleRestartComplete = useCallback(() => {
    setIsIntentionalRestart(false);
  }, []);

  const isAppInteractive = isFullyReady && appState === 'idle';

  useEffect(() => {
    statusSnapshotRef.current = {
      appState,
      isFullyReady,
      currentScreen,
      slowStartupActive: slowStartup.active,
      isInitialized,
      resourcesLoaded,
      userLoading,
      adminLoading,
      autoAuthCompleted,
      isAppInteractive,
    };

    lastProgressRef.current = Date.now();

    if (watchdogRef.current) {
      if (IS_DEV_ENV) {
        console.info('[WATCHDOG] Progress detected, clearing stall', statusSnapshotRef.current);
      }
      watchdogRef.current = false;
      setWatchdogActive(false);
    }
  }, [
    appState,
    isFullyReady,
    currentScreen,
    slowStartup.active,
    isInitialized,
    resourcesLoaded,
    userLoading,
    adminLoading,
    autoAuthCompleted,
    isAppInteractive,
  ]);

  useEffect(() => {
    watchdogRef.current = watchdogActive;
  }, [watchdogActive]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      const snapshot = statusSnapshotRef.current;
      const blocking =
        snapshot.slowStartupActive ||
        !snapshot.isFullyReady ||
        snapshot.appState !== 'idle' ||
        !snapshot.resourcesLoaded ||
        !snapshot.isInitialized ||
        snapshot.userLoading ||
        snapshot.adminLoading ||
        !snapshot.isAppInteractive;
      const elapsed = now - lastProgressRef.current;

      if (blocking) {
        if (elapsed >= WATCHDOG_THRESHOLD) {
          if (!watchdogRef.current) {
            watchdogRef.current = true;
            setWatchdogActive(true);
            lastWatchdogLogRef.current = now;
            if (IS_DEV_ENV) {
              console.warn('[WATCHDOG] UI stall detected', { elapsed, snapshot });
            }
          } else if (now - lastWatchdogLogRef.current >= WATCHDOG_LOG_INTERVAL) {
            lastWatchdogLogRef.current = now;
            if (IS_DEV_ENV) {
              console.warn('[WATCHDOG] Stall ongoing', { elapsed, snapshot });
            }
          }
        }
      } else if (watchdogRef.current) {
        watchdogRef.current = false;
        setWatchdogActive(false);
        lastProgressRef.current = now;
        if (IS_DEV_ENV) {
          console.info('[WATCHDOG] Stall resolved', snapshot);
        }
      }
    }, WATCHDOG_INTERVAL);

    return () => window.clearInterval(interval);
  }, []);
  const interactionLabel = !isFullyReady
    ? 'Загрузка…'
    : appState === 'transitioning'
      ? 'Переход…'
      : appState === 'error'
        ? 'Ошибка'
        : 'Загрузка…';

  const toastActive =
    slowStartup.active ||
    !isFullyReady ||
    appState === 'transitioning' ||
    appState === 'loading' ||
    watchdogActive;

  const ensureStorageAccessible = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      const testKey = "__storage_test__";
      window.localStorage?.setItem(testKey, "1");
      window.localStorage?.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn("⚠️ LocalStorage not available, using fallback");
      return false;
    }
  }, []);

  const isDev =
    typeof process !== "undefined" && process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isDev && devScreen) {
      setCurrentScreen(devScreen);
    }
  }, [isDev, devScreen, setCurrentScreen]);

  useEffect(() => {
    if (currentScreen === "main menu") {
      setAppState("idle");
    }
  }, [currentScreen, setAppState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentScreen !== "main menu") return;

    const tg = window.Telegram?.WebApp;
    try {
      tg?.ready?.();
    } catch (error) {
      console.warn('Telegram ready() call failed:', error);
    }
  }, [currentScreen]);

  const handleStartClassic = useCallback(async () => {
    if (appState !== "idle") return;
    if (IS_DEV_ENV) {
      console.info('[WATCHDOG] Classic mode requested', {
        appState,
        isFullyReady,
        currentScreen,
        timestamp: Date.now(),
      });
    }
    setAppState("transitioning");

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
      ensureStorageAccessible();
      setCurrentScreen("classic mode");
    } catch (error) {
      console.error("❌ Failed to start Classic mode:", error);
    } finally {
      setAppState("idle");
    }
  }, [appState, ensureStorageAccessible, setAppState, setCurrentScreen]);

  const handleStartZen = useCallback(async () => {
    if (appState !== "idle") {
      if (IS_DEV_ENV) {
        console.warn('[WATCHDOG] Zen mode request ignored because appState is not idle', {
          appState,
          currentScreen,
        });
      }
      return;
    }
    if (IS_DEV_ENV) {
      console.info('[WATCHDOG] Zen mode requested', {
        appState,
        isFullyReady,
        currentScreen,
        timestamp: Date.now(),
      });
    }
    setAppState("transitioning");

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
      ensureStorageAccessible();
      setCurrentScreen("zen mode");
    } catch (error) {
      console.error("❌ Failed to start Zen mode:", error);
    } finally {
      setAppState("idle");
    }
  }, [appState, ensureStorageAccessible, setAppState, setCurrentScreen]);

  const handleGoToMenu = useCallback(() => {
    if (appState !== "idle") {
      if (IS_DEV_ENV) {
        console.warn('[WATCHDOG] Go-to-menu ignored: appState not idle', {
          appState,
          currentScreen,
        });
      }
      return;
    }
    if (IS_DEV_ENV) {
      console.info('[WATCHDOG] Returning to main menu', {
        currentScreen,
        timestamp: Date.now(),
      });
    }
    setAppState("transitioning");
    setCurrentScreen("main menu");
    setAppState("idle");
  }, [appState, setAppState, setCurrentScreen]);

  const handleGameOver = async () => {
    try {
      const { score } = useGameStore.getState();
      const telegramId =
        user?.telegramId ||
        (isAdmin && process.env.NODE_ENV === "development"
          ? "610936383"
          : null);

      if (telegramId && score > 0) {
        // Подготавливаем заголовки с авторизацией для production
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Добавляем токен авторизации если он есть (нужно для production)
        if (sessionToken) {
          headers["Authorization"] = `Bearer ${sessionToken}`;
        }

        // Определяем режим игры для отправки на сервер
        const gameMode = currentScreen === "zen mode" ? "zen" : "classic";
        const endpoint =
          gameMode === "zen"
            ? `/api/users/${telegramId}/zen-game`
            : `/api/users/${telegramId}/game`;

        // Отправляем результат игры на сервер
        const response = await fetch(endpoint, {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            gameId: 1, // временный ID
            finalScore: score,
            level: 1,
            gameMode: gameMode,
            gameData: {
              gameDuration: Date.now(), // можно добавить реальную продолжительность
              piecesPlaced: useGameStore.getState().piecesPlaced || 0,
            },
          }),
        });

        if (response.ok) {
          const result = JSON.parse(await response.text());

          // Получаем актуальный баланс с сервера
          await refreshBalance();

          // Обновляем рекорд если он изменился
          if (result.newRecord !== undefined && user) {
            if (gameMode === "zen") {
              updateUser({ zenRecord: result.newRecord });
            } else {
              updateUser({ record: result.newRecord });
            }
          }
        } else {
          // ошибка игнорируется
        }
      } else {
        // ошибка игнорируется
      }
    } catch (error) {
      // ошибка игнорируется
    }

    // Устанавливаем shopReturnTo перед переходом на экран gameover
    if (currentScreen === "classic mode" || currentScreen === "zen mode") {
      setShopReturnTo(currentScreen);
    }
    setCurrentScreen("gameover");
  };

  const handleResourcesLoaded = () => {
    setResourcesLoaded(true);
    // НЕ устанавливаем currentScreen - пусть логика авторизации сама определит
  };

  const handleOpenShop = useCallback(
    (initialTab?: string) => {
      if (currentScreen === "classic mode" || currentScreen === "zen mode") {
        setShopReturnTo(currentScreen);
        setShopInitialTab(initialTab === "zen" ? "zen" : "boosters");
      } else {
        setShopReturnTo("main menu");
        setShopInitialTab(initialTab === "zen" ? "zen" : "shards");
      }
      setCurrentScreen("shop");
    },
    [currentScreen]
  );

  const handleShopBack = useCallback(() => {
    if (shopReturnTo === "classic mode" || shopReturnTo === "zen mode") {
      setCurrentScreen(shopReturnTo);
    } else {
      setCurrentScreen("main menu");
    }
    setShopReturnTo(null);
  }, [shopReturnTo]);

  const handleOpenLeaderboard = useCallback(() => {
    setCurrentScreen("leaderboard");
  }, []);

  const handleLeaderboardBack = useCallback(() => {
    setCurrentScreen("main menu");
  }, []);

  // Колбэк для запуска анимации возвращения фигуры
  const handlePieceReturnAnimation = useCallback(
    (animationData: {
      piece: any;
      fromPosition: { x: number; y: number };
      targetRect: DOMRect | null;
      cellSize: number;
      gap: number;
    }) => {
      setPieceReturnAnimation(animationData);
    },
    []
  );

  if (!resourcesLoaded) {
    const allColors: BlockColor[] = [
      "red",
      "blue",
      "green",
      "yellow",
      "purple",
      "orange",
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

  if (
    !isInitialized ||
    ((adminLoading || userLoading) &&
      !autoAuthCompleted &&
      !isAuthenticated &&
      !isAdmin)
  ) {
    return <LoadingScreen />;
  }

  return (
    <div
      className={`${currentScreen === "classic mode" || currentScreen === "zen mode"
          ? "bg-[var(--game-background)]"
          : "menu-bg"
        } min-h-screen `}
      style={{
        paddingTop: "var(--tg-content-safe-area-inset-top)",
        overflow: "hidden",
      }}
    >

      <SlowStartupToast active={toastActive} />

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

      {currentScreen === "admin login" && (
        <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
      )}

      {currentScreen === "telegram login" && !autoAuthCompleted && (
        <TelegramLogin
          onLoginSuccess={handleTelegramLoginSuccess}
          seamless={isTelegramAutoAuth}
        />
      )}

      {currentScreen === "main menu" && (
        <MainMenu
          onStartClassic={handleStartClassic}
          onStartZen={handleStartZen}
          onOpenShop={handleOpenShop}
          onOpenLeaderboard={handleOpenLeaderboard}
          isInteractive={isAppInteractive}
          loadingLabel={interactionLabel}
        />
      )}

      {currentScreen === "classic mode" && (
        <GameBoard
          onExitGame={handleGoToMenu}
          onScoreUpdate={(newScore) => setScore(newScore)}
          onGameOver={handleGameOver}
          onBoardRectChange={setBoardRect}
          onGoHome={handleGoToMenu}
          isIntentionalRestart={isIntentionalRestart}
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
            setIsIntentionalRestart(true); // Устанавливаем флаг перед сбросом
            // Возвращаемся к предыдущему экрану (classic или zen)
            const previousScreen = shopReturnTo || "classic mode";
            setCurrentScreen(previousScreen);
            useGameStore.getState().resetGame();
          }}
          onBackToMenu={() => {
            setIsIntentionalRestart(true); // Устанавливаем флаг перед сбросом
            useGameStore.getState().resetGame();
            setCurrentScreen("main menu");
          }}
          gameMode={shopReturnTo === "zen mode" ? "zen" : "classic"}
        />
      )}

      {currentScreen === "shop" && (
        <ShopScreen
          onBack={handleShopBack}
          initialTab={shopInitialTab}
        />
      )}

      {currentScreen === "leaderboard" && (
        <LeaderboardScreen onBack={handleLeaderboardBack} />
      )}

      {/* Fallback для отладки */}
      {!currentScreen && <LoadingScreen />}

      {/* Тестовый компонент для Stars API (только в dev режиме) */}
      {/* <TestStarsPayment /> */}
    </div>
  );
};

export default HomePage;
