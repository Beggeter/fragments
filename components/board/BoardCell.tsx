import React from "react";
import { Piece } from "../pieces/Piece";

const BoardCell = React.memo<{
  cell: any;
  x: number;
  y: number;
  highlight: boolean;
  isInClearingLine: boolean;
  isPotentiallyCleared: boolean;
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
    isFirst,
    cellRef,
    onClick,
  }) => {
    return (
      <div
        key={x}
        ref={isFirst ? cellRef : undefined}
        className={`rounded-[3px] ${
          cell.value ? "bg-gray-900" : "bg-gray-900"
        } ${highlight ? "ring-2 ring-blue-500" : ""} ${
          isInClearingLine ? "clearing-line-horizontal" : ""
        } ${isInClearingLine ? "clearing-line-vertical" : ""} ${
          isPotentiallyCleared ? "potential-clear-highlight" : ""
        }`}
        onClick={onClick}
      >
        {cell.value === 1 && cell.color && (
          <Piece color={cell.color} size="100%" isClearing={isInClearingLine} />
        )}
      </div>
    );
  }
);

export default BoardCell;