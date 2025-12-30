import React, { useRef, useEffect } from "react";

interface WhirlwindSpinnerCanvasProps {
  width: number;
  height: number;
  onFinish?: () => void;
  onLineBreakpoint?: (lineIdx: number, rowIdx: number) => void;
}

const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];
const CELL_SIZE = 43;
const GAP_PX = 2;
const BOARD_SIZE = 8;
const FLY_SPEED = 400; // px/sec
const BOUNCE_DURATION = 0.35; // сек
const EXPLOSION_OFFSET = 80; // px
const EXTRA = 400; // запас вверх для анимации

function getCellParams() {
  const xSpread = (Math.random() - 0.5) * 40;
  const rot1 = (Math.random() - 0.5) * 30;
  const rot2 = rot1 + (Math.random() - 0.5) * 60;
  const rotFinal = rot2 + (Math.random() - 0.5) * 90;
  const scale2 = 1.1 + Math.random() * 0.15;
  const scale3 = 1.2 + Math.random() * 0.2;
  const scaleFinal = 1.3 + Math.random() * 0.3;
  return { xSpread, rot1, rot2, rotFinal, scale2, scale3, scaleFinal };
}

function getLineCells() {
  return Array.from({ length: BOARD_SIZE }).map(() => ({
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    ...getCellParams(),
  }));
}

function getAllLines() {
  return Array.from({ length: BOARD_SIZE }).map(() => getLineCells());
}

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

type BounceParams = {
  bounce1: number;
  bounce2: number;
  finalY: number;
};

type LineTiming = {
  flyDuration: number;
  totalDuration: number;
  startY: number;
  topBounce: number;
};

