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
        const offset = -10;
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

        // Рандомные параметры
        const baseDist = 2;
        const randomDist = baseDist + Math.random() * 6;
        const randomAngle = (Math.random() - 0.5) * 1.5;
        const randomDelay = Math.random() * 100;
        const randomDuration = ANIMATION_DURATION - Math.random() * 400;
        const randomSize =
          MIN_PARTICLE_SIZE + Math.random() * 4;
        const randomRotation = Math.random() * 120;
        const randomColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];


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
          transformTo = `translate(-${randomDist}px, -${randomDist}px)`;
        } else if (pt.side === "corner-tr") {
          transformTo = `translate(${randomDist}px, -${randomDist}px)`;
        } else if (pt.side === "corner-br") {
          transformTo = `translate(${randomDist}px, ${randomDist}px)`;
        } else if (pt.side === "corner-bl") {
          transformTo = `translate(-${randomDist}px, ${randomDist}px)`;
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
            0% { opacity: 0; }
            10% { opacity: 0.2; }
            20% { opacity: 0.4; }
            40% { opacity: 0.8; transform: var(--particle-transform); }
            60% { opacity: 1; transform: var(--particle-transform);}
            80% { opacity: 0.5; transform: var(--particle-transform);}
            100% { opacity: 0;  transform: var(--particle-transform);}
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
              // transform: `rotate(${pt.randomRotation}deg)`,
              animation: `perimeter-particle-explode ${pt.randomDuration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              animationDelay: `${pt.randomDelay}ms`,
              ["--particle-transform" as any]: `${pt.transformTo}`,
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
            
            {i % 2 === 0 ? (
              <rect x="20" y="20" width="60" height="60" 
                    fill="white" 
                    // stroke="#ffff00" 
                    // strokeWidth="5"
                    style={{
                      filter: "drop-shadow(0 0 14px #ffff00)"
                    }}
              />
            ) : (
              <path 
              d="M43 0.573095C36.2804 28.3069 27.5969 38.2595 0.573593 42.9995C28.493 47.8597 38.3632 56.5588 43 85.4259C46.4865 56.5515 55.2865 46.0561 85.4264 42.9995C58.0896 38.1858 48.6892 29.0552 43 0.573095Z"
              fill="white" 
                // stroke="#ffff00" 
                // strokeWidth="5"
                style={{
                  filter: "drop-shadow(0 0 14px #ffff00)"
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
