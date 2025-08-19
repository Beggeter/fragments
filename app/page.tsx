"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { init } from "@telegram-apps/sdk";
import GameBoard from "../components/GameBoard";
import { ZenGameBoard } from "../components/ZenGameBoard";
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
import ShopScreen from "../components/ShopScreen";
import LeaderboardScreen from "../components/LeaderboardScreen";
import PieceReturnAnimation from "../components/board/PieceReturnAnimation";
import { initializeTelegramWebApp, isLaunchedInTelegram, safeLocalStorage } from "@/lib/utils/telegramSDK";

type Screen =
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

// Функция isLaunchedInTelegram теперь импортируется из telegramSDK

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
  // Вместо isTransitioning и isInitialized:
  const [appState, setAppState] = useState<'idle' | 'transitioning' | 'error' | 'loading'>('loading');

  // Создаем стабильную функцию для завершения перезапуска
  const handleRestartComplete = useCallback(() => {
    setIsIntentionalRestart(false);
  }, []);


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
    sessionToken,
  } = useUser();

  // Инициализация: определяем контекст и показываем соответствующий экран
  useEffect(() => {
    setAppState('loading');
    const initializeApp = async () => {
      console.log('🚀 Starting app initialization...');
      
      try {
        // Инициализируем TMA SDK (новый @telegram-apps/sdk)
        await init();
      } catch (error) {
        console.warn('Failed to initialize @telegram-apps/sdk:', error);
        setAppState('error');
        return;
      }
      
      // ✅ Инициализируем Telegram WebApp с улучшенной обработкой слабого интернета
      console.log('🔄 Starting Telegram WebApp initialization...');
      let telegramSuccess = false;
      
      try {
        // Детекция типа соединения для адаптивного таймаута
        const connection = (navigator as any)?.connection;
        const effectiveType = connection?.effectiveType;
        const isSlowConnection = effectiveType && ['slow-2g', '2g', '3g'].includes(effectiveType);
        
        // Адаптивный таймаут: больше времени для медленных соединений
        const timeoutMs = isSlowConnection ? 15000 : 10000;
        console.log(`📶 Connection type: ${effectiveType || 'unknown'}, timeout: ${timeoutMs}ms`);
        
        const initPromise = initializeTelegramWebApp();
        const timeoutPromise = new Promise<boolean>(resolve => 
          setTimeout(() => {
            console.warn(`⏰ Telegram initialization timeout (${timeoutMs}ms), continuing with fallback`);
            resolve(false);
          }, timeoutMs)
        );
        
        telegramSuccess = await Promise.race([initPromise, timeoutPromise]);
        console.log('📱 Telegram WebApp initialization:', telegramSuccess ? 'success' : 'failed/timeout');
      } catch (error) {
        console.error('❌ Error during Telegram initialization:', error);
        telegramSuccess = false;
        setAppState('error');
        return;
      }
      
      // Проверяем, что мы на клиенте
      if (typeof window === "undefined") {
        setAppState('error');
        return;
      }

      // Проверяем, есть ли уже авторизованный пользователь (валидный кеш)
      const existingSessionToken = safeLocalStorage.getItem("sessionToken");
      const existingAdminToken = safeLocalStorage.getItem("adminToken");
      const cachedUser = safeLocalStorage.getItem("userData");

      if (existingSessionToken && cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser);
          if (parsed && typeof parsed.telegramId !== 'undefined' && parsed.telegramId !== null) {
            // Валидный кеш — считаем сессию готовой и показываем меню
            setCurrentScreen("main menu");
            setAppState('idle');
            setIsInitialized(true);
            return;
          }
        } catch {
          // битый кеш — игнорируем, пойдём по обычному флоу
        }
      }
      if (existingAdminToken) {
        // Админ-токен есть — разрешаем сразу перейти в меню
        setCurrentScreen("main menu");
        setAppState('idle');
        setIsInitialized(true);
        return;
      }

      // Определяем контекст: Telegram WebApp или браузер
      const isInTelegram = isLaunchedInTelegram();

      if (isInTelegram) {
        // В Telegram: пытаемся автоматическую авторизацию
        setIsTelegramAutoAuth(true);

        const tg = window.Telegram?.WebApp;
        if (tg) {
          // ✅ Проверяем готовность Telegram WebApp перед автоавторизацией
          if (!telegramSuccess) {
            console.warn('⚠️ Telegram WebApp not fully initialized, proceeding with caution');
          }
          
          const user = tg.initDataUnsafe?.user;
          if (user) {
            try {
              console.log('🔐 Starting Telegram auto-authentication for user:', user.id);
              
              const initData = tg.initData || "";
              const urlParams = new URLSearchParams(initData);
              const hash = urlParams.get("hash");
              const authDate = urlParams.get("auth_date");

              if (hash) {
                const authData = {
                  ...user,
                  hash: hash,
                  auth_date: authDate ? parseInt(authDate) : undefined,
                  initData: initData,
                };

                console.log('📡 Sending auth request to server...');
                const response = await fetch("/api/auth/telegram", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(authData),
                });

                const data = await response.json();
                if (response.ok) {
                  console.log('✅ Auto-auth successful, setting up session...');
                  safeLocalStorage.setItem("sessionToken", data.sessionToken);
                  safeLocalStorage.setItem("userData", JSON.stringify(data.user));
                  loginUser(data.user, data.sessionToken);
                  setAutoAuthCompleted(true);
                  
                  // ✅ Дополнительная задержка для стабилизации состояния
                  await new Promise(resolve => setTimeout(resolve, 300));
                  setCurrentScreen("main menu");
                  setAppState('idle');
                  setIsInitialized(true);
                  return;
                } else {
                  console.error('❌ Auth server error:', data);
                  setAppState('error');
                  return;
                }
              } else {
                console.warn('⚠️ No hash found in Telegram initData');
                setAppState('error');
                return;
              }
            } catch (error) {
              console.error('Auto-auth failed:', error);
              setAppState('error');
              return;
            }
          }
        }

        // Если автоматическая авторизация не удалась, показываем Telegram login
        setCurrentScreen("telegram login");
        setAppState('idle');
      } else {
        // В браузере: сразу показываем админ-логин
        setCurrentScreen("admin login");
        setAppState('idle');
      }

      setIsInitialized(true);
    };

    initializeApp();
  }, []); // Запускаем только один раз при монтировании

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault(); // Отключить контекстное меню
    };

    // Отключаем контекстное меню на всей странице
    document.addEventListener("contextmenu", preventContextMenu);

    // Очистка при размонтировании компонента
    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);

  useEffect(() => {
    // Frontend error logger (no devtools in TMA) — сэмплирование и дебаунс
    let lastSent = 0;
    const minIntervalMs = 5000;
    const send = (payload: any) => {
      const now = Date.now();
      if (now - lastSent < minIntervalMs) return;
      lastSent = now;
      fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    };
    const onError = (event: ErrorEvent) => {
      const src = (event as any).filename?.toString?.() || '';
      const ln = (event as any).lineno || 0;
      const col = (event as any).colno || 0;
      const msg = event.message || 'unknown';
      send({ event: 'window_error', msg, src, ln, col, ts: Date.now() });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const msg = (event as any).reason && ((event as any).reason.message || (event as any).reason.toString()) || 'unhandledrejection';
      send({ event: 'unhandledrejection', msg, ts: Date.now() });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection as any);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection as any);
    };
  }, []);

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

  // Защитный хук: следим, чтобы никакие оверлеи не удерживали pointer-events
  useEffect(() => {
    const fixOverlays = () => {
      // снимаем pointer-events с фоновых анимаций/оверлеев на случай гонок
      document.querySelectorAll('[data-bg-overlay]')
        .forEach(el => (el as HTMLElement).style.pointerEvents = 'none');
    };
    fixOverlays();
    const id = setInterval(fixOverlays, 1500);
    return () => clearInterval(id);
  }, []);

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
      currentScreen !== "zen mode" &&
      currentScreen !== "settings" &&
      currentScreen !== "gameover" &&
      currentScreen !== "shop" &&
      currentScreen !== "leaderboard"
    ) {
      setCurrentScreen("main menu");
      // Ensure menu buttons are interactive
      setAppState('idle');
    }

    // Если пользователь не авторизован и приложение инициализировано,
    // но экран не установлен, показываем соответствующий экран
    if (!isAuthenticated && !isAdmin && isInitialized && !currentScreen) {
      const isInTelegram = isLaunchedInTelegram();
      if (isInTelegram) {
        setCurrentScreen("telegram login");
        setAppState('idle');
      } else {
        setCurrentScreen("admin login");
        setAppState('idle');
      }
    }
  }, [isAuthenticated, isAdmin, isInitialized, currentScreen]);

  // Fail-safe watchdog: если через 3 секунды после инициализации экран не выбран — очищаем битую сессию и показываем логин
  useEffect(() => {
    if (!isInitialized) return;
    const timer = setTimeout(() => {
      if (!currentScreen) {
        const hasToken = !!safeLocalStorage.getItem('sessionToken');
        const hasUser = !!safeLocalStorage.getItem('userData');
        // Если кеш неполный — очищаем
        if (hasToken !== hasUser) {
          safeLocalStorage.removeItem('sessionToken');
          safeLocalStorage.removeItem('userData');
        }
        if (isLaunchedInTelegram()) {
          setCurrentScreen('telegram login');
          setAppState('idle');
        } else {
          setCurrentScreen('admin login');
          setAppState('idle');
        }
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isInitialized, currentScreen]);

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
    setAppState('idle');
  };

  const handleTelegramLoginSuccess = (user: any, sessionToken: string) => {
    loginUser(user, sessionToken);
    setCurrentScreen("main menu");
    setAppState('idle');
  };

  const handleLogout = () => {
    if (isAdmin) {
      logoutAdmin();
    } else {
      logout();
    }
    setAutoAuthCompleted(false);
    
    // Если мы внутри Telegram — пробуем автоматическую авторизацию сразу
    if (typeof window !== "undefined" && isLaunchedInTelegram()) {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.initDataUnsafe?.user) {
        (async () => {
          try {
            setIsTelegramAutoAuth(true);
            const user = tg.initDataUnsafe.user;
            const initData = tg.initData || "";
            const urlParams = new URLSearchParams(initData);
            const hash = urlParams.get("hash");
            const authDate = urlParams.get("auth_date");
            if (hash) {
              const authData = {
                ...user,
                hash: hash,
                auth_date: authDate ? parseInt(authDate) : undefined,
                initData: initData,
              } as any;
              const response = await fetch("/api/auth/telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(authData),
              });
              const data = await response.json();
              if (response.ok) {
                // Сохраняем сессию и возвращаемся в меню
                safeLocalStorage.setItem("sessionToken", data.sessionToken);
                safeLocalStorage.setItem("userData", JSON.stringify(data.user));
                loginUser(data.user, data.sessionToken);
                setAutoAuthCompleted(true);
                await new Promise((r) => setTimeout(r, 150));
                setCurrentScreen("main menu");
                return;
              }
            }
          } catch {}
          // Фолбек: показать экран логина Telegram
          setIsTelegramAutoAuth(false);
          setCurrentScreen("telegram login");
        })();
        return;
      }
      // Нет tg данных — показываем логин
      setCurrentScreen("telegram login");
      return;
    }
    // В браузере — админ логин
    setIsTelegramAutoAuth(false);
    setCurrentScreen("admin login");
  };


  // Кнопки активны только если appState === 'idle'
  const isMenuButtonActive = appState === 'idle';

  const handleStartClassic = useCallback(async () => {
    if (appState !== 'idle') return;
    setAppState('transitioning');

    try {
      // ✅ Защита от множественных кликов и проверка инициализации
      if (appState !== 'idle') {
        console.warn('🚫 Classic mode blocked: transitioning=', appState, 'initialized=', isInitialized);
        return;
      }
      
      console.log('🎮 Starting Classic mode...');
      
      // ✅ Подготовка критических ресурсов перед переходом
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Проверка готовности хранилища
      if (typeof window !== 'undefined' && !window.localStorage) {
        console.warn('⚠️ LocalStorage not available, using fallback');
      }
      
      setCurrentScreen("classic mode");
      setAppState('idle');
    } catch (error) {
      console.error('❌ Failed to start Classic mode:', error);
      setAppState('error');
    }

  }, [appState]);


  const handleStartZen = useCallback(async () => {
    if (appState !== 'idle') return;
    setAppState('transitioning');
    try {
      // ✅ Защита от множественных кликов и проверка инициализации
      if (appState !== 'idle') {
        console.warn('🚫 Zen mode blocked: transitioning=', appState, 'initialized=', isInitialized);
        return;
      }
      
      console.log('🧘 Starting Zen mode...');
      
      // ✅ Подготовка критических ресурсов перед переходом
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Проверка готовности хранилища
      if (typeof window !== 'undefined' && !window.localStorage) {
        console.warn('⚠️ LocalStorage not available, using fallback');
      }
      
      setCurrentScreen("zen mode");
      setAppState('idle');
    } catch (error) {
      console.error('❌ Failed to start Zen mode:', error);
      setAppState('error');
    }
  }, [appState]);

  const handleGoToMenu = useCallback(() => {
    if (appState !== 'idle') return;
    setAppState('transitioning');
    console.log('🏠 Going to main menu...');
    setCurrentScreen("main menu");
    setAppState('idle');
  }, [appState]);

  // Ensure menu is always interactive when visible
  useEffect(() => {
    if (currentScreen === 'main menu' && appState !== 'idle') {
      setAppState('idle');
    }
  }, [currentScreen, appState]);

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
      // Perf: measure time from click to ShopScreen mount
      try { console.time && console.time("openShop"); } catch {}
      // Determine where to return after shop
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
      className={`${
        currentScreen === "classic mode" || currentScreen === "zen mode"
          ? "bg-[var(--game-background)]"
          : "menu-bg"
      } min-h-screen `}
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
          isTransitioning={appState !== 'idle'}
          isInitialized={isInitialized}
        />
      )}

      {currentScreen === "classic mode" && (
        <GameBoard
          onExitGame={handleGoToMenu}
          onScoreUpdate={(newScore) => setScore(newScore)}
          onGameOver={handleGameOver}
          onBoardRectChange={setBoardRect}
          clearedLine={clearedLine}
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
