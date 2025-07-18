import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ExplosionParticlesProps {
  centerX: number;
  centerY: number;
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
  gap: number;
  isActive: boolean;
  onComplete?: () => void;
}

type ParticleType = "fire" | "spark" | "debris" | "star" | "smoke" | "glitter";

interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  endX: number;
  endY: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
}

const ExplosionParticles: React.FC<ExplosionParticlesProps> = ({
  centerX,
  centerY,
  boardWidth,
  boardHeight,
  cellSize,
  gap,
  isActive,
  onComplete,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isActive) {
      // Создаем частицы
      const newParticles: Particle[] = [];
      const centerXPx = centerX * (cellSize + gap) + cellSize / 2;
      const centerYPx = centerY * (cellSize + gap) + cellSize / 2;
      
      // Генерируем разные типы частиц
      const particleTypes: ParticleType[] = ["fire", "spark", "debris", "star", "smoke", "glitter"];
      
      particleTypes.forEach((type, typeIndex) => {
        const count = type === "fire" ? 15 : type === "spark" ? 10 : type === "smoke" ? 8 : 6;
        
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + (typeIndex * Math.PI / 6);
          const distance = 80 + Math.random() * 120;
          const endX = centerXPx + Math.cos(angle) * distance;
          const endY = centerYPx + Math.sin(angle) * distance;
          
          const particle: Particle = {
            id: `${type}-${i}`,
            type,
            x: centerXPx,
            y: centerYPx,
            endX,
            endY,
            size: type === "fire" ? 10 + Math.random() * 6 : 
                  type === "spark" ? 4 + Math.random() * 3 :
                  type === "debris" ? 6 + Math.random() * 4 :
                  type === "star" ? 6 + Math.random() * 3 :
                  type === "smoke" ? 12 + Math.random() * 8 :
                  4 + Math.random() * 2,
            color: type === "fire" ? `hsl(${0 + Math.random() * 30}, 100%, 60%)` : // Красные оттенки
                   type === "spark" ? `hsl(${45 + Math.random() * 30}, 100%, 80%)` : // Желтые искры
                   type === "debris" ? `hsl(${20 + Math.random() * 40}, 70%, 50%)` : // Коричневые осколки
                   type === "star" ? `hsl(${Math.random() * 60}, 100%, 80%)` : // Золотые звезды
                   type === "smoke" ? `hsl(0, 0%, ${30 + Math.random() * 40}%)` : // Серый дым
                   `hsl(${Math.random() * 360}, 100%, 70%)`, // Разноцветные блестки
            delay: 0,
            duration: 0.4 + Math.random() * 0.2,
            rotation: Math.random() * 360,
          };
          
          newParticles.push(particle);
        }
      });
      
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        setParticles([]);
        if (onComplete) onComplete();
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, centerX, centerY, boardWidth, boardHeight, cellSize, gap, onComplete]);

  if (!isActive || particles.length === 0) return null;

  const getParticleStyle = (particle: Particle) => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      width: particle.size,
      height: particle.size,
      borderRadius: particle.type === "star" ? "0%" : 
                   particle.type === "debris" ? "20%" :
                   particle.type === "smoke" ? "50%" :
                   "50%",
      background: particle.color,
      transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
      boxShadow: particle.type === "fire" ? `0 0 ${particle.size * 2}px ${particle.color}` :
                 particle.type === "spark" ? `0 0 ${particle.size * 3}px ${particle.color}` :
                 particle.type === "star" ? `0 0 ${particle.size * 2}px ${particle.color}` :
                 particle.type === "glitter" ? `0 0 ${particle.size * 2}px ${particle.color}` :
                 particle.type === "debris" ? `0 0 ${particle.size}px ${particle.color}` :
                 "none",
      zIndex: 20,
    };

    // Специальные стили для разных типов частиц
    if (particle.type === "star") {
      baseStyle.clipPath = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
    } else if (particle.type === "smoke") {
      baseStyle.filter = "blur(3px)";
      baseStyle.opacity = 0.8;
      baseStyle.borderRadius = "50%";
    } else if (particle.type === "debris") {
      baseStyle.borderRadius = "20%";
      baseStyle.transform = `translate(-50%, -50%) rotate(${particle.rotation}deg) scale(${0.6 + Math.random() * 0.4})`;
    } else if (particle.type === "fire") {
      baseStyle.borderRadius = "50%";
      baseStyle.filter = "blur(1px)";
    } else if (particle.type === "spark") {
      baseStyle.borderRadius = "50%";
      baseStyle.filter = "blur(0.5px)";
    }

    return baseStyle;
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: particle.endX,
            y: particle.endY,
            scale: [0, 1, 0.8, 0],
            opacity: [1, 1, 0.6, 0],
          }}
          transition={{
            duration: particle.duration,
            ease: "easeIn",
            scale: {
              duration: particle.duration,
              times: [0, 0.1, 0.8, 1],
            },
            opacity: {
              duration: particle.duration,
              times: [0, 0.2, 0.8, 1],
            },
          }}
          style={getParticleStyle(particle)}
        />
      ))}
    </div>
  );
};

export default ExplosionParticles; 