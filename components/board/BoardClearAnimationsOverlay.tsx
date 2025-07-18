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

const ANIMATION_DURATION = 0.3; // seconds
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

const MAIN_ANIM_DURATION = 0.15; // исчезновение основной клетки (быстрее)
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
          style={{
            width: cellSize,
            height: cellSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `mainCellFadeOut_${cell.id} ${MAIN_ANIM_DURATION}s forwards`,
            animationDelay: cell.delay ? `${cell.delay}s` : undefined,
            willChange: 'transform, opacity',
          }}
        >
          <Piece color={cell.color} size={cellSize} />
          <style>{`
            @keyframes mainCellFadeOut_${cell.id} {
              0%   { opacity: 1; transform: scale(1); }
              60%  { opacity: 1; transform: scale(1.1); }
              100% { opacity: 0; transform: scale(0.8); }
            }
          `}</style>
        </div>
      )}
      {/* Мини-клетки: стартуют с scale=1, быстро уменьшаются до MINI_SIZE, разлетаются и исчезают */}
      {showExplosion && [0,1,2,3].map(i => {
        const MINI_SIZE = MINI_SIZES[i];
        const [dx, dy] = explodeVectors[i];
        const mini = MINI_SIZE * cellSize;
        const start = (cellSize - mini) / 2;
        const endX = dx * cellSize;
        const endY = dy * cellSize;
        // Индивидуальная ротация для каждого осколка
        const startRot = [-25, 18, 30, -15][i];
        const deltaRot = [45, 60, 90, 70][i];
        const animName = `explodeMiniPiece${i}_${cell.id}`;
        const keyframes = `@keyframes ${animName} {
          0%   { opacity: 1; transform: scale(1) translate(0px,0px) rotate(0deg); }
          30%  { opacity: 1; transform: scale(${MINI_SIZE}) translate(0px,0px) rotate(0deg); }
          100% { opacity: 0; transform: scale(${MINI_SIZE}) translate(${endX}px,${endY}px) rotate(${deltaRot}deg); }
        }`;
        return (
          <React.Fragment key={`${cell.id}-${i}`}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: cellSize,
                height: cellSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: "none",
                animation: `${animName} ${ANIMATION_DURATION}s forwards`,
                animationDelay: cell.delay ? `${cell.delay}s` : undefined,
                willChange: 'transform, opacity',
                transform: `rotate(${startRot}deg)`,
                opacity: 0,
              }}
            >
              <Piece color={cell.color} size={cellSize} />
            </div>
            <style>{keyframes}</style>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export type { AnimationCell };
export default BoardClearAnimationsOverlay; 