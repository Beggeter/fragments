// lib/utils/telegramSDK.ts

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  disableClosingConfirmation?: () => void;
  enableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isFullscreen?: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (callback: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

// Состояние инициализации
let isInitialized = false;
let isInitializing = false;
let initPromise: Promise<boolean> | null = null;

// События инициализации
const initCallbacks: ((success: boolean) => void)[] = [];

// Безопасная обертка для localStorage
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    if (typeof window === "undefined") return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    if (typeof window === "undefined") return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// Проверка, запущено ли приложение в Telegram
export function isLaunchedInTelegram(): boolean {
  if (typeof window === "undefined") return false;
  
  // Проверяем наличие Telegram WebApp объекта
  const hasTelegramWebApp = !!(window.Telegram && window.Telegram.WebApp);
  
  // Проверяем наличие tgWebAppData в URL
  const urlParams = new URLSearchParams(window.location.search);
  const hasTgWebAppData = urlParams.has("tgWebAppData");
  
  return hasTelegramWebApp || hasTgWebAppData;
}

// Ожидание загрузки Telegram WebApp API - оптимизировано для мобильных сетей
function waitForTelegramWebApp(maxAttempts = 40, interval = 250): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const checkTelegram = () => {
      // Сначала быстрая проверка
      if (window.Telegram?.WebApp) {
        console.log('✅ Telegram WebApp API found!');
        resolve(true);
        return;
      }
      
      attempts++;
      
      // Увеличиваем интервал для мобильных сетей после 10 попыток
      const currentInterval = attempts > 10 ? interval * 2 : interval;
      
      if (attempts >= maxAttempts) {
        console.warn(`❌ Telegram WebApp API not loaded after ${maxAttempts} attempts`);
        resolve(false);
        return;
      }
      
      // Логируем каждые 5 попыток для отладки мобильных сетей
      if (attempts % 5 === 0) {
        console.log(`🔄 Still waiting for Telegram API... (${attempts}/${maxAttempts})`);
      }
      
      setTimeout(checkTelegram, currentInterval);
    };
    
    checkTelegram();
  });
}

// Настройка viewport
function setupViewport(tg: TelegramWebApp) {
  const root = document.documentElement;
  const height = tg.viewportHeight || window.innerHeight;
  const stableHeight = tg.viewportStableHeight || window.innerHeight;
  
  root.style.setProperty('--tg-viewport-height', height + 'px');
  root.style.setProperty('--tg-viewport-stable-height', stableHeight + 'px');
  
  // Обновляем viewport при изменении размера
  const updateViewport = () => {
    const newHeight = tg.viewportHeight || window.innerHeight;
    const newStableHeight = tg.viewportStableHeight || window.innerHeight;
    root.style.setProperty('--tg-viewport-height', newHeight + 'px');
    root.style.setProperty('--tg-viewport-stable-height', newStableHeight + 'px');
  };
  
  // Используем AbortController для корректной очистки
  const controller = new AbortController();
  window.addEventListener('resize', updateViewport, { signal: controller.signal });
  
  return () => controller.abort();
}

// Настройка полноэкранного режима
function setupFullscreen(tg: TelegramWebApp) {
  try {
    const fullscreenEnabled = safeLocalStorage.getItem('fullscreenEnabled');
    const shouldEnableFullscreen = fullscreenEnabled !== 'false'; // По умолчанию включен
    
    if (tg.requestFullscreen && shouldEnableFullscreen && !tg.isFullscreen) {
      tg.requestFullscreen();
    }
  } catch (error) {
    console.warn('Failed to setup fullscreen:', error);
  }
}

// Fallback для браузерной среды
function setupFallbackViewport() {
  const root = document.documentElement;
  root.style.setProperty('--tg-viewport-height', '100vh');
  root.style.setProperty('--tg-viewport-stable-height', '100vh');
}

