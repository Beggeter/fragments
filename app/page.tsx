"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import GameBoard from "../components/GameBoard";
import MainMenu from "@/components/MainMenu";
import AdminLogin from "@/components/AdminLogin";
import TelegramLogin from "@/components/TelegramLogin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUser } from "@/hooks/useUser";
import { GameOver } from "@/components/GameOver";
import { useGameStore } from "../lib/state/store";
import { ResourceLoader } from "@/utils/ResourceLoader";
import { BlockColor } from "@/lib/data/types";
import { LoadingScreen } from "@/components/LoadingScreen";
import LoadingSpinner from "../components/LoadingSpinner";
import ShopScreen from "../components/ShopScreen";
import LeaderboardScreen from "../components/LeaderboardScreen";
import PieceReturnAnimation from "../components/board/PieceReturnAnimation";

type Screen =
  | "admin login"
  | "telegram login"
  | "main menu"
  | "classic mode"
  | "settings"
  | "gameover"
  | "shop"
  | "leaderboard";

// Функция для надежного определения Telegram WebApp
const isLaunchedInTelegram = (): boolean => {
  if (typeof window === "undefined") {
    console.log("🔍 SSR: window не определен");
    return false;
  }

  // Проверяем наличие Telegram WebApp объекта
  const hasTelegramWebApp = !!(window.Telegram && window.Telegram.WebApp);

  // Проверяем наличие tgWebAppData в URL (самый надежный способ)
  const urlParams = new URLSearchParams(window.location.search);
  const hasTgWebAppData = urlParams.has("tgWebAppData");

  // Проверяем наличие initData в Telegram WebApp
  const hasInitData = !!window.Telegram?.WebApp?.initData;

  // Проверяем наличие пользователя в initDataUnsafe
  const hasUser = !!window.Telegram?.WebApp?.initDataUnsafe?.user;

  // Проверяем, что initData не пустая строка
  const hasValidInitData = !!(
    window.Telegram?.WebApp?.initData &&
    window.Telegram.WebApp.initData.length > 0
  );

  // Дополнительная отладка
  console.log("🔍 Детальная проверка контекста запуска:");
  console.log("  - window.Telegram:", window.Telegram);
  console.log("  - window.Telegram?.WebApp:", window.Telegram?.WebApp);
  console.log(
    "  - window.Telegram?.WebApp?.initData:",
    window.Telegram?.WebApp?.initData
  );
  console.log(
    "  - window.Telegram?.WebApp?.initDataUnsafe:",
    window.Telegram?.WebApp?.initDataUnsafe
  );
  console.log("  - URL:", window.location.href);
  console.log("  - URL params:", urlParams.toString());
  console.log("  - Telegram WebApp объект:", hasTelegramWebApp);
  console.log("  - tgWebAppData в URL:", hasTgWebAppData);
  console.log("  - initData:", hasInitData);
  console.log("  - hasValidInitData:", hasValidInitData);
  console.log("  - user в initDataUnsafe:", hasUser);

  // Считаем Telegram WebApp только если есть tgWebAppData в URL ИЛИ валидные данные в объекте
  // Это более строгая проверка, которая исключает ложные срабатывания в браузере
  const isTelegram =
    hasTgWebAppData || (hasTelegramWebApp && (hasValidInitData || hasUser));

  console.log(
    "📱 Итоговый результат:",
    isTelegram ? "Telegram WebApp" : "Обычный браузер"
  );

  return isTelegram;
};

