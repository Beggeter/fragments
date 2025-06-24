import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

const COLORS = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
];

const CELL_SIZE = 43;
const GAP_PX = 2;
const BOARD_SIZE = 8;
const BOARD_HEIGHT = CELL_SIZE * BOARD_SIZE + GAP_PX * (BOARD_SIZE - 1);
const BOARD_WIDTH = CELL_SIZE * BOARD_SIZE + GAP_PX * (BOARD_SIZE - 1);
const START_Y = BOARD_HEIGHT; // Начинаем ровно под полем
const END_Y = -CELL_SIZE + GAP_PX; // Заканчиваем, когда верх линии совпадает с верхом поля


const ROW_Y = (row: number) => -(row * (CELL_SIZE + GAP_PX));

interface LineProps {
  index: number;
  duration: number;
  delay: number;
  onFinish?: () => void;
}

const Line: React.FC<LineProps> = ({ index, duration, delay, onFinish }) => {
  const colorsRef = useRef(
    Array.from({ length: 8 }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
  );

  const y = useMotionValue(START_Y);
  const scale = useTransform(
    y,
    [
      START_Y,
      START_Y - (START_Y - END_Y) * 0.3, // к 3-й линии
      START_Y - (START_Y - END_Y) * 0.5, // к 5-й линии
      START_Y - (START_Y - END_Y) * 0.7, // к 7-й линии
      END_Y // к 10-й линии
    ],
    [1, 0.92, 1, 0.92, 1] // ← здесь 0.92 — степень уменьшения, меняйте для скорости/глубины
  );
  const opacity = useTransform(y, [START_Y, BOARD_HEIGHT, 0, END_Y], [0, 1, 1, 0]);

  useEffect(() => {
    const controls = animate(y, END_Y, {
      duration,
      delay,
      ease: 'linear',
      onComplete: onFinish,
    });
    return controls.stop;
  }, [duration, delay, onFinish]);

  return (
    <motion.div
      style={{
        y,
        opacity,
        position: 'absolute',
        left: 0,
        width: BOARD_WIDTH,
        display: 'flex',
        scaleX: scale,
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: GAP_PX }}>
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
              display: 'block',
              opacity: 0.85
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export const LoadingSpinner: React.FC<{ onFinish?: () => void }> = ({ onFinish }) => {
  const finishedCount = useRef(0);
  const duration = 1;
  const delayBetween = duration * ((CELL_SIZE + GAP_PX) / (BOARD_HEIGHT + CELL_SIZE));

  const handleLineFinish = () => {
    finishedCount.current += 1;
    if (finishedCount.current === 8 && onFinish) {
      onFinish();
    }
  };

  return (
    <div
      className="relative mx-auto"
      style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, overflow: 'hidden' }}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <Line
          key={index}
          index={index}
          duration={duration}
          delay={index * delayBetween}
          onFinish={handleLineFinish}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner; 