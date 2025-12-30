import React, { useMemo } from "react";

interface PerimeterParticlesProps {
  width: number;
  height: number;
  visible: boolean;
  color?: string;
  className?: string;
}
const CONFETTI_COLORS = [
  "#FF0000", // ярко-красный
  "#00FF00", // ярко-зеленый
  "#0000FF", // ярко-синий
  "#FFFF00", // ярко-желтый
  "#FF00FF", // ярко-малиновый
  "#00FFFF", // ярко-голубой
  "#FF8000", // ярко-оранжевый
  "#8000FF", // ярко-фиолетовый
  "#FF0080", // ярко-розовый
  "#80FF00", // ярко-лаймовый
  "#0080FF", // ярко-синий
  "#FF4000", // ярко-красно-оранжевый
  "#40FF00", // ярко-зелено-желтый
  "#0040FF", // ярко-сине-голубой
  "#FF0040", // ярко-красно-розовый
  "#40FF40", // ярко-зеленый
  "#4040FF", // ярко-синий
  "#FF4040", // ярко-красный
  "#40FF80", // ярко-зелено-голубой
  "#8040FF", // ярко-фиолетовый
];
const N = 14;
const M = 14;
const MIN_PARTICLE_SIZE = 10;
const ANIMATION_DURATION = 1000;

type Particle = {
  x: number;
  y: number;
  side: string;
  idx: number;
  left: number;
  top: number;
  randomSize: number;
  randomDuration: number;
  randomDelay: number;
  transformTo: string;
};

