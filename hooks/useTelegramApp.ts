import { useCallback, useEffect, useRef, useState } from 'react';
import { init } from '@telegram-apps/sdk';
import { HomeScreen, AppStateStatus } from '@/types/home';
import { initializeTelegramWebApp, isLaunchedInTelegram, onTelegramWebAppReady, safeLocalStorage } from '@/lib/utils/telegramSDK';
import { useAdminAuth } from './useAdminAuth';
import { useUser } from './useUser';

type ScreenState = HomeScreen | '';

type StartupMilestone = 'sdk-init' | 'telegram-init' | 'session-restore' | 'auto-auth';

interface SlowStartupState {
  active: boolean;
  step?: StartupMilestone;
  since?: number;
  threshold?: number;
}

type StartupMetrics = Record<StartupMilestone, number[]>;

const STARTUP_METRICS_KEY = 'startupMetrics.v1';
const METRIC_SAMPLE_SIZE = 20;

const DEFAULT_THRESHOLDS: Record<StartupMilestone, number> = {
  'sdk-init': 4000,
  'telegram-init': 8000,
  'session-restore': 3500,
  'auto-auth': 7000,
};

interface UseTelegramAppResult {
  adminAuth: ReturnType<typeof useAdminAuth>;
  userState: ReturnType<typeof useUser>;
  appState: AppStateStatus;
  setAppState: React.Dispatch<React.SetStateAction<AppStateStatus>>;
  currentScreen: ScreenState;
  setCurrentScreen: React.Dispatch<React.SetStateAction<ScreenState>>;
  isInitialized: boolean;
  isFullyReady: boolean;
  isTelegramAutoAuth: boolean;
  autoAuthCompleted: boolean;
  handleAdminLoginSuccess: (token: string, expiresAt: string) => void;
  handleTelegramLoginSuccess: (user: any, sessionToken: string) => void;
  handleLogout: () => void;
  slowStartup: SlowStartupState;
  dismissSlowStartup: () => void;
}

const isGameScreen = (screen: ScreenState) =>
  screen === 'classic mode' || screen === 'zen mode' || screen === 'settings' || screen === 'gameover' || screen === 'shop' || screen === 'leaderboard';

const loadStartupMetrics = (): StartupMetrics => {
  if (typeof window === 'undefined') {
    return {
      'sdk-init': [],
      'telegram-init': [],
      'session-restore': [],
      'auto-auth': [],
    };
  }

  try {
    const raw = safeLocalStorage.getItem(STARTUP_METRICS_KEY);
    if (!raw) {
      return {
        'sdk-init': [],
        'telegram-init': [],
        'session-restore': [],
        'auto-auth': [],
      };
    }
    const parsed = JSON.parse(raw) as StartupMetrics;
    return {
      'sdk-init': parsed['sdk-init']?.slice?.(-METRIC_SAMPLE_SIZE) ?? [],
      'telegram-init': parsed['telegram-init']?.slice?.(-METRIC_SAMPLE_SIZE) ?? [],
      'session-restore': parsed['session-restore']?.slice?.(-METRIC_SAMPLE_SIZE) ?? [],
      'auto-auth': parsed['auto-auth']?.slice?.(-METRIC_SAMPLE_SIZE) ?? [],
    };
  } catch {
    return {
      'sdk-init': [],
      'telegram-init': [],
      'session-restore': [],
      'auto-auth': [],
    };
  }
};

const computeThreshold = (metric: StartupMilestone, samples: number[]): number => {
  if (!samples.length) {
    return DEFAULT_THRESHOLDS[metric];
  }

  const mean = samples.reduce((acc, value) => acc + value, 0) / samples.length;
  const variance = samples.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / samples.length;
  const std = Math.sqrt(variance);

  const adaptive = mean + std * 2;
  return Math.max(DEFAULT_THRESHOLDS[metric], Math.min(adaptive, DEFAULT_THRESHOLDS[metric] * 4));
};

