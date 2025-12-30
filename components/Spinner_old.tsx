import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

const CELL_SIZE = 43;
const GAP_PX = 2;
const BOARD_SIZE = 8;
const BOARD_HEIGHT = CELL_SIZE * BOARD_SIZE + GAP_PX * (BOARD_SIZE - 1);
const BOARD_WIDTH = CELL_SIZE * BOARD_SIZE + GAP_PX * (BOARD_SIZE - 1);
const START_Y = BOARD_HEIGHT;
const END_Y = -CELL_SIZE + GAP_PX;

// --- ExplodingLine ---
const getExplodingCellParams = (cellIdx: number, lineIdx: number) => {
  // Уникальная траектория для каждой клетки
  const angleSpread = Math.PI / 2; // 90 градусов
  const baseAngle =
    Math.PI / 2 + (cellIdx - 3.5) * (angleSpread / (BOARD_SIZE - 1));
  const randomAngle = baseAngle + (Math.random() - 0.5) * 0.3;
  const distance = 350 + Math.random() * 100;
  const bounceHeight = 60 + Math.random() * 30;
  const flyUp = 40 + Math.random() * 20;
  const rotate = (Math.random() - 0.5) * 180;
  const rotateX = (Math.random() - 0.5) * 60;
  const rotateY = (Math.random() - 0.5) * 60;
  return {
    randomAngle,
    distance,
    bounceHeight,
    flyUp,
    rotate,
    rotateX,
    rotateY,
  };
};

const ExplodingLine = ({
  lineIdx,
  colors,
  left,
  top,
  onExplodeEnd,
}: {
  lineIdx: number;
  colors: string[];
  left: number;
  top: number;
  onExplodeEnd?: () => void;
}) => {
  const finished = useRef(0);
  return (
    <div
      style={{
        position: "fixed",
        left,
        top: top + lineIdx * (CELL_SIZE + GAP_PX),
        width: BOARD_WIDTH,
        height: CELL_SIZE,
        display: "flex",
        gap: GAP_PX,
        pointerEvents: "none",
        perspective: 800,
        zIndex: 99999,
      }}
    >
      {colors.map((color, cellIdx) => {
        const {
          randomAngle,
          distance,
          bounceHeight,
          flyUp,
          rotate,
          rotateX,
          rotateY,
        } = getExplodingCellParams(cellIdx, lineIdx);
        // Ключевые кадры: вверх, дуга вниз, bounce, улёт
        return (
          <motion.img
            key={cellIdx}
            src={`/${color}.svg`}
            alt={color}
            width={CELL_SIZE}
            height={CELL_SIZE}
            initial={{
              x: 0,
              y: 0,
              scale: 1,
              rotate: 0,
              rotateX: 0,
              rotateY: 0,
              opacity: 0.85,
            }}
            animate={{
              x: [
                0,
                0,
                Math.cos(randomAngle) * distance * 0.2,
                Math.cos(randomAngle) * distance,
              ],
              y: [0, -flyUp, bounceHeight, bounceHeight + 40],
              scale: [1, 1, 1.2, 2.2],
              rotate: [0, rotate * 0.3, rotate * 0.7, rotate],
              rotateX: [0, rotateX * 0.3, rotateX * 0.7, rotateX],
              rotateY: [0, rotateY * 0.3, rotateY * 0.7, rotateY],
              opacity: [0.85, 0.95, 0.7, 0],
              transition: {
                duration: 0.85,
                times: [0, 0.25, 0.55, 1],
                ease: ["easeOut", "easeInOut", "easeIn"],
              },
            }}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              display: "block",
              transformStyle: "preserve-3d",
            }}
            onAnimationComplete={() => {
              finished.current += 1;
              if (finished.current === BOARD_SIZE && onExplodeEnd) {
                onExplodeEnd();
              }
            }}
          />
        );
      })}
    </div>
  );
};

