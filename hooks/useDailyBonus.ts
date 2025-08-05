import { useState, useEffect } from 'react';
import { useUser } from './useUser';

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
  weeks: DailyBonusConfig;
  state: DailyBonusState;
}

export const useDailyBonus = () => {
  const { user, sessionToken } = useUser();
  const [bonusData, setBonusData] = useState<DailyBonusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные о бонусах
  const loadBonusData = async () => {
    if (!user?.telegramId || !sessionToken) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.telegramId}/bonus`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBonusData(data);
    } catch (err) {
      console.error('Error loading bonus data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bonus data');
    } finally {
      setIsLoading(false);
    }
  };

  // Получаем бонус
  const claimBonus = async () => {
    if (!user?.telegramId || !sessionToken) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.telegramId}/bonus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Обновляем локальное состояние
      if (bonusData) {
        setBonusData({
          ...bonusData,
          state: data.state
        });
      }

      return true;
    } catch (err) {
      console.error('Error claiming bonus:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim bonus');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Получаем текущий день недели
  const getCurrentDayRewards = () => {
    if (!bonusData) return null;

    const currentWeek = bonusData.weeks.weeks.find(w => w.week === bonusData.state.currentWeek);
    if (!currentWeek) return null;

    const currentDay = currentWeek.days.find(d => d.day === bonusData.state.currentDay);
    return currentDay;
  };

  // Проверяем, есть ли у пользователя Zen подписка
  const hasZenSubscription = user?.role === 'premium' || user?.role === 'admin' || user?.role === 'tester';

  // Загружаем данные при изменении пользователя
  useEffect(() => {
    if (user?.telegramId && sessionToken) {
      loadBonusData();
    }
  }, [user?.telegramId, sessionToken]);

  return {
    bonusData,
    isLoading,
    error,
    claimBonus,
    loadBonusData,
    getCurrentDayRewards,
    hasZenSubscription,
    currentWeek: bonusData?.state.currentWeek || 1,
    currentDay: bonusData?.state.currentDay || 1,
    canClaimToday: bonusData?.state.canClaimToday || false,
  };
}; 