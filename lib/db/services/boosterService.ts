import { eq, and, desc } from 'drizzle-orm';
import { db } from '../index';
import { boosterTypes, userBoosters } from '../schema';
import type { BoosterType, NewBoosterType, UserBooster, NewUserBooster, BoosterEffect } from '../types';

export class BoosterService {
  // Создание нового типа бустера (только для админов)
  static async createBoosterType(boosterData: Omit<NewBoosterType, 'id' | 'createdAt'>): Promise<BoosterType> {
    const [booster] = await db.insert(boosterTypes).values(boosterData).returning();
    return booster;
  }

  // Получение всех типов бустеров
  static async getAllBoosterTypes(): Promise<BoosterType[]> {
    return await db.select().from(boosterTypes).where(eq(boosterTypes.isActive, true));
  }

  // Получение типа бустера по ID
  static async getBoosterTypeById(id: number): Promise<BoosterType | null> {
    const [booster] = await db.select().from(boosterTypes).where(eq(boosterTypes.id, id));
    return booster || null;
  }

  // Получение типа бустера по имени
  static async getBoosterTypeByName(name: string): Promise<BoosterType | null> {
    const [booster] = await db.select().from(boosterTypes).where(eq(boosterTypes.name, name));
    return booster || null;
  }

  // Обновление типа бустера
  static async updateBoosterType(id: number, updates: Partial<Omit<NewBoosterType, 'id' | 'createdAt'>>): Promise<BoosterType | null> {
    const [booster] = await db
      .update(boosterTypes)
      .set(updates)
      .where(eq(boosterTypes.id, id))
      .returning();
    return booster || null;
  }

  // Получение бустеров пользователя
  static async getUserBoosters(userId: number): Promise<UserBooster[]> {
    return await db
      .select()
      .from(userBoosters)
      .where(eq(userBoosters.userId, userId));
  }

  // Получение конкретного бустера пользователя
  static async getUserBooster(userId: number, boosterTypeId: number): Promise<UserBooster | null> {
    const [booster] = await db
      .select()
      .from(userBoosters)
      .where(and(eq(userBoosters.userId, userId), eq(userBoosters.boosterTypeId, boosterTypeId)));
    return booster || null;
  }

  // Добавление бустера пользователю
  static async addUserBooster(userId: number, boosterTypeId: number, quantity: number = 1): Promise<UserBooster> {
    const existingBooster = await this.getUserBooster(userId, boosterTypeId);
    
    if (existingBooster) {
      // Обновляем количество существующего бустера
      const [booster] = await db
        .update(userBoosters)
        .set({ 
          quantity: existingBooster.quantity + quantity,
          updatedAt: new Date()
        })
        .where(and(eq(userBoosters.userId, userId), eq(userBoosters.boosterTypeId, boosterTypeId)))
        .returning();
      return booster;
    } else {
      // Создаем новый бустер для пользователя
      const [booster] = await db.insert(userBoosters).values({
        userId,
        boosterTypeId,
        quantity,
      }).returning();
      return booster;
    }
  }

  // Использование бустера
  static async useBooster(userId: number, boosterTypeId: number, quantity: number = 1): Promise<boolean> {
    const userBooster = await this.getUserBooster(userId, boosterTypeId);
    
    if (!userBooster || userBooster.quantity < quantity) {
      return false; // Недостаточно бустеров
    }

    if (userBooster.quantity === quantity) {
      // Удаляем бустер, если количество равно 0
      await db.delete(userBoosters).where(and(eq(userBoosters.userId, userId), eq(userBoosters.boosterTypeId, boosterTypeId)));
    } else {
      // Уменьшаем количество
      await db
        .update(userBoosters)
        .set({ 
          quantity: userBooster.quantity - quantity,
          updatedAt: new Date()
        })
        .where(and(eq(userBoosters.userId, userId), eq(userBoosters.boosterTypeId, boosterTypeId)));
    }

    return true;
  }