export const useTelegramApp = (): UseTelegramAppResult => {
  const adminAuth = useAdminAuth();
  const userState = useUser();

  const [appState, setAppState] = useState<AppStateStatus>('loading');
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('');
  const [isTelegramAutoAuth, setIsTelegramAutoAuth] = useState(false);
  const [autoAuthCompleted, setAutoAuthCompleted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [slowStartup, setSlowStartup] = useState<SlowStartupState>({ active: false });
  const [isFullyReady, setIsFullyReady] = useState(false);
  const docReadyRef = useRef(typeof document !== 'undefined' ? document.readyState === 'complete' : false);
  const telegramReadyRef = useRef(false);

  const loginUserRef = useRef(userState.loginUser);
  const logoutRef = useRef(userState.logout);
  const loginAsAdminRef = useRef(adminAuth.loginAsAdmin);
  const logoutAdminRef = useRef(adminAuth.logoutAdmin);
  const metricsRef = useRef<StartupMetrics>(loadStartupMetrics());
  const milestoneStartRef = useRef<Partial<Record<StartupMilestone, number>>>({});
  const milestoneTimersRef = useRef<Partial<Record<StartupMilestone, number>>>({});
  const slowStateRef = useRef<SlowStartupState>({ active: false });
  const suppressedStepsRef = useRef<Set<StartupMilestone>>(new Set());
  const suppressionTimersRef = useRef<Partial<Record<StartupMilestone, number>>>({});
  const recomputeReadiness = useCallback(() => {
    const ready = docReadyRef.current && telegramReadyRef.current && appState === 'idle';
    setIsFullyReady(ready);
  }, [appState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (document.readyState === 'complete') {
      docReadyRef.current = true;
      recomputeReadiness();
      return;
    }

    const handleReadyState = () => {
      if (document.readyState === 'complete') {
        docReadyRef.current = true;
        recomputeReadiness();
        document.removeEventListener('readystatechange', handleReadyState);
        window.removeEventListener('load', handleLoad);
      }
    };

    const handleLoad = () => {
      docReadyRef.current = true;
      recomputeReadiness();
      document.removeEventListener('readystatechange', handleReadyState);
      window.removeEventListener('load', handleLoad);
    };

    document.addEventListener('readystatechange', handleReadyState);
    window.addEventListener('load', handleLoad);

    return () => {
      document.removeEventListener('readystatechange', handleReadyState);
      window.removeEventListener('load', handleLoad);
    };
  }, [recomputeReadiness]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let detachReadyListener: (() => void) | undefined;
    let waitForTelegramTimer: number | undefined;
    let fallbackTimer: number | undefined;

    const markTelegramReady = () => {
      if (telegramReadyRef.current) return;
      telegramReadyRef.current = true;
      recomputeReadiness();
    };

    const attachTelegramListener = () => {
      const tg = window.Telegram?.WebApp;
      if (!tg) return false;

      const handleReady = () => {
        markTelegramReady();
      };

      try {
        tg.onEvent?.('web_app_ready', handleReady);
      } catch (error) {
        
      }

      if (tg.isExpanded || tg.initData) {
        handleReady();
      }

      detachReadyListener = () => {
        try {
          tg.offEvent?.('web_app_ready', handleReady);
        } catch (error) {
          
        }
      };

      return true;
    };

    if (!attachTelegramListener()) {
      waitForTelegramTimer = window.setInterval(() => {
        if (attachTelegramListener()) {
          if (waitForTelegramTimer) {
            window.clearInterval(waitForTelegramTimer);
            waitForTelegramTimer = undefined;
          }
        }
      }, 300);
    }

    const unsubscribeInit = onTelegramWebAppReady((success) => {
      if (success) {
        markTelegramReady();
        attachTelegramListener();
      }
    });

    fallbackTimer = window.setTimeout(() => {
      markTelegramReady();
    }, 8000);

    return () => {
      unsubscribeInit?.();
      if (waitForTelegramTimer) {
        window.clearInterval(waitForTelegramTimer);
      }
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      detachReadyListener?.();
    };
  }, [recomputeReadiness]);

  const persistMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = JSON.stringify(metricsRef.current);
      window.setTimeout(() => {
        safeLocalStorage.setItem(STARTUP_METRICS_KEY, snapshot);
      }, 0);
    } catch {
      // ignore storage errors
    }
  }, []);

  const updateMetrics = useCallback(
    (step: StartupMilestone, duration: number) => {
      const samples = metricsRef.current[step] ?? [];
      samples.push(duration);
      if (samples.length > METRIC_SAMPLE_SIZE) {
        samples.splice(0, samples.length - METRIC_SAMPLE_SIZE);
      }
      metricsRef.current[step] = samples;
      persistMetrics();
    },
    [persistMetrics],
  );

  const clearSlowForStep = useCallback((step: StartupMilestone) => {
    if (slowStateRef.current.active && slowStateRef.current.step === step) {
      slowStateRef.current = { active: false };
      setSlowStartup({ active: false });
    }
    suppressedStepsRef.current.delete(step);
  }, []);

  const triggerSlowForStep = useCallback(
    (step: StartupMilestone, threshold: number) => {
      if (suppressedStepsRef.current.has(step)) {
        return;
      }
      const info: SlowStartupState = {
        active: true,
        step,
        since: Date.now(),
        threshold,
      };
      slowStateRef.current = info;
      setSlowStartup(info);
    },
    [],
  );

  const dismissSlowStartup = useCallback(() => {
    const current = slowStateRef.current;
    setSlowStartup({ active: false });
    slowStateRef.current = { active: false };
    if (current.step) {
      const step = current.step;
      suppressedStepsRef.current.add(step);
      if (suppressionTimersRef.current[step]) {
        window.clearTimeout(suppressionTimersRef.current[step]);
      }
      suppressionTimersRef.current[step] = window.setTimeout(() => {
        suppressedStepsRef.current.delete(step);
        delete suppressionTimersRef.current[step];
        if (milestoneStartRef.current[step]) {
          triggerSlowForStep(step, current.threshold ?? DEFAULT_THRESHOLDS[step]);
        }
      }, 2000);
    }
  }, [triggerSlowForStep]);

  const cancelMilestoneTimer = useCallback((step: StartupMilestone) => {
    const timer = milestoneTimersRef.current[step];
    if (timer) {
      window.clearTimeout(timer);
      delete milestoneTimersRef.current[step];
    }
  }, []);

  const startMilestone = useCallback(
    (step: StartupMilestone) => {
      const now = Date.now();
      milestoneStartRef.current[step] = now;
      cancelMilestoneTimer(step);

      const samples = metricsRef.current[step] ?? [];
      const threshold = computeThreshold(step, samples);
      milestoneTimersRef.current[step] = window.setTimeout(() => {
        triggerSlowForStep(step, threshold);
      }, threshold);
    },
    [cancelMilestoneTimer, triggerSlowForStep],
  );

  const completeMilestone = useCallback(
    (step: StartupMilestone) => {
      const start = milestoneStartRef.current[step];
      if (!start) {
        cancelMilestoneTimer(step);
        clearSlowForStep(step);
        return;
      }

      const duration = Date.now() - start;
      updateMetrics(step, duration);
      delete milestoneStartRef.current[step];
      cancelMilestoneTimer(step);
      clearSlowForStep(step);
      if (step === 'telegram-init') {
        telegramReadyRef.current = true;
        recomputeReadiness();
      }
    },
    [cancelMilestoneTimer, updateMetrics, clearSlowForStep, recomputeReadiness],
  );

  const cancelAllMilestones = useCallback(() => {
    (Object.keys(milestoneStartRef.current) as StartupMilestone[]).forEach((step) => {
      cancelMilestoneTimer(step);
      delete milestoneStartRef.current[step];
      clearSlowForStep(step);
    });
  }, [cancelMilestoneTimer, clearSlowForStep]);

  useEffect(() => {
    loginUserRef.current = userState.loginUser;
  }, [userState.loginUser]);

  useEffect(() => {
    logoutRef.current = userState.logout;
  }, [userState.logout]);

  useEffect(() => {
    loginAsAdminRef.current = adminAuth.loginAsAdmin;
  }, [adminAuth.loginAsAdmin]);

  useEffect(() => {
    logoutAdminRef.current = adminAuth.logoutAdmin;
  }, [adminAuth.logoutAdmin]);

  const fallbackToLogin = useCallback(
    (screen?: HomeScreen) => {
      cancelAllMilestones();
      const targetScreen = screen ?? (isLaunchedInTelegram() ? 'telegram login' : 'admin login');
      if (targetScreen === 'telegram login') {
        setIsTelegramAutoAuth(false);
      }
      setAutoAuthCompleted(false);
      setCurrentScreen(targetScreen);
      setAppState('idle');
      setIsInitialized(true);
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    setAppState('loading');

    const initializeApp = async () => {
      startMilestone('sdk-init');
      try {
        await init();
        completeMilestone('sdk-init');
      } catch (error) {
        
        completeMilestone('sdk-init');
        if (!isMounted) return;
        fallbackToLogin();
        return;
      }

      if (!isMounted) return;

      startMilestone('telegram-init');
      let telegramSuccess = false;
      try {
        const connection = (navigator as any)?.connection;
        const effectiveType = connection?.effectiveType;
        const isSlowConnection = effectiveType && ['slow-2g', '2g', '3g'].includes(effectiveType);
        const timeoutMs = isSlowConnection ? 15000 : 10000;

        const initPromise = initializeTelegramWebApp();
        const timeoutPromise = new Promise<boolean>((resolve) => {
          window.setTimeout(() => resolve(false), timeoutMs);
        });

        const firstResult = await Promise.race([initPromise, timeoutPromise]);
        if (!isMounted) return;

        if (firstResult === false) {
          
          telegramSuccess = await initPromise;
        } else {
          telegramSuccess = firstResult;
        }
      } catch (error) {
        
        completeMilestone('telegram-init');
        if (!isMounted) return;
        fallbackToLogin();
        return;
      }

      completeMilestone('telegram-init');

      if (!isMounted) return;

      if (typeof window === 'undefined') {
        fallbackToLogin();
        return;
      }

      startMilestone('session-restore');
      const existingSessionToken = safeLocalStorage.getItem('sessionToken');
      const existingAdminToken = safeLocalStorage.getItem('adminToken');
      const cachedUser = safeLocalStorage.getItem('userData');

      if (existingSessionToken && cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser);
          if (parsed && typeof parsed.telegramId !== 'undefined' && parsed.telegramId !== null) {
            completeMilestone('session-restore');
            setCurrentScreen('main menu');
            setAppState('idle');
            setIsInitialized(true);
            return;
          }
        } catch {
          // corrupted cache, fallback to normal flow
        }
      }

      if (existingAdminToken) {
        completeMilestone('session-restore');
        setCurrentScreen('main menu');
        setAppState('idle');
        setIsInitialized(true);
        return;
      }

      completeMilestone('session-restore');

      const inTelegram = isLaunchedInTelegram();

      if (inTelegram) {
        setIsTelegramAutoAuth(true);

        const tg = window.Telegram?.WebApp;
        if (tg) {
          if (!telegramSuccess) {
            
          }

          const tgUser = tg.initDataUnsafe?.user;
          if (tgUser) {
            startMilestone('auto-auth');
            try {
              const initData = tg.initData || '';
              const urlParams = new URLSearchParams(initData);
              const hash = urlParams.get('hash');
              const authDate = urlParams.get('auth_date');

              if (hash) {
                const authData = {
                  ...tgUser,
                  hash,
                  auth_date: authDate ? parseInt(authDate) : undefined,
                  initData,
                };

                const response = await fetch('/api/auth/telegram', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(authData),
                });

                const data = await response.json();
                if (response.ok) {
                  safeLocalStorage.setItem('sessionToken', data.sessionToken);
                  safeLocalStorage.setItem('userData', JSON.stringify(data.user));
                  loginUserRef.current(data.user, data.sessionToken);
                  setAutoAuthCompleted(true);
                  completeMilestone('auto-auth');
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  if (!isMounted) return;
                  setCurrentScreen('main menu');
                  setAppState('idle');
                  setIsInitialized(true);
                  return;
                }

                
                completeMilestone('auto-auth');
                if (!isMounted) return;
                fallbackToLogin('telegram login');
                return;
              }

              
              completeMilestone('auto-auth');
              if (!isMounted) return;
              fallbackToLogin('telegram login');
              return;
            } catch (error) {
              
              completeMilestone('auto-auth');
              if (!isMounted) return;
              fallbackToLogin('telegram login');
              return;
            }
          }
        }

        clearSlowForStep('auto-auth');
        setCurrentScreen('telegram login');
        setAppState('idle');
        setIsInitialized(true);
        return;
      }

      clearSlowForStep('auto-auth');
      setCurrentScreen('admin login');
      setAppState('idle');
      setIsInitialized(true);
    };

    initializeApp();

    return () => {
      isMounted = false;
      (Object.values(suppressionTimersRef.current) as number[]).forEach((timerId) => {
        if (timerId) {
          window.clearTimeout(timerId);
        }
      });
      suppressionTimersRef.current = {};
    };
  }, [fallbackToLogin]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (
      (userState.isAuthenticated || adminAuth.isAdmin) &&
      isInitialized &&
      currentScreen &&
      !isGameScreen(currentScreen)
    ) {
      setCurrentScreen('main menu');
      setAppState('idle');
    }

    if (!userState.isAuthenticated && !adminAuth.isAdmin && isInitialized && !currentScreen) {
      const inTelegram = isLaunchedInTelegram();
      setCurrentScreen(inTelegram ? 'telegram login' : 'admin login');
      setAppState('idle');
    }
  }, [
    adminAuth.isAdmin,
    userState.isAuthenticated,
    isInitialized,
    currentScreen,
  ]);

  useEffect(() => {
    if (!isInitialized) return;

    const timer = window.setTimeout(() => {
      if (currentScreen) return;

      const hasToken = !!safeLocalStorage.getItem('sessionToken');
      const hasUser = !!safeLocalStorage.getItem('userData');

      if (hasToken !== hasUser) {
        safeLocalStorage.removeItem('sessionToken');
        safeLocalStorage.removeItem('userData');
      }

      if (isLaunchedInTelegram()) {
        setCurrentScreen('telegram login');
      } else {
        setCurrentScreen('admin login');
      }
      setAppState('idle');
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isInitialized, currentScreen]);

  const handleAdminLoginSuccess = useCallback(
    (adminToken: string, expiresAt: string) => {
      loginAsAdminRef.current(adminToken, expiresAt);
      setCurrentScreen('main menu');
      setAppState('idle');
    },
    [],
  );

  const handleTelegramLoginSuccess = useCallback(
    (user: any, sessionToken: string) => {
      loginUserRef.current(user, sessionToken);
      setCurrentScreen('main menu');
      setAppState('idle');
      clearSlowForStep('session-restore');
    },
    [clearSlowForStep],
  );

  const handleLogout = useCallback(() => {
    if (adminAuth.isAdmin) {
      logoutAdminRef.current();
    } else {
      logoutRef.current();
    }

    setAutoAuthCompleted(false);

    if (typeof window !== 'undefined' && isLaunchedInTelegram()) {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.initDataUnsafe?.user) {
        (async () => {
          try {
            setIsTelegramAutoAuth(true);
            const tgUser = tg.initDataUnsafe.user;
            const initData = tg.initData || '';
            const urlParams = new URLSearchParams(initData);
            const hash = urlParams.get('hash');
            const authDate = urlParams.get('auth_date');
            if (hash) {
              const authData = {
                ...tgUser,
                hash,
                auth_date: authDate ? parseInt(authDate) : undefined,
                initData,
              } as any;
              const response = await fetch('/api/auth/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authData),
              });
              const data = await response.json();
              if (response.ok) {
                safeLocalStorage.setItem('sessionToken', data.sessionToken);
                safeLocalStorage.setItem('userData', JSON.stringify(data.user));
                loginUserRef.current(data.user, data.sessionToken);
                setAutoAuthCompleted(true);
                await new Promise((resolve) => setTimeout(resolve, 150));
                setCurrentScreen('main menu');
                return;
              }
            }
          } catch {
            // ignore auto auth errors
          }
          setIsTelegramAutoAuth(false);
          setCurrentScreen('telegram login');
        })();
        return;
      }

      setCurrentScreen('telegram login');
      return;
    }

    setIsTelegramAutoAuth(false);
    setCurrentScreen('admin login');
  }, [adminAuth.isAdmin]);

  return {
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
    handleLogout,
    slowStartup,
    dismissSlowStartup,
  };
};
