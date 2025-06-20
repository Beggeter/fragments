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
      >
        {cell.value === 1 && cell.color && (
          <Piece color={cell.color} size="100%" isClearing={isInClearingLine} />
        )}
      </div>
    );
  }
);

export default BoardCell;