import { eq, and, desc, ne, count, sum, gt } from 'drizzle-orm';
import { db } from '../index';
import { users, userGames, currencyTransactions, recordHistory } from '../schema';
import type { User, NewUser, UserRole } from '../types';

export class UserService {
  private static async refreshZenSubscriptionStatus(user: User | null): Promise<User | null> {
    if (!user) {
      return null;
    }

    if (!user.hasZenSubscription || !user.zenSubscriptionEndDate) {
      return user;
    }

    const endDate = new Date(user.zenSubscriptionEndDate);
    const now = new Date();

    if (Number.isNaN(endDate.getTime()) || endDate > now) {
      return user;
    }

    const [updated] = await db
      .update(users)
      .set({
        hasZenSubscription: false,
        zenSubscriptionEndDate: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    if (updated) {
      return updated;
    }

    return {
      ...user,
      hasZenSubscription: false,
      zenSubscriptionEndDate: null,
    };
  }

  // Создание нового пользователя
  static async createUser(userData: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Получение пользователя по Telegram ID
  static async getUserByTelegramId(telegramId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return this.refreshZenSubscriptionStatus(user || null);
  }

  // Получение пользователя по ID
  static async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return this.refreshZenSubscriptionStatus(user || null);
  }

  // Обновление пользователя
  static async updateUser(id: number, updates: Partial<Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  // Обновление рекорда пользователя
  static async updateRecord(userId: number, newRecord: number, gameMode: 'classic' | 'zen' = 'classic'): Promise<User | null> {
    const updateData = gameMode === 'zen' 
      ? { zenRecord: newRecord, updatedAt: new Date() }
      : { record: newRecord, updatedAt: new Date() };
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user || null;
  }

  // Получение рекорда пользователя по режиму
  static async getRecord(userId: number, gameMode: 'classic' | 'zen' = 'classic'): Promise<number> {
    const user = await this.getUserById(userId);
    if (!user) return 0;
    
    return gameMode === 'zen' ? user.zenRecord : user.record;
  }

  // Обновление валюты пользователя
  static async updateCurrency(userId: number, amount: number): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ currency: amount, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || null;
  }

  // Получение всех пользователей с пагинацией
  static async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
  }

  // Получение пользователей по роли
  static async getUsersByRole(role: UserRole): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Получение топ пользователей по рекорду
  static async getTopUsers(limit = 10, gameMode: 'classic' | 'zen' = 'classic'): Promise<User[]> {
    const recordField = gameMode === 'zen' ? users.zenRecord : users.record;
    
    return await db
      .select()
      .from(users)
      .where(ne(recordField, 0))
      .orderBy(desc(recordField))
      .limit(limit);
  }

  // Получение позиции пользователя в рейтинге (быстрый способ)
  static async getUserPosition(userId: number, gameMode: 'classic' | 'zen' = 'classic'): Promise<number | null> {
    // console.log('UserService.getUserPosition called with userId:', userId, 'gameMode:', gameMode);
    const user = await this.getUserById(userId);
    if (!user) {
      // console.log('UserService.getUserPosition: user not found');
      return null;
    }
    
    const userRecord = gameMode === 'zen' ? user.zenRecord : user.record;
    const recordField = gameMode === 'zen' ? users.zenRecord : users.record;
    
    // Если у пользователя рекорд = 0, не показываем позицию
    if (userRecord === 0) {
      // console.log('UserService.getUserPosition: user has no record (0)');
      return null;
    }
    
    // Считаем сколько пользователей имеют рекорд больше чем у текущего
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        gt(recordField, userRecord),
        ne(recordField, 0)
      ));
    
    const position = (result.count || 0) + 1;
    // console.log('UserService.getUserPosition calculated position:', position);
    return position;
  }

  // Удаление пользователя (только для админов)
  static async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Проверка существования пользователя
  static async userExists(telegramId: string): Promise<boolean> {
    const user = await this.getUserByTelegramId(telegramId);
    return user !== null;
  }

  // Получение статистики пользователя
  static async getUserStats(userId: number) {
    const user = await this.getUserById(userId);
    if (!user) return null;

    // Получаем количество игр
    const gamesCount = await db
      .select({ count: count() })
      .from(userGames)
      .where(eq(userGames.userId, userId));

    // Получаем общую сумму транзакций
    const totalTransactions = await db
      .select({ sum: sum(currencyTransactions.amount) })
      .from(currencyTransactions)
      .where(eq(currencyTransactions.userId, userId));

    // Получаем количество рекордов
    const recordsCount = await db
      .select({ count: count() })
      .from(recordHistory)
      .where(eq(recordHistory.userId, userId));

    return {
      user,
      gamesCount: gamesCount[0]?.count || 0,
      totalCurrencyEarned: totalTransactions[0]?.sum || 0,
      recordsCount: recordsCount[0]?.count || 0,
    };
  }
} 