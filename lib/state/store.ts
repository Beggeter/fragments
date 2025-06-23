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
}

export interface GameSnapshot {
  board: Matrix;
  currentPieces: Block[];
  score: number;
  round: number;
  piecesPlaced: number;
  lastScoreResult: ScoreResult | null;
  previewBlock: Block | null;
  // можно добавить combo, draggedPiece и др. если нужно
}

const scoreCalculator = new ScoreCalculator();
const blockGenerator = new BlockGenerator();
const difficultyEvaluator = new DifficultyEvaluator();

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

  return scoreCalculator.calculateScore(
    clearedBoard,
    clearedLines,
    cellsPlaced,
    cellsInLines,
    piece
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
    history: GameSnapshot[];
    pushHistory: () => void;
    undo: () => void;
    isAdmin: boolean;
  }
>((set, get) => ({
  draggedPiece: null,
  dragPosition: null,
  lastScoreResult: null,
  previewBlock: null,
  blockEvaluations: [],
  history: [],
  isAdmin: true,

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

  setCurrentPieces: (pieces) => set({ currentPieces: pieces }),
  setPreviewBlock: (block) => set({ previewBlock: block }),

  initializeGame: () => {
    const blocksWithInitialIndex = blockGenerator.generateNextBlocks(
      get().board
    );
    set({
      currentPieces: blocksWithInitialIndex,
      previewBlock: blockGenerator.getPreviewBlock(),
      round: 1,
      piecesPlaced: 0,
    });
  },

  placePiece: (x: number, y: number) => {
    const state = get();
    if (!state.draggedPiece) return;
    if (state.isAdmin) get().pushHistory();

    const { board, currentPieces, draggedPiece, round, piecesPlaced } = state;

    // First, place the piece on the board without clearing lines
    const newBoard = placePieceOnBoard(board, draggedPiece, { x, y });
    const cellsToClear = getCellsToClear(newBoard, draggedPiece, { x, y });
    const hasCellsToClear = cellsToClear.some((row) =>
      row.some((cell) => cell)
    );

    // Calculate score and prepare for line clearing
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

    const newCurrentPieces = currentPieces.filter(
      (p) => p.uniqueId !== draggedPiece.uniqueId
    );

    // First update with the piece placed but not cleared
    set({
      board: newBoard, // Use newBoard instead of boardAfterClearing
      currentPieces: newCurrentPieces,
      draggedPiece: null,
      dragPosition: null,
      hoverCell: null,
      round: newRound,
      piecesPlaced: newPiecesPlaced,
      score: state.score + scoreResult.totalPoints,
      lastScoreResult: scoreResult,
      isAnimating: hasCellsToClear, // Set animation state if there are lines to clear
    });

    // Проверяем завершение игры после размещения фигуры
    const finalBoard = hasCellsToClear ? boardAfterClearing : newBoard;
    if (checkGameOver(finalBoard, newCurrentPieces)) {
      // Игра завершена
      setTimeout(() => {
        set({ gameOver: true });
        const { onGameOver } = get();

        if (onGameOver) {
          onGameOver();
        }
      }, 2000);
      return;
    }

    // If there are lines to clear, update the board after animation
    if (hasCellsToClear) {
      setTimeout(() => {
        set({
          board: boardAfterClearing,
          isAnimating: false,
        });
      }, 300); // Match the animation duration from CSS
    }

    // Handle new blocks if needed
    if (newPiecesPlaced === 0) {
      const newBlocks = blockGenerator.generateNextBlocks(boardAfterClearing);

      // Проверяем завершение игры после генерации новых фигур
      if (checkGameOver(boardAfterClearing, newBlocks)) {
        set({
          currentPieces: newBlocks,
          previewBlock: blockGenerator.getPreviewBlock(),
        });
        setTimeout(() => {
          set({ gameOver: true });
          const { onGameOver } = get();

          if (onGameOver) {
            onGameOver();
          }
        }, 2000);
        return;
      }

      set({
        currentPieces: newBlocks,
        previewBlock: blockGenerator.getPreviewBlock(),
      });
    }
  },

  resetGame: () => {
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
    });
    scoreCalculator.resetCombo();
  },

  hoverCell: null,
  setHoverCell: (cell: { x: number; y: number } | null) =>
    set({ hoverCell: cell }),

  onGameOver: null,
  setOnGameOver: (callback: (() => void) | null) =>
    set({ onGameOver: callback }),

  pushHistory: () => {
    const state = get();
    const snapshot: GameSnapshot = {
      board: state.board.map(row => row.map(cell => ({ ...cell }))),
      currentPieces: [...state.currentPieces],
      score: state.score,
      round: state.round,
      piecesPlaced: state.piecesPlaced,
      lastScoreResult: state.lastScoreResult,
      previewBlock: state.previewBlock,
    };
    set({ history: [...state.history, snapshot] });
  },

  undo: () => {
    const state = get();
    if (state.history.length === 0) return;
    
    const lastSnapshot = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    
    set({
      board: lastSnapshot.board,
      currentPieces: lastSnapshot.currentPieces,
      score: lastSnapshot.score,
      round: lastSnapshot.round,
      piecesPlaced: lastSnapshot.piecesPlaced,
      lastScoreResult: lastSnapshot.lastScoreResult,
      previewBlock: lastSnapshot.previewBlock,
      history: newHistory,
      draggedPiece: null,
      dragPosition: null,
      hoverCell: null,
    });
  },

}));
