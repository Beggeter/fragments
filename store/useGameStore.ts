import { create } from 'zustand';
import { Block, GameState, GameSettings } from '../types/game';
import { BlockGenerator } from '../utils/BlockGenerator';
import { ScoreCalculator } from '../utils/ScoreCalculator';
import { DifficultyEvaluator } from '../utils/DifficultyEvaluator';
import { useGameLogger } from '../hooks/useGameLogger';

// Функция для проверки валидности размещения блока
function isValidPlacement(board: number[][], block: Block, x: number, y: number): boolean {
  const shape = block.shape;
  
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j] === 1) {
        const boardX = x + j;
        const boardY = y + i;
        
        // Проверяем границы доски
        if (boardX < 0 || boardX >= board[0].length || boardY < 0 || boardY >= board.length) {
          return false;
        }
        
        // Проверяем, что клетка не занята
        if (board[boardY][boardX] === 1) {
          return false;
        }
      }
    }
  }
  
  return true;
}

// Функция для размещения блока на доске
function placeBlockOnBoard(board: number[][], block: Block, x: number, y: number): number[][] {
  const newBoard = board.map(row => [...row]);
  const shape = block.shape;
  
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j] === 1) {
        newBoard[y + i][x + j] = 1;
      }
    }
  }
  
  return newBoard;
}

const DEFAULT_SETTINGS: GameSettings = {
  width: 8,
  height: 8,
  initialPieces: 3,
  maxPieces: 3,
};

