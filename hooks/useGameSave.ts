"use client";

import { useCallback, useEffect, useRef } from 'react';
import { useUser } from './useUser';
import { useAdminAuth } from './useAdminAuth';
import { useGameStore } from '../lib/state/store';
import { Block, Cell } from '../lib/data/types';

interface SavedGameState {
  board: Cell[][]; // Сохраняем каждую клетку с цветом
  currentPieces: Block[];
  score: number;
  combo: number;
  placedPiecesCount: number;
  timestamp: number;
  version: string;
}

interface ServerGameState {
  boardState: {
    grid: Cell[][]; // Изменено на Cell[][]
    width: number;
    height: number;
  };
  currentPieces: Block[];
  score: number;
  level: number;
}

const GAME_SAVE_VERSION = '2.0.0'; // Новая версия для новой логики сохранения
const LOCAL_STORAGE_KEY = 'fragments_game_state';

export const useGameSave = () => {
  const { user, isAuthenticated, sessionToken } = useUser();
  const { isAdmin } = useAdminAuth();
  const lastServerSyncRef = useRef<number>(0);

  // Загрузка из локального хранилища
  const loadFromLocalStorage = useCallback((): SavedGameState | null => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) return null;

      const gameState: SavedGameState = JSON.parse(saved);
      
      // Проверяем версию сохранения
      if (gameState.version !== GAME_SAVE_VERSION) {
        console.warn('Game save version mismatch, clearing old save');
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return null;
      }

      // Проверяем, не устарели ли данные (старше 24 часов)
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - gameState.timestamp > oneDay) {
        console.warn('Game save is too old, clearing');
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return null;
      }

      return gameState;
    } catch (error) {
      console.error('Failed to load game from localStorage:', error);
      return null;
    }
  }, []);

  // Загрузка с сервера
  const loadFromServer = useCallback(async (): Promise<SavedGameState | null> => {
    const targetUserId = isAdmin ? '610936383' : user?.telegramId;
    if (!targetUserId || !isAuthenticated) {
      console.log('User not authenticated, skipping server load');
      return null;
    }

    try {
      const response = await fetch(`/api/users/${targetUserId}/game`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No saved game on server');
          return null;
        }
        throw new Error(`Server load failed: ${response.status}`);
      }

      const data = await response.json();
      const serverGame = data.currentGame;

      if (!serverGame) {
        console.log('No current game on server');
        return null;
      }

      const gameState: SavedGameState = {
        board: serverGame.boardState.grid,
        currentPieces: serverGame.currentPieces,
        score: serverGame.score,
        combo: 0, // Сервер не сохраняет комбо
        placedPiecesCount: 0, // Сервер не сохраняет счетчик размещенных фигур
        timestamp: new Date(serverGame.updatedAt).getTime(),
        version: GAME_SAVE_VERSION,
      };

      lastServerSyncRef.current = Date.now();
      console.log('Game loaded from server');
      return gameState;
    } catch (error) {
      console.error('Failed to load game from server:', error);
      return null;
    }
  }, [user?.telegramId, isAuthenticated, isAdmin]);

  // Сохранение в localStorage
  const saveToLocalStorage = useCallback((gameState: SavedGameState) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
      console.log('Game saved to localStorage');
    } catch (error) {
      console.error('Failed to save game to localStorage:', error);
    }
  }, []);

  // Сохранение на сервер (только при выходе)
  const saveToServer = useCallback(async (gameState: SavedGameState) => {
    const targetUserId = isAdmin ? '610936383' : user?.telegramId;
    if (!targetUserId || !isAuthenticated) {
      console.log('User not authenticated, skipping server save');
      return false;
    }

    try {
      const serverState: ServerGameState = {
        boardState: {
          grid: gameState.board,
          width: gameState.board[0]?.length || 8,
          height: gameState.board.length || 8,
        },
        currentPieces: gameState.currentPieces,
        score: gameState.score,
        level: 1, // TODO: добавить логику уровней
      };

      // Подготавливаем заголовки с авторизацией для production
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Добавляем токен авторизации если он есть (нужно для production)
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        console.log('🔐 Added authorization token to game-sync request');
      }

      const response = await fetch(`/api/users/${targetUserId}/game-sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify(serverState),
      });

      if (!response.ok) {
        throw new Error(`Server save failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Проверяем, обновился ли рекорд на сервере
      if (result.recordUpdated && result.newRecord !== undefined && user) {
        console.log('🏆 Record updated during auto-save! Local user record updated from', user.record, 'to', result.newRecord);
        // Здесь нужно обновить локальное состояние пользователя
        // Но у нас нет прямого доступа к updateUser из useUser
        // Можно использовать событие или колбэк для уведомления
        window.dispatchEvent(new CustomEvent('recordUpdated', { 
          detail: { newRecord: result.newRecord } 
        }));
      }

      lastServerSyncRef.current = Date.now();
      console.log('Game saved to server, record updated:', result.recordUpdated);
      return true;
    } catch (error) {
      console.error('Failed to save game to server:', error);
      return false;
    }
  }, [user?.telegramId, isAuthenticated, isAdmin, user]);

  // Сохранение после хода или применения бустера
  const saveAfterAction = useCallback(async () => {
    const gameStore = useGameStore.getState();
    
    // Сохраняем board как есть - он уже содержит Cell[][] с цветами
    const boardWithColors = gameStore.board;
    
    // Убеждаемся, что у всех фигур есть правильные цвета
    const fixedPieces = gameStore.currentPieces.map(piece => {
      const pieceColor = piece.color || 'red';
      return {
        ...piece,
        color: pieceColor,
        uniqueId: piece.uniqueId || `${piece.id}_${Date.now()}_${Math.random()}`,
      };
    });
    
    const gameState: SavedGameState = {
      board: boardWithColors,
      currentPieces: fixedPieces,
      score: gameStore.score,
      combo: 0, // В правильном store нет combo
      placedPiecesCount: gameStore.piecesPlaced,
      timestamp: Date.now(),
      version: GAME_SAVE_VERSION,
    };

    // Всегда сохраняем в localStorage
    saveToLocalStorage(gameState);

    // Проверяем, нужно ли сохранить на сервер (новый рекорд или каждые 10 ходов)
    const currentScore = gameStore.score;
    const userRecord = user?.record || 0;
    const shouldSaveToServer = 
      currentScore > userRecord || // Новый рекорд - сразу сохраняем
      gameStore.piecesPlaced % 10 === 0; // Или каждые 10 ходов

    if (shouldSaveToServer && isAuthenticated) {
      console.log('💾 Triggering server save:', {
        reason: currentScore > userRecord ? 'new record' : 'periodic save',
        score: currentScore,
        record: userRecord,
        piecesPlaced: gameStore.piecesPlaced
      });
      await saveToServer(gameState);
    }
  }, [saveToLocalStorage, saveToServer, user?.record, isAuthenticated]);

  // Загрузка игры с приоритетом
  const loadGame = useCallback(async (): Promise<boolean> => {
    console.log('Loading game state...');

    // Сначала пытаемся загрузить с сервера
    let serverState = null;
    if (isAuthenticated) {
      serverState = await loadFromServer();
    }

    // Затем загружаем из локального хранилища
    const localState = loadFromLocalStorage();

    // Определяем, какое состояние использовать
    let finalState: SavedGameState | null = null;

    if (serverState && localState) {
      // Есть оба состояния - выбираем более новое
      if (serverState.timestamp > localState.timestamp) {
        console.log('Using server state (newer)');
        finalState = serverState;
      } else {
        console.log('Using local state (newer)');
        finalState = localState;
      }
    } else if (serverState) {
      console.log('Using server state (only available)');
      finalState = serverState;
    } else if (localState) {
      console.log('Using local state (only available)');
      finalState = localState;
    } else {
      console.log('No saved game found');
      return false;
    }

    if (finalState) {
      // Восстанавливаем состояние игры
      const gameStore = useGameStore.getState();
      
      // Проверяем валидность состояния
      if (!finalState.board || !Array.isArray(finalState.board) || 
          !finalState.currentPieces || !Array.isArray(finalState.currentPieces)) {
        console.warn('Invalid game state, starting new game');
        return false;
      }

      // Восстанавливаем фигуры с правильными uniqueId
      const fixedPieces = finalState.currentPieces.map((piece, index) => {
        const pieceColor = piece.color || 'red';
        return {
          ...piece,
          color: pieceColor,
          uniqueId: piece.uniqueId || `${piece.id}_${Date.now()}_${index}`,
        };
      });

      console.log('Restoring game state with pieces:', fixedPieces.map(p => ({
        id: p.id,
        uniqueId: p.uniqueId,
        color: p.color,
        matrixSize: `${p.matrix.length}x${p.matrix[0]?.length}`,
      })));

      console.log('Board state:', finalState.board.map(row => 
        row.map(cell => ({ value: cell.value, color: cell.color }))
      ));

      gameStore.restoreGameState({
        board: finalState.board,
        currentPieces: fixedPieces,
        score: finalState.score,
        combo: finalState.combo,
        placedPiecesCount: finalState.placedPiecesCount,
      });

      console.log('Game state restored successfully');
      return true;
    }

    return false;
  }, [isAuthenticated, loadFromServer, loadFromLocalStorage]);

  // Принудительное сохранение (только на сервер при выходе)
  const forceSave = useCallback(async () => {
    console.log('Force saving game to server...');
    const gameStore = useGameStore.getState();
    
    // Сохраняем board как есть - он уже содержит Cell[][] с цветами
    const boardWithColors = gameStore.board;
    
    // Убеждаемся, что у всех фигур есть правильные цвета
    const fixedPieces = gameStore.currentPieces.map(piece => {
      const pieceColor = piece.color || 'red';
      return {
        ...piece,
        color: pieceColor,
        uniqueId: piece.uniqueId || `${piece.id}_${Date.now()}_${Math.random()}`,
      };
    });
    
    const gameState: SavedGameState = {
      board: boardWithColors,
      currentPieces: fixedPieces,
      score: gameStore.score,
      combo: 0, // В правильном store нет combo
      placedPiecesCount: gameStore.piecesPlaced,
      timestamp: Date.now(),
      version: GAME_SAVE_VERSION,
    };

    await saveToServer(gameState);
  }, [saveToServer]);

  // Очистка сохранений
  const clearSaves = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('Local saves cleared');
    } catch (error) {
      console.error('Failed to clear local saves:', error);
    }
  }, []);

  // Сохранение при закрытии страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      forceSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [forceSave]);

  return {
    loadGame,
    forceSave,
    saveAfterAction,
    clearSaves,
    isAuthenticated,
  };
}; 