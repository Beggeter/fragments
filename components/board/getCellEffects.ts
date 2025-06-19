export function getCellEffects({
  x,
  y,
  draggedPiece,
  hoverCell,
  potentialClearHighlight,
  clearingHorizontalLines,
  clearingVerticalLines,
}: {
  x: number;
  y: number;
  draggedPiece: any;
  hoverCell: any;
  potentialClearHighlight: boolean[][];
  clearingHorizontalLines: number[];
  clearingVerticalLines: number[];
}): {
  highlight: boolean;
  isInClearingLine: boolean;
  isPotentiallyCleared: boolean;
} {
  let highlight = false;
  let isInClearingLine = false;
  let isPotentiallyCleared = false;

  if (draggedPiece && hoverCell) {
    const pieceMatrix = draggedPiece.matrix;
    const pieceX = x - hoverCell.x;
    const pieceY = y - hoverCell.y;

    if (
      pieceY >= 0 &&
      pieceY < pieceMatrix.length &&
      pieceX >= 0 &&
      pieceX < pieceMatrix[0].length
    ) {
      highlight = pieceMatrix[pieceY][pieceX].value === 1;
    }
  }

  if (potentialClearHighlight[y]?.[x]) {
    isPotentiallyCleared = true;
  }
  isInClearingLine =
    clearingHorizontalLines.includes(y) ||
    clearingVerticalLines.includes(x);

  return { highlight, isInClearingLine, isPotentiallyCleared };
} 