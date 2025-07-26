import { create } from "zustand";
import {
  Block,
  GameState,
  Position,
  ScoreResult,
  Matrix,
  Cell,
} from "../data/types";
import {
  placeBlock,
  clearLines,
  isGameOver,
  getCellsToClear,
} from "../core/engine";
import { calculateValidPositions } from "../core/positions";
import { ScoreCalculator } from "../core/score";
import { BlockGenerator } from "../core/blockGenerator";
import { DifficultyEvaluator } from "../core/difficulty";
import { DifficultyManager } from "../core/difficultyManager";

export interface ExtendedGameState extends GameState {
  round: number;
  piecesPlaced: number;
  validPositions: Position[];
  isAnimating: boolean;
  setAnimating: (isAnimating: boolean) => void;
  previewBlock: Block | null;
  blockEvaluations: Array<{ difficulty: number; scorePotential: number }>;
  setCurrentPieces: (pieces: Block[]) => void;
  setPreviewBlock: (block: Block | null) => void;
  scoreDisplayCoords?: { x: number; y: number } | null;
  onGameOver: (() => void) | null;
  setOnGameOver: (callback: (() => void) | null) => void;
  restoreGameState: (state: {
    board: Cell[][];
    currentPieces: Block[];
    score: number;
    combo: number;
    placedPiecesCount: number;
  }) => void;
  // Новые поля для системы сложности
  playerRecord: number;
  currentLevel: number;
  levelName: string;
  levelDescription: string;
  progressToNextLevel: number;
  nextLevelThreshold: number;
  isRecordBreakerMode: boolean;
  updatePlayerRecord: (newRecord: number) => void;
  getLevelInfo: () => {
    level: number;
    name: string;
    description: string;
    progress: number;
    nextThreshold: number;
    isRecordBreaker: boolean;
  };
}

const scoreCalculator = new ScoreCalculator();
const blockGenerator = new BlockGenerator();
const difficultyEvaluator = new DifficultyEvaluator();
const difficultyManager = new DifficultyManager();

const placePieceOnBoard = (
  board: Matrix,
  piece: Block,
  position: Position
): Matrix => {
  const newBoard = board.map((row) => [...row]);
  piece.matrix.forEach((row, dy) => {
    row.forEach((cell, dx) => {
      if (cell.value === 1) {
        newBoard[position.y + dy][position.x + dx] = {
          value: 1,
          color: piece.color,
        };
      }
    });
  });
  return newBoard;
};

const calculateScore = (
  newBoard: Matrix,
  oldBoard: Matrix,
  piece: Block,
  cellsToClear: boolean[][],
  position: Position
): ScoreResult => {
  const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard);
  const cellsPlaced = piece.matrix.reduce(
    (sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell.value, 0),
    0
  );
  const cellsInLines = cellsToClear.reduce((sum, row, y) => {
    return (
      sum +
      row.reduce((rowSum, cell, x) => {
        if (cell) {
          const relX = x - position.x;
          const relY = y - position.y;
          if (
            relY >= 0 &&
            relY < piece.matrix.length &&
            relX >= 0 &&
            relX < piece.matrix[0].length &&
            piece.matrix[relY][relX].value === 1
          ) {
            return rowSum + 1;
          }
        }
        return rowSum;
      }, 0)
    );
  }, 0);

  // Получаем модификаторы сложности
  const modifiers = difficultyManager.getModifiers();

  return scoreCalculator.calculateScore(
    clearedBoard,
    clearedLines,
    cellsPlaced,
    cellsInLines,
    piece,
    {
      scoreMultiplier: modifiers.scoreMultiplier,
      comboMultiplier: modifiers.comboMultiplier
    }
  );
};

// Функция для проверки возможности размещения блока
const canPlaceBlock = (board: Matrix, block: Block): boolean => {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      // Проверяем, можно ли разместить блок в позиции (x, y)
      const canPlace = block.matrix.every((row, dy) => {
        return row.every((cell, dx) => {
          if (cell.value === 1) {
            const boardX = x + dx;
            const boardY = y + dy;
            return (
              boardX >= 0 &&
              boardX < board[0].length &&
              boardY >= 0 &&
              boardY < board.length &&
              board[boardY][boardX].value === 0
            );
          }
          return true;
        });
      });

      if (canPlace) {
        return true;
      }
    }
  }
  return false;
};

// Функция для проверки завершения игры
const checkGameOver = (board: Matrix, currentPieces: Block[]): boolean => {
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
};

