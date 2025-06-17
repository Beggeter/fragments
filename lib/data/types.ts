export type BlockColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface Cell {
  value: number;
  color?: BlockColor;
}

export type Matrix = Cell[][];

export interface Block {
  id: string;
  uniqueId: string;
  name: string;
  matrix: Matrix;
  difficulty: 'easy' | 'medium' | 'hard';
  FIGURE_TO_OFTEN?: number;
  color: BlockColor;
  initialIndex?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface ScoreResult {
  clearedLines: number;
  cellsPlaced: number;
  placedBlocksPoints: number;
  clearedLinesPoints: number;
  clearedBlocksPoints: number;
  comboLevel: number;
  comboBonus: number;
  isBoardCleared: boolean;
  totalPoints: number;
  movesSinceLastSuccess: number;
  pixelPosition?: { x: number; y: number };
}

export interface GameState {
  board: Matrix;
  currentPieces: Block[];
  score: number;
  gameOver: boolean;
  draggedPiece: Block | null;
  lastScoreResult: ScoreResult | null;
}

export const BLOCK_COLORS: BlockColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export type Board = Cell[][];
