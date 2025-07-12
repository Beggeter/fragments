import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DraggablePiece } from "../DraggablePiece";
import { Block, Position } from "../../lib/data/types";

interface PieceReturnAnimationProps {
  piece: Block;
  fromPosition: Position; // позиция на доске где была фигура
  targetRect: DOMRect | null; // целевая позиция (контейнер с фигурами)
  cellSize: number;
  gap: number;
  onComplete?: () => void;
}

const PieceReturnAnimation: React.FC<PieceReturnAnimationProps> = ({
  piece,
  fromPosition,
  targetRect,
  cellSize,
  gap,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Вычисляем начальную позицию на доске
  const boardStartX = 4 + fromPosition.x * (cellSize + gap);
  const boardStartY = 4 + fromPosition.y * (cellSize + gap);

  // Вычисляем конечную позицию (центр контейнера с фигурами)
  const targetX = targetRect ? targetRect.left + targetRect.width / 2 : boardStartX;
  const targetY = targetRect ? targetRect.top + targetRect.height / 2 : boardStartY;

  // Размер фигуры
  const pieceWidth = piece.matrix[0].length * cellSize;
  const pieceHeight = piece.matrix.length * cellSize;

  useEffect(() => {
    // Скрываем фигуру после анимации
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 800); // Продолжительность анимации

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{
        x: boardStartX,
        y: boardStartY,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        x: targetX - pieceWidth / 2,
        y: targetY - pieceHeight / 2,
        scale: 0.6,
        opacity: 0.8,
      }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
      }}
      style={{
        position: "fixed",
        zIndex: 1100,
        pointerEvents: "none",
        width: pieceWidth,
        height: pieceHeight,
      }}
    >
      <DraggablePiece
        piece={piece}
        originalSize={cellSize}
        style={{
          width: pieceWidth,
          height: pieceHeight,
        }}
      />
    </motion.div>
  );
};

export default PieceReturnAnimation; 