interface GameStore extends GameState {
  placePiece: (x: number, y: number) => void;
  startDrag: (piece: Block) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  setHoverCell: (x: number | null, y: number | null) => void;
  initializeGame: () => void;
  resetGame: () => void;
  setCurrentPieces: (pieces: Block[]) => void;
  setPreviewBlock: (block: Block | null) => void;
  onGameOver: (() => void) | null;
  setOnGameOver: (callback: (() => void) | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  const blockGenerator = new BlockGenerator();
  const scoreCalculator = new ScoreCalculator();
  const difficultyEvaluator = new DifficultyEvaluator();
  const { logEvent } = useGameLogger();

  const initializeGame = () => {
    const { width, height, initialPieces } = DEFAULT_SETTINGS;
    const board = Array(height)
      .fill(0)
      .map(() => Array(width).fill(0));
    const currentPieces = blockGenerator.generateNextBlocks(board);

    set({
      board,
      currentPieces,
      score: 0,
      combo: 0,
      lastScoreResult: null,
      previewBlock: blockGenerator.getPreviewBlock(),
      placedPiecesCount: 0,
    });
  };

  const placePiece = (x: number, y: number) => {
    const { board, draggedPiece, currentPieces, placedPiecesCount } = get();
    
    if (!draggedPiece) return;

    // Проверяем валидность размещения
    if (!isValidPlacement(board, draggedPiece, x, y)) {
      return;
    }

    // Размещаем фигуру
    const newBoard = placeBlockOnBoard(board, draggedPiece, x, y);
    
    // Проверяем линии для очистки
    const linesToClear = getLinesToClear(newBoard);
    let newScore = get().score;
    let newCombo = get().combo;
    let clearedLines = 0;

    if (linesToClear.length > 0) {
      const clearedBoard = clearLines(newBoard, linesToClear);
      clearedLines = linesToClear.length;
      const scoreResult = scoreCalculator.calculateScore(clearedLines, newCombo, clearedBoard);
      newScore += scoreResult.score;
      newCombo = scoreResult.combo;
      
      set({ 
        board: clearedBoard,
        score: newScore,
        combo: newCombo,
        lastScoreResult: scoreResult
      });
    } else {
      set({ 
        board: newBoard,
        combo: 0,
        lastScoreResult: null
      });
    }

    // Обновляем текущие фигуры
    const newPlacedCount = placedPiecesCount + 1;
    const newCurrentPieces = currentPieces.filter(p => p.uniqueId !== draggedPiece.uniqueId);
    
    set({ 
      currentPieces: newCurrentPieces,
      placedPiecesCount: newPlacedCount,
      draggedPiece: null,
      dragPosition: null,
      hoverCell: null
    });

    // Проверяем завершение игры после размещения фигуры
    const finalBoard = linesToClear.length > 0 ? clearLines(newBoard, linesToClear) : newBoard;
    if (checkGameOver(finalBoard, newCurrentPieces)) {
      // Игра завершена - вызываем onGameOver
      setTimeout(() => {
        const { onGameOver } = get();
        if (onGameOver) {
          onGameOver();
        }
      }, 2000); // Небольшая задержка для завершения анимаций
      return;
    }

    // Генерируем новые фигуры только если разместили все 3 и это не повторная генерация
    if (newPlacedCount === 3 && newCurrentPieces.length === 0) {
      const blockGenerator = new BlockGenerator();
      const newBlocks = blockGenerator.generateNextBlocks(finalBoard);
      
      // Проверяем завершение игры после генерации новых фигур
      if (checkGameOver(finalBoard, newBlocks)) {
        set({ 
          currentPieces: newBlocks,
          previewBlock: blockGenerator.getPreviewBlock(),
          placedPiecesCount: 0
        });
        setTimeout(() => {
          const { onGameOver } = get();
          if (onGameOver) {
            onGameOver();
          }
        }, 100);
        return;
      }
      
      set({ 
        currentPieces: newBlocks,
        previewBlock: blockGenerator.getPreviewBlock(),
        placedPiecesCount: 0
      });
    }
  };

  const getLinesToClear = (board: number[][]): number[] => {
    const lines: number[] = [];

    // Проверяем горизонтальные линии
    for (let row = 0; row < board.length; row++) {
      let isLineComplete = true;
      for (let col = 0; col < board[0].length; col++) {
        if (board[row][col] === 0) {
          isLineComplete = false;
          break;
        }
      }
      if (isLineComplete) lines.push(row);
    }

    // Проверяем вертикальные линии
    for (let col = 0; col < board[0].length; col++) {
      let isLineComplete = true;
      for (let row = 0; row < board.length; row++) {
        if (board[row][col] === 0) {
          isLineComplete = false;
          break;
        }
      }
      if (isLineComplete) lines.push(board.length + col);
    }

    return lines;
  };

  const clearLines = (board: number[][], lines: number[]) => {
    // Очищаем горизонтальные линии
    lines
      .filter(line => line < board.length)
      .forEach(row => {
        for (let col = 0; col < board[0].length; col++) {
          board[row][col] = 0;
        }
      });

    // Очищаем вертикальные линии
    lines
      .filter(line => line >= board.length)
      .forEach(line => {
        const col = line - board.length;
        for (let row = 0; row < board.length; row++) {
          board[row][col] = 0;
        }
      });

    return board;
  };

  // Функция для проверки возможности размещения блока
  function canPlaceBlock(board: number[][], block: Block): boolean {
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[0].length; x++) {
        if (isValidPlacement(board, block, x, y)) {
          return true;
        }
      }
    }
    return false;
  }

  // Функция для проверки завершения игры
  function checkGameOver(board: number[][], currentPieces: Block[]): boolean {
    // Если нет фигур, игра не может быть завершена
    if (currentPieces.length === 0) {
      return false;
    }
    
    // Проверяем, можно ли разместить хотя бы одну из оставшихся фигур
    for (const piece of currentPieces) {
      if (canPlaceBlock(board, piece)) {
        return false; // Игра может продолжаться
      }
    }
    
    return true; // Ни одну фигуру нельзя разместить
  }

  return {
    board: [],
    currentPieces: [],
    score: 0,
    combo: 0,
    lastScoreResult: null,
    previewBlock: null,
    placedPiecesCount: 0,
    draggedPiece: null,
    dragPosition: null,
    hoverCell: null,
    validPositions: [],

    placePiece,
    startDrag: (piece: Block) => set({ draggedPiece: piece }),
    updateDrag: (x: number, y: number) =>
      set({ dragPosition: { x, y } }),
    endDrag: () => set({ draggedPiece: null }),
    setHoverCell: (x: number | null, y: number | null) =>
      set({ hoverCell: x !== null && y !== null ? { x, y } : null }),
    initializeGame,
    resetGame: () => {
      set({
        board: [],
        currentPieces: [],
        score: 0,
        combo: 0,
        lastScoreResult: null,
        previewBlock: null,
        placedPiecesCount: 0,
        draggedPiece: null,
        dragPosition: null,
        hoverCell: null,
        validPositions: [],
      });
      initializeGame();
    },
    setCurrentPieces: (pieces: Block[]) => set({ currentPieces: pieces }),
    setPreviewBlock: (block: Block | null) => set({ previewBlock: block }),
    onGameOver: null,
    setOnGameOver: (callback: (() => void) | null) => set({ onGameOver: callback }),
  };
}); 