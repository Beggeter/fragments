import { Block, Position } from "../../lib/data/types";

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
  onAfterPlacement?: () => void;
}) {
  if (draggedPiece && hoverCell) {
    const getCellsToClear = require("@/lib/core/engine").getCellsToClear;
    const cellsToClear = getCellsToClear(board, draggedPiece, hoverCell);
    const hasCellsToClear = cellsToClear.some((row: any[]) =>
      row.some((cell: any) => cell)
    );

    if (hasCellsToClear) {
      // Находим горизонтальные линии
      const horizontalLines = cellsToClear
        .map((row: any[], index: number) => (row.every((cell: any) => cell) ? index : -1))
        .filter((index: number) => index !== -1);

      // Находим вертикальные линии
      const verticalLines = Array(width)
        .fill(0)
        .map((_: any, colIndex: number) => {
          const isFullLine = cellsToClear.every((row: any[]) => row[colIndex]);
          return isFullLine ? colIndex : -1;
        })
        .filter((index: number) => index !== -1);

      // Сначала размещаем фигуру
      placePiece(x, y);
      // Затем запускаем анимацию
      requestAnimationFrame(() => {
        setClearingHorizontalLines(horizontalLines);
        setClearingVerticalLines(verticalLines);
        setIsAnimating(true);

        // Очищаем состояния анимации через некоторое время
        setTimeout(() => {
          setClearingHorizontalLines([]);
          setClearingVerticalLines([]);
          setIsAnimating(false);
          if (onAfterPlacement) onAfterPlacement();
        }, 300);
      });

      setTimeout(() => {
        const { lastScoreResult } = useGameStore.getState();
        if (lastScoreResult && boardRect && dynamicCellSize) {
          const pixelX = hoverCell.x * (dynamicCellSize + GAP_SIZE_PX);
          const pixelY = hoverCell.y * (dynamicCellSize + GAP_SIZE_PX);
          lastScoreResult.pixelPosition = { x: pixelX, y: pixelY };
          useGameStore.setState({ lastScoreResult: { ...lastScoreResult } });
        }
      }, 0);
    } else {
      placePiece(x, y);
      if (onAfterPlacement) onAfterPlacement();
    }
  }
} 