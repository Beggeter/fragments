import React, { useMemo } from "react";

interface LinePerimeterParticlesProps {
  areas: number[][][]; // Массив областей для подсветки
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
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

const MIN_PARTICLE_SIZE = 2;
const EXPLODE_DURATION = 500; // Время "взрыва"
const BOUNCE_DURATION = 2500; // Время покачивания

// Функция для расчета количества частиц на основе размера стороны
const getParticleCount = (sideLength: number, cellSize: number): number => {
  const pixelsPerParticle = 20; // Один частица на каждые 20 пикселей
  const minParticles = 2; // Минимум 2 частицы
  const maxParticles = 12; // Максимум 12 частиц
  
  const calculatedCount = Math.floor(sideLength * cellSize / pixelsPerParticle);
  return Math.max(minParticles, Math.min(maxParticles, calculatedCount));
};

type Particle = {
  x: number;
  y: number;
  side: string;
  idx: number;
  left: number;
  top: number;
  randomSize: number;
  randomDelay: number;
  transformTo: string;
  randomRotation: number;
  randomColor: string;
  bounceOffset: number; // Смещение для покачивания
  bounceSpeed: number; // Скорость покачивания
};

// Функция для создания стабильного seed на основе области
const createAreaSeed = (area: number[][], areaIndex: number): number => {
  let hash = areaIndex * 31;
  area.forEach(([y, x]) => {
    hash = ((hash << 5) - hash) + y * 1000 + x;
    hash = hash & hash; // Convert to 32bit integer
  });
  return Math.abs(hash);
};

// Функция для генерации псевдослучайного числа с seed
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const LinePerimeterParticles: React.FC<LinePerimeterParticlesProps> = React.memo(
  ({ areas, boardWidth, boardHeight, cellSize, visible, color = "#fff", className = "" }) => {
    // Генерируем параметры частиц для каждой области
    const particles = useMemo(() => {
      const allParticles: Particle[] = [];
      
      areas.forEach((area, areaIndex) => {
        if (area.length === 0) return;
        
        // Создаем стабильный seed для этой области
        const areaSeed = createAreaSeed(area, areaIndex);
        
        // Находим границы области
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        area.forEach(([y, x]) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        });
        
        // Размеры области в ячейках
        const areaWidthCells = maxX - minX + 1;
        const areaHeightCells = maxY - minY + 1;
        
        // Размеры области в пикселях
        const areaWidth = areaWidthCells * cellSize;
        const areaHeight = areaHeightCells * cellSize;
        const areaLeft = minX * cellSize;
        const areaTop = minY * cellSize;
        
        // Рассчитываем количество частиц для каждой стороны
        const topParticles = getParticleCount(areaWidthCells, cellSize);
        const bottomParticles = getParticleCount(areaWidthCells, cellSize);
        const leftParticles = getParticleCount(areaHeightCells, cellSize);
        const rightParticles = getParticleCount(areaHeightCells, cellSize);
        
        // Генерируем частицы по периметру области
        const pts: { x: number; y: number; side: string; idx: number }[] = [];
        
        // top (left to right)
        for (let i = 0; i < topParticles; i++)
          pts.push({ x: i / (topParticles - 1), y: 0, side: "top", idx: i });
        // right (top to bottom)
        for (let i = 0; i < rightParticles; i++)
          pts.push({ x: 1, y: i / (rightParticles - 1), side: "right", idx: i });
        // bottom (right to left)
        for (let i = bottomParticles - 1; i >= 0; i--)
          pts.push({ x: i / (bottomParticles - 1), y: 1, side: "bottom", idx: bottomParticles - 1 - i });
        // left (bottom to top)
        for (let i = leftParticles - 1; i >= 0; i--)
          pts.push({ x: 0, y: i / (leftParticles - 1), side: "left", idx: leftParticles - 1 - i });
        
        // Добавляем углы только если область больше 1x1
        if (areaWidthCells > 1 || areaHeightCells > 1) {
          pts.push({ x: 0, y: 0, side: "corner-tl", idx: 0 });
          pts.push({ x: 1, y: 0, side: "corner-tr", idx: 1 });
          pts.push({ x: 1, y: 1, side: "corner-br", idx: 2 });
          pts.push({ x: 0, y: 1, side: "corner-bl", idx: 3 });
        }

        // Для каждого pt генерируем параметры частицы
        pts.forEach((pt, ptIndex) => {
          const offset = -5;
          const left = areaLeft + pt.x * (areaWidth - MIN_PARTICLE_SIZE) +
            (pt.side === "left" || pt.side === "corner-tl" || pt.side === "corner-bl"
              ? offset
              : pt.side === "right" || pt.side === "corner-tr" || pt.side === "corner-br"
              ? -offset
              : 0);
          const top = areaTop + pt.y * (areaHeight - MIN_PARTICLE_SIZE) +
            (pt.side === "top" || pt.side === "corner-tl" || pt.side === "corner-tr"
              ? offset
              : pt.side === "bottom" || pt.side === "corner-bl" || pt.side === "corner-br"
              ? -offset
              : 0);

          // Используем стабильный seed для генерации параметров
          const particleSeed = areaSeed + ptIndex * 7;
          const baseDist = 1.5;
          const randomDist = baseDist + seededRandom(particleSeed) * 8;
          const randomAngle = (seededRandom(particleSeed + 1) - 0.5) * 2.5;
          const randomDelay = seededRandom(particleSeed + 2) * 500;
          const randomSize = MIN_PARTICLE_SIZE + seededRandom(particleSeed + 3) * 3;
          const randomRotation = seededRandom(particleSeed + 4) * 120;
          const randomColorIndex = Math.floor(seededRandom(particleSeed + 5) * CONFETTI_COLORS.length);
          const randomColor = CONFETTI_COLORS[randomColorIndex];
          
          // Параметры покачивания
          const bounceOffset = (seededRandom(particleSeed + 6) - 0.5) * 4;
          const bounceSpeed = 0.1 + seededRandom(particleSeed + 7) * 0.3;

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

          allParticles.push({
            ...pt,
            left,
            top,
            randomSize,
            randomDelay,
            transformTo,
            randomRotation,
            randomColor,
            bounceOffset,
            bounceSpeed
          });
        });
      });
      
      return allParticles;
    }, [areas, boardWidth, boardHeight, cellSize]);

    if (!visible || areas.length === 0) return null;

    return (
      <div
        className={className}
        style={{
          position: "absolute",
          width: boardWidth,
          height: boardHeight,
          left: 0,
          top: 0,
          pointerEvents: "none",
          zIndex: 1200,
          opacity: 1,
        }}
      >
        <style>{`
          @keyframes line-perimeter-particle-explode {
            0% { 
              opacity: 0; 
            }
            10% { 
              opacity: 0.2; 
            }
            20% { 
              opacity: 0.4; 
            }
            40% { 
              opacity: 0.8; 
            }
            60% { 
              opacity: 1; 
            }
            80% { 
              opacity: 1; 
            }
            100% { 
              opacity: 1; 
              transform: var(--particle-transform);
            }
          }
          
          @keyframes line-perimeter-particle-bounce {
            0% { 
              transform: var(--particle-transform) translate(var(--bounce-x), var(--bounce-y));
               opacity: 1; 
            }
            25% { 
              transform: var(--particle-transform) translate(calc(var(--bounce-x) * -0.5), calc(var(--bounce-y) * -0.5));
              
               opacity: 0.6; 
            }
            50% { 
              transform: var(--particle-transform) translate(var(--bounce-x), var(--bounce-y));
               opacity: 1; 
            }
            75% { 
              transform: var(--particle-transform) translate(calc(var(--bounce-x) * -0.5), calc(var(--bounce-y) * -0.5));
               opacity: 0.5; 
            }
            100% { 
              transform: var(--particle-transform) translate(var(--bounce-x), var(--bounce-y));
               opacity: 1; 
            }
          }
        `}</style>
        {particles.map((pt, i) => (
          <svg
            key={`${i}-${pt.left}-${pt.top}`}
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
              animation: `
                line-perimeter-particle-explode ${EXPLODE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) forwards,
                line-perimeter-particle-bounce ${BOUNCE_DURATION}ms ease-in-out infinite
              `,
              animationDelay: `${pt.randomDelay}ms, ${EXPLODE_DURATION + pt.randomDelay}ms`,
              ["--particle-transform" as any]: `${pt.transformTo}`,
              ["--bounce-x" as any]: `${pt.bounceOffset}px`,
              ["--bounce-y" as any]: `${pt.bounceOffset * 0.5}px`,
              willChange: "transform, opacity"
            }}
          >
            {i % 2 === 0 ? (
              // <rect x="20" y="20" width="60" height="60" 
              //       fill="white" 
              //       style={{
              //         filter: "drop-shadow(0 0 8px #ffff00)"
              //       }}
              // />
              <path 
              d="M43 0.573095C36.2804 28.3069 27.5969 38.2595 0.573593 42.9995C28.493 47.8597 38.3632 56.5588 43 85.4259C46.4865 56.5515 55.2865 46.0561 85.4264 42.9995C58.0896 38.1858 48.6892 29.0552 43 0.573095Z"
              fill="white" 
              style={{
                filter: "drop-shadow(0 0 16px #fff700)"
              }}
              />
            ) : (
              <path 
                d="M43 0.573095C36.2804 28.3069 27.5969 38.2595 0.573593 42.9995C28.493 47.8597 38.3632 56.5588 43 85.4259C46.4865 56.5515 55.2865 46.0561 85.4264 42.9995C58.0896 38.1858 48.6892 29.0552 43 0.573095Z"
                fill="white" 
                style={{
                  filter: "drop-shadow(0 0 16px #fff700)"
                }}
              />
            )}
          </svg>
        ))}
      </div>
    );
  }
);

LinePerimeterParticles.displayName = "LinePerimeterParticles"; 