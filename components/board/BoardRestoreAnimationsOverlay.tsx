import React, { useEffect, useState } from "react";
import { Piece } from "../pieces/Piece";
import { BlockColor } from "../../lib/data/types";

interface RestoreAnimationCell {
  id: string;
  x: number;
  y: number;
  color: BlockColor;
  delay?: number; // индивидуальная задержка в секундах
}

interface BoardRestoreAnimationsOverlayProps {
  cells: RestoreAnimationCell[];
  cellSize: number;
  gap: number;
  boardRect: DOMRect | null;
}

const ANIMATION_DURATION = 0.4; // seconds - чуть дольше чем удаление
const EXPLODE_DISTANCE = 1; // базовое расстояние для разлета
const MINI_SIZES = [0.22, 0.28, 0.33, 0.35]; // размеры осколков

// Траектории: [dx, dy] в относительных координатах (от центра)
// Используем те же векторы что и при удалении
const explodeVectors = [
  [-EXPLODE_DISTANCE * 0.9, -EXPLODE_DISTANCE * 1.1], // ↖ 
  [EXPLODE_DISTANCE * 1.1, -EXPLODE_DISTANCE * 0.8],  // ↗ 
  [EXPLODE_DISTANCE * 0.8, EXPLODE_DISTANCE * 1.1],   // ↘ 
  [-EXPLODE_DISTANCE * 1.2, EXPLODE_DISTANCE * 0.7],  // ↙ 
];

const BoardRestoreAnimationsOverlay: React.FC<BoardRestoreAnimationsOverlayProps> = ({
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
        <RestoreCell key={cell.id} cell={cell} cellSize={cellSize} gap={gap} />
      ))}
    </div>
  );
};

const MINI_DURATION = 0.25; // время сборки мини-клеток
const MAIN_ANIM_DURATION = 0.15; // появление основной клетки

const RestoreCell: React.FC<{ cell: RestoreAnimationCell; cellSize: number; gap: number }> = ({ 
  cell, cellSize, gap 
}) => {
  const [showMainCell, setShowMainCell] = useState(false);

  useEffect(() => {
    // Основная клетка появляется после сборки мини-клеток
    const timer = setTimeout(() => setShowMainCell(true), MINI_DURATION * 1000);
    return () => clearTimeout(timer);
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
      {/* Мини-клетки: стартуют разлетевшими, собираются в центр и исчезают */}
      {[0,1,2,3].map(i => {
        const MINI_SIZE = MINI_SIZES[i];
        const [dx, dy] = explodeVectors[i];
        const endX = dx * cellSize;
        const endY = dy * cellSize;
        // Обратная ротация для каждого осколка
        const startRot = [45, 60, 90, 70][i];
        const endRot = [-25, 18, 30, -15][i];
        const animName = `restoreMiniPiece${i}_${cell.id}`;
        const keyframes = `@keyframes ${animName} {
          0%   { opacity: 0; transform: scale(${MINI_SIZE}) translate(${endX}px,${endY}px) rotate(${startRot}deg); }
          70%  { opacity: 1; transform: scale(${MINI_SIZE}) translate(0px,0px) rotate(${endRot}deg); }
          100% { opacity: 0; transform: scale(1) translate(0px,0px) rotate(0deg); }
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
                animation: `${animName} ${MINI_DURATION}s forwards`,
                animationDelay: cell.delay ? `${cell.delay}s` : undefined,
                willChange: 'transform, opacity',
                opacity: 1,
              }}
            >
              <Piece color={cell.color} size={cellSize} />
            </div>
            <style>{keyframes}</style>
          </React.Fragment>
        );
      })}

      {/* Основная клетка появляется после сборки мини-клеток */}
      {showMainCell && (
        <div
          style={{
            width: cellSize,
            height: cellSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `mainCellFadeIn_${cell.id} ${MAIN_ANIM_DURATION}s forwards`,
            animationDelay: cell.delay ? `${cell.delay}s` : undefined,
            willChange: 'transform, opacity',
          }}
        >
          <Piece color={cell.color} size={cellSize} />
          <style>{`
            @keyframes mainCellFadeIn_${cell.id} {
              0%   { opacity: 0; transform: scale(0.8); }
              40%  { opacity: 1; transform: scale(1.1); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export type { RestoreAnimationCell };
export default BoardRestoreAnimationsOverlay; 