// Основная функция инициализации
async function performInitialization(): Promise<boolean> {
  try {
    console.log('🔄 Starting Telegram WebApp initialization...');
    
    // Проверяем, что мы на клиенте
    if (typeof window === "undefined") {
      console.warn('❌ Window is undefined, cannot initialize Telegram WebApp');
      return false;
    }
    
    // Задержка для стабильности (увеличена для мобильных сетей)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Дополнительная проверка сети
    const connectionType = (navigator as any)?.connection?.effectiveType;
    if (connectionType) {
      console.log('📶 Network type detected:', connectionType);
    }
    
    // Если не в Telegram, настраиваем fallback
    if (!isLaunchedInTelegram()) {
      console.log('🌐 Not in Telegram, setting up fallback viewport');
      setupFallbackViewport();
      return true; // Считаем успешной инициализацию для браузера
    }
    
    console.log('📱 In Telegram environment, waiting for API...');
    
    // Ждем загрузки Telegram WebApp API
    const isLoaded = await waitForTelegramWebApp();
    if (!isLoaded) {
      console.warn('❌ Telegram WebApp API failed to load, setting up fallback');
      setupFallbackViewport();
      return false;
    }
    
    const tg = window.Telegram!.WebApp!;
    console.log('✅ Telegram WebApp API loaded successfully');
    
    // Базовая инициализация
    tg.ready();
    tg.expand();
    
    if (tg.disableClosingConfirmation) {
      tg.disableClosingConfirmation();
    }
    
    // Устанавливаем цвет header
    if (tg.setHeaderColor) {
      try {
        tg.setHeaderColor('#1a1a2e');
      } catch (error) {
        console.warn('Failed to set header color:', error);
      }
    }
    
    // Настраиваем viewport
    const cleanupViewport = setupViewport(tg);
    
    // Настраиваем полноэкранный режим
    setupFullscreen(tg);
    
    // Сохраняем cleanup функцию для будущего использования
    (window as any).__telegramCleanup = cleanupViewport;
    
    console.log('🎉 Telegram WebApp initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Telegram WebApp initialization failed:', error);
    setupFallbackViewport();
    return false;
  }
}

// Публичная функция инициализации
export async function initializeTelegramWebApp(): Promise<boolean> {
  // Если уже инициализировано
  if (isInitialized) {
    return true;
  }
  
  // Если инициализация в процессе, ждем её завершения
  if (isInitializing && initPromise) {
    return initPromise;
  }
  
  // Начинаем инициализацию
  isInitializing = true;
  initPromise = performInitialization();
  
  try {
    const success = await initPromise;
    isInitialized = success;
    isInitializing = false;
    
    // Уведомляем всех подписчиков
    initCallbacks.forEach(callback => {
      try {
        callback(success);
      } catch (error) {
        console.error('Error in init callback:', error);
      }
    });
    
    return success;
  } catch (error) {
    isInitializing = false;
    isInitialized = false;
    console.error('Failed to initialize Telegram WebApp:', error);
    return false;
  }
}

// Подписка на завершение инициализации
export function onTelegramWebAppReady(callback: (success: boolean) => void): () => void {
  if (isInitialized) {
    // Если уже инициализировано, вызываем callback немедленно
    setTimeout(() => callback(true), 0);
  } else {
    // Добавляем в очередь
    initCallbacks.push(callback);
  }
  
  // Возвращаем функцию отписки
  return () => {
    const index = initCallbacks.indexOf(callback);
    if (index > -1) {
      initCallbacks.splice(index, 1);
    }
  };
}

// Получение текущего состояния
export function getTelegramWebAppState() {
  return {
    isInitialized,
    isInitializing,
    isInTelegram: isLaunchedInTelegram(),
    webApp: isInitialized ? window.Telegram?.WebApp : null
  };
}

// Очистка ресурсов
export function cleanupTelegramWebApp() {
  if (typeof window !== "undefined" && (window as any).__telegramCleanup) {
    try {
      (window as any).__telegramCleanup();
      delete (window as any).__telegramCleanup;
    } catch (error) {
      console.error('Error during Telegram WebApp cleanup:', error);
    }
  }
}