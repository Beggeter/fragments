import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useState, useEffect } from "react";

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

// Вынесем параметры скорости и длительности наверх, чтобы использовать их в обоих компонентах
const FLY_SPEED = 400; // px/sec (можно подстроить)
const BOUNCE_DURATION = 0.35; // сек, длительность взрыва
const EXPLOSION_OFFSET = 40; // px, насколько выше поля будет взрыв

type LineProps = {
  lineIdx: number;
  cells: SpinnerCell[];
  onFinish: () => void;
  startY: number;
  topBounce: number;
  bounce1: number;
  bounce2: number;
  finalY: number;
  boardWidth: number;
  flyDuration: number; // индивидуальная длительность полёта
  totalDuration: number; // индивидуальная общая длительность
};

const Line = ({
  lineIdx,
  cells,
  onFinish,
  startY,
  topBounce,
  bounce1,
  bounce2,
  finalY,
  boardWidth,
  flyDuration,
  totalDuration,
  onLineBreakpoint,
}: LineProps & {
  onLineBreakpoint?: (lineIdx: number, rowIdx: number) => void;
}) => {
  const [clearedLines, setClearedLines] = useState();
  // Временные точки анимации
  const frac = flyDuration / totalDuration;
  const times = [0, frac, frac + 0.25 * (1 - frac), frac + 0.6 * (1 - frac), 1];
  const yKeyframes = [
    startY, // старт
    topBounce, // долетели до верха
    topBounce - bounce1, // первый прыжок
    topBounce - bounce2, // второй прыжок
    topBounce - EXPLOSION_OFFSET, // взрыв чуть выше поля
  ];

  // --- scaleX: брейкпоинты на строках поля с учётом EXTRA ---
  const y = useMotionValue(startY);
  // Получаем те же y3, y5, y7, что и в родителе
  const EXTRA = 200;
  const getRowY = (rowIdx: number) =>
    EXTRA + rowIdx * CELL_SIZE + rowIdx * GAP_PX;
  const y3 = getRowY(2);
  const y5 = getRowY(4);
  const y7 = getRowY(6);
  // breakpoints теперь от нижней к верхней
  const breakpoints = [y7, y5, y3];
  // scaleXKeyframes соответствуют новым брейкпоинтам
  const scaleXKeyframes = [1, 0.92, 1.08, 0.95, 1.12];
  const flyDistance = startY - topBounce;
  // times для scaleX:
  const scaleXTimes = [
    0,
    ...breakpoints.map((yN) => {
      const progress = (startY - yN) / flyDistance;
      const tN = progress * flyDuration;
      return tN / totalDuration;
    }),
    1,
  ].sort((a, b) => a - b);

  // Логирование для отладки анимации
  // console.log(`Line ${lineIdx}:`);
  // console.log('  startY:', startY);
  // console.log('  topBounce:', topBounce);
  // console.log('  finalY:', finalY);
  // console.log('  topBounce - finalY:', topBounce - finalY);
  // console.log('  breakpoints:', breakpoints);
  // console.log('  scaleXTimes:', scaleXTimes);

  const scaleX = useTransform(
    y,
    [startY, ...breakpoints, topBounce - EXPLOSION_OFFSET],
    scaleXKeyframes
  );

  // --- добавляю вызов onLineBreakpoint для всех 8 строк ---
  const triggeredRowsRef = useRef(Array(8).fill(false));
  const rowYs = Array.from({ length: 8 }).map(
    (_, rowIdx) => EXTRA + rowIdx * CELL_SIZE + rowIdx * GAP_PX
  );

  useEffect(() => {
    const controls = animate(y, yKeyframes[yKeyframes.length - 1], {
      duration: totalDuration,
      ease: "linear",
      onUpdate: (latestY) => {
        rowYs.forEach((rowY, rowIdx) => {
          if (!triggeredRowsRef.current[rowIdx] && latestY <= rowY) {
            triggeredRowsRef.current[rowIdx] = true;
            if (onLineBreakpoint) {
              if (lineIdx != rowIdx) {
                onLineBreakpoint(lineIdx, rowIdx);
              }
            }
          }
        });
      },
      onComplete: () => {
        if (onFinish) onFinish();
      },
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      style={{
        position: "absolute",
        left: 0,
        width: boardWidth,
        display: "flex",
        justifyContent: "center",
        top: 0,
        y,
        scaleX,
      }}
      initial={false}
      animate={false}
      onAnimationComplete={() => {
        // Используем setTimeout чтобы избежать вызова setState во время рендеринга
        setTimeout(() => {
          onFinish();
        }, 0);
      }}
    >
      {cells.map((cell, i) => (
        <motion.img
          key={i}
          src={`/${cell.color}.svg`}
          alt={cell.color}
          width={CELL_SIZE}
          height={CELL_SIZE}
          initial={{
            y: 0,
            x: 0,
            scale: 1,
            rotate: 0,
            opacity: 0.85,
          }}
          animate={{
            x: [0, 0, cell.xSpread * 0.5, cell.xSpread, cell.xSpread],
            scale: [1, 1, cell.scale2, cell.scale3, cell.scaleFinal],
            rotate: [0, 0, cell.rot1, cell.rot2, cell.rotFinal],
            opacity: [0.85, 1, 1, 0.7, 0],
          }}
          transition={{
            duration: totalDuration,
            times,
            ease: ["easeIn", "linear", "easeOut", "easeInOut", "easeIn"],
            delay: 0, // все линии стартуют одновременно
          }}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            display: "block",
            opacity: 0.85,
          }}
        />
      ))}
    </motion.div>
  );
};

type LoadingSpinnerProps = {
  width?: number;
  height?: number;
  startYOffset?: number;
  onFinish?: () => void;
  onLineBreakpoint?: (lineIdx: number, rowIdx: number) => void;
};

// Для отладки: показывать ли горизонтальные линии на брейкпоинтах
const SHOW_DEBUG_LINES = false;

export const LoadingSpinner = ({
  width,
  height,
  startYOffset = 0,
  onFinish,
  onLineBreakpoint,
}: LoadingSpinnerProps) => {
  const [finishedCount, setFinishedCount] = useState(0);
  const boardHeight = height ?? 0;
  const boardWidth = width ?? 0;
  const EXTRA = 200; // запас вверх для анимации

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
  const END_Y = -CELL_SIZE + GAP_PX;

  // Все линии летят до одной и той же верхней границы (EXTRA)
  const COMMON_TOP = EXTRA;
  const lineTimings = Array.from({ length: 8 }).map((_, lineIdx) => {
    const startY = START_Y + lineIdx * CELL_SIZE + EXTRA;
    const topBounce = COMMON_TOP;
    const flyDistance = Math.abs(startY - topBounce);
    const flyDuration = flyDistance / FLY_SPEED;
    const totalDuration = flyDuration + BOUNCE_DURATION;
    return { flyDuration, totalDuration, startY, topBounce };
  });

  // --- DEBUG LINES ---
  const getRowY = (rowIdx: number) =>
    EXTRA + rowIdx * CELL_SIZE + rowIdx * GAP_PX;
  const y3 = getRowY(2);
  const y5 = getRowY(4);
  const y7 = getRowY(6);

  const handleLineFinish = () => {
    setFinishedCount((prev) => {
      const next = prev + 1;
      if (next === 8 && onFinish) {
        // Используем setTimeout чтобы избежать вызова setState во время рендеринга
        setTimeout(() => {
          onFinish();
        }, 0);
      }
      return next;
    });
  };

  return (
    <div
      className="relative mx-auto"
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
      {/* DEBUG: горизонтальные линии на брейкпоинтах */}
      {SHOW_DEBUG_LINES && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              width: "100%",
              height: 2,
              background: "red",
              top: y3,
              zIndex: 9999,
              pointerEvents: "none",
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              width: "100%",
              height: 2,
              background: "lime",
              top: y5,
              zIndex: 9999,
              pointerEvents: "none",
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              width: "100%",
              height: 2,
              background: "blue",
              top: y7,
              zIndex: 9999,
              pointerEvents: "none",
              opacity: 0.7,
            }}
          />
        </>
      )}
      {Array.from({ length: 8 }).map((_, lineIdx) => {
        const { flyDuration, totalDuration, startY, topBounce } =
          lineTimings[lineIdx];
        return (
          <Line
            key={lineIdx}
            lineIdx={lineIdx}
            cells={linesRef.current[lineIdx]}
            onFinish={handleLineFinish}
            startY={startY}
            topBounce={topBounce}
            {...bounceParamsRef.current[lineIdx]}
            boardWidth={boardWidth}
            flyDuration={flyDuration}
            totalDuration={totalDuration}
            onLineBreakpoint={onLineBreakpoint}
          />
        );
      })}
    </div>
  );
};

export default LoadingSpinner;
