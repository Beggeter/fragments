import { db } from '../index';
import { dailyBonuses, users, userBoosters, boosterTypes } from '../schema';
import { eq, and } from 'drizzle-orm';
import dailyBonusConfig from '../../data/dailyBonusConfig.json';
import { DailyBonusConfig, DailyBonusState, DailyBonusReward } from '../../data/dailyBonusTypes';
import { CurrencyService } from './currencyService';
import { BoosterService } from './boosterService';
import { CurrencyTransactionType } from '../types';

const config = dailyBonusConfig as DailyBonusConfig;

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Проверяем, можно ли получить бонус сегодня
    let canClaimToday = false;
    let todayReward: DailyBonusReward | null = null;

    if (userBonus.lastClaimDate) {
      const lastClaim = new Date(userBonus.lastClaimDate);
      lastClaim.setHours(0, 0, 0, 0);

      // Если последний бонус был получен сегодня, то нельзя получить еще раз
      if (lastClaim.getTime() === today.getTime()) {
        canClaimToday = false;
      } else {
        // Проверяем, не пропустил ли пользователь день
        const daysDiff = Math.floor((today.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));
        
                 if (daysDiff === 1) {
           // Следующий день - можно получить бонус
           canClaimToday = true;
           todayReward = await this.getRewardForDay(userId, userBonus.currentWeek, userBonus.currentDay);
         } else if (daysDiff > 1) {
           // Пропустил день - сбрасываем к началу
           await this.resetUserProgress(userId);
           canClaimToday = true;
           todayReward = await this.getRewardForDay(userId, 1, 1);
         }
      }
         } else {
       // Первый раз - можно получить бонус
       canClaimToday = true;
       todayReward = await this.getRewardForDay(userId, userBonus.currentWeek, userBonus.currentDay);
     }

    return {
      currentWeek: userBonus.currentWeek,
      currentDay: userBonus.currentDay,
      lastClaimDate: userBonus.lastClaimDate?.toISOString() || null,
      canClaimToday,
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

    const isPremium = ['premium', 'admin', 'tester'].includes(user[0].role);
    const weekConfig = config.weeks.find(w => w.week === week);
    
    if (!weekConfig) {
      throw new Error(`Week ${week} not found in config`);
    }

    const dayConfig = weekConfig.days.find(d => d.day === day);
    if (!dayConfig) {
      throw new Error(`Day ${day} not found in week ${week}`);
    }

    return isPremium ? dayConfig.premium : dayConfig.regular;
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
    if (newWeek > 4) {
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
    const userBonus = await this.getOrCreateUserBonus(userId);
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
      await CurrencyService.addCurrency(userId, reward.amount, CurrencyTransactionType.DAILY_BONUS, `Daily bonus week ${userBonus.currentWeek} day ${userBonus.currentDay}`, {
        week: userBonus.currentWeek,
        day: userBonus.currentDay,
      });
    } else if (reward.type === 'booster' && reward.name && reward.quantity) {
      // Сначала получаем ID бустера по имени
      const boosterType = await BoosterService.getBoosterTypeByName(reward.name);
      if (boosterType) {
        await BoosterService.addUserBooster(userId, boosterType.id, reward.quantity);
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
} 