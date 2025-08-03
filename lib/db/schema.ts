import { 
  pgTable, 
  integer, 
  text, 
  varchar, 
  boolean, 
  timestamp, 
  jsonb,
  primaryKey,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Пользователи
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  telegramId: varchar("telegram_id", { length: 50 }).notNull().unique(),
  username: varchar("username", { length: 100 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 20 }).notNull().default('user'), // 'admin', 'user', 'premium', 'tester'
  record: integer("record").notNull().default(0),
  currency: integer("currency").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  telegramIdIdx: index("telegram_id_idx").on(table.telegramId),
  roleIdx: index("role_idx").on(table.role),
}));

// Текущие игры пользователей
export const userGames = pgTable("user_games", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  boardState: jsonb("board_state").notNull(), // Состояние игрового поля
  currentPieces: jsonb("current_pieces").notNull(), // Текущие доступные фигуры
  score: integer("score").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

// Бустеры (типы улучшений)
export const boosterTypes = pgTable("booster_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  price: integer("price").notNull(),
  effect: jsonb("effect").notNull(), // Описание эффекта бустера
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Бустеры пользователей
export const userBoosters = pgTable("user_boosters", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  boosterTypeId: integer("booster_type_id").notNull().references(() => boosterTypes.id),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_booster_user_id_idx").on(table.userId),
  boosterTypeIdx: index("user_booster_type_idx").on(table.boosterTypeId),
  uniqueUserBooster: primaryKey({ columns: [table.userId, table.boosterTypeId] }),
}));

// История транзакций валюты
export const currencyTransactions = pgTable("currency_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(), // Может быть отрицательным
  type: varchar("type", { length: 50 }).notNull(), // 'game_reward', 'booster_purchase', 'admin_grant', etc.
  description: text("description"),
  metadata: jsonb("metadata"), // Дополнительные данные
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("currency_user_id_idx").on(table.userId),
  typeIdx: index("currency_type_idx").on(table.type),
  createdAtIdx: index("currency_created_at_idx").on(table.createdAt),
}));

// История рекордов
export const recordHistory = pgTable("record_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  score: integer("score").notNull(),
  level: integer("level").notNull(),
  gameData: jsonb("game_data"), // Дополнительные данные о игре
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("record_user_id_idx").on(table.userId),
  scoreIdx: index("record_score_idx").on(table.score),
  createdAtIdx: index("record_created_at_idx").on(table.createdAt),
}));

// Отношения
export const usersRelations = relations(users, ({ one, many }) => ({
  currentGame: one(userGames, {
    fields: [users.id],
    references: [userGames.userId],
  }),
  boosters: many(userBoosters),
  currencyTransactions: many(currencyTransactions),
  recordHistory: many(recordHistory),
}));

export const userGamesRelations = relations(userGames, ({ one }) => ({
  user: one(users, {
    fields: [userGames.userId],
    references: [users.id],
  }),
}));

export const userBoostersRelations = relations(userBoosters, ({ one }) => ({
  user: one(users, {
    fields: [userBoosters.userId],
    references: [users.id],
  }),
  boosterType: one(boosterTypes, {
    fields: [userBoosters.boosterTypeId],
    references: [boosterTypes.id],
  }),
}));

export const boosterTypesRelations = relations(boosterTypes, ({ many }) => ({
  userBoosters: many(userBoosters),
}));

export const currencyTransactionsRelations = relations(currencyTransactions, ({ one }) => ({
  user: one(users, {
    fields: [currencyTransactions.userId],
    references: [users.id],
  }),
}));

export const recordHistoryRelations = relations(recordHistory, ({ one }) => ({
  user: one(users, {
    fields: [recordHistory.userId],
    references: [users.id],
  }),
})); 