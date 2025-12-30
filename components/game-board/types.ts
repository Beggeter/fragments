import { Block, BlockColor, Matrix, Position } from '@/lib/data/types';

export interface GameBoardProps {
  width?: number;
  height?: number;
  onScoreUpdate: (score: number) => void;
  onGameOver: () => void;
  onExitGame: () => void;
  onBoardRectChange?: (rect: DOMRect | null) => void;
  clearedLine?: number | null;
  onGoHome?: () => void;
  isIntentionalRestart?: boolean;
  onRestartComplete?: () => void;
  onOpenShop?: () => void;
  onPieceReturnAnimation?: (animationData: PieceReturnAnimationPayload) => void;
  gameMode?: 'classic' | 'zen';
}

export interface PieceReturnAnimationPayload {
  piece: any;
  fromPosition: { x: number; y: number };
  targetRect: DOMRect | null;
  cellSize: number;
  gap: number;
}

export interface CellParticlesProps {
  x: number;
  y: number;
  trigger: boolean;
}

export type AnimationCell = {
  id: string;
  x: number;
  y: number;
  color: BlockColor;
  delay?: number;
};

export type HandlePiecePlacementArgs = {
  x: number;
  y: number;
  board: Matrix;
  draggedPiece: Block | null;
  hoverCell: { x: number; y: number } | null;
  width: number;
  placePiece: (x: number, y: number) => void;
  setClearingHorizontalLines: (lines: number[]) => void;
  setClearingVerticalLines: (lines: number[]) => void;
  setIsAnimating: (anim: boolean) => void;
  boardRect: DOMRect | null;
  dynamicCellSize: number;
  gapSizePx: number;
  useGameStore: any;
  onAfterPlacement?: (
    clearedCells: boolean[][],
    placedPiecePosition: Position,
    placedPiece: Block,
  ) => void;
  addClearAnimations?: (
    board: Matrix,
    cellsToClear: boolean[][],
    placedPieceColor?: BlockColor,
  ) => void;
};