export const PerimeterParticles: React.FC<PerimeterParticlesProps> = React.memo(
  ({ width, height, visible, color = "#fff", className = "" }) => {
    // Генерируем параметры частиц только при изменении размеров
    const particles = useMemo(() => {
      const pts: { x: number; y: number; side: string; idx: number }[] = [];
      // top (left to right)
      for (let i = 0; i < N; i++)
        pts.push({ x: i / (N - 1), y: 0, side: "top", idx: i });
      // right (top to bottom)
      for (let i = 0; i < M; i++)
        pts.push({ x: 1, y: i / (M - 1), side: "right", idx: i });
      // bottom (right to left)
      for (let i = N - 1; i >= 0; i--)
        pts.push({ x: i / (N - 1), y: 1, side: "bottom", idx: N - 1 - i });
      // left (bottom to top)
      for (let i = M - 1; i >= 0; i--)
        pts.push({ x: 0, y: i / (M - 1), side: "left", idx: M - 1 - i });
      // corners
      pts.push({ x: 0, y: 0, side: "corner-tl", idx: 0 });
      pts.push({ x: 1, y: 0, side: "corner-tr", idx: 1 });
      pts.push({ x: 1, y: 1, side: "corner-br", idx: 2 });
      pts.push({ x: 0, y: 1, side: "corner-bl", idx: 3 });

      // Для каждого pt генерируем параметры частицы
      return pts.map((pt) => {
        const offset = -16;
        const left =
          pt.x * (width - MIN_PARTICLE_SIZE) +
          (pt.side === "left" ||
          pt.side === "corner-tl" ||
          pt.side === "corner-bl"
            ? offset
            : pt.side === "right" ||
              pt.side === "corner-tr" ||
              pt.side === "corner-br"
            ? -offset
            : 0);
        const top =
          pt.y * (height - MIN_PARTICLE_SIZE) +
          (pt.side === "top" ||
          pt.side === "corner-tl" ||
          pt.side === "corner-tr"
            ? offset
            : pt.side === "bottom" ||
              pt.side === "corner-bl" ||
              pt.side === "corner-br"
            ? -offset
            : 0);

        // Рандомные параметры - увеличенная вариативность
        const baseDist = 3;
        const randomDist = baseDist + Math.random() * 20; // Увеличили максимальное расстояние
        const randomAngle = (Math.random() - 0.5) * 3.14; // Полный круг
        const randomDelay = Math.random() * 300; // Увеличили задержку
        const randomDuration = ANIMATION_DURATION - Math.random() * 600; // Больше вариативности
        const randomSize = MIN_PARTICLE_SIZE + Math.random() * MIN_PARTICLE_SIZE * 1.5; // Больше вариативности в размере
        const randomRotation = Math.random() * 360; // Полный оборот
        const randomColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];


        let transformTo = "";
        if (pt.side === "top") {
          // Для верхней стороны - летим вверх и в случайном направлении по горизонтали
          const xOffset = Math.cos(randomAngle) * randomDist * 0.8;
          const yOffset = -randomDist - Math.abs(Math.sin(randomAngle) * randomDist * 0.5);
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "bottom") {
          // Для нижней стороны - летим вниз и в случайном направлении по горизонтали
          const xOffset = Math.cos(randomAngle) * randomDist * 0.8;
          const yOffset = randomDist + Math.abs(Math.sin(randomAngle) * randomDist * 0.5);
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "left") {
          // Для левой стороны - летим влево и в случайном направлении по вертикали
          const xOffset = -randomDist - Math.abs(Math.cos(randomAngle) * randomDist * 0.5);
          const yOffset = Math.sin(randomAngle) * randomDist * 0.8;
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "right") {
          // Для правой стороны - летим вправо и в случайном направлении по вертикали
          const xOffset = randomDist + Math.abs(Math.cos(randomAngle) * randomDist * 0.5);
          const yOffset = Math.sin(randomAngle) * randomDist * 0.8;
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "corner-tl") {
          // Для углов - более случайное направление
          const xOffset = -randomDist * (0.5 + Math.random() * 0.5);
          const yOffset = -randomDist * (0.5 + Math.random() * 0.5);
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "corner-tr") {
          const xOffset = randomDist * (0.5 + Math.random() * 0.5);
          const yOffset = -randomDist * (0.5 + Math.random() * 0.5);
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "corner-br") {
          const xOffset = randomDist * (0.5 + Math.random() * 0.5);
          const yOffset = randomDist * (0.5 + Math.random() * 0.5);
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "corner-bl") {
          const xOffset = -randomDist * (0.5 + Math.random() * 0.5);
          const yOffset = randomDist * (0.5 + Math.random() * 0.5);
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        }

        return {
          ...pt,
          left,
          top,
          randomSize,
          randomDuration,
          randomDelay,
          transformTo,
          randomRotation,
          randomColor
        };
      });
    }, [width, height]);

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
              transform: scale(0.3) rotate(0deg);
            }
            10% { 
              opacity: 0.4; 
              transform: scale(0.8) rotate(var(--particle-rotation));
            }
            20% { 
              opacity: 0.8; 
              transform: scale(1.2) rotate(var(--particle-rotation));
            }
            40% { 
              opacity: 1; 
              transform: var(--particle-transform) scale(1) rotate(var(--particle-rotation));
            }
            60% { 
              opacity: 0.8; 
              transform: var(--particle-transform) scale(0.9) rotate(var(--particle-rotation));
            }
            80% { 
              opacity: 0.4; 
              transform: var(--particle-transform) scale(0.7) rotate(var(--particle-rotation));
            }
            100% { 
              opacity: 0; 
              transform: var(--particle-transform) scale(0.5) rotate(var(--particle-rotation));
            }
          }
        `}</style>
        {particles.map((pt, i) => (
          <svg
            key={i}
            width="121"
            height="72"
            viewBox="0 0 121 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: "absolute",
              left: pt.left,
              top: pt.top,
              width: pt.randomSize,
              height: pt.randomSize,
              pointerEvents: "none",
              zIndex: 1,
              // transform: `rotate(${pt.randomRotation}deg)`,
              animation: `perimeter-particle-explode ${pt.randomDuration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              animationDelay: `${pt.randomDelay}ms`,
              ["--particle-transform" as any]: `${pt.transformTo}`,
              ["--particle-rotation" as any]: `${pt.randomRotation}deg`,
            }}
          >
            <path
              id="Vector 1882"
              d="M117 28.7517C88.2166 5.97328 41.2893 -14.1636 4 28.7517V64.0642C53.4251 26.3439 78.2415 28.6236 117 64.0642V28.7517Z"
              fill="white"
              stroke="white"
              strokeWidth="6"
              transform={`rotate(${pt.randomRotation} 60.5 36)`}
            />
          </svg>
        ))}
      </div>
    );
  }
);

PerimeterParticles.displayName = "PerimeterParticles";