  // Получение количества бустера у пользователя
  static async getBoosterQuantity(userId: number, boosterTypeId: number): Promise<number> {
    const userBooster = await this.getUserBooster(userId, boosterTypeId);
    return userBooster?.quantity || 0;
  }

  // Получение всех бустеров пользователя с информацией о типах
  static async getUserBoostersWithInfo(userId: number): Promise<(UserBooster & { boosterType: BoosterType })[]> {
    return await db
      .select({
        userId: userBoosters.userId,
        boosterTypeId: userBoosters.boosterTypeId,
        quantity: userBoosters.quantity,
        createdAt: userBoosters.createdAt,
        updatedAt: userBoosters.updatedAt,
        boosterType: {
          id: boosterTypes.id,
          name: boosterTypes.name,
          description: boosterTypes.description,
          price: boosterTypes.price,
          effect: boosterTypes.effect,
          isActive: boosterTypes.isActive,
          createdAt: boosterTypes.createdAt,
        }
      })
      .from(userBoosters)
      .innerJoin(boosterTypes, eq(userBoosters.boosterTypeId, boosterTypes.id))
      .where(eq(userBoosters.userId, userId));
  }

  // Проверка, может ли пользователь использовать бустер
  static async canUseBooster(userId: number, boosterTypeId: number, quantity: number = 1): Promise<boolean> {
    const userBooster = await this.getUserBooster(userId, boosterTypeId);
    return userBooster !== null && userBooster.quantity >= quantity;
  }

  // Получение эффекта бустера
  static getBoosterEffect(boosterType: BoosterType): BoosterEffect {
    return boosterType.effect as BoosterEffect;
  }

  // Применение эффекта бустера к игре
  static applyBoosterEffect(effect: BoosterEffect, gameState: any): any {
    switch (effect.type) {
      case 'score_multiplier':
        return {
          ...gameState,
          scoreMultiplier: effect.value,
          scoreMultiplierExpiresAt: effect.duration 
            ? new Date(Date.now() + effect.duration * 1000)
            : null
        };
      
      case 'piece_preview':
        return {
          ...gameState,
          piecePreviewCount: effect.value,
        };
      
      case 'line_clear':
        return {
          ...gameState,
          lineClearBonus: effect.value,
        };
      
      case 'time_freeze':
        return {
          ...gameState,
          timeFreezeActive: true,
          timeFreezeExpiresAt: effect.duration 
            ? new Date(Date.now() + effect.duration * 1000)
            : null
        };
      
      default:
        return gameState;
    }
  }

  // Инициализация стандартных бустеров
  static async initializeDefaultBoosters(): Promise<void> {
    const defaultBoosters: Omit<NewBoosterType, 'id' | 'createdAt'>[] = [
      {
        name: 'score_multiplier_2x',
        description: 'Удваивает очки за 30 секунд',
        price: 100,
        effect: {
          type: 'score_multiplier',
          value: 2,
          duration: 30,
          description: 'Удваивает очки'
        },
        isActive: true,
      },
      {
        name: 'piece_preview',
        description: 'Показывает следующую фигуру',
        price: 50,
        effect: {
          type: 'piece_preview',
          value: 1,
          description: 'Показывает следующую фигуру'
        },
        isActive: true,
      },
      {
        name: 'line_clear_bonus',
        description: 'Дополнительные очки за очистку линий',
        price: 75,
        effect: {
          type: 'line_clear',
          value: 50,
          description: '+50 очков за каждую очищенную линию'
        },
        isActive: true,
      },
      {
        name: 'time_freeze',
        description: 'Останавливает время на 15 секунд',
        price: 150,
        effect: {
          type: 'time_freeze',
          value: 1,
          duration: 15,
          description: 'Останавливает время'
        },
        isActive: true,
      },
    ];

    for (const booster of defaultBoosters) {
      const existing = await this.getBoosterTypeByName(booster.name);
      if (!existing) {
        await this.createBoosterType(booster);
      }
    }
  }
} 