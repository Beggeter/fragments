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
  boardRect: DOMRect | null; // теперь boardRect приходит из пропсов
  onComplete?: () => void;
}

const PieceReturnAnimation: React.FC<PieceReturnAnimationProps> = ({
  piece,
  fromPosition,
  targetRect,
  cellSize,
  gap,
  boardRect, // теперь из пропсов
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showPortal, setShowPortal] = useState(false);

  // Размер фигуры (нужно вычислить до координат)
  const pieceWidth = piece.matrix[0].length * cellSize;
  const pieceHeight = piece.matrix.length * cellSize;

  // Паддинг доски (если есть, иначе 0)
  const BOARD_PADDING = 4; // если у доски padding: 4px, иначе поставить 0

  // Вычисляем левый верхний угол bounding box фигуры на доске (в пикселях)
  const startX = boardRect
    ? boardRect.left + BOARD_PADDING + fromPosition.x * (cellSize + gap)
    : 100;
  const startY = boardRect
    ? boardRect.top + BOARD_PADDING + fromPosition.y * (cellSize + gap)
    : 100;

  // Находим конкретный контейнер для фигуры
  const pieceContainers = document.querySelectorAll(
    ".draggable-pieces-section > div"
  );
  let targetContainer: Element | null = null;

  // Ищем первый пустой контейнер (проверяем наличие видимых DraggablePiece)
  for (let i = 0; i < pieceContainers.length; i++) {
    const container = pieceContainers[i];
    // Проверяем, есть ли в контейнере видимые фигуры (не ghost)
    const visiblePieces = container.querySelectorAll(
      'div:not([style*="pointer-events: none"])'
    );
    if (visiblePieces.length === 0) {
      targetContainer = container;
      // ;
      break;
    }
  }

  // Если не нашли пустой контейнер, используем средний контейнер (индекс 1)
  if (!targetContainer && pieceContainers.length >= 2) {
    targetContainer = pieceContainers[1];
  } else if (!targetContainer && pieceContainers.length > 0) {
    targetContainer = pieceContainers[0];
  }

  // Если есть конкретный контейнер, используем его координаты
  let targetX, targetY;
  if (targetContainer) {
    const containerRect = targetContainer.getBoundingClientRect();
    targetX = containerRect.left + containerRect.width / 2;
    targetY = containerRect.top + containerRect.height / 2;

    // console.log("🎯 Target container found:", {
    //   container: targetContainer,
    //   rect: {
    //     x: targetX,
    //     y: targetY,
    //     width: containerRect.width,
    //     height: containerRect.height,
    //   },
    // });
  } else {
    // Fallback к старой логике
    targetX = targetRect ? targetRect.left + targetRect.width / 2 : startX;
    targetY = targetRect ? targetRect.top + targetRect.height * 0.3 : startY;

    // ;
  }

  // Размер фигуры уже определен выше

  // Подробное логирование для отладки
  // console.log("🎯 PieceReturnAnimation координаты:", {
  //   "🟢 Начальная позиция (левый верхний угол bounding box)": {
  //     x: startX,
  //     y: startY,
  //   },
  //   "🔴 Конечная позиция (центр контейнера)": { x: targetX, y: targetY },
  //   "📏 Размер фигуры": { width: pieceWidth, height: pieceHeight },
  //   "🎲 Позиция на доске (сетка)": fromPosition,
  //   "🎯 Найденный контейнер": targetContainer ? "✅ Найден" : "❌ Не найден",
  //   "📐 Размер ячейки": cellSize,
  //   "🔹 Зазор": gap,
  //   "🎪 Доска": boardRect
  //     ? {
  //         left: boardRect.left,
  //         top: boardRect.top,
  //         width: boardRect.width,
  //         height: boardRect.height,
  //       }
  //     : "❌ Не найдена",
  // });

  // useEffect(() => {
  //   ;
  // }, [boardRect]);

  useEffect(() => {
    // Показываем портал-эффект в начале
    setShowPortal(true);

    // Скрываем портал через небольшое время
    const portalTimer = setTimeout(() => {
      setShowPortal(false);
    }, 200);

    // Скрываем фигуру после анимации
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 800); // Продолжительность анимации

    return () => {
      clearTimeout(portalTimer);
      clearTimeout(timer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <>

      {/* Портал-эффект в начале */}
      {showPortal && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            left: startX,
            top: startY,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)",
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.6)",
            zIndex: 1200,
            pointerEvents: "none",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {/* Анимация возвращения фигуры */}
      <motion.div
        initial={{
          x: startX,
          y: startY,
          scale: 1,
          opacity: 1,
        }}
        animate={{
          x: targetX - pieceWidth / 2,
          y: targetY - pieceHeight / 2,
          scale: 0.5,
          opacity: 1,
        }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
          scale: {
            duration: 0.8,
            ease: "easeInOut",
            times: [0, 0.5, 1], // 0% -> 50% -> 100%
            values: [1, 1.2, 0.6], // начальный -> максимум -> конечный
          },
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
    </>
  );
};

export default PieceReturnAnimation;
