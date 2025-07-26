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
  potentialClearColor: string | null;
  showPreviewPiece: boolean;
  previewPieceColor: string | null;
} {
  let highlight = false;
  let isInClearingLine = false;
  let isPotentiallyCleared = false;
  let potentialClearColor: string | null = null;
  let showPreviewPiece = false;
  let previewPieceColor: string | null = null;

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
      const pieceCell = pieceMatrix[pieceY][pieceX];
      if (pieceCell.value === 1) {
        showPreviewPiece = true;
        previewPieceColor = draggedPiece.color;
      }
    }
  }

  if (potentialClearHighlight[y]?.[x]) {
    isPotentiallyCleared = true;
    potentialClearColor = draggedPiece?.color || null;
  }
  isInClearingLine =
    clearingHorizontalLines.includes(y) || clearingVerticalLines.includes(x);

  return {
    highlight,
    isInClearingLine,
    isPotentiallyCleared,
    potentialClearColor,
    showPreviewPiece,
    previewPieceColor,
  };
}
