import React from "react";
import { Piece } from "../pieces/Piece";

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
        className={`rounded-[3px] relative ${
          cell.value ? "bg-gray-900" : "bg-gray-900"
        } ${
          isInClearingLine ? "clearing-line-horizontal" : ""
        } ${isInClearingLine ? "clearing-line-vertical" : ""
        } ${
          isPotentiallyCleared ? "potential-clear-highlight" : ""
        }`}
        onClick={onClick}
      >
        {cell.value === 1 && displayColor && (
          <Piece color={displayColor} size="100%" isClearing={isInClearingLine} />
        )}
        
        {/* Показываем полупрозрачную фигуру-превью */}
        {showPreviewPiece && previewPieceColor && (
          <div className="absolute inset-0 z-10">
            <Piece 
              color={previewPieceColor} 
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