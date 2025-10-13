import { db } from '../index';
import { dailyBonuses, users } from '../schema';
import { eq, sql } from 'drizzle-orm';
let dayStatusesColumnEnsured = false;

const ensureDayStatusesColumn = async () => {
  if (dayStatusesColumnEnsured) return;

  try {
    await db.execute(sql`
      ALTER TABLE "daily_bonuses"
      ADD COLUMN IF NOT EXISTS "day_statuses" jsonb NOT NULL DEFAULT '{"claimedDays":[],"skippedDays":[]}'
    `);
  } catch (_) {
    // no-op: if we can't add the column, subsequent queries will surface the real error
  } finally {
    dayStatusesColumnEnsured = true;
  }
};

import dailyBonusConfig from '../../data/dailyBonusConfig.json';
import {
  DailyBonusConfig,
  DailyBonusReward,
  DailyBonusSkippedDay,
  DailyBonusState,
} from '../../data/dailyBonusTypes';
import { CurrencyService } from './currencyService';
import { BoosterService } from './boosterService';
import { CurrencyTransactionType } from '../types';

const config = dailyBonusConfig as DailyBonusConfig;
const TOTAL_DAYS = config.weeks.length * 7;

type DayStatuses = {
  claimedDays: number[];
  skippedDays: number[];
};

const emptyDayStatuses = (): DayStatuses => ({
  claimedDays: [],
  skippedDays: [],
});

const ensureUniqueSorted = (values: unknown): number[] => {
  if (!Array.isArray(values)) return [];

  const unique = new Set<number>();
  for (const value of values) {
    const num = Number(value);
    if (Number.isInteger(num) && num >= 1 && num <= TOTAL_DAYS) {
      unique.add(num);
    }
  }

  return Array.from(unique).sort((a, b) => a - b);
};

const normalizeDayStatuses = (raw: unknown): DayStatuses => {
  if (!raw || typeof raw !== 'object') {
    return emptyDayStatuses();
  }

  const data = raw as Partial<DayStatuses>;
  const claimed = ensureUniqueSorted(data.claimedDays);
  const skipped = ensureUniqueSorted(data.skippedDays);

  const claimedSet = new Set(claimed);
  const normalizedSkipped = skipped.filter(index => !claimedSet.has(index));

  return {
    claimedDays: claimed,
    skippedDays: normalizedSkipped,
  };
};

const toDayIndex = (week: number, day: number): number => {
  if (week < 1 || day < 1) {
    return 1;
  }
  return (week - 1) * 7 + day;
};

const fromDayIndex = (index: number): DailyBonusSkippedDay => {
  const zeroBased = Math.max(0, index - 1);
  const week = Math.floor(zeroBased / 7) + 1;
  const day = (zeroBased % 7) + 1;
  return { week, day };
};

const advanceWeekDay = (week: number, day: number) => {
  let newWeek = week;
  let newDay = day + 1;
  let wrapped = false;

  if (newDay > 7) {
    newDay = 1;
    newWeek = week + 1;
  }

  if (newWeek > config.weeks.length) {
    newWeek = 1;
    wrapped = true;
  }

  return { week: newWeek, day: newDay, wrapped };
};

const retreatWeekDay = (week: number, day: number) => {
  let newWeek = week;
  let newDay = day - 1;
  let wrapped = false;

  if (newDay < 1) {
    newDay = 7;
    newWeek = week - 1;
    if (newWeek < 1) {
      newWeek = config.weeks.length;
      wrapped = true;
    }
  }

  return { week: newWeek, day: newDay, wrapped };
};

const markDayStatus = (
  statuses: DayStatuses,
  week: number,
  day: number,
  status: 'claimed' | 'skipped',
): DayStatuses => {
  const index = toDayIndex(week, day);
  const claimed = new Set(statuses.claimedDays);
  const skipped = new Set(statuses.skippedDays);

  claimed.delete(index);
  skipped.delete(index);

  if (status === 'claimed') {
    claimed.add(index);
  } else {
    skipped.add(index);
  }

  return {
    claimedDays: Array.from(claimed).sort((a, b) => a - b),
    skippedDays: Array.from(skipped).sort((a, b) => a - b),
  };
};

const isIndexBetween = (index: number, startExclusive: number, endExclusive: number): boolean => {
  if (startExclusive === endExclusive) {
    return false;
  }

  if (startExclusive === 0) {
    return index < endExclusive;
  }

  if (startExclusive < endExclusive) {
    return index > startExclusive && index < endExclusive;
  }

  return index > startExclusive || index < endExclusive;
};

const computeClaimStreak = (statuses: DayStatuses, currentWeek: number, currentDay: number): number => {
  if (statuses.claimedDays.length === 0) {
    return 0;
  }

  const claimedSet = new Set(statuses.claimedDays);
  let streak = 0;
  let pointerWeek = currentWeek;
  let pointerDay = currentDay;

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const { week, day } = retreatWeekDay(pointerWeek, pointerDay);
    const index = toDayIndex(week, day);

    if (!claimedSet.has(index)) {
      break;
    }

    streak += 1;
    pointerWeek = week;
    pointerDay = day;
  }

  return streak;
};

