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
  gameMode?: 'classic' | 'zen'; // Добавляем режим игры
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
  gameMode?: 'classic' | 'zen'; // Добавляем режим игры
}

const GAME_SAVE_VERSION = '2.1.0'; // Обновляем версию для поддержки Zen режима
const MIN_SERVER_SAVE_INTERVAL_MS = 2000; // Троттлинг сетевых сохранений (кроме рекорда)
const LOCAL_STORAGE_KEY_CLASSIC = 'fragments_game_state';
const LOCAL_STORAGE_KEY_ZEN = 'fragments_zen_game_state';

export const useGameSave = (gameMode: 'classic' | 'zen' = 'classic') => {
  const { user, isAuthenticated, sessionToken } = useUser();
  const { isAdmin } = useAdminAuth();
  const lastServerSyncRef = useRef<number>(0);

  // Получаем правильный ключ для localStorage в зависимости от режима
  const getStorageKey = useCallback(() => {
    return gameMode === 'zen' ? LOCAL_STORAGE_KEY_ZEN : LOCAL_STORAGE_KEY_CLASSIC;
  }, [gameMode]);

  // Загрузка из локального хранилища
  const loadFromLocalStorage = useCallback((): SavedGameState | null => {
    try {
      const storageKey = getStorageKey();
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const gameState: SavedGameState = JSON.parse(saved);
      
      // Проверяем версию сохранения
      if (gameState.version !== GAME_SAVE_VERSION) {
        // console.warn('Game save version mismatch, clearing old save');
        localStorage.removeItem(storageKey);
        return null;
      }

      // Проверяем, что режим игры совпадает
      if (gameState.gameMode && gameState.gameMode !== gameMode) {
        // console.warn('Game mode mismatch, clearing save');
        localStorage.removeItem(storageKey);
        return null;
      }

      // Проверяем, не устарели ли данные (старше 24 часов)
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - gameState.timestamp > oneDay) {
        // console.warn('Game save is too old, clearing');
        localStorage.removeItem(storageKey);
        return null;
      }

      return gameState;
    } catch (error) {
      // console.error('Failed to load game from localStorage:', error);
      return null;
    }
  }, [getStorageKey, gameMode]);

  // Загрузка с сервера
  const loadFromServer = useCallback(async (): Promise<SavedGameState | null> => {
    const targetUserId = isAdmin ? '610936383' : user?.telegramId;
    if (!targetUserId || !isAuthenticated) {
      // ;
      return null;
    }

    try {
      // Используем разные endpoints для разных режимов
      const endpoint = gameMode === 'zen' 
        ? `/api/users/${targetUserId}/zen-game`
        : `/api/users/${targetUserId}/game`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        if (response.status === 404) {
          // ;
          return null;
        }
        throw new Error(`Server load failed: ${response.status}`);
      }

      const data = await response.json();
      const serverGame = data.currentGame;

      if (!serverGame) {
        // ;
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
        gameMode: gameMode,
      };

      lastServerSyncRef.current = Date.now();
      // ;
      return gameState;
    } catch (error) {
      // console.error(`Failed to load ${gameMode} game from server:`, error);
      return null;
    }
  }, [user?.telegramId, isAuthenticated, isAdmin, gameMode]);

  // Сохранение в localStorage
  const saveToLocalStorage = useCallback((gameState: SavedGameState) => {
    try {
      const storageKey = getStorageKey();
      const stateWithMode = { ...gameState, gameMode };
      const save = () => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(stateWithMode));
        } catch (_) {}
      };
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        // @ts-ignore - типизировано не во всех TSDOM
        window.requestIdleCallback(save, { timeout: 200 });
      } else {
        setTimeout(save, 0);
      }
    } catch (error) {
      // noop
    }
  }, [getStorageKey, gameMode]);

  // Сохранение на сервер (только при выходе)
  const saveToServer = useCallback(async (gameState: SavedGameState) => {
    const targetUserId = isAdmin ? '610936383' : user?.telegramId;
    if (!targetUserId || !isAuthenticated) {
      // ;
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
        gameMode: gameMode,
      };

      // Подготавливаем заголовки с авторизацией для production
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Добавляем токен авторизации если он есть (нужно для production)
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        // ;
      }

      // Используем разные endpoints для разных режимов
      const endpoint = gameMode === 'zen' 
        ? `/api/users/${targetUserId}/zen-game-sync`
        : `/api/users/${targetUserId}/game-sync`;

      const response = await fetch(endpoint, {
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
        const currentRecord = gameMode === 'zen' ? user.zenRecord : user.record;
        // ;
        // Здесь нужно обновить локальное состояние пользователя
        // Но у нас нет прямого доступа к updateUser из useUser
        // Можно использовать событие или колбэк для уведомления
        window.dispatchEvent(new CustomEvent('recordUpdated', { 
          detail: { newRecord: result.newRecord, gameMode: gameMode } 
        }));
      }

      lastServerSyncRef.current = Date.now();
      // ;
      return true;
    } catch (error) {
      // console.error(`Failed to save ${gameMode} game to server:`, error);
      return false;
    }
  }, [user?.telegramId, isAuthenticated, isAdmin, user, gameMode]);

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
      gameMode: gameMode,
    };

    // Всегда сохраняем в localStorage
    saveToLocalStorage(gameState);

    // Проверяем, нужно ли сохранить на сервер (новый рекорд или каждые 10 ходов)
    const currentScore = gameStore.score;
    const userRecord = gameMode === 'zen' ? (user?.zenRecord || 0) : (user?.record || 0);
    // Решаем, сохранять ли на сервер
    const now = Date.now();
    const isNewRecord = currentScore > userRecord;
    const isPeriodicSave = gameStore.piecesPlaced % 10 === 0;
    const throttled = !isNewRecord && (now - lastServerSyncRef.current) < MIN_SERVER_SAVE_INTERVAL_MS;
    const shouldSaveToServer = isNewRecord || (isPeriodicSave && !throttled);

    if (shouldSaveToServer && isAuthenticated) {
      // console.log('💾 Triggering server save:', {
      //   reason: currentScore > userRecord ? 'new record' : 'periodic save',
      //   score: currentScore,
      //   record: userRecord,
      //   piecesPlaced: gameStore.piecesPlaced,
      //   gameMode: gameMode
      // });
      // Делаем сетевое сохранение неблокирующим для UI пути
      // Не ждём завершения, чтобы не задерживать следующий кадр
      void saveToServer(gameState);
    }
  }, [saveToLocalStorage, saveToServer, user?.record, user?.zenRecord, isAuthenticated, gameMode]);

  // Загрузка игры с приоритетом
  const loadGame = useCallback(async (): Promise<boolean> => {
    // ;

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
        // ;
        finalState = serverState;
      } else {
        // ;
        finalState = localState;
      }
    } else if (serverState) {
      // ;
      finalState = serverState;
    } else if (localState) {
      // ;
      finalState = localState;
    } else {
      // ;
      return false;
    }

    if (finalState) {
      // Восстанавливаем состояние игры
      const gameStore = useGameStore.getState();
      
      // Проверяем валидность состояния
      if (!finalState.board || !Array.isArray(finalState.board) || 
          !finalState.currentPieces || !Array.isArray(finalState.currentPieces)) {
        // console.warn('Invalid game state, starting new game');
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

      // console.log('Restoring game state with pieces:', fixedPieces.map(p => ({
      //   id: p.id,
      //   uniqueId: p.uniqueId,
      //   color: p.color,
      //   matrixSize: `${p.matrix.length}x${p.matrix[0]?.length}`,
      // })));

      // console.log('Board state:', finalState.board.map(row => 
      //   row.map(cell => ({ value: cell.value, color: cell.color }))
      // ));

      gameStore.restoreGameState({
        board: finalState.board,
        currentPieces: fixedPieces,
        score: finalState.score,
        combo: finalState.combo,
        placedPiecesCount: finalState.placedPiecesCount,
      });

      // ;
      return true;
    }

    return false;
  }, [isAuthenticated, loadFromServer, loadFromLocalStorage, gameMode]);

  // Принудительное сохранение (только на сервер при выходе)
  const forceSave = useCallback(async () => {
    // ;
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
      gameMode: gameMode,
    };

    await saveToServer(gameState);
  }, [saveToServer, gameMode]);

  // Очистка сохранений
  const clearSaves = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
      // ;
    } catch (error) {
      // console.error(`Failed to clear ${gameMode} local saves:`, error);
    }
  }, [getStorageKey, gameMode]);

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