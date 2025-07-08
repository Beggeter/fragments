import React from "react";
import { Block } from "../lib/data/types";
import { Piece } from "./pieces/Piece";

interface DraggablePieceProps {
  piece: Block;
  originalSize?: number;
  ghostSize?: number;
  isGhost?: boolean;
  isDragged?: boolean;
  onStart?: (piece: Block, x: number, y: number) => void;
  style?: React.CSSProperties;
  onTransitionEnd?: () => void;
}

export const DraggablePiece: React.FC<DraggablePieceProps> = ({
  piece,
  isGhost = false,
  style,
  originalSize = 32,
  ghostSize = 44,
  onTransitionEnd,
}) => {
  if (!piece || !piece.matrix) {
    console.warn('DraggablePiece: missing piece or matrix', { piece });
    return null;
  }

  // Убеждаемся, что у фигуры есть цвет
  const pieceColor = piece.color || 'red';

  // Отладочная информация
  console.log('DraggablePiece rendering:', {
    pieceId: piece.id,
    pieceColor,
    matrixSize: `${piece.matrix.length}x${piece.matrix[0]?.length}`,
    matrixSample: piece.matrix.slice(0, 2).map(row => row.slice(0, 2)),
    hasValue1: piece.matrix.some(row => row.some(cell => cell.value === 1)),
  });

  const baseClasses = `grid gap-0.5  ${
    isGhost ? "pointer-events-none drop-shadow-[5px_5px_2px_rgba(0,0,0,0.3)]" : "cursor-pointer drop-shadow-[5px_5px_2px_rgba(0,0,0,0.2)]"
  }`;
  const containerClasses = isGhost
    ? "fixed z-[1000] opacity-100 transition-transform duration-200"
    : `rounded-lg transition-all opacity-in-animation cursor-pointer touch-manipulation`;

  return (
    <div
      className={containerClasses}
      style={style}
      onTransitionEnd={onTransitionEnd}
    >
      <div className={baseClasses}>
        {piece.matrix.map((row, y) => (
          <div key={y} className="flex gap-0.5">
            {row.map((cell, x) =>
              cell.value === 1 ? (
                <Piece
                  key={`${x}-${y}`}
                  color={pieceColor}
                  size={isGhost ? ghostSize : originalSize}
                />
              ) : (
                <div
                  key={`${x}-${y}`}
                  style={{
                    width: isGhost ? ghostSize : originalSize,
                    height: isGhost ? ghostSize : originalSize,
                  }}
                />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
