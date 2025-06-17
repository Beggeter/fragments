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
  
}

export const DraggablePiece: React.FC<DraggablePieceProps> = ({
  piece,
  isGhost = false,
  style,
  originalSize = 32,
  ghostSize = 44,
}) => {
  if (!piece || !piece.matrix) {
    return null;
  }

  const baseClasses = `grid gap-0.5  ${
    isGhost ? "pointer-events-none " : "cursor-pointer drop-shadow-[5px_5px_2px_rgba(0,0,0,0.2)]"
  }`;
  const containerClasses = isGhost
    ? "fixed z-[1000] opacity-70 transition-transform duration-200"
    : `rounded-lg transition-all opacity-in-animation cursor-pointer touch-manipulation`;

  return (
    <div
      className={containerClasses}
      style={style}
    >
      <div className={baseClasses}>
        {piece.matrix.map((row, y) => (
          <div key={y} className="flex gap-0.5">
            {row.map((cell, x) =>
              cell.value === 1 ? (
                <Piece
                  key={`${x}-${y}`}
                  color={piece.color}
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