const WhirlwindSpinnerCanvas: React.FC<WhirlwindSpinnerCanvasProps> = ({
  width,
  height,
  onFinish,
  onLineBreakpoint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const linesRef = useRef<SpinnerCell[][]>(getAllLines());
  const bounceParamsRef = useRef<BounceParams[]>(
    Array.from({ length: BOARD_SIZE }).map(() => {
      const bounce1 = 40 + Math.random() * 30;
      const bounce2 = bounce1 + 30 + Math.random() * 20;
      const finalY = bounce2 + 60 + Math.random() * 30;
      return { bounce1, bounce2, finalY };
    })
  );
  const lineTimingsRef = useRef<LineTiming[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const finishedLinesRef = useRef<boolean[]>(Array(BOARD_SIZE).fill(false));
  const triggeredRowsRef = useRef<boolean[][]>(
    Array.from({ length: BOARD_SIZE }).map(() => Array(BOARD_SIZE).fill(false))
  );
  
  // Кэшируем часто используемые константы
  const dprRef = useRef(window.devicePixelRatio || 1);
  const mathPiDiv180Ref = useRef(Math.PI / 180);
  const cellSizeHalfRef = useRef(CELL_SIZE / 2);
  // Для задержки старта каждой линии (эффект "волны")
  const lineDelays = useRef<number[]>(Array.from({ length: BOARD_SIZE }).map((_, i) => i * 0.07)); // 70ms между линиями
  const lineStartTimes = useRef<number[]>(Array(BOARD_SIZE).fill(0));

  // --- SVG ICONS ---
  const imagesRef = useRef<Record<string, HTMLImageElement | null>>({});
  useEffect(() => {
    COLORS.forEach((color) => {
      const img = new window.Image();
      img.src = `/` + color + `.svg`;
      imagesRef.current[color] = img;
    });
  }, []);

  // Перегенерировать данные при изменении размеров
  useEffect(() => {
    const boardHeight = height;
    const START_Y = boardHeight - CELL_SIZE;
    const COMMON_TOP = EXTRA;
    const timings: LineTiming[] = Array.from({ length: BOARD_SIZE }).map((_, lineIdx) => {
      const startY = START_Y + lineIdx * CELL_SIZE + EXTRA;
      const topBounce = COMMON_TOP;
      const flyDistance = Math.abs(startY - topBounce);
      const flyDuration = flyDistance / FLY_SPEED;
      const totalDuration = flyDuration + BOUNCE_DURATION;
      return { flyDuration, totalDuration, startY, topBounce };
    });
    lineTimingsRef.current = timings;
    linesRef.current = getAllLines();
    bounceParamsRef.current = Array.from({ length: BOARD_SIZE }).map(() => {
      const bounce1 = 40 + Math.random() * 30;
      const bounce2 = bounce1 + 30 + Math.random() * 20;
      const finalY = bounce2 + 60 + Math.random() * 30;
      return { bounce1, bounce2, finalY };
    });
    finishedLinesRef.current = Array(BOARD_SIZE).fill(false);
    triggeredRowsRef.current = Array.from({ length: BOARD_SIZE }).map(() => Array(BOARD_SIZE).fill(false));
    startTimeRef.current = null;
    // lineStartTimes: рассчитываем для каждой линии
    lineStartTimes.current = Array.from({ length: BOARD_SIZE }).map(() => 0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
    // eslint-disable-next-line
  }, [width, height]);

  // Основная функция анимации
  function animate(now: number) {
    if (!startTimeRef.current) startTimeRef.current = now;
    const globalStart = startTimeRef.current;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    // Используем кэшированные значения
    const dpr = dprRef.current;
    const mathPiDiv180 = mathPiDiv180Ref.current;
    const cellSizeHalf = cellSizeHalfRef.current;
    const canvas = canvasRef.current;
    const logicalWidth = width;
    const logicalHeight = height + EXTRA;
    if (canvas) {
      if (canvas.width !== logicalWidth * dpr || canvas.height !== logicalHeight * dpr) {
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        canvas.style.width = logicalWidth + "px";
        canvas.style.height = logicalHeight + "px";
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    let allFinished = true;
    for (let lineIdx = 0; lineIdx < BOARD_SIZE; lineIdx++) {
      // Для эффекта волны: задержка старта каждой линии
      const delay = lineDelays.current[lineIdx];
      if (lineStartTimes.current[lineIdx] === 0) {
        lineStartTimes.current[lineIdx] = globalStart + delay * 1000;
      }
      const localElapsed = (now - lineStartTimes.current[lineIdx]) / 1000;
      if (localElapsed < 0) {
        allFinished = false;
        continue; // линия еще не стартовала
      }
      const timing = lineTimingsRef.current[lineIdx];
      const bounce = bounceParamsRef.current[lineIdx];
      const cells = linesRef.current[lineIdx];
      const totalDuration = timing.totalDuration;
      const t = Math.min(1, localElapsed / totalDuration);
      // Ключевые точки для y
      const yKeyframes = [
        timing.startY,
        timing.topBounce,
        timing.topBounce - bounce.bounce1,
        timing.topBounce - bounce.bounce2,
        timing.topBounce - EXPLOSION_OFFSET,
      ];
      const times = [0, timing.flyDuration / totalDuration, 0.7, 0.9, 1];
      function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t;
      }
      function interpKeyframes(keys: number[], times: number[], t: number) {
        for (let i = 1; i < times.length; i++) {
          if (t <= times[i]) {
            const localT = (t - times[i - 1]) / (times[i] - times[i - 1]);
            return lerp(keys[i - 1], keys[i], localT);
          }
        }
        return keys[keys.length - 1];
      }
      const y = interpKeyframes(yKeyframes, times, t);
      const scaleXKeyframes = [1, 0.92, 1.08, 0.95, 1.12];
      const scaleX = interpKeyframes(scaleXKeyframes, times, t);
      for (let cellIdx = 0; cellIdx < BOARD_SIZE; cellIdx++) {
        const cell = cells[cellIdx];
        const xKeyframes = [0, 0, cell.xSpread * 0.5, cell.xSpread, cell.xSpread];
        const x = interpKeyframes(xKeyframes, times, t);
        const scaleKeyframes = [1, 1, cell.scale2, cell.scale3, cell.scaleFinal];
        const scale = interpKeyframes(scaleKeyframes, times, t);
        const rotKeyframes = [0, 0, cell.rot1, cell.rot2, cell.rotFinal];
        const rot = interpKeyframes(rotKeyframes, times, t);
        const opacityKeyframes = [0.85, 1, 1, 0.7, 0];
        const opacity = interpKeyframes(opacityKeyframes, times, t);
        const cellX = cellIdx * (CELL_SIZE + GAP_PX) + cellSizeHalf + x;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(cellX, y);
        ctx.scale(scale * scaleX, scale);
        ctx.rotate(rot * mathPiDiv180);
        const img = imagesRef.current[cell.color];
        if (img && img.complete) {
          ctx.drawImage(img, -cellSizeHalf, -cellSizeHalf, CELL_SIZE, CELL_SIZE);
        } else {
          ctx.fillStyle = cell.color;
          ctx.beginPath();
          ctx.moveTo(-cellSizeHalf + 8, -cellSizeHalf);
          ctx.lineTo(cellSizeHalf - 8, -cellSizeHalf);
          ctx.quadraticCurveTo(cellSizeHalf, -cellSizeHalf, cellSizeHalf, -cellSizeHalf + 8);
          ctx.lineTo(cellSizeHalf, cellSizeHalf - 8);
          ctx.quadraticCurveTo(cellSizeHalf, cellSizeHalf, cellSizeHalf - 8, cellSizeHalf);
          ctx.lineTo(-cellSizeHalf + 8, cellSizeHalf);
          ctx.quadraticCurveTo(-cellSizeHalf, cellSizeHalf, -cellSizeHalf, cellSizeHalf - 8);
          ctx.lineTo(-cellSizeHalf, -cellSizeHalf + 8);
          ctx.quadraticCurveTo(-cellSizeHalf, -cellSizeHalf, -cellSizeHalf + 8, -cellSizeHalf);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        // Вызов onLineBreakpoint при прохождении строки
        const rowYs = Array.from({ length: BOARD_SIZE }).map((_, rowIdx) => EXTRA + rowIdx * CELL_SIZE + rowIdx * GAP_PX);
        for (let rowIdx = 0; rowIdx < BOARD_SIZE; rowIdx++) {
          if (!triggeredRowsRef.current[lineIdx][rowIdx] && y <= rowYs[rowIdx]) {
            triggeredRowsRef.current[lineIdx][rowIdx] = true;
            if (onLineBreakpoint) {
              onLineBreakpoint(lineIdx, rowIdx);
            }
          }
        }
      }
      if (t < 1) {
        allFinished = false;
      } else {
        finishedLinesRef.current[lineIdx] = true;
      }
    }
    if (!allFinished) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (onLineBreakpoint) {
        for (let i = 0; i < BOARD_SIZE; i++) {
          onLineBreakpoint(i, i);
        }
      }
      if (onFinish) {
        onFinish();
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: width,
        height: height + EXTRA,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
};

export default WhirlwindSpinnerCanvas; 