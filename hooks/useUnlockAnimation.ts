import { useEffect, useState, useMemo } from "react";
import { DailyReward } from "@/components/DailyBonusModal"; // путь подкорректируй, если надо
import { RewardStatus } from "@/types/components";

const LOCAL_KEY = "daily-bonus-statuses";


interface StoredBonusState {
  date: string; // YYYY-MM-DD
  statuses: RewardStatus[];
}

export function useUnlockAnimations(currentWeekRewards: DailyReward[]): boolean[] {
  const [unlockAnimations, setUnlockAnimations] = useState<boolean[]>([]);

  // Создаем стабильную зависимость для useEffect
  const rewardsKey = useMemo(() => {
    if (!currentWeekRewards.length) return '';
    return currentWeekRewards.map(r => `${r.status}-${r.type}-${r.amount}`).join('|');
  }, [currentWeekRewards]);

  useEffect(() => {
    if (!currentWeekRewards.length) {
      setUnlockAnimations([]);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const raw = localStorage.getItem(LOCAL_KEY);
    let previousStatuses: RewardStatus[] | undefined;

    if (raw) {
      try {
        const parsed: StoredBonusState = JSON.parse(raw);
        if (parsed.date === today) {
          // Уже сегодня загружено — не проигрываем анимацию
          setUnlockAnimations(new Array(currentWeekRewards.length).fill(false));
          return;
        }
        previousStatuses = parsed.statuses;
      } catch {
        // Ошибка парсинга — игнорируем
      }
    }

    // Вычисляем новые анимации
    const newStatuses = currentWeekRewards.map((r) => r.status ?? "locked");
    const animations = newStatuses.map(
      (status, i) => status === "available" && previousStatuses?.[i] === "locked"
    );

    setUnlockAnimations(animations);

    // Сохраняем в localStorage
    const stored: StoredBonusState = {
      date: today,
      statuses: newStatuses,
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(stored));
  }, [rewardsKey]); // Используем стабильную зависимость

  return unlockAnimations;
}
