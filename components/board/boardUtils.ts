import { Block, Position } from "../../lib/data/types";
import { placeBlock } from "../../lib/core/engine";

export function calculatePotentialClearLines(
  board: any[][],
  piece: Block,
  position: Position,
  width: number,
  height: number
): boolean[][] {
  if (!position) return [];

  // Создаем временную копию доски
  const tempBoard = board.map((row) => [...row]);

  // Размещаем фигуру на временной доске
  piece.matrix.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell.value === 1) {
        const boardY = position.y + y;
        const boardX = position.x + x;
        if (
          boardY >= 0 &&
          boardY < height &&
          boardX >= 0 &&
          boardX < width
        ) {
          tempBoard[boardY][boardX] = { value: 1, color: piece.color };
        }
      }
    });
  });

  // Оптимизированная проверка линий
  const horizontalLines = new Array(height).fill(false);
  const verticalLines = new Array(width).fill(false);

  // Проверяем горизонтальные линии
  for (let y = 0; y < height; y++) {
    horizontalLines[y] = tempBoard[y].every((cell) => cell.value === 1);
  }

  // Проверяем вертикальные линии
  for (let x = 0; x < width; x++) {
    verticalLines[x] = tempBoard.every((row) => row[x].value === 1);
  }

  // Создаем матрицу подсветки только если есть линии для очистки
  const hasLinesToClear =
    horizontalLines.some((line) => line) ||
    verticalLines.some((line) => line);
  if (!hasLinesToClear) return [];

  const highlightMatrix = tempBoard.map((row, y) => {
    return row.map((_, x) => {
      return horizontalLines[y] || verticalLines[x];
    });
  });

  return highlightMatrix;
}

export function handlePiecePlacement({
  x,
  y,
  board,
  draggedPiece,
  hoverCell,
  width,
  placePiece,
  setClearingHorizontalLines,
  setClearingVerticalLines,
  setIsAnimating,
  boardRect,
  dynamicCellSize,
  GAP_SIZE_PX,
  useGameStore,
  onAfterPlacement,
  addClearAnimations,
}: {
  x: number;
  y: number;
  board: any[][];
  draggedPiece: any;
  hoverCell: any;
  width: number;
  placePiece: (x: number, y: number) => void;
  setClearingHorizontalLines: (lines: number[]) => void;
  setClearingVerticalLines: (lines: number[]) => void;
  setIsAnimating: (anim: boolean) => void;
  boardRect: DOMRect | null;
  dynamicCellSize: number;
  GAP_SIZE_PX: number;
  useGameStore: any;
  onAfterPlacement?: (clearedCells: boolean[][], placedPiecePosition: Position, placedPiece: Block) => void;
  addClearAnimations?: (board: any[][], cellsToClear: boolean[][], placedPieceColor?: import("../../lib/data/types").BlockColor) => void;
}) {
  if (draggedPiece && hoverCell) {
    const getCellsToClear = require("@/lib/core/engine").getCellsToClear;
    // Сначала размещаем фигуру на временной доске
    const tempBoard = require("@/lib/core/engine").placeBlock(board, draggedPiece, hoverCell);
    const cellsToClear = getCellsToClear(tempBoard, draggedPiece, hoverCell);
    if (addClearAnimations) addClearAnimations(tempBoard, cellsToClear, draggedPiece.color);
    placePiece(x, y);
    // --- Добавляем вычисление pixelPosition только если есть очищаемые линии ---
    const hasCellsToClear = cellsToClear.some((row: any[]) => row.some((cell: any) => cell));
    if (hasCellsToClear) {
      setTimeout(() => {
        const { lastScoreResult } = useGameStore.getState();
        if (
          lastScoreResult &&
          boardRect &&
          dynamicCellSize &&
          hoverCell
        ) {
          const pixelX = hoverCell.x * (dynamicCellSize + GAP_SIZE_PX);
          const pixelY = hoverCell.y * (dynamicCellSize + GAP_SIZE_PX);
          lastScoreResult.pixelPosition = { x: pixelX, y: pixelY };
          useGameStore.setState({ lastScoreResult: { ...lastScoreResult } });
        }
      }, 0);
    }
    // --- конец блока pixelPosition ---
    if (onAfterPlacement) onAfterPlacement(cellsToClear, hoverCell, draggedPiece);
  }
} 