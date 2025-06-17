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
  }
>((set, get) => ({
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
    const { board, currentPieces, draggedPiece, round, piecesPlaced } = get();

    if (!draggedPiece) return;

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
      score: get().score + scoreResult.totalPoints,
      lastScoreResult: scoreResult,
      isAnimating: hasCellsToClear, // Set animation state if there are lines to clear
    });

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
}));
