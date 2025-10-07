import { db } from '../index';
import { dailyBonuses, users } from '../schema';
import { eq } from 'drizzle-orm';
import dailyBonusConfig from '../../data/dailyBonusConfig.json';
import { DailyBonusConfig, DailyBonusState, DailyBonusReward } from '../../data/dailyBonusTypes';
import { CurrencyService } from './currencyService';
import { BoosterService } from './boosterService';
import { CurrencyTransactionType } from '../types';

const config = dailyBonusConfig as DailyBonusConfig;

const startOfUtcDay = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const diffInDaysUtc = (from: Date, to: Date): number => {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / oneDayMs);
};

const totalClaimedDaysFromProgress = (week: number, day: number): number => {
  if (week < 1 || day < 1) return 0;
  return (week - 1) * 7 + (day - 1);
};

const normalizeRewardConfig = (rewardConfig: any): DailyBonusReward => {
  if (!rewardConfig) {
    throw new Error('Invalid reward configuration');
  }

  if (rewardConfig.type === 'currency') {
    const amount = Number(rewardConfig.amount ?? rewardConfig.quantity ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid currency reward configuration');
    }
    return {
      type: 'currency',
      amount: Math.floor(amount),
    } as const;
  }

  if (rewardConfig.type === 'booster') {
    const name = rewardConfig.name;
    const quantity = Number(rewardConfig.quantity ?? rewardConfig.amount ?? 1);
    if (!name) {
      throw new Error('Booster reward is missing name');
    }
    return {
      type: 'booster',
      name,
      quantity: Math.max(1, Math.floor(quantity)),
      amount: Math.max(1, Math.floor(quantity)),
    } as const;
  }

  throw new Error(`Unsupported reward type: ${rewardConfig.type}`);
};

export class DailyBonusService {
  /**
   * Получить или создать запись о бонусах пользователя
   */
  static async getOrCreateUserBonus(userId: number) {
    const existing = await db
      .select()
      .from(dailyBonuses)
      .where(eq(dailyBonuses.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Создаем новую запись
    const [newBonus] = await db
      .insert(dailyBonuses)
      .values({
        userId,
        currentWeek: 1,
        currentDay: 1,
        lastClaimDate: null,
      })
      .returning();

    return newBonus;
  }

  /**
   * Получить текущее состояние бонусов пользователя
   */
  static async getUserBonusState(userId: number): Promise<DailyBonusState> {
    const userBonus = await this.getOrCreateUserBonus(userId);
    let { currentWeek, currentDay, lastClaimDate } = userBonus;

    const now = new Date();
    const todayUtc = startOfUtcDay(now);

    let lastClaimUtc: Date | null = lastClaimDate ? startOfUtcDay(new Date(lastClaimDate)) : null;
    let canClaimToday = true;
    let isClaimedToday = false;

    if (lastClaimUtc) {
      const diff = diffInDaysUtc(lastClaimUtc, todayUtc);

      if (diff === 0) {
        canClaimToday = false;
        isClaimedToday = true;
      } else if (diff === 1) {
        canClaimToday = true;
      } else if (diff > 1) {
        // Пропуск дня — сбрасываем прогресс
        currentWeek = 1;
        currentDay = 1;
        lastClaimUtc = null;
        lastClaimDate = null;
        await db
          .update(dailyBonuses)
          .set({
            currentWeek,
            currentDay,
            lastClaimDate: null,
            updatedAt: new Date(),
          })
          .where(eq(dailyBonuses.userId, userId));
      }
    }

    const todayReward = await this.getRewardForDay(userId, currentWeek, currentDay);
    const nextClaimAvailableAt = isClaimedToday
      ? new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000).toISOString()
      : null;
    const streakLength = Math.max(0, totalClaimedDaysFromProgress(currentWeek, currentDay));

    return {
      currentWeek,
      currentDay,
      canClaimToday,
      isClaimedToday,
      lastClaimDate: lastClaimUtc ? lastClaimUtc.toISOString() : null,
      nextClaimAvailableAt,
      streakLength,
      todayReward,
    };
  }

  /**
   * Получить награду для конкретного дня
   */
  static async getRewardForDay(userId: number, week: number, day: number): Promise<DailyBonusReward> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error('User not found');
    }

    const isPremium =
      user[0].hasZenSubscription || ['premium', 'admin', 'tester'].includes(user[0].role);
    const weekConfig = config.weeks.find(w => w.week === week);
    
    if (!weekConfig) {
      throw new Error(`Week ${week} not found in config`);
    }