// --- Zustand Store ---
export const useGameStore = create<
  ExtendedGameState & {
    placePiece: (x: number, y: number) => void;
    resetGame: () => void;
    draggedPiece: Block | null;
    dragPosition: { x: number; y: number } | null;
    startDrag: (block: Block) => void;
    updateDrag: (position: { x: number; y: number }) => void;
    endDrag: () => void;
    hoverCell: { x: number; y: number } | null;
    setHoverCell: (cell: { x: number; y: number } | null) => void;
    initializeGame: () => void;
    justGeneratedPieces: boolean;
    setJustGeneratedPieces: (value: boolean) => void;
  }
>((set, get) => {
  // Вспомогательная функция для обработки завершения игры
  const handleGameOver = (delay: number = 1500) => {
    setTimeout(() => {
      set({ gameOver: true });
      const { onGameOver } = get();
      if (onGameOver) {
        onGameOver();
      }
    }, delay);
  };

  return {
    draggedPiece: null,
    dragPosition: null,
    lastScoreResult: null,
    previewBlock: null,
    blockEvaluations: [],

    startDrag: (block) => {
      const { board } = get();
      const validPositions = calculateValidPositions(board, block);
      set({ draggedPiece: block, validPositions });
    },
    updateDrag: (position) => set({ dragPosition: position }),
    endDrag: () => set({ draggedPiece: null, dragPosition: null }),

    board: Array(8)
      .fill(0)
      .map(() => Array(8).fill({ value: 0 })),
    currentPieces: [],
    score: 0,
    gameOver: false,
    round: 1,
    piecesPlaced: 0,
    validPositions: [],
    isAnimating: false,
    setAnimating: (isAnimating) => set({ isAnimating }),

    // Поля для системы сложности
    playerRecord: 0,
    currentLevel: 1,
    levelName: "Новичок",
    levelDescription: "Простое начало для изучения механик",
    progressToNextLevel: 0,
    nextLevelThreshold: 10000,
    isRecordBreakerMode: false,

    setCurrentPieces: (pieces) => set({ currentPieces: pieces }),
    setPreviewBlock: (block) => set({ previewBlock: block }),

    updatePlayerRecord: (newRecord: number) => {
      difficultyManager.updatePlayerRecord(newRecord);
      set({ playerRecord: newRecord });
    },

    getLevelInfo: () => {
      const { score } = get();
      return difficultyManager.getLevelInfo(score);
    },

    initializeGame: () => {
      const blocksWithInitialIndex = blockGenerator.generateNextBlocks(
        get().board
      );
      set({
        currentPieces: blocksWithInitialIndex,
        previewBlock: blockGenerator.getPreviewBlock(),
        round: 1,
        piecesPlaced: 0,
        justGeneratedPieces: true,
      });
      setTimeout(() => set({ justGeneratedPieces: false }), 500);
    },

    placePiece: (x: number, y: number) => {
      const { board, currentPieces, draggedPiece, round, piecesPlaced } = get();

      if (!draggedPiece) return;

      // Размещаем фигуру на доске без очистки линий
      const newBoard = placePieceOnBoard(board, draggedPiece, { x, y });
      const cellsToClear = getCellsToClear(newBoard, draggedPiece, { x, y });
      const hasCellsToClear = cellsToClear.some((row) =>
        row.some((cell) => cell)
      );

      // Вычисляем очки и подготавливаем очистку линий
      const scoreResult = calculateScore(
        newBoard,
        board,
        draggedPiece,
        cellsToClear,
        { x, y }
      );
      const { newBoard: boardAfterClearing } = clearLines(newBoard);

      const newRound = piecesPlaced + 1 >= 3 ? round + 1 : round;
      const newPiecesPlaced = piecesPlaced + 1 >= 3 ? 0 : piecesPlaced + 1;

      console.log('Removing piece with uniqueId:', draggedPiece.uniqueId);
      console.log('Current pieces before removal:', currentPieces.map(p => ({ id: p.id, uniqueId: p.uniqueId })));
      
      const newCurrentPieces = currentPieces.filter(
        (p) => p.uniqueId !== draggedPiece.uniqueId
      );
      
      console.log('Current pieces after removal:', newCurrentPieces.map(p => ({ id: p.id, uniqueId: p.uniqueId })));

      // Первое обновление с размещенной фигурой, но без очистки линий
      const newScore = get().score + scoreResult.totalPoints;
      
      // Обновляем сложность на основе новых очков
      const levelChanged = blockGenerator.updateDifficulty(newScore);
      const levelInfo = difficultyManager.getLevelInfo(newScore);
      
      set({
        board: newBoard, // Используем newBoard вместо boardAfterClearing
        currentPieces: newCurrentPieces,
        draggedPiece: null,
        dragPosition: null,
        hoverCell: null,
        round: newRound,
        piecesPlaced: newPiecesPlaced,
        score: newScore,
        lastScoreResult: scoreResult,
        isAnimating: hasCellsToClear, // Устанавливаем состояние анимации если есть линии для очистки
        // Обновляем информацию о сложности
        currentLevel: levelInfo.level,
        levelName: levelInfo.name,
        levelDescription: levelInfo.description,
        progressToNextLevel: levelInfo.progress,
        nextLevelThreshold: levelInfo.nextThreshold,
        isRecordBreakerMode: levelInfo.isRecordBreaker,
      });

      // Если есть линии для очистки, обновляем доску после анимации
      if (hasCellsToClear) {
        set({
          board: boardAfterClearing,
          isAnimating: false,
        });

        // Проверяем завершение игры ПОСЛЕ очистки линий
        if (checkGameOver(boardAfterClearing, newCurrentPieces)) {
          handleGameOver();
          return;
        }
      } else {
        // Если нет линий для очистки, проверяем Game Over сразу
        if (checkGameOver(newBoard, newCurrentPieces)) {
          handleGameOver();
          return;
        }
      }

      // Генерируем новые фигуры СРАЗУ, если разместили все 3
      if (newPiecesPlaced === 0) {
        const finalBoard = hasCellsToClear ? boardAfterClearing : newBoard;
        const newBlocks = blockGenerator.generateNextBlocks(finalBoard);

        // Проверяем завершение игры после генерации новых фигур
        if (checkGameOver(finalBoard, newBlocks)) {
          set({
            currentPieces: newBlocks,
            previewBlock: blockGenerator.getPreviewBlock(),
            justGeneratedPieces: true,
          });
          setTimeout(() => set({ justGeneratedPieces: false }), 500);
          return;
        }

        console.log('Generated new blocks:', newBlocks.map(b => ({ id: b.id, uniqueId: b.uniqueId })));
        set({
          currentPieces: newBlocks,
          previewBlock: blockGenerator.getPreviewBlock(),
          justGeneratedPieces: true,
        });
        setTimeout(() => set({ justGeneratedPieces: false }), 500);
      }
    },

    resetGame: () => {
      // Сбрасываем сложность
      blockGenerator.updateDifficulty(0);
      const levelInfo = difficultyManager.getLevelInfo(0);
      
      set({
        board: Array(8)
          .fill(0)
          .map(() => Array(8).fill({ value: 0 })),
        currentPieces: [],
        score: 0,
        gameOver: false,
        round: 1,
        piecesPlaced: 0,
        validPositions: [],
        draggedPiece: null,
        dragPosition: null,
        lastScoreResult: null,
        previewBlock: null,
        blockEvaluations: [],
        // Сбрасываем информацию о сложности
        currentLevel: levelInfo.level,
        levelName: levelInfo.name,
        levelDescription: levelInfo.description,
        progressToNextLevel: levelInfo.progress,
        nextLevelThreshold: levelInfo.nextThreshold,
        isRecordBreakerMode: levelInfo.isRecordBreaker,
      });
      scoreCalculator.resetCombo();
    },

    hoverCell: null,
    setHoverCell: (cell: { x: number; y: number } | null) =>
      set({ hoverCell: cell }),

    onGameOver: null,
    setOnGameOver: (callback: (() => void) | null) =>
      set({ onGameOver: callback }),
    
    restoreGameState: (state) => {
      // Board уже содержит Cell[][] с цветами, используем как есть
      const boardWithColors = state.board;
      
      // Убеждаемся, что у всех фигур есть правильные цвета и uniqueId
      const fixedPieces = state.currentPieces.map((piece, index) => ({
        ...piece,
        color: piece.color || 'red', // fallback цвет если цвет потерялся
        uniqueId: piece.uniqueId || `${piece.id}_${Date.now()}_${index}`,
      }));
      
      // Обновляем сложность на основе восстановленных очков
      blockGenerator.updateDifficulty(state.score);
      const levelInfo = difficultyManager.getLevelInfo(state.score);
      
      set({
        board: boardWithColors,
        currentPieces: fixedPieces,
        score: state.score,
        piecesPlaced: state.placedPiecesCount,
        gameOver: false,
        draggedPiece: null,
        dragPosition: null,
        hoverCell: null,
        lastScoreResult: null,
        // Восстанавливаем информацию о сложности
        currentLevel: levelInfo.level,
        levelName: levelInfo.name,
        levelDescription: levelInfo.description,
        progressToNextLevel: levelInfo.progress,
        nextLevelThreshold: levelInfo.nextThreshold,
        isRecordBreakerMode: levelInfo.isRecordBreaker,
      });
    },
    justGeneratedPieces: false,
    setJustGeneratedPieces: (value) => set({ justGeneratedPieces: value }),
  };
});
