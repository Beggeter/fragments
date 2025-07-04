import React, { useMemo } from "react";

interface PerimeterParticlesProps {
  width: number;
  height: number;
  visible: boolean;
  color?: string;
  className?: string;
}

const N = 16;
const M = 16;
const PARTICLE_SIZE = 2;
const ANIMATION_DURATION = 1000; // ms

const COLORS = ["#fff"];

export const PerimeterParticles: React.FC<PerimeterParticlesProps> = ({
  width,
  height,
  visible,
  color = "#fff",
  className = "",
}) => {
  // Генерируем точки по периметру (top, right, bottom, left)
  const points = useMemo(() => {
    const pts: { x: number; y: number; side: string; idx: number }[] = [];
    // top (left to right)
    for (let i = 0; i < N; i++)
      pts.push({ x: i / (N - 1), y: 0, side: "top", idx: i });
    // right (top to bottom, включая углы)
    for (let i = 0; i < M; i++)
      pts.push({ x: 1, y: i / (M - 1), side: "right", idx: i });
    // bottom (right to left)
    for (let i = N - 1; i >= 0; i--)
      pts.push({ x: i / (N - 1), y: 1, side: "bottom", idx: N - 1 - i });
    // left (bottom to top, включая углы)
    for (let i = M - 1; i >= 0; i--)
      pts.push({ x: 0, y: i / (M - 1), side: "left", idx: M - 1 - i });
    
    // Добавляем дополнительные точки в углы с диагональным направлением
    pts.push({ x: 0, y: 0, side: "corner-tl", idx: 0 }); // top-left
    pts.push({ x: 1, y: 0, side: "corner-tr", idx: 1 }); // top-right
    pts.push({ x: 1, y: 1, side: "corner-br", idx: 2 }); // bottom-right
    pts.push({ x: 0, y: 1, side: "corner-bl", idx: 3 }); // bottom-left
    
    return pts;
  }, []);

  if (!visible) return null;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        width,
        height,
        left: 0,
        top: 0,
        pointerEvents: "none",
        zIndex: 1200,
        opacity: 1,
      }}
    >
      <style>{`
        @keyframes perimeter-particle-explode {
          0% { 
            opacity: 0;
          }
          15% { 
            opacity: 0.8;
          }
          30% { 
            opacity: 1;
          }
          50% { 
            opacity: 0.6;
          }
          70% { 
            opacity: 0.2;
          }
          100% { 
            opacity: 0;
            transform: var(--particle-transform); 
          }
        }
      `}</style>
      {points.map((pt, i) => {
        // offset: частица появляется чуть ближе к центру
        const offset = -10; // px
        const left =
          pt.x * (width - PARTICLE_SIZE) +
          (pt.side === "left" ? offset : pt.side === "right" ? -offset : 0);
        const top =
          pt.y * (height - PARTICLE_SIZE) +
          (pt.side === "top" ? offset : pt.side === "bottom" ? -offset : 0);
        const particleColor = COLORS[i % COLORS.length];

        // Рандомизируем движение и время
        const baseDist = 10;
        const randomDist = baseDist + (Math.random() ) * 5; // ±20px вариация
        const randomAngle = (Math.random() - 0.5) * 1; // ±15 градусов вариация
        const randomDelay = Math.random() * 100; // 0-200ms задержка
        const randomDuration = ANIMATION_DURATION + (Math.random() - 0.5) * 400; // ±200ms вариация
        const randomSize = PARTICLE_SIZE + (Math.random() - 0.5) * 6;

        let transformTo = "";
        if (pt.side === "top") {
          const xOffset = Math.sin(randomAngle) * randomDist;
          transformTo = `translate(${xOffset}px, -${randomDist}px)`;
        } else if (pt.side === "bottom") {
          const xOffset = Math.sin(randomAngle) * randomDist;
          transformTo = `translate(${xOffset}px, ${randomDist}px)`;
        } else if (pt.side === "left") {
          const yOffset = Math.sin(randomAngle) * randomDist;
          transformTo = `translate(-${randomDist}px, ${yOffset}px)`;
        } else if (pt.side === "right") {
          const yOffset = Math.sin(randomAngle) * randomDist;
          transformTo = `translate(${randomDist}px, ${yOffset}px)`;
        } else if (pt.side === "corner-tl") {
          // top-left: диагонально влево-вверх
          transformTo = `translate(-${randomDist}px, -${randomDist}px)`;
        } else if (pt.side === "corner-tr") {
          // top-right: диагонально вправо-вверх
          transformTo = `translate(${randomDist}px, -${randomDist}px)`;
        } else if (pt.side === "corner-br") {
          // bottom-right: диагонально вправо-вниз
          transformTo = `translate(${randomDist}px, ${randomDist}px)`;
        } else if (pt.side === "corner-bl") {
          // bottom-left: диагонально влево-вниз
          transformTo = `translate(-${randomDist}px, ${randomDist}px)`;
        }

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top,
              width: randomSize,
              height: randomSize,
              borderRadius: "50%",
              background: `radial-gradient(circle, #fff 20%, ${particleColor} 100%)`,
              opacity: 0.5,
              pointerEvents: "none",
              zIndex: 1,
              animation: `perimeter-particle-explode ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              ["--particle-transform" as any]: transformTo,
            }}
          />
        );
      })}
    </div>
  );
};