// --- Line ---
interface LineProps {
  index: number;
  duration: number;
  delay: number;
  onFinish?: () => void;
  onExplode?: (lineIdx: number, colors: string[]) => void;
}

const Line: React.FC<LineProps> = ({
  index,
  duration,
  delay,
  onFinish,
  onExplode,
}) => {
  const colorsRef = useRef(
    Array.from(
      { length: 8 },
      () => COLORS[Math.floor(Math.random() * COLORS.length)]
    )
  );

  const y = useMotionValue(START_Y);
  const scale = useTransform(
    y,
    [
      START_Y,
      START_Y - (START_Y - END_Y) * 0.3,
      START_Y - (START_Y - END_Y) * 0.5,
      START_Y - (START_Y - END_Y) * 0.7,
      END_Y,
    ],
    [1, 0.92, 1, 0.92, 1]
  );
  const opacity = useTransform(
    y,
    [START_Y, BOARD_HEIGHT, 0, END_Y],
    [0, 1, 1, 0]
  );

  useEffect(() => {
    const controls = animate(y, END_Y, {
      duration,
      delay,
      ease: "linear",
      onComplete: () => {
        if (onExplode) onExplode(index, colorsRef.current);
        if (onFinish) onFinish();
      },
    });
    return controls.stop;
  }, [duration, delay, onFinish, onExplode, index]);

  return (
    <motion.div
      style={{
        y,
        opacity,
        position: "absolute",
        left: 0,
        width: BOARD_WIDTH,
        display: "flex",
        scaleX: scale,
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", gap: GAP_PX }}>
        {colorsRef.current.map((color, i) => (
          <img
            key={i}
            src={`/${color}.svg`}
            alt={color}
            width={CELL_SIZE}
            height={CELL_SIZE}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              display: "block",
              opacity: 0.85,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export const LoadingSpinner: React.FC<{
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  onFinish?: () => void;
}> = ({ width, height, left = 0, top = 0, onFinish }) => {
  const finishedCount = useRef(0);
  const duration = 1;
  const delayBetween =
    duration * ((CELL_SIZE + GAP_PX) / (BOARD_HEIGHT + CELL_SIZE));
  const [explodingLines, setExplodingLines] = useState<
    { lineIdx: number; colors: string[] }[]
  >([]);
  const [explosionDone, setExplosionDone] = useState(false);
  const [allLinesFinished, setAllLinesFinished] = useState(false);

  const handleLineFinish = () => {
    

    finishedCount.current += 1;
    if (finishedCount.current === 8) {
      setAllLinesFinished(true);
    }
  };

  const handleExplode = (lineIdx: number, colors: string[]) => {
    setExplodingLines((prev) => [...prev, { lineIdx, colors }]);
  };

  useEffect(() => {
    if (allLinesFinished && explodingLines.length === 8 && !explosionDone) {
      // Ждём завершения всех ExplodingLine
      // setExplosionDone(true) будет вызван из ExplodingLine
    }
    if (explosionDone && onFinish) {
      onFinish();
    }
  }, [allLinesFinished, explodingLines.length, explosionDone, onFinish]);

  return (
    <div
      className="relative mx-auto"
      style={{
        width: width ?? BOARD_WIDTH,
        height: height ?? BOARD_HEIGHT,
        overflow: "hidden",
      }}
    >
      {/* Линии */}
      {!allLinesFinished &&
        Array.from({ length: 8 }).map((_, index) => (
          <Line
            key={index}
            index={index}
            duration={duration}
            delay={index * delayBetween}
            onFinish={handleLineFinish}
            onExplode={handleExplode}
          />
        ))}
      {/* Слой разлёта */}
      {explodingLines.map(({ lineIdx, colors }, i) => (
        <ExplodingLine
          key={`${lineIdx}-${i}`}
          lineIdx={lineIdx}
          colors={colors}
          left={left}
          top={top}
          onExplodeEnd={() => {
            if (i === 7) setExplosionDone(true);
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;
