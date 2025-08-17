// lib/utils/networkOptimizer.ts
// ✅ Дополнительные оптимизации сети для мобильного интернета

export interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export function getNetworkInfo(): NetworkInfo | null {
  if (typeof navigator === 'undefined') return null;
  
  const connection = (navigator as any)?.connection;
  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
}

export function shouldUseDataSaver(): boolean {
  const networkInfo = getNetworkInfo();
  if (!networkInfo) return false;

  // Включаем режим экономии данных для:
  // - Медленных соединений (2g, slow-2g)
  // - Когда включен saveData
  // - Высокая задержка (RTT > 400ms)
  // - Низкая пропускная способность (< 0.5 Mbps)
  return (
    ['slow-2g', '2g'].includes(networkInfo.effectiveType) ||
    networkInfo.saveData ||
    networkInfo.rtt > 400 ||
    networkInfo.downlink < 0.5
  );
}

export function getOptimalTimeout(baseTimeout: number = 5000): number {
  const networkInfo = getNetworkInfo();
  if (!networkInfo) return baseTimeout;

  // Адаптивные таймауты в зависимости от качества сети
  switch (networkInfo.effectiveType) {
    case 'slow-2g':
      return baseTimeout * 3;
    case '2g':
      return baseTimeout * 2.5;
    case '3g':
      return baseTimeout * 1.5;
    case '4g':
    default:
      return baseTimeout;
  }
}

export function getOptimalBatchSize(baseBatchSize: number = 10): number {
  const networkInfo = getNetworkInfo();
  if (!networkInfo) return baseBatchSize;

  // Меньшие пакеты для медленных соединений
  if (shouldUseDataSaver()) {
    return Math.max(1, Math.floor(baseBatchSize * 0.3));
  }

  switch (networkInfo.effectiveType) {
    case 'slow-2g':
      return Math.max(1, Math.floor(baseBatchSize * 0.2));
    case '2g':
      return Math.max(1, Math.floor(baseBatchSize * 0.4));
    case '3g':
      return Math.max(1, Math.floor(baseBatchSize * 0.7));
    case '4g':
    default:
      return baseBatchSize;
  }
}

// Throttling для частых операций на медленном интернете
export class NetworkThrottle {
  private lastCall = 0;
  private timeout: NodeJS.Timeout | null = null;

  constructor(private delay: number = 1000) {}

  throttle<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      const now = Date.now();
      
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      const timeSinceLastCall = now - this.lastCall;
      const adaptiveDelay = shouldUseDataSaver() ? this.delay * 2 : this.delay;

      if (timeSinceLastCall >= adaptiveDelay) {
        this.lastCall = now;
        return fn(...args);
      } else {
        return new Promise<ReturnType<T>>((resolve) => {
          this.timeout = setTimeout(() => {
            this.lastCall = Date.now();
            resolve(fn(...args));
          }, adaptiveDelay - timeSinceLastCall);
        });
      }
    }) as T;
  }
}

// Debouncing для пользовательских действий
export class NetworkDebounce {
  private timeout: NodeJS.Timeout | null = null;

  constructor(private delay: number = 300) {}

  debounce<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      const adaptiveDelay = shouldUseDataSaver() ? this.delay * 1.5 : this.delay;

      return new Promise<ReturnType<T>>((resolve) => {
        this.timeout = setTimeout(() => {
          resolve(fn(...args));
        }, adaptiveDelay);
      });
    }) as T;
  }
}

// Мониторинг изменений сетевых условий
export class NetworkMonitor {
  private listeners: Array<(info: NetworkInfo | null) => void> = [];
  private currentInfo: NetworkInfo | null = null;

  constructor() {
    this.currentInfo = getNetworkInfo();
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof navigator === 'undefined') return;

    const connection = (navigator as any)?.connection;
    if (!connection) return;

    const updateInfo = () => {
      const newInfo = getNetworkInfo();
      if (JSON.stringify(newInfo) !== JSON.stringify(this.currentInfo)) {
        this.currentInfo = newInfo;
        this.notifyListeners();
      }
    };

    connection.addEventListener('change', updateInfo);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentInfo);
      } catch (error) {
        console.error('Network monitor listener error:', error);
      }
    });
  }

  subscribe(listener: (info: NetworkInfo | null) => void): () => void {
    this.listeners.push(listener);
    
    // Немедленно вызываем listener с текущим состоянием
    listener(this.currentInfo);

    // Возвращаем функцию отписки
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getCurrentInfo(): NetworkInfo | null {
    return this.currentInfo;
  }
}

// Глобальный экземпляр мониторинга сети
export const networkMonitor = new NetworkMonitor();

// Функция для логирования сетевых метрик
export function logNetworkMetrics(operation: string, startTime: number, success: boolean) {
  const duration = Date.now() - startTime;
  const networkInfo = getNetworkInfo();
  
  console.log(`📊 Network metrics for ${operation}:`, {
    duration: `${duration}ms`,
    success,
    connection: networkInfo?.effectiveType || 'unknown',
    rtt: networkInfo?.rtt || 'unknown',
    downlink: networkInfo?.downlink || 'unknown',
    saveData: networkInfo?.saveData || false
  });
}

// Обертка для fetch с автоматической оптимизацией
export async function optimizedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const startTime = Date.now();
  const timeout = getOptimalTimeout(8000);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    logNetworkMetrics(`fetch ${url}`, startTime, response.ok);
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    logNetworkMetrics(`fetch ${url}`, startTime, false);
    throw error;
  }
}

export default {
  getNetworkInfo,
  shouldUseDataSaver,
  getOptimalTimeout,
  getOptimalBatchSize,
  NetworkThrottle,
  NetworkDebounce,
  networkMonitor,
  logNetworkMetrics,
  optimizedFetch
};
