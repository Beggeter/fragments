import React from "react";
import { Piece } from "../pieces/Piece";
import { BlockColor } from "../../lib/data/types";

const BoardCell = React.memo<{
  cell: any;
  x: number;
  y: number;
  highlight: boolean;
  isInClearingLine: boolean;
  isPotentiallyCleared: boolean;
  potentialClearColor: string | null;
  showPreviewPiece: boolean;
  previewPieceColor: string | null;
  isFirst: boolean;
  cellRef: React.RefObject<HTMLDivElement | null>;
  onClick?: () => void;
  isPotentiallyBombed?: boolean; 
  isBombShaking?: boolean; 
}>(
  ({
    cell,
    x,
    y,
    highlight,
    isInClearingLine,
    isPotentiallyCleared,
    potentialClearColor,
    showPreviewPiece,
    previewPieceColor,
    isFirst,
    cellRef,
    onClick,
    isPotentiallyBombed,
    isBombShaking,
  }) => {
    // Определяем цвет для отображения фигуры
    let displayColor = cell.color;

    // Если фигура в линии для очистки и есть цвет размещаемой фигуры, используем его
    if (isPotentiallyCleared && potentialClearColor && cell.value === 1) {
      displayColor = potentialClearColor;
    }

    return (
      <div
        key={x}
        ref={isFirst ? cellRef : undefined}
        className={`rounded-[3px] z-2  relative ${
          cell.value ? "bg-gray-900" : "bg-gray-900"
        } ${isPotentiallyCleared ? "potential-clear-highlight" : ""} 
        ${
          isPotentiallyBombed
            ? "potential-bomb-highlight animate-pulse-bomb"
            : ""
        } 
        ${cell.value && isBombShaking ? "bomb-shake" : ""}`}
        onClick={onClick}
      >
        {cell.value === 1 && displayColor && (
          <Piece color={displayColor} size="100%" isClearing={false} />
        )}

        {/* Показываем полупрозрачную фигуру-превью */}
        {showPreviewPiece && previewPieceColor && (
          <div className="absolute inset-0 z-10">
            <Piece
              color={previewPieceColor as BlockColor}
              size="100%"
              isClearing={false}
              isPreview={true}
            />
          </div>
        )}
      </div>
    );
  }
);

export default BoardCell;