const applySkippedDays = (
  week: number,
  day: number,
  statuses: DayStatuses,
  skipCount: number,
): { week: number; day: number; statuses: DayStatuses } => {
  if (skipCount <= 0) {
    return { week, day, statuses };
  }

  let currentWeek = week;
  let currentDay = day;
  let currentStatuses = statuses;

  for (let i = 0; i < skipCount; i++) {
    currentStatuses = markDayStatus(currentStatuses, currentWeek, currentDay, 'skipped');
    const next = advanceWeekDay(currentWeek, currentDay);

    if (next.wrapped) {
      currentStatuses = emptyDayStatuses();
    }

    currentWeek = next.week;
    currentDay = next.day;
  }

  if (currentWeek === 1 && currentDay === 1) {
    currentStatuses = emptyDayStatuses();
  }

  return { week: currentWeek, day: currentDay, statuses: currentStatuses };
};

const startOfUtcDay = (date: Date): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const diffInDaysUtc = (from: Date, to: Date): number => {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / oneDayMs);
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
    await ensureDayStatusesColumn();

    const existing = await db
      .select()
      .from(dailyBonuses)
      .where(eq(dailyBonuses.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [newBonus] = await db
      .insert(dailyBonuses)
      .values({
        userId,
        currentWeek: 1,
        currentDay: 1,
        lastClaimDate: null,
        dayStatuses: emptyDayStatuses(),
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
    let statuses = normalizeDayStatuses(userBonus.dayStatuses);

    const now = new Date();
    const todayUtc = startOfUtcDay(now);

    let lastClaimUtc: Date | null = lastClaimDate ? startOfUtcDay(new Date(lastClaimDate)) : null;
    let canClaimToday = true;
    let isClaimedToday = false;

    const currentIndex = toDayIndex(currentWeek, currentDay);
    const lastClaimIndex = statuses.claimedDays.length > 0
      ? statuses.claimedDays[statuses.claimedDays.length - 1]
      : 0;

    if (lastClaimUtc) {
      const diff = diffInDaysUtc(lastClaimUtc, todayUtc);

      if (diff === 0) {
        canClaimToday = false;
        isClaimedToday = true;
      } else if (diff === 1) {
        canClaimToday = true;
      } else if (diff > 1) {
        const processedSkips = statuses.skippedDays.filter(index =>
          isIndexBetween(index, lastClaimIndex, currentIndex),
        ).length;
        const remainingSkips = Math.max(0, diff - 1 - processedSkips);

        if (remainingSkips > 0) {
          const result = applySkippedDays(currentWeek, currentDay, statuses, remainingSkips);
          currentWeek = result.week;
          currentDay = result.day;
          statuses = result.statuses;

          await db
            .update(dailyBonuses)
            .set({
              currentWeek,
              currentDay,
              dayStatuses: statuses,
              updatedAt: new Date(),
            })
            .where(eq(dailyBonuses.userId, userId));
        }
      }
    }

    const todayReward = await this.getRewardForDay(userId, currentWeek, currentDay);
    const nextClaimAvailableAt = isClaimedToday
      ? new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000).toISOString()
      : null;
    const skippedDays = statuses.skippedDays.map(fromDayIndex);
    const streakLength = computeClaimStreak(statuses, currentWeek, currentDay);

    return {
      currentWeek,
      currentDay,
      canClaimToday,
      isClaimedToday,
      lastClaimDate: lastClaimUtc ? lastClaimUtc.toISOString() : null,
      nextClaimAvailableAt,
      streakLength,
      todayReward,
      skippedDays,
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
        dayStatuses: emptyDayStatuses(),
        updatedAt: new Date(),
      })
      .where(eq(dailyBonuses.userId, userId));
  }

  /**
   * Перейти к следующему дню
   */
  static async advanceToNextDay(userId: number, claimedDay?: { week: number; day: number }) {
    const userBonus = await this.getOrCreateUserBonus(userId);
    let statuses = normalizeDayStatuses(userBonus.dayStatuses);

    const target = claimedDay ?? { week: userBonus.currentWeek, day: userBonus.currentDay };
    statuses = markDayStatus(statuses, target.week, target.day, 'claimed');

    const next = advanceWeekDay(userBonus.currentWeek, userBonus.currentDay);

    if (next.wrapped) {
      statuses = emptyDayStatuses();
    }

    await db
      .update(dailyBonuses)
      .set({
        currentWeek: next.week,
        currentDay: next.day,
        lastClaimDate: new Date(),
        dayStatuses: statuses,
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
      const boosterType = await BoosterService.getBoosterTypeByName(reward.name);
      if (boosterType) {
        await BoosterService.addUserBooster(userId, boosterType.id, reward.quantity);
      }
    }

    await this.advanceToNextDay(userId, { week: state.currentWeek, day: state.currentDay });

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
        dayStatuses: emptyDayStatuses(),
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
        dayStatuses: emptyDayStatuses(),
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