    const dayConfig = weekConfig.days.find(d => d.day === day);
    if (!dayConfig) {
      throw new Error(`Day ${day} not found in week ${week}`);
    }

    return normalizeRewardConfig(isPremium ? dayConfig.premium : dayConfig.regular);
  }

  /**
   * Сбросить прогресс пользователя к началу
   */
  static async resetUserProgress(userId: number) {
    await db
      .update(dailyBonuses)
      .set({
        currentWeek: 1,
        currentDay: 1,
        lastClaimDate: null,
        updatedAt: new Date(),
      })
      .where(eq(dailyBonuses.userId, userId));
  }

  /**
   * Перейти к следующему дню
   */
  static async advanceToNextDay(userId: number) {
    const userBonus = await this.getOrCreateUserBonus(userId);
    
    let newWeek = userBonus.currentWeek;
    let newDay = userBonus.currentDay + 1;

    // Если день больше 7, переходим к следующей неделе
    if (newDay > 7) {
      newWeek += 1;
      newDay = 1;
    }

    // Если неделя больше 4, начинаем сначала
    if (newWeek > config.weeks.length) {
      newWeek = 1;
      newDay = 1;
    }

    await db
      .update(dailyBonuses)
      .set({
        currentWeek: newWeek,
        currentDay: newDay,
        lastClaimDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dailyBonuses.userId, userId));
  }

  /**
   * Выдать бонус пользователю
   */
  static async claimBonus(userId: number): Promise<DailyBonusReward> {
    await this.getOrCreateUserBonus(userId);
    const state = await this.getUserBonusState(userId);

    if (!state.canClaimToday) {
      throw new Error('Cannot claim bonus today');
    }

    const reward = state.todayReward;
    if (!reward) {
      throw new Error('No reward available');
    }

    // Выдаем награду
    if (reward.type === 'currency' && reward.amount) {
      await CurrencyService.addCurrency(
        userId,
        reward.amount,
        CurrencyTransactionType.DAILY_BONUS,
        `Daily bonus week ${state.currentWeek} day ${state.currentDay}`,
        {
          week: state.currentWeek,
          day: state.currentDay,
        },
      );
    } else if (reward.type === 'booster') {
      // Сначала получаем ID бустера по имени
      const boosterType = await BoosterService.getBoosterTypeByName(reward.name);
      if (boosterType) {
        await BoosterService.addUserBooster(userId, boosterType.id, reward.quantity);
      } else {
        // console.error(`Booster type '${reward.name}' not found in database`);
        // Можно либо выбросить ошибку, либо продолжить без выдачи бустера
        // throw new Error(`Booster type '${reward.name}' not found`);
      }
    }

    // Переходим к следующему дню
    await this.advanceToNextDay(userId);

    return reward;
  }

  /**
   * Получить полную конфигурацию бонусов
   */
  static getBonusConfig() {
    return config;
  }

  /**
   * Принудительно установить прогресс пользователя (для отладки)
   */
  static async setProgress(userId: number, week: number, day: number) {
    const weeksCount = config.weeks.length;
    const normalizedWeek = Math.min(Math.max(1, week), weeksCount);
    const normalizedDay = Math.min(Math.max(1, day), 7);

    await db
      .update(dailyBonuses)
      .set({
        currentWeek: normalizedWeek,
        currentDay: normalizedDay,
        lastClaimDate: null,
        updatedAt: new Date(),
      })
      .where(eq(dailyBonuses.userId, userId));
  }

  /**
   * Принудительно задать дату последнего получения бонуса (UTC начало дня)
   */
  static async setLastClaimDate(userId: number, date: Date | null) {
    await db
      .update(dailyBonuses)
      .set({
        lastClaimDate: date ? startOfUtcDay(date) : null,
        updatedAt: new Date(),
      })
      .where(eq(dailyBonuses.userId, userId));
  }

  /**
   * Полный сброс прогресса (для отладки)
   */
  static async forceReset(userId: number) {
    await db
      .update(dailyBonuses)
      .set({
        currentWeek: 1,
        currentDay: 1,
        lastClaimDate: null,
        updatedAt: new Date(),
      })
      .where(eq(dailyBonuses.userId, userId));
  }

  /**
   * Подготовить пользователя к получению конкретного бонуса (week/day) сегодня
   */
  static async prepareForClaim(userId: number, week: number, day: number) {
    await this.setProgress(userId, week, day);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayUtc = startOfUtcDay(yesterday);
    await this.setLastClaimDate(userId, yesterdayUtc);
  }
} 