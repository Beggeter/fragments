import { useState, useEffect } from 'react';
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
}

export const useDailyBonus = (opts?: { autoLoad?: boolean; autoRefreshOnClaim?: boolean }) => {
  const { autoLoad = true, autoRefreshOnClaim = true } = opts ?? {};
  const { user, sessionToken } = useUser();
  const { isAdmin } = useAdminAuth();
  const [bonusData, setBonusData] = useState<DailyBonusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {};
      
      // Добавляем токен только если он есть
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`/api/users/${telegramId}/bonus`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('Daily Bonus API Response:', data);
      setBonusData(data);
    } catch (err) {
      // console.error('Error loading bonus data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bonus data');
    } finally {
      setIsLoading(false);
    }
  };

  // Получаем бонус
  const claimBonus = async () => {
    const telegramId = getTelegramId();
    
    if (!telegramId) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

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
      
      // Обновляем локальное состояние после успешного получения бонуса
      if (data.success && autoRefreshOnClaim) {
        // Перезагружаем данные бонусов, если включено автообновление
        await loadBonusData();
      }

      return true;
    } catch (err) {
      // console.error('Error claiming bonus:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim bonus');
      return false;
    } finally {
      setIsLoading(false);
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
    if (autoLoad && telegramId) {
      loadBonusData();
    }
  }, [user?.telegramId, sessionToken, isAdmin, autoLoad]);

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