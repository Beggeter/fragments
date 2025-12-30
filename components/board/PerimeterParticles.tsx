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
const MIN_PARTICLE_SIZE = 2;
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
    // Проверяем и корректируем размеры для production сборки
    const validWidth = Math.max(width, 200); // минимальный размер 200px
    const validHeight = Math.max(height, 200);
    
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
        const offset = -12;
        const left =
          pt.x * (validWidth - MIN_PARTICLE_SIZE) +
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
          pt.y * (validHeight - MIN_PARTICLE_SIZE) +
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
        // Используем детерминированные значения на основе индекса частицы
        const seed = pt.x + pt.y * 1000 + pt.idx; // Уникальный seed для каждой частицы
        const randomDist = baseDist + (seed % 1000) / 1000 * 15; // 0-15
        const randomAngle = ((seed % 6283) / 1000 - 3.14) ; // -π до π
        const randomDelay = (seed % 200); // 0-200ms
        const randomDuration = ANIMATION_DURATION - (seed % 600); // Вариативность в длительности
        const randomSize = MIN_PARTICLE_SIZE + (seed % 8); // Размер
        const randomRotation = (seed % 360); // Поворот
        const randomColor = CONFETTI_COLORS[seed % CONFETTI_COLORS.length];


        let transformTo = "";
        // Предвычисляем cos и sin
        const cosAngle = Math.cos(randomAngle);
        const sinAngle = Math.sin(randomAngle);
        const absCosAngle = Math.abs(cosAngle);
        const absSinAngle = Math.abs(sinAngle);
        
        if (pt.side === "top") {
          // Для верхней стороны - летим вверх и в случайном направлении по горизонтали
          const xOffset = cosAngle * randomDist * 0.8;
          const yOffset = -randomDist - absSinAngle * randomDist * 0.5;
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "bottom") {
          // Для нижней стороны - летим вниз и в случайном направлении по горизонтали
          const xOffset = cosAngle * randomDist * 0.8;
          const yOffset = randomDist + absSinAngle * randomDist * 0.5;
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "left") {
          // Для левой стороны - летим влево и в случайном направлении по вертикали
          const xOffset = -randomDist - absCosAngle * randomDist * 0.5;
          const yOffset = sinAngle * randomDist * 0.8;
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "right") {
          // Для правой стороны - летим вправо и в случайном направлении по вертикали
          const xOffset = randomDist + absCosAngle * randomDist * 0.5;
          const yOffset = sinAngle * randomDist * 0.8;
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "corner-tl") {
          // Для углов - детерминированное направление
          const factor1 = 0.5 + ((seed + 1) % 500) / 1000; // 0.5-1.0
          const factor2 = 0.5 + ((seed + 2) % 500) / 1000; // 0.5-1.0
          const xOffset = -randomDist * factor1;
          const yOffset = -randomDist * factor2;
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "corner-tr") {
          const factor1 = 0.5 + ((seed + 3) % 500) / 1000;
          const factor2 = 0.5 + ((seed + 4) % 500) / 1000;
          const xOffset = randomDist * factor1;
          const yOffset = -randomDist * factor2;
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "corner-br") {
          const factor1 = 0.5 + ((seed + 5) % 500) / 1000;
          const factor2 = 0.5 + ((seed + 6) % 500) / 1000;
          const xOffset = randomDist * factor1;
          const yOffset = randomDist * factor2;
          transformTo = `translate(${xOffset}px, ${yOffset}px)`;
        } else if (pt.side === "corner-bl") {
          const factor1 = 0.5 + ((seed + 7) % 500) / 1000;
          const factor2 = 0.5 + ((seed + 8) % 500) / 1000;
          const xOffset = -randomDist * factor1;
          const yOffset = randomDist * factor2;
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
    }, [validWidth, validHeight]);

    if (!visible) return null;

    return (
      <div
        className={className}
        style={{
          position: "absolute",
          width: validWidth,
          height: validHeight,
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
              opacity: 0.3; 
              transform: scale(0.8) rotate(var(--particle-rotation));
            }
            20% { 
              opacity: 0.6; 
              transform: scale(1.1) rotate(var(--particle-rotation));
            }
            40% { 
              opacity: 0.9; 
              transform: var(--particle-transform) scale(1) rotate(var(--particle-rotation));
            }
            60% { 
              opacity: 1; 
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
            width={pt.randomSize}
            height={pt.randomSize}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: "absolute",
              left: pt.left,
              top: pt.top,
              pointerEvents: "none",
              zIndex: 1,
              animation: `perimeter-particle-explode ${pt.randomDuration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              animationDelay: `${pt.randomDelay}ms`,
              ["--particle-transform" as any]: `${pt.transformTo}`,
              ["--particle-rotation" as any]: `${pt.randomRotation}deg`,
              willChange: "transform, opacity"
            }}
          >
            {/* <defs>
              <filter id={`neon-${i}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs> */}
            
            {i % 4 === 0 ? (
              // Квадрат
              <rect x="20" y="20" width="60" height="60" 
                    fill="white" 
                    style={{
                      filter: "drop-shadow(0 0 8px #ffff00)"
                    }}
              />
            ) : i % 4 === 1 ? (
              // Звезда
              <path 
                d="M43 0.573095C36.2804 28.3069 27.5969 38.2595 0.573593 42.9995C28.493 47.8597 38.3632 56.5588 43 85.4259C46.4865 56.5515 55.2865 46.0561 85.4264 42.9995C58.0896 38.1858 48.6892 29.0552 43 0.573095Z"
                fill="white" 
                style={{
                  filter: "drop-shadow(0 0 8px #ffff00)"
                }}
              />
            ) : i % 4 === 2 ? (
              // Круг
              <circle cx="50" cy="50" r="30" 
                      fill="white" 
                      style={{
                        filter: "drop-shadow(0 0 8px #ffff00)"
                      }}
              />
            ) : (
              // Ромб
              <path 
                d="M50 20 L80 50 L50 80 L20 50 Z"
                fill="white" 
                style={{
                  filter: "drop-shadow(0 0 8px #ffff00)"
                }}
              />
            )}
          </svg>
        ))}
      </div>
    );
  }
);

PerimeterParticles.displayName = "PerimeterParticles";
