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
  animateAppear?: boolean;
}

export const DraggablePiece: React.FC<DraggablePieceProps> = ({
  piece,
  isGhost = false,
  style,
  originalSize = 32,
  ghostSize = 44,
  onTransitionEnd,
  animateAppear = false,
}) => {
  //   pieceId: piece?.id,
  //   pieceUniqueId: piece?.uniqueId,
  //   hasMatrix: !!piece?.matrix,
  //   matrixSize: piece?.matrix ? `${piece.matrix.length}x${piece.matrix[0]?.length}` : 'N/A',
  //   pieceColor: piece?.color,
  // });
  
  if (!piece || !piece.matrix) {
    return null;
  }

  // Убеждаемся, что у фигуры есть цвет
  const pieceColor = piece.color || 'red';

  // Отладочная информация
  //   pieceId: piece.id,
  //   pieceColor,
  //   matrixSize: `${piece.matrix.length}x${piece.matrix[0]?.length}`,
  //   matrixSample: piece.matrix.slice(0, 2).map(row => row.slice(0, 2)),
  //   hasValue1: piece.matrix.some(row => row.some(cell => cell.value === 1)),
  // });

  const baseClasses = `grid gap-0.5  ${
    isGhost ? "pointer-events-none drop-shadow-[5px_5px_2px_rgba(0,0,0,0.3)]" : "cursor-pointer drop-shadow-[5px_5px_2px_rgba(0,0,0,0.2)]"
  }`;
  const containerClasses = isGhost
    ? "fixed z-[1000] opacity-100 transition-transform duration-200"
    : `rounded-lg transition-all  cursor-pointer touch-manipulation  ${animateAppear ? "animate-appear" : ""}`;

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
