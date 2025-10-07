import { useCallback, useEffect, useRef, useState } from 'react';
import { init } from '@telegram-apps/sdk';
import { HomeScreen, AppStateStatus } from '@/types/home';
import { initializeTelegramWebApp, isLaunchedInTelegram, safeLocalStorage } from '@/lib/utils/telegramSDK';
import { useAdminAuth } from './useAdminAuth';
import { useUser } from './useUser';

type ScreenState = HomeScreen | '';

interface UseTelegramAppResult {
  adminAuth: ReturnType<typeof useAdminAuth>;
  userState: ReturnType<typeof useUser>;
  appState: AppStateStatus;
  setAppState: React.Dispatch<React.SetStateAction<AppStateStatus>>;
  currentScreen: ScreenState;
  setCurrentScreen: React.Dispatch<React.SetStateAction<ScreenState>>;
  isInitialized: boolean;
  isTelegramAutoAuth: boolean;
  autoAuthCompleted: boolean;
  handleAdminLoginSuccess: (token: string, expiresAt: string) => void;
  handleTelegramLoginSuccess: (user: any, sessionToken: string) => void;
  handleLogout: () => void;
}

const isGameScreen = (screen: ScreenState) =>
  screen === 'classic mode' || screen === 'zen mode' || screen === 'settings' || screen === 'gameover' || screen === 'shop' || screen === 'leaderboard';

export const useTelegramApp = (): UseTelegramAppResult => {
  const adminAuth = useAdminAuth();
  const userState = useUser();

  const [appState, setAppState] = useState<AppStateStatus>('loading');
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('');
  const [isTelegramAutoAuth, setIsTelegramAutoAuth] = useState(false);
  const [autoAuthCompleted, setAutoAuthCompleted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const loginUserRef = useRef(userState.loginUser);
  const logoutRef = useRef(userState.logout);
  const loginAsAdminRef = useRef(adminAuth.loginAsAdmin);
  const logoutAdminRef = useRef(adminAuth.logoutAdmin);

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
      try {
        await init();
      } catch (error) {
        console.warn('Failed to initialize @telegram-apps/sdk:', error);
        if (!isMounted) return;
        fallbackToLogin();
        return;
      }

      if (!isMounted) return;

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

        telegramSuccess = await Promise.race([initPromise, timeoutPromise]);
      } catch (error) {
        console.error('Error during Telegram initialization:', error);
        if (!isMounted) return;
        fallbackToLogin();
        return;
      }

      if (!isMounted) return;

      if (typeof window === 'undefined') {
        fallbackToLogin();
        return;
      }

      const existingSessionToken = safeLocalStorage.getItem('sessionToken');
      const existingAdminToken = safeLocalStorage.getItem('adminToken');
      const cachedUser = safeLocalStorage.getItem('userData');

      if (existingSessionToken && cachedUser) {
        try {
          const parsed = JSON.parse(cachedUser);
          if (parsed && typeof parsed.telegramId !== 'undefined' && parsed.telegramId !== null) {
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
        setCurrentScreen('main menu');
        setAppState('idle');
        setIsInitialized(true);
        return;
      }

      const inTelegram = isLaunchedInTelegram();

      if (inTelegram) {
        setIsTelegramAutoAuth(true);

        const tg = window.Telegram?.WebApp;
        if (tg) {
          if (!telegramSuccess) {
            console.warn('Telegram WebApp not fully initialized, proceeding with caution');
          }

          const tgUser = tg.initDataUnsafe?.user;
          if (tgUser) {
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
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  if (!isMounted) return;
                  setCurrentScreen('main menu');
                  setAppState('idle');
                  setIsInitialized(true);
                  return;
                }

                console.error('Auth server error:', data);
                if (!isMounted) return;
                fallbackToLogin('telegram login');
                return;
              }

              console.warn('No hash found in Telegram initData');
              if (!isMounted) return;
              fallbackToLogin('telegram login');
              return;
            } catch (error) {
              console.error('Auto-auth failed:', error);
              if (!isMounted) return;
              fallbackToLogin('telegram login');
              return;
            }
          }
        }

        setCurrentScreen('telegram login');
        setAppState('idle');
        setIsInitialized(true);
        return;
      }

      setCurrentScreen('admin login');
      setAppState('idle');
      setIsInitialized(true);
    };

    initializeApp();

    return () => {
      isMounted = false;
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
    },
    [],
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
    isTelegramAutoAuth,
    autoAuthCompleted,
    handleAdminLoginSuccess,
    handleTelegramLoginSuccess,
    handleLogout,
  };
};
