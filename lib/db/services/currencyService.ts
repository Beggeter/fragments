import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { db } from '../index';
import { currencyTransactions, users } from '../schema';
import type { CurrencyTransaction, NewCurrencyTransaction, CurrencyTransactionMetadata } from '../types';
import { CurrencyTransactionType } from '../types';
import { UserService } from './userService';
import { count, sum, avg } from 'drizzle-orm';

export class CurrencyService {
  // Добавление валюты пользователю
  static async addCurrency(
    userId: number, 
    amount: number, 
    type: CurrencyTransactionType, 
    description?: string, 
    metadata?: CurrencyTransactionMetadata
  ): Promise<boolean> {
    try {
      // Начинаем транзакцию
      await db.transaction(async (tx) => {
        // Получаем текущего пользователя
        const user = await tx.select().from(users).where(eq(users.id, userId));
        if (user.length === 0) {
          throw new Error('User not found');
        }

        const currentUser = user[0];
        const newBalance = currentUser.currency + amount;

        // Обновляем баланс пользователя
        await tx
          .update(users)
          .set({ currency: newBalance, updatedAt: new Date() })
          .where(eq(users.id, userId));

        // Создаем запись о транзакции
        await tx.insert(currencyTransactions).values({
          userId,
          amount,
          type,
          description,
          metadata,
        });
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Списание валюты с пользователя
  static async deductCurrency(
    userId: number, 
    amount: number, 
    type: CurrencyTransactionType, 
    description?: string, 
    metadata?: CurrencyTransactionMetadata
  ): Promise<boolean> {
    try {
      // Начинаем транзакцию
      await db.transaction(async (tx) => {
        // Получаем текущего пользователя
        const user = await tx.select().from(users).where(eq(users.id, userId));
        if (user.length === 0) {
          throw new Error('User not found');
        }

        const currentUser = user[0];
        const newBalance = currentUser.currency - amount;

        // Проверяем, что у пользователя достаточно валюты
        if (newBalance < 0) {
          throw new Error('Insufficient currency');
        }

        // Обновляем баланс пользователя
        await tx
          .update(users)
          .set({ currency: newBalance, updatedAt: new Date() })
          .where(eq(users.id, userId));

        // Создаем запись о транзакции (отрицательная сумма)
        await tx.insert(currencyTransactions).values({
          userId,
          amount: -amount,
          type,
          description,
          metadata,
        });
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Получение истории транзакций пользователя
  static async getUserTransactions(
    userId: number, 
    limit = 50, 
    offset = 0
  ): Promise<CurrencyTransaction[]> {
    return await db
      .select()
      .from(currencyTransactions)
      .where(eq(currencyTransactions.userId, userId))
      .orderBy(desc(currencyTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Получение транзакций по типу
  static async getTransactionsByType(
    userId: number, 
    type: CurrencyTransactionType, 
    limit = 50
  ): Promise<CurrencyTransaction[]> {
    return await db
      .select()
      .from(currencyTransactions)
      .where(and(
        eq(currencyTransactions.userId, userId),
        eq(currencyTransactions.type, type)
      ))
      .orderBy(desc(currencyTransactions.createdAt))
      .limit(limit);
  }

  // Получение транзакций за период
  static async getTransactionsByDateRange(
    userId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<CurrencyTransaction[]> {
    return await db
      .select()
      .from(currencyTransactions)
      .where(and(
        eq(currencyTransactions.userId, userId),
        gte(currencyTransactions.createdAt, startDate),
        lte(currencyTransactions.createdAt, endDate)
      ))
      .orderBy(desc(currencyTransactions.createdAt));
  }

  // Получение статистики транзакций пользователя
  static async getUserTransactionStats(userId: number) {
    const transactions = await this.getUserTransactions(userId, 1000);

    const stats = {
      totalTransactions: transactions.length,
      totalEarned: 0,
      totalSpent: 0,
      netChange: 0,
      byType: {} as Record<CurrencyTransactionType, { count: number; total: number }>,
    };

    for (const transaction of transactions) {
      const amount = transaction.amount;
      stats.netChange += amount;

      if (amount > 0) {
        stats.totalEarned += amount;
      } else {
        stats.totalSpent += Math.abs(amount);
      }

      if (!stats.byType[transaction.type as CurrencyTransactionType]) {
        stats.byType[transaction.type as CurrencyTransactionType] = { count: 0, total: 0 };
      }
      stats.byType[transaction.type as CurrencyTransactionType].count++;
      stats.byType[transaction.type as CurrencyTransactionType].total += amount;
    }

    return stats;
  }

  // Получение текущего баланса пользователя
  static async getUserBalance(userId: number): Promise<number> {
    const user = await UserService.getUserById(userId);
    return user?.currency || 0;
  }

  // Проверка, может ли пользователь совершить покупку
  static async canAfford(userId: number, amount: number): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    return balance >= amount;
  }

  // Покупка бустера
  static async purchaseBooster(
    userId: number, 
    boosterTypeId: number, 
    price: number
  ): Promise<boolean> {
    return await this.deductCurrency(
      userId,
      price,
      CurrencyTransactionType.BOOSTER_PURCHASE,
      `Purchase of booster ${boosterTypeId}`,
      { boosterId: boosterTypeId }
    );
  }

  // Награда за игру
  static async awardGameReward(
    userId: number, 
    amount: number, 
    gameData?: any
  ): Promise<boolean> {
    return await this.addCurrency(
      userId,
      amount,
      CurrencyTransactionType.GAME_REWARD,
      'Game completion reward',
      { gameId: gameData?.gameId }
    );
  }

  // Ежедневный бонус
  static async awardDailyBonus(userId: number, amount: number = 50): Promise<boolean> {
    return await this.addCurrency(
      userId,
      amount,
      CurrencyTransactionType.DAILY_BONUS,
      'Daily login bonus'
    );
  }

  // Бонус за реферала
  static async awardReferralBonus(
    userId: number, 
    amount: number = 100, 
    referredUserId: number
  ): Promise<boolean> {
    return await this.addCurrency(
      userId,
      amount,
      CurrencyTransactionType.REFERRAL_BONUS,
      'Referral bonus',
      { referredUserId }
    );
  }

  // Административные операции
  static async adminGrantCurrency(
    userId: number, 
    amount: number, 
    adminId: number, 
    reason: string
  ): Promise<boolean> {
    return await this.addCurrency(
      userId,
      amount,
      CurrencyTransactionType.ADMIN_GRANT,
      reason,
      { adminId, reason }
    );
  }

  static async adminDeductCurrency(
    userId: number, 
    amount: number, 
    adminId: number, 
    reason: string
  ): Promise<boolean> {
    return await this.deductCurrency(
      userId,
      amount,
      CurrencyTransactionType.ADMIN_DEDUCT,
      reason,
      { adminId, reason }
    );
  }

  // Получение топ пользователей по валюте
  static async getTopUsersByCurrency(limit = 10): Promise<{ userId: number; currency: number }[]> {
    return await db
      .select({
        userId: users.id,
        currency: users.currency,
      })
      .from(users)
      .orderBy(desc(users.currency))
      .limit(limit);
  }

  // Получение общей статистики валюты
  static async getGlobalCurrencyStats() {
    const result = await db
      .select({
        totalUsers: count(users.id),
        totalCurrency: sum(users.currency),
        averageCurrency: avg(users.currency),
      })
      .from(users);

    return result[0] || {
      totalUsers: 0,
      totalCurrency: 0,
      averageCurrency: 0,
    };
  }
} 