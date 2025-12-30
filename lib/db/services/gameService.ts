import { eq, and, desc } from 'drizzle-orm';
import { db } from '../index';
import { userGames, recordHistory } from '../schema';
import type { UserGame, NewUserGame, BoardState, GamePiece, GameData, RecordHistory } from '../types';

export class GameService {
  // Создание новой игры для пользователя
  static async createGame(userId: number, boardState: BoardState, currentPieces: GamePiece[], gameMode: 'classic' | 'zen' = 'classic'): Promise<UserGame> {
    const [game] = await db.insert(userGames).values({
      userId,
      gameMode,
      boardState,
      currentPieces,
      score: 0,
      level: 1,
      isActive: true,
    }).returning();
    return game;
  }

  // Получение текущей игры пользователя
  static async getCurrentGame(userId: number, gameMode: 'classic' | 'zen' = 'classic'): Promise<UserGame | null> {
    const [game] = await db
      .select()
      .from(userGames)
      .where(
        and(
          eq(userGames.userId, userId),
          eq(userGames.gameMode, gameMode),
          eq(userGames.isActive, true)
        )
      )
      .orderBy(desc(userGames.updatedAt))
      .limit(1);
    return game || null;
  }

  // Обновление состояния игры
  static async updateGame(
    gameId: number, 
    updates: Partial<{
      boardState: BoardState;
      currentPieces: GamePiece[];
      score: number;
      level: number;
    }>
  ): Promise<UserGame | null> {
    const [game] = await db
      .update(userGames)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userGames.id, gameId))
      .returning();
    return game || null;
  }

  // Удаление игры (при завершении)
  static async deleteGame(gameId: number): Promise<boolean> {
    const result = await db.delete(userGames).where(eq(userGames.id, gameId));
    return (result.rowCount ?? 0) > 0;
  }

  // Сохранение рекорда
  static async saveRecord(
    userId: number, 
    score: number, 
    level: number, 
    gameData: GameData
  ): Promise<RecordHistory> {
    const [record] = await db.insert(recordHistory).values({
      userId,
      score,
      level,
      gameData,
    }).returning();
    return record;
  }

  // Получение истории рекордов пользователя
  static async getUserRecords(userId: number, limit = 10): Promise<RecordHistory[]> {
    return await db
      .select()
      .from(recordHistory)
      .where(eq(recordHistory.userId, userId))
      .orderBy(desc(recordHistory.score))
      .limit(limit);
  }

  // Получение лучшего рекорда пользователя
  static async getBestRecord(userId: number): Promise<RecordHistory | null> {
    const [record] = await db
      .select()
      .from(recordHistory)
      .where(eq(recordHistory.userId, userId))
      .orderBy(desc(recordHistory.score))
      .limit(1);
    return record || null;
  }

  // Получение глобальных рекордов
  static async getGlobalRecords(limit = 10): Promise<RecordHistory[]> {
    return await db
      .select()
      .from(recordHistory)
      .orderBy(desc(recordHistory.score))
      .limit(limit);
  }

  // Получение статистики игр пользователя
  static async getUserGameStats(userId: number) {
    const records = await this.getUserRecords(userId, 100);
    
    if (records.length === 0) {
      return {
        totalGames: 0,
        averageScore: 0,
        bestScore: 0,
        totalLinesCleared: 0,
        averageLinesCleared: 0,
        totalPiecesPlaced: 0,
        averagePiecesPlaced: 0,
        totalGameTime: 0,
        averageGameTime: 0,
      };
    }

    const totalGames = records.length;
    const totalScore = records.reduce((sum, record) => sum + record.score, 0);
    const averageScore = Math.round(totalScore / totalGames);
    const bestScore = records[0]?.score || 0;

    const totalLinesCleared = records.reduce((sum, record) => {
      const gameData = record.gameData as GameData;
      return sum + (gameData?.linesCleared || 0);
    }, 0);

    const totalPiecesPlaced = records.reduce((sum, record) => {
      const gameData = record.gameData as GameData;
      return sum + (gameData?.piecesPlaced || 0);
    }, 0);

    const totalGameTime = records.reduce((sum, record) => {
      const gameData = record.gameData as GameData;
      return sum + (gameData?.gameDuration || 0);
    }, 0);

    return {
      totalGames,
      averageScore,
      bestScore,
      totalLinesCleared,
      averageLinesCleared: Math.round(totalLinesCleared / totalGames),
      totalPiecesPlaced,
      averagePiecesPlaced: Math.round(totalPiecesPlaced / totalGames),
      totalGameTime,
      averageGameTime: Math.round(totalGameTime / totalGames),
    };
  }

  // Проверка, может ли пользователь разместить фигуру
  static canPlacePiece(boardState: BoardState, piece: GamePiece, position: { x: number; y: number }): boolean {
    const { grid, width, height } = boardState;
    const { shape } = piece;
    
    // Проверяем, что фигура помещается в границы поля
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] === 0) continue;
        
        const boardX = position.x + x;
        const boardY = position.y + y;
        
        // Проверяем границы
        if (boardX < 0 || boardX >= width || boardY < 0 || boardY >= height) {
          return false;
        }
        
        // Проверяем, что клетка свободна
        if (grid[boardY][boardX] !== 0) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Размещение фигуры на поле
  static placePiece(boardState: BoardState, piece: GamePiece, position: { x: number; y: number }): BoardState {
    const newGrid = boardState.grid.map(row => [...row]);
    const { shape } = piece;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] === 0) continue;
        
        const boardX = position.x + x;
        const boardY = position.y + y;
        
        // Используем цвет фигуры как идентификатор
        newGrid[boardY][boardX] = parseInt(piece.color) || 1;
      }
    }
    
    return {
      ...boardState,
      grid: newGrid,
    };
  }
} 