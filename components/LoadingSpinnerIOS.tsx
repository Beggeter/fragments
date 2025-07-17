import React, { useRef, useState, useEffect } from "react";

const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

const CELL_SIZE = 43;
const GAP_PX = 2;
const BOARD_SIZE = 8;

const getCellParams = () => {
  const xSpread = (Math.random() - 0.5) * 40;
  const rot1 = (Math.random() - 0.5) * 30;
  const rot2 = rot1 + (Math.random() - 0.5) * 60;
  const rotFinal = rot2 + (Math.random() - 0.5) * 90;
  const scale2 = 1.1 + Math.random() * 0.15;
  const scale3 = 1.2 + Math.random() * 0.2;
  const scaleFinal = 1.3 + Math.random() * 0.3;
  return { xSpread, rot1, rot2, rotFinal, scale2, scale3, scaleFinal };
};

const getLineCells = () =>
  Array.from({ length: 8 }).map(() => ({
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    ...getCellParams(),
  }));

const getAllLines = () => Array.from({ length: 8 }).map(() => getLineCells());

type SpinnerCell = {
  color: string;
  xSpread: number;
  rot1: number;
  rot2: number;
  rotFinal: number;
  scale2: number;
  scale3: number;
  scaleFinal: number;
};

const FLY_SPEED = 400; // px/sec
const BOUNCE_DURATION = 0.35; // сек
const EXPLOSION_OFFSET = 40; // px

type LoadingSpinnerIOSProps = {
  width?: number;
  height?: number;
  startYOffset?: number;
  onFinish?: () => void;
  onLineBreakpoint?: (lineIdx: number, rowIdx: number) => void;
};

