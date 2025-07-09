import { useEffect } from "react";
import { useGameStore } from "../lib/state/store";
import { BLOCK_COLORS } from "../lib/data/types";
import { playGameOver } from "../lib/utils/sound";

interface UseGameOverProps {
  onGameOver: () => void;
  width?: number;
  height?: number;
}

const CELL_FILL_INTERVAL = 40;


export const useGameOver = ({
  onGameOver,
  width = 8,
  height = 8,
}: UseGameOverProps) => {
  const { setOnGameOver } = useGameStore();

  useEffect(() => {
    const gameOverHandler = () => {
      const { board } = useGameStore.getState();

      // Находим все пустые клетки
      const emptyCells: { x: number; y: number }[] = [];
      board.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell.value === 0) {
            emptyCells.push({ x, y });
          }
        });
      });

      // Перемешиваем массив для случайного порядка заполнения
      const shuffledCells = [...emptyCells].sort(() => Math.random() - 0.5);

      let currentIndex = 0;
      const fillInterval = setInterval(() => {
        if (currentIndex >= shuffledCells.length) {
          clearInterval(fillInterval);

          setTimeout(() => {
            playGameOver();
            onGameOver();
          }, 300);

          return;
        }

        const { x, y } = shuffledCells[currentIndex];
        const randomColor =
          BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];

        // Обновляем одну клетку за раз, используя функциональное обновление
        useGameStore.setState((state) => {
          const newBoard = state.board.map((row, rowIndex) =>
            rowIndex === y
              ? row.map((cell, colIndex) =>
                  colIndex === x ? { value: 1, color: randomColor } : cell
                )
              : row
          );
          return { board: newBoard };
        });

        currentIndex++;
      }, CELL_FILL_INTERVAL); // Интервал между добавлением клеток
    };

    setOnGameOver(gameOverHandler);

    return () => {
      setOnGameOver(null);
    };
  }, [onGameOver, setOnGameOver, width, height]);
};
