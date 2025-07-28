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
  onComplete?: () => void;
}

const ANIMATION_DURATION = 0.8; // seconds - немного дольше для плавности
const SHOW_RESULT_DURATION = 0.1; // seconds - время показа результата после анимации
const RESTORE_DISTANCE = 0.5; // Дистанция откуда появляются клетки

// Направления появления клеток (они прилетают из случайных направлений)
const restoreVectors = [
  [-RESTORE_DISTANCE * 1.2, -RESTORE_DISTANCE * 1.0], // ↖
  [RESTORE_DISTANCE * 1.0, -RESTORE_DISTANCE * 1.2],  // ↗
  [RESTORE_DISTANCE * 1.2, RESTORE_DISTANCE * 1.0],   // ↘
  [-RESTORE_DISTANCE * 1.0, RESTORE_DISTANCE * 1.2],  // ↙
  [-RESTORE_DISTANCE * 1.5, 0],                       // ←
  [RESTORE_DISTANCE * 1.5, 0],                        // →
  [0, -RESTORE_DISTANCE * 1.5],                       // ↑
  [0, RESTORE_DISTANCE * 1.5],                        // ↓
];

const BoardRestoreAnimationsOverlay: React.FC<BoardRestoreAnimationsOverlayProps> = ({
  cells,
  cellSize,
  gap,
  boardRect,
  onComplete,
}) => {
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    if (cells.length > 0) {
      setAnimationStarted(true);
      
      // Вызываем onComplete после окончания анимации + пауза для показа результата
      const totalDuration = (ANIMATION_DURATION + SHOW_RESULT_DURATION) * 1000;
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, totalDuration);

      return () => clearTimeout(timer);
    }
  }, [cells, onComplete]);

  if (!animationStarted) return null;

  return (
    <div style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: 950, // Выше clearAnimations, но ниже других элементов
    }}>
      {cells.map((cell, index) => (
        <RestoreCell 
          key={cell.id} 
          cell={cell} 
          cellSize={cellSize} 
          gap={gap}
          vectorIndex={index % restoreVectors.length}
        />
      ))}
    </div>
  );
};

const RestoreCell: React.FC<{ 
  cell: RestoreAnimationCell; 
  cellSize: number; 
  gap: number;
  vectorIndex: number;
}> = ({ cell, cellSize, gap, vectorIndex }) => {
  const [dx, dy] = restoreVectors[vectorIndex];
  const startX = dx * cellSize;
  const startY = dy * cellSize;
  
  const animationName = `restoreCell_${cell.id}`;
  const keyframes = `@keyframes ${animationName} {
    0% { 
      opacity: 0; 
      transform: translate(${startX}px, ${startY}px) scale(0.3) rotate(180deg);
    }
    30% { 
      opacity: 1; 
      transform: translate(${startX * 0.5}px, ${startY * 0.5}px) scale(0.6) rotate(90deg);
    }
    100% { 
      opacity: 1; 
      transform: translate(0px, 0px) scale(1) rotate(0deg);
    }
  }`;

  return (
    <div
      style={{
        position: "absolute",
        left: 4 + cell.x * (cellSize + gap),
        top: 4 + cell.y * (cellSize + gap),
        width: cellSize,
        height: cellSize,
        pointerEvents: "none",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: cellSize,
          height: cellSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: `${animationName} ${ANIMATION_DURATION}s ease-out forwards`,
          animationDelay: cell.delay ? `${cell.delay}s` : undefined,
          willChange: 'transform, opacity',
        }}
      >
        <Piece color={cell.color} size={cellSize} />
      </div>
      <style>{keyframes}</style>
    </div>
  );
};

export type { RestoreAnimationCell };
export default BoardRestoreAnimationsOverlay; 