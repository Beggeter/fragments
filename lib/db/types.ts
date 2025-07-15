import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { 
  users, 
  userGames, 
  boosterTypes, 
  userBoosters, 
  currencyTransactions, 
  recordHistory 
} from './schema';

// Типы для пользователей
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Типы для игр
export type UserGame = InferSelectModel<typeof userGames>;
export type NewUserGame = InferInsertModel<typeof userGames>;

// Типы для бустеров
export type BoosterType = InferSelectModel<typeof boosterTypes>;
export type NewBoosterType = InferInsertModel<typeof boosterTypes>;

export type UserBooster = InferSelectModel<typeof userBoosters>;
export type NewUserBooster = InferInsertModel<typeof userBoosters>;

// Типы для транзакций валюты
export type CurrencyTransaction = InferSelectModel<typeof currencyTransactions>;
export type NewCurrencyTransaction = InferInsertModel<typeof currencyTransactions>;

// Типы для истории рекордов
export type RecordHistory = InferSelectModel<typeof recordHistory>;
export type NewRecordHistory = InferInsertModel<typeof recordHistory>;

// Дополнительные типы для игровых данных
export interface BoardState {
  grid: number[][];
  width: number;
  height: number;
}

export interface GamePiece {
  id: string;
  shape: number[][];
  color: string;
  position?: { x: number; y: number };
}

export interface BoosterEffect {
  type: 'score_multiplier' | 'piece_preview' | 'line_clear' | 'time_freeze' | 'custom';
  value: number;
  duration?: number; // в секундах, если применимо
  description: string;
}

export interface CurrencyTransactionMetadata {
  gameId?: string;
  boosterId?: number;
  adminId?: number;
  reason?: string;
  referredUserId?: number;
  // Метаданные для платежей Telegram Stars
  telegramPaymentChargeId?: string;
  providerPaymentChargeId?: string;
  itemType?: 'shards' | 'booster' | 'subscription';
  itemId?: string;
  price?: number;
  currency?: string;
}

export interface GameData {
  finalScore: number;
  linesCleared: number;
  piecesPlaced: number;
  gameDuration: number; // в секундах
  boostersUsed: number[];
}

// Enum для ролей пользователей
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PREMIUM = 'premium'
}

// Enum для типов транзакций валюты
export enum CurrencyTransactionType {
  GAME_REWARD = 'game_reward',
  BOOSTER_PURCHASE = 'booster_purchase',
  CURRENCY_PURCHASE = 'currency_purchase', // Покупка валюты за Stars
  ADMIN_GRANT = 'admin_grant',
  ADMIN_DEDUCT = 'admin_deduct',
  DAILY_BONUS = 'daily_bonus',
  REFERRAL_BONUS = 'referral_bonus'
} 