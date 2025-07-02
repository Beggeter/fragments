import React from "react";
import { Piece } from "../pieces/Piece";
import { BlockColor } from "../../lib/data/types";

interface AnimationCell {
  id: string;
  x: number;
  y: number;
  color: BlockColor;
  delay?: number; // индивидуальная задержка в секундах
}

interface BoardClearAnimationsOverlayProps {
  cells: AnimationCell[];
  cellSize: number;
  gap: number;
  boardRect: DOMRect | null;
}

const ANIMATION_DURATION = 0.18; // seconds

const BoardClearAnimationsOverlay: React.FC<BoardClearAnimationsOverlayProps> = ({
  cells,
  cellSize,
  gap,
  boardRect,
}) => {
  // boardRect больше не нужен, overlay всегда совпадает с grid
  return (
    <div style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: 900,
    }}>
      {cells.map(cell => (
        <div
          key={cell.id}
          style={{
            position: "absolute",
            left: 4 + cell.x * (cellSize + gap),
            top: 4 + cell.y * (cellSize + gap),
            width: cellSize,
            height: cellSize,
            transition: `opacity ${ANIMATION_DURATION}s, transform ${ANIMATION_DURATION}s, filter ${ANIMATION_DURATION}s`,
            opacity: 1,
            transform: "scale(1)",
            animation: `clearAnim ${ANIMATION_DURATION}s forwards`,
            animationDelay: cell.delay ? `${cell.delay}s` : undefined,
            willChange: "opacity, transform, filter",
          }}
        >
          <Piece color={cell.color} size={cellSize} />
        </div>
      ))}
      <style>{`
        @keyframes clearAnim {
          0%   { opacity: 1; transform: scale(1); filter: brightness(1); }
          20%  { opacity: 1; transform: scale(1.1); filter: brightness(1.5); }
          80%  { opacity: 1; transform: scale(1); filter: brightness(1); }
          100% { opacity: 0; transform: scale(0.7); filter: brightness(1); }
        }
      `}</style>
    </div>
  );
};

export type { AnimationCell };
export default BoardClearAnimationsOverlay; 