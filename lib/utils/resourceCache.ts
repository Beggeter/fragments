// lib/utils/resourceCache.ts
// ✅ Система кэширования ресурсов для мобильного интернета

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ResourceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 минут

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  // Очистка устаревших записей
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Получение статистики кэша
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Создаем глобальный экземпляр кэша
export const resourceCache = new ResourceCache();

// Автоматическая очистка кэша каждые 10 минут
if (typeof window !== 'undefined') {
  setInterval(() => {
    resourceCache.cleanup();
  }, 10 * 60 * 1000);
}

// Функция для кэширования API запросов
export async function cachedFetch<T>(
  url: string, 
  options: RequestInit = {}, 
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;
  
  // Проверяем кэш
  const cached = resourceCache.get<T>(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit for ${url}`);
    return cached;
  }

  // Выполняем запрос
  console.log(`🌐 Cache miss, fetching ${url}`);
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Сохраняем в кэш
    resourceCache.set(cacheKey, data, ttl);
    
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch ${url}:`, error);
    throw error;
  }
}

// Предзагрузка критичных ресурсов
export function preloadCriticalResources() {
  const criticalImages = [
    '/logo-frame.svg',
    '/infinity.svg',
    '/cart.svg',
    '/powerups.svg',
    '/gift.svg',
    '/record.png',
    '/romn.svg'
  ];

  criticalImages.forEach(src => {
    if (!resourceCache.has(`image:${src}`)) {
      const img = new Image();
      img.onload = () => {
        resourceCache.set(`image:${src}`, true, 30 * 60 * 1000); // 30 минут
        console.log(`✅ Preloaded image: ${src}`);
      };
      img.onerror = () => {
        console.warn(`⚠️ Failed to preload image: ${src}`);
      };
      img.src = src;
    }
  });
}

// Проверка качества соединения
export function getConnectionQuality(): 'slow' | 'medium' | 'fast' {
  if (typeof navigator === 'undefined') return 'medium';
  
  const connection = (navigator as any)?.connection;
  if (!connection) return 'medium';

  const effectiveType = connection.effectiveType;
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  } else if (effectiveType === '3g') {
    return 'medium';
  } else {
    return 'fast';
  }
}

// Оптимизированная загрузка в зависимости от качества соединения
export function getOptimizedResourceCount(baseCount: number): number {
  const quality = getConnectionQuality();
  
  switch (quality) {
    case 'slow':
      return Math.max(1, Math.floor(baseCount * 0.3));
    case 'medium':
      return Math.max(1, Math.floor(baseCount * 0.6));
    case 'fast':
    default:
      return baseCount;
  }
}

export default resourceCache;
