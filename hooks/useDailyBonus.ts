import { useState, useEffect, useRef } from 'react';
import { useUser } from './useUser';
import { useAdminAuth } from './useAdminAuth';

interface DailyBonusReward {
  type: 'currency' | 'booster';
  amount: number;
  boosterType?: string;
}

interface DailyBonusDay {
  day: number;
  regular: DailyBonusReward;
  premium: DailyBonusReward;
}

interface DailyBonusWeek {
  week: number;
  days: DailyBonusDay[];
}

interface DailyBonusConfig {
  weeks: DailyBonusWeek[];
}

interface DailyBonusState {
  currentWeek: number;
  currentDay: number;
  canClaimToday: boolean;
  lastClaimDate: string | null;
}

interface DailyBonusResponse {
  weeks: DailyBonusWeek[];
  currentWeek: number;
  currentDay: number;
  canClaimToday: boolean;
  todayReward: DailyBonusReward | null;
  lastClaimDate: string | null;
}

export const useDailyBonus = () => {
  const { user, sessionToken } = useUser();
  const { isAdmin } = useAdminAuth();
  const [bonusData, setBonusData] = useState<DailyBonusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against setState after unmount and cancels in-flight requests
  const mountedRef = useRef(true);
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try { activeControllerRef.current?.abort(); } catch {}
      activeControllerRef.current = null;
    };
  }, []);

  // Определяем telegramId для использования
  const getTelegramId = () => {
    // Для админа в режиме разработки используем тестовый ID
    if (isAdmin && process.env.NODE_ENV === 'development' && !user?.telegramId) {
      return '610936383';
    }
    return user?.telegramId;
  };

  // Загружаем данные о бонусах
  const loadBonusData = async () => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      if (mountedRef.current) setError('User not authenticated');
      return;
    }

    // Abort any previous request and create a new controller
    try { activeControllerRef.current?.abort(); } catch {}
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const signal = controller.signal;

    if (mountedRef.current && !signal.aborted) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const headers: HeadersInit = {};
      
      // Добавляем токен только если он есть
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`/api/users/${telegramId}/bonus`, {
        headers,
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('Daily Bonus API Response:', data);
      if (mountedRef.current && !signal.aborted) {
        setBonusData(data);
      }
    } catch (err) {
      // console.error('Error loading bonus data:', err);
      if (mountedRef.current && !signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load bonus data');
      }
    } finally {
      if (mountedRef.current && !signal.aborted) {
        setIsLoading(false);
      }
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    }
  };

  // Получаем бонус
  const claimBonus = async () => {
    const telegramId = getTelegramId();
    
    if (!telegramId) {
      if (mountedRef.current) setError('User not authenticated');
      return false;
    }

    if (mountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Добавляем токен только если он есть
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`/api/users/${telegramId}/bonus`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (mountedRef.current && data.success) {
        // Оптимистично блокируем кнопку до перезагрузки данных
        setBonusData(prev => prev ? { ...prev, canClaimToday: false } : prev);
        // Дожидаемся обновлённых данных, чтобы не дать повторно кликнуть
        await loadBonusData();
      }

      return true;
    } catch (err) {
      // console.error('Error claiming bonus:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to claim bonus');
      }
      return false;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  // Получаем текущий день недели
  const getCurrentDayRewards = () => {
    if (!bonusData) return null;

    const currentWeek = bonusData.weeks.find(w => w.week === bonusData.currentWeek);
    if (!currentWeek) return null;

    const currentDay = currentWeek.days.find(d => d.day === bonusData.currentDay);
    return currentDay;
  };

  // Проверяем, есть ли у пользователя Zen подписка
  const hasZenSubscription = user?.role === 'premium' || user?.role === 'admin' || user?.role === 'tester';

  // Загружаем данные при изменении пользователя или админ-статуса
  useEffect(() => {
    const telegramId = getTelegramId();
    if (telegramId) {
      loadBonusData();
    }
  }, [user?.telegramId, sessionToken, isAdmin]);

  return {
    bonusData,
    isLoading,
    error,
    claimBonus,
    loadBonusData,
    getCurrentDayRewards,
    hasZenSubscription,
    currentWeek: bonusData?.currentWeek ?? 1,
    currentDay: bonusData?.currentDay ?? 1,
    canClaimToday: bonusData?.canClaimToday ?? false,
  };
}; 