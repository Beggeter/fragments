import React, { useEffect, useState } from "react";
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

const EXPLODE_DISTANCE = 1; // 35% от размера клетки
const MINI_SIZES = [0.22, 0.28, 0.33, 0.35]; // разные размеры осколков, не более 35%

// Траектории: [dx, dy] в относительных координатах (от центра)
const explodeVectors = [
  [-EXPLODE_DISTANCE * 0.9, -EXPLODE_DISTANCE * 1.1], // ↖ чуть левее и выше
  [EXPLODE_DISTANCE * 1.1, -EXPLODE_DISTANCE * 0.8],  // ↗ чуть правее и выше
  [EXPLODE_DISTANCE * 0.8, EXPLODE_DISTANCE * 1.1],   // ↘ чуть правее и ниже
  [-EXPLODE_DISTANCE * 1.2, EXPLODE_DISTANCE * 0.7],  // ↙ чуть левее и ниже
];

const BoardClearAnimationsOverlay: React.FC<BoardClearAnimationsOverlayProps> = ({
  cells,
  cellSize,
  gap,
  boardRect,
}) => {
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
        <ExplosionCell key={cell.id} cell={cell} cellSize={cellSize} gap={gap} />
      ))}
    </div>
  );
};

const MINI_DELAY = 100; // задержка появления мини-клеток (мс)

const ExplosionCell: React.FC<{ cell: any; cellSize: number; gap: number }> = ({ cell, cellSize, gap }) => {
  const [showExplosion, setShowExplosion] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowExplosion(true), MINI_DELAY);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left: 4 + cell.x * (cellSize + gap),
        top: 4 + cell.y * (cellSize + gap),
        width: cellSize,
        height: cellSize,
        pointerEvents: "none",
      }}
    >
      {/* Основная клетка исчезает с анимацией, всегда строго cellSize */}
      {!showExplosion && (
        <div
          className="board-clear-main"
          style={{
            "--board-clear-delay": cell.delay ? `${cell.delay}s` : undefined,
          } as React.CSSProperties}
        >
          <Piece color={cell.color} size={cellSize} />
        </div>
      )}
      {/* Мини-клетки: стартуют с scale=1, быстро уменьшаются до MINI_SIZE, разлетаются и исчезают */}
      {showExplosion && [0,1,2,3].map(i => {
        const MINI_SIZE = MINI_SIZES[i];
        const [dx, dy] = explodeVectors[i];
        const endX = dx * cellSize;
        const endY = dy * cellSize;
        // Индивидуальная ротация для каждого осколка
        const startRot = [-25, 18, 30, -15][i];
        const deltaRot = [45, 60, 90, 70][i];
        return (
          <div
            key={`${cell.id}-${i}`}
            className="board-clear-mini"
            style={{
              "--board-clear-delay": cell.delay ? `${cell.delay}s` : undefined,
              "--explode-x": `${endX}px`,
              "--explode-y": `${endY}px`,
              "--explode-scale": MINI_SIZE,
              "--explode-rotate-start": `${startRot}deg`,
              "--explode-rotate-end": `${startRot + deltaRot}deg`,
            } as React.CSSProperties}
          >
            <Piece color={cell.color} size={cellSize} />
          </div>
        );
      })}
    </div>
  );
};

export type { AnimationCell };
export default BoardClearAnimationsOverlay; 