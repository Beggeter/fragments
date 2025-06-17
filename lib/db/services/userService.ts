import { eq, and, desc } from 'drizzle-orm';
import { db } from '../index';
import { users, userGames, currencyTransactions, recordHistory } from '../schema';
import type { User, NewUser, UserRole } from '../types';

export class UserService {
  // Создание нового пользователя
  static async createUser(userData: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Получение пользователя по Telegram ID
  static async getUserByTelegramId(telegramId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || null;
  }

  // Получение пользователя по ID
  static async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
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
  static async updateRecord(userId: number, newRecord: number): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ record: newRecord, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || null;
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
  static async getTopUsers(limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.record, 0).not())
      .orderBy(desc(users.record))
      .limit(limit);
  }

  // Удаление пользователя (только для админов)
  static async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
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
      .select({ count: db.fn.count() })
      .from(userGames)
      .where(eq(userGames.userId, userId));

    // Получаем общую сумму транзакций
    const totalTransactions = await db
      .select({ sum: db.fn.sum(currencyTransactions.amount) })
      .from(currencyTransactions)
      .where(eq(currencyTransactions.userId, userId));

    // Получаем количество рекордов
    const recordsCount = await db
      .select({ count: db.fn.count() })
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