const HomePage: React.FC = () => {
  // --- все хуки должны быть до любых return! ---
  const [score, setScore] = useState(0);
  const [currentScreen, setCurrentScreen] = useState<Screen | "">("");
  const [isTelegramAutoAuth, setIsTelegramAutoAuth] = useState(false);
  const [autoAuthCompleted, setAutoAuthCompleted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [devScreen, setDevScreen] = useState<Screen | "">("");
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [showSpinnerAnimation, setShowSpinnerAnimation] = useState(false);
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null);
  const [clearedLine, setClearedLine] = useState<number | null>(null);
  const [clearedLines, setClearedLines] = useState<Set<number>>(new Set());
  const [particlesInit, setParticlesInit] = useState(false);
  // Track where the shop was opened from
  const [shopReturnTo, setShopReturnTo] = useState<Screen | null>(null);
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

  // Создаем стабильную функцию для завершения перезапуска
  const handleRestartComplete = useCallback(() => {
    setIsIntentionalRestart(false);
  }, []);

  // --- tsparticles engine init ---

  const particlesOptions = useMemo(
    () => ({
      particles: {
        number: { value: 100 },
        color: { value: "#f00" },
        shape: { type: "square" },
        size: { value: { min: 10, max: 20 } },
        move: { enable: false },
      },
      detectRetina: true,
      fullScreen: { enable: false },
    }),
    []
  );

  const handleLineBreakpoint = useCallback((lineIdx: number, rowIdx: number) => {
    setClearedLine(rowIdx);
    setClearedLines(prev => new Set([...prev, rowIdx]));
    // Сбросить после короткой задержки, чтобы не очищать повторно
    setTimeout(() => setClearedLine(null), 100);
  }, []);

  // функция для запуска спиннера
  const handleShowSpinnerAnimation = useCallback(() => {
    setShowSpinnerAnimation(true);
    setClearedLines(new Set()); // Сбрасываем отслеживание линий
  }, []);

  // функция для завершения анимации спиннера
  const handleSpinnerFinish = useCallback(() => {
    setShowSpinnerAnimation(false);
    
    // Гарантированно очищаем все линии, которые могли быть пропущены из-за лагов
    if (clearedLines.size < 8) {
      // Если не все линии были очищены, очищаем оставшиеся
      const remainingLines = Array.from({ length: 8 }, (_, i) => i)
        .filter(i => !clearedLines.has(i));
      
      remainingLines.forEach(lineIdx => {
        setTimeout(() => {
          setClearedLine(lineIdx);
          setTimeout(() => setClearedLine(null), 50);
        }, lineIdx * 50); // Небольшая задержка между линиями
      });
    }
    
    // Очищаем отслеживание линий
    setTimeout(() => {
      setClearedLines(new Set());
    }, 500);
  }, [clearedLines]);

  const {
    isAdmin,
    isLoading: adminLoading,
    loginAsAdmin,
    logoutAdmin,
    getTimeRemaining,
  } = useAdminAuth();
  const {
    user,
    isLoading: userLoading,
    isAuthenticated,
    loginUser,
    logout,
    updateCurrency,
    updateUser,
    refreshBalance,
  } = useUser();

  // Инициализация: определяем контекст и показываем соответствующий экран
  useEffect(() => {
    const initializeApp = async () => {
      // Проверяем, что мы на клиенте
      if (typeof window === "undefined") {
        return;
      }

      console.log("🚀 Инициализация приложения...");

      // Проверяем, есть ли уже авторизованный пользователь
      const existingSessionToken = localStorage.getItem("sessionToken");
      const existingAdminToken = localStorage.getItem("adminToken");

      if (existingSessionToken || existingAdminToken) {
        console.log("✅ Найден существующий токен, пропускаем инициализацию");
        setIsInitialized(true);
        return;
      }

      // Определяем контекст: Telegram WebApp или браузер
      const isInTelegram = isLaunchedInTelegram();

      if (isInTelegram) {
        // В Telegram: пытаемся автоматическую авторизацию
        console.log("📱 Telegram: запускаем автоматическую авторизацию");
        setIsTelegramAutoAuth(true);

        const tg = window.Telegram?.WebApp;
        if (tg) {
          const user = tg.initDataUnsafe?.user;
          if (user) {
            try {
              const initData = tg.initData || "";
              const urlParams = new URLSearchParams(initData);
              const hash = urlParams.get("hash");
              const authDate = urlParams.get("auth_date");

              if (hash) {
                console.log("🔐 Telegram: пытаемся авторизовать пользователя");
                const authData = {
                  ...user,
                  hash: hash,
                  auth_date: authDate ? parseInt(authDate) : undefined,
                  initData: initData,
                };

                const response = await fetch("/api/auth/telegram", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(authData),
                });

                const data = await response.json();
                if (response.ok) {
                  console.log(
                    "✅ Telegram: автоматическая авторизация успешна"
                  );
                  localStorage.setItem("sessionToken", data.sessionToken);
                  localStorage.setItem("userData", JSON.stringify(data.user));
                  loginUser(data.user, data.sessionToken);
                  setAutoAuthCompleted(true);
                  setCurrentScreen("main menu");
                  setIsInitialized(true);
                  return;
                } else {
                  console.log(
                    "❌ Telegram: автоматическая авторизация не удалась"
                  );
                }
              }
            } catch (error) {
              console.error(
                "💥 Telegram: ошибка автоматической авторизации:",
                error
              );
            }
          }
        }

        // Если автоматическая авторизация не удалась, показываем Telegram login
        console.log("📱 Telegram: показываем экран Telegram login");
        setCurrentScreen("telegram login");
      } else {
        // В браузере: сразу показываем админ-логин
        console.log("🌐 Браузер: показываем админ-логин");
        setCurrentScreen("admin login");
      }

      setIsInitialized(true);
    };

    initializeApp();
  }, []); // Запускаем только один раз при монтировании

  useEffect(() => {
    if (showSpinnerAnimation) {
      document.body.classList.add("screen-shake");
      const shakeTimeout = setTimeout(() => {
        document.body.classList.remove("screen-shake");
      }, 300); // 1/4 длительности анимации
      return () => {
        clearTimeout(shakeTimeout);
        document.body.classList.remove("screen-shake");
      };
    } else {
      document.body.classList.remove("screen-shake");
    }
  }, [showSpinnerAnimation]);

  // useEffect для управления экраном на основе статуса авторизации
  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === "undefined") {
      return;
    }

    // Если пользователь авторизован И приложение инициализировано,
    // но не находится на игровых экранах, переключаем на главное меню
    if (
      (isAuthenticated || isAdmin) &&
      isInitialized &&
      currentScreen !== "main menu" &&
      currentScreen !== "classic mode" &&
      currentScreen !== "settings" &&
      currentScreen !== "gameover" &&
      currentScreen !== "shop" &&
      currentScreen !== "leaderboard"
    ) {
      console.log("✅ Пользователь авторизован, переключаем на главное меню");
      setCurrentScreen("main menu");
    }

    // Если пользователь не авторизован и приложение инициализировано,
    // но экран не установлен, показываем соответствующий экран
    if (!isAuthenticated && !isAdmin && isInitialized && !currentScreen) {
      const isInTelegram = isLaunchedInTelegram();
      if (isInTelegram) {
        console.log("📱 Telegram: показываем Telegram login");
        setCurrentScreen("telegram login");
      } else {
        console.log("🌐 Браузер: показываем админ-логин");
        setCurrentScreen("admin login");
      }
    }
  }, [isAuthenticated, isAdmin, isInitialized, currentScreen]);

  // Dev-панель для ручного переключения экрана
  const isDev =
    typeof process !== "undefined" && process.env.NODE_ENV === "development";

  const devScreens: Screen[] = [
    "main menu",
    "classic mode",
    "settings",
    "gameover",
  ];

  useEffect(() => {
    if (isDev && devScreen) {
      setCurrentScreen(devScreen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devScreen]);

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
    if (typeof window !== "undefined" && isLaunchedInTelegram()) {
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

  const handleGameOver = async () => {
    try {
      const { score } = useGameStore.getState();
      const telegramId = user?.telegramId || (isAdmin && process.env.NODE_ENV === 'development' ? '610936383' : null);
      
      if (telegramId && score > 0) {
        console.log('🎮 Sending game over data:', { telegramId, score });
        
        // Отправляем результат игры на сервер
        const response = await fetch(`/api/users/${telegramId}/game`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: 1, // временный ID
            finalScore: score,
            level: 1,
            gameData: {
              gameDuration: Date.now(), // можно добавить реальную продолжительность
              piecesPlaced: useGameStore.getState().piecesPlaced || 0,
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Game over processed:', result);
          
          // Получаем актуальный баланс с сервера
          await refreshBalance();
          
          // Обновляем рекорд если он изменился
          if (result.newRecord !== undefined && user) {
            updateUser({ record: result.newRecord });
          }
        } else {
          console.error('❌ Failed to process game over:', response.status);
        }
      }
    } catch (error) {
      console.error('❌ Error processing game over:', error);
    }
    
    setCurrentScreen("gameover");
  };

  const handleResourcesLoaded = () => {
    setResourcesLoaded(true);
    // НЕ устанавливаем currentScreen - пусть логика авторизации сама определит
  };

  const handleOpenShop = useCallback(() => {
    // Determine where to return after shop
    if (currentScreen === "classic mode") {
      setShopReturnTo("classic mode");
    } else {
      setShopReturnTo("main menu");
    }
    setCurrentScreen("shop");
  }, [currentScreen]);

  const handleShopBack = useCallback(() => {
    if (shopReturnTo === "classic mode") {
      setCurrentScreen("classic mode");
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
  const handlePieceReturnAnimation = useCallback((animationData: {
    piece: any;
    fromPosition: { x: number; y: number };
    targetRect: DOMRect | null;
    cellSize: number;
    gap: number;
  }) => {
    setPieceReturnAnimation(animationData);
  }, []);

  // Показываем загрузку ресурсов если они еще не загружены
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

  // Показываем загрузку пока проверяем статус авторизации или инициализируем приложение
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
    <div className="min-h-screen menu-bg">
      {/* Overlay spinner */}
      {showSpinnerAnimation && boardRect && (
        <div
          style={{
            position: "fixed",
            left: boardRect.left,
            top: boardRect.top,
            width: boardRect.width,
            height: boardRect.height,
            zIndex: 9999,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LoadingSpinner
            width={boardRect.width}
            height={boardRect.height}
            onFinish={handleSpinnerFinish}
            onLineBreakpoint={handleLineBreakpoint}
          />
        </div>
      )}

      

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

      <div
        className={`glow-side glow-left${
          showSpinnerAnimation ? " glow-visible" : ""
        }`}
      />
      <div
        className={`glow-side glow-right${
          showSpinnerAnimation ? " glow-visible" : ""
        }`}
      />

      {/* Dev-панель для ручного переключения экрана */}
      {/* {isDev && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            zIndex: 1000,
            background: "#222",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            opacity: 0.95,
          }}
        >
          <label>
            Dev screen:&nbsp;
            <select
              value={devScreen}
              onChange={(e) => setDevScreen(e.target.value as Screen)}
              style={{ color: "#000" }}
            >
              <option value="">--</option>
              {devScreens.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      )} */}

      {currentScreen === "admin login" && (
        <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
      )}

      {currentScreen === "telegram login" && !autoAuthCompleted && (
        <TelegramLogin
          onLoginSuccess={handleTelegramLoginSuccess}
          seamless={isTelegramAutoAuth}
        />
      )}

      {/* MainMenu теперь скрывается через CSS, а не размонтируется хззззззз*/}
      <div
        style={{ display: currentScreen === "main menu" ? "block" : "none" }}
      >
        <MainMenu
          onStartClassic={hadleStartClassic}
          onOpenShop={handleOpenShop}
          onOpenLeaderboard={handleOpenLeaderboard}
        />
      </div>

      {currentScreen === "classic mode" && (
        <GameBoard
          onExitGame={handleGoToMenu}
          onScoreUpdate={(newScore) => setScore(newScore)}
          onGameOver={handleGameOver}
          onShowSpinner={handleShowSpinnerAnimation}
          onBoardRectChange={setBoardRect}
          clearedLine={clearedLine}
          onGoHome={handleGoToMenu}
          isIntentionalRestart={isIntentionalRestart}
          onRestartComplete={handleRestartComplete}
          onOpenShop={handleOpenShop}
          onPieceReturnAnimation={handlePieceReturnAnimation}
        />
      )}

      {currentScreen === "gameover" && (
        <GameOver
          onPlayAgain={() => {
            setIsIntentionalRestart(true); // Устанавливаем флаг перед сбросом
            setCurrentScreen("classic mode");
            useGameStore.getState().resetGame();
          }}
        />
      )}

      {currentScreen === "shop" && (
        <ShopScreen
          onBack={handleShopBack}
          initialTab={shopReturnTo === "classic mode" ? "boosters" : "shards"}
        />
      )}

      {currentScreen === "leaderboard" && (
        <LeaderboardScreen
          onBack={handleLeaderboardBack}
        />
      )}

      {/* Fallback для отладки */}
      {!currentScreen && <LoadingScreen />}
    </div>
  );
};

export default HomePage;