export const LoadingSpinnerIOS = ({
  width,
  height,
  startYOffset = 0,
  onFinish,
  onLineBreakpoint,
}: LoadingSpinnerIOSProps) => {
  const [finishedCount, setFinishedCount] = useState(0);
  const [animationId, setAnimationId] = useState(0);
  const boardHeight = height ?? 0;
  const boardWidth = width ?? 0;
  const EXTRA = 200;

  // Генерируем линии и параметры только один раз
  const linesRef = useRef(getAllLines());
  const bounceParamsRef = useRef(
    Array.from({ length: 8 }).map(() => {
      const bounce1 = 40 + Math.random() * 30;
      const bounce2 = bounce1 + 30 + Math.random() * 20;
      const finalY = bounce2 + 60 + Math.random() * 30;
      return { bounce1, bounce2, finalY };
    })
  );

  const START_Y = boardHeight - CELL_SIZE + startYOffset;
  const COMMON_TOP = EXTRA;

  const lineTimings = Array.from({ length: 8 }).map((_, lineIdx) => {
    const startY = START_Y + lineIdx * CELL_SIZE + EXTRA;
    const topBounce = COMMON_TOP;
    const flyDistance = Math.abs(startY - topBounce);
    const flyDuration = flyDistance / FLY_SPEED;
    const totalDuration = flyDuration + BOUNCE_DURATION;
    return { flyDuration, totalDuration, startY, topBounce };
  });

  const handleLineFinish = () => {
    setFinishedCount((prev) => {
      const next = prev + 1;
      if (next === 8 && onFinish) {
        // Гарантированно вызываем onLineBreakpoint для всех линий перед завершением
        if (onLineBreakpoint) {
          for (let i = 0; i < 8; i++) {
            setTimeout(() => {
              onLineBreakpoint(i, i);
            }, i * 10);
          }
        }
        
        setTimeout(() => {
          onFinish();
        }, 100);
      }
      return next;
    });
  };

  // Генерируем уникальные CSS анимации для каждой линии
  const generateCSSAnimations = () => {
    const animations = [];
    
    for (let lineIdx = 0; lineIdx < 8; lineIdx++) {
      const { flyDuration, totalDuration, startY, topBounce } = lineTimings[lineIdx];
      const { bounce1, bounce2 } = bounceParamsRef.current[lineIdx];
      
      const frac = flyDuration / totalDuration;
      const times = [0, frac, frac + 0.25 * (1 - frac), frac + 0.6 * (1 - frac), 1];
      
      // Y анимация
      const yKeyframes = [
        startY,
        topBounce,
        topBounce - bounce1,
        topBounce - bounce2,
        topBounce - EXPLOSION_OFFSET,
      ];
      
      // ScaleX анимация для брейкпоинтов
      const breakpoints = [startY - 3 * CELL_SIZE, startY - 5 * CELL_SIZE, startY - 7 * CELL_SIZE];
      const scaleXKeyframes = [1, 0.92, 1.08, 0.95, 1.12];
      
      animations.push(`
        @keyframes whirlwind-y-${lineIdx}-${animationId} {
          0% { transform: translateY(${startY}px) scaleX(1); }
          ${(times[1] * 100).toFixed(1)}% { transform: translateY(${topBounce}px) scaleX(${scaleXKeyframes[1]}); }
          ${(times[2] * 100).toFixed(1)}% { transform: translateY(${topBounce - bounce1}px) scaleX(${scaleXKeyframes[2]}); }
          ${(times[3] * 100).toFixed(1)}% { transform: translateY(${topBounce - bounce2}px) scaleX(${scaleXKeyframes[3]}); }
          100% { transform: translateY(${topBounce - EXPLOSION_OFFSET}px) scaleX(${scaleXKeyframes[4]}); }
        }
      `);
      
      // Анимация для каждой клетки в линии
      const cells = linesRef.current[lineIdx];
      cells.forEach((cell, cellIdx) => {
        animations.push(`
          @keyframes whirlwind-cell-${lineIdx}-${cellIdx}-${animationId} {
            0% { 
              transform: translateX(0px) scale(1) rotate(0deg);
              opacity: 0.85;
            }
            ${(times[1] * 100).toFixed(1)}% { 
              transform: translateX(0px) scale(1) rotate(0deg);
              opacity: 1;
            }
            ${(times[2] * 100).toFixed(1)}% { 
              transform: translateX(${cell.xSpread * 0.5}px) scale(${cell.scale2}) rotate(${cell.rot1}deg);
              opacity: 1;
            }
            ${(times[3] * 100).toFixed(1)}% { 
              transform: translateX(${cell.xSpread}px) scale(${cell.scale3}) rotate(${cell.rot2}deg);
              opacity: 0.7;
            }
            100% { 
              transform: translateX(${cell.xSpread}px) scale(${cell.scaleFinal}) rotate(${cell.rotFinal}deg);
              opacity: 0;
            }
          }
        `);
      });
    }
    
    return animations.join('\n');
  };

  useEffect(() => {
    // Обновляем ID анимации при каждом рендере
    setAnimationId(prev => prev + 1);
  }, []);

  return (
    <>
      <style>{generateCSSAnimations()}</style>
      <div
        className="relative mx-auto whirlwind-container"
        style={{
          width: boardWidth,
          height: boardHeight + EXTRA,
          position: "absolute",
          left: 0,
          top: -EXTRA,
          overflowY: "hidden",
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 8 }).map((_, lineIdx) => {
          const { totalDuration } = lineTimings[lineIdx];
          const cells = linesRef.current[lineIdx];
          
          return (
            <div
              key={lineIdx}
              className="ios-hardware-acceleration"
              style={{
                position: "absolute",
                left: 0,
                width: boardWidth,
                display: "flex",
                justifyContent: "center",
                top: 0,
                animation: `whirlwind-y-${lineIdx}-${animationId} ${totalDuration}s linear forwards`,
              }}
              onAnimationEnd={() => handleLineFinish()}
            >
              {cells.map((cell, cellIdx) => (
                               <img
                 key={cellIdx}
                 src={`/${cell.color}.svg`}
                 alt={cell.color}
                 width={CELL_SIZE}
                 height={CELL_SIZE}
                 className="whirlwind-cell ios-hardware-acceleration"
                 style={{
                   width: CELL_SIZE,
                   height: CELL_SIZE,
                   display: "block",
                   animation: `whirlwind-cell-${lineIdx}-${cellIdx}-${animationId} ${totalDuration}s linear forwards`,
                 }}
               />
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default LoadingSpinnerIOS; 