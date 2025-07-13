import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ExplosionWaveProps {
  centerX: number;
  centerY: number;
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
  gap: number;
  isActive: boolean;
  onComplete?: () => void;
}

const ExplosionWave: React.FC<ExplosionWaveProps> = ({
  centerX,
  centerY,
  boardWidth,
  boardHeight,
  cellSize,
  gap,
  isActive,
  onComplete,
}) => {
  const [showWave, setShowWave] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowWave(true);
      const timer = setTimeout(() => {
        setShowWave(false);
        if (onComplete) onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!showWave) return null;

  // Вычисляем позицию центра в пикселях относительно игрового поля
  const centerXPx = centerX * (cellSize + gap) + cellSize / 2;
  const centerYPx = centerY * (cellSize + gap) + cellSize / 2;

  // Размеры доски в пикселях
  const boardWidthPx = boardWidth * (cellSize + gap) - gap;
  const boardHeightPx = boardHeight * (cellSize + gap) - gap;

  // Максимальное расстояние для волны
  const maxDistance = Math.min(
    Math.sqrt(boardWidthPx * boardWidthPx + boardHeightPx * boardHeightPx),
    Math.max(boardWidthPx, boardHeightPx) * 0.8
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Основная волна */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: maxDistance / 50,
          opacity: [1, 0.8, 0.4, 0]
        }}
        transition={{ 
          duration: 0.8, 
          ease: "easeOut",
          opacity: { duration: 0.8, times: [0, 0.3, 0.7, 1] }
        }}
        style={{
          position: "absolute",
          left: centerXPx,
          top: centerYPx,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 50, 50, 0.8) 0%, rgba(255, 100, 50, 0.6) 30%, rgba(255, 150, 50, 0.4) 60%, transparent 100%)",
          border: "2px solid rgba(255, 50, 50, 0.9)",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 20px rgba(255, 50, 50, 0.6)",
        }}
      />

      {/* Вторичная волна */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: maxDistance / 40,
          opacity: [1, 0.6, 0.2, 0]
        }}
        transition={{ 
          duration: 0.8, 
          delay: 0.1,
          ease: "easeOut",
          opacity: { duration: 0.8, times: [0, 0.4, 0.8, 1] }
        }}
        style={{
          position: "absolute",
          left: centerXPx,
          top: centerYPx,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 100, 50, 0.7) 0%, rgba(255, 150, 50, 0.5) 40%, rgba(255, 200, 50, 0.3) 70%, transparent 100%)",
          border: "1px solid rgba(255, 100, 50, 0.8)",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 15px rgba(255, 100, 50, 0.5)",
        }}
      />

      {/* Третичная волна */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: maxDistance / 30,
          opacity: [1, 0.4, 0.1, 0]
        }}
        transition={{ 
          duration: 0.8, 
          delay: 0.2,
          ease: "easeOut",
          opacity: { duration: 0.8, times: [0, 0.5, 0.9, 1] }
        }}
        style={{
          position: "absolute",
          left: centerXPx,
          top: centerYPx,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 150, 50, 0.6) 0%, rgba(255, 200, 50, 0.4) 50%, rgba(255, 255, 50, 0.2) 80%, transparent 100%)",
          border: "1px solid rgba(255, 150, 50, 0.7)",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 10px rgba(255, 150, 50, 0.4)",
        }}
      />

      {/* Сетка волны - линии, которые распространяются по сетке */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45) * Math.PI / 180;
        const distance = maxDistance * 0.8;
        const endX = centerXPx + Math.cos(angle) * distance;
        const endY = centerYPx + Math.sin(angle) * distance;
        
        return (
          <motion.div
            key={i}
            initial={{ 
              scaleX: 0, 
              opacity: 1,
              x: centerXPx,
              y: centerYPx,
            }}
            animate={{ 
              scaleX: 1,
              opacity: [1, 0.8, 0.3, 0],
              x: endX,
              y: endY,
            }}
            transition={{ 
              duration: 0.8, 
              delay: 0.1 + i * 0.05,
              ease: "easeOut",
              opacity: { duration: 0.8, times: [0, 0.2, 0.6, 1] }
            }}
            style={{
              position: "absolute",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255, 50, 50, 0.8) 0%, rgba(255, 100, 50, 0.6) 50%, transparent 100%)",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 6px rgba(255, 50, 50, 0.6)",
            }}
          />
        );
      })}

      {/* Дополнительные частицы по сетке */}
      {[...Array(16)].map((_, i) => {
        const angle = (i * 22.5) * Math.PI / 180;
        const distance = maxDistance * 0.6;
        const endX = centerXPx + Math.cos(angle) * distance;
        const endY = centerYPx + Math.sin(angle) * distance;
        
        return (
          <motion.div
            key={`particle-${i}`}
            initial={{ 
              scale: 0, 
              opacity: 1,
              x: centerXPx,
              y: centerYPx,
            }}
            animate={{ 
              scale: 1,
              opacity: [1, 0.6, 0.2, 0],
              x: endX,
              y: endY,
            }}
            transition={{ 
              duration: 0.6, 
              delay: 0.2 + i * 0.03,
              ease: "easeOut",
              opacity: { duration: 0.6, times: [0, 0.3, 0.7, 1] }
            }}
            style={{
              position: "absolute",
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "rgba(255, 150, 50, 0.7)",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 4px rgba(255, 150, 50, 0.5)",
            }}
          />
        );
      })}
    </div>
  );
};

export default ExplosionWave; 