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
        className={`rounded-[3px] ${
          cell.value ? "bg-gray-900" : "bg-gray-900"
        } ${highlight ? "ring-2 ring-blue-500" : ""} ${
          isInClearingLine ? "clearing-line-horizontal" : ""
        } ${isInClearingLine ? "clearing-line-vertical" : ""}`}
        onClick={onClick}
      >
        {cell.value === 1 && displayColor && (
          <Piece color={displayColor} size="100%" isClearing={isInClearingLine} />
        )}
      </div>
    );
  }
);

export default BoardCell;