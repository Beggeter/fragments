import React, { useEffect, useState } from "react";
import { Piece } from "./pieces/Piece";

interface LoadingScreenProps {
  progress?: {
    loaded: number;
    total: number;
    percentage: number;
  };
  showProgress?: boolean;
  showLogo?: boolean;
  logoPath?: string;
}

const CELL_COUNT = 16;

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  showProgress = false,
  showLogo = true,
  logoPath = "/logo-frame.svg",
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (!showProgress) return;

    const ANIMATION_DURATION = 700; // 2 секунды на полное заполнение
    const INTERVAL = ANIMATION_DURATION / CELL_COUNT; // 250ms на каждую клетку

    const interval = setInterval(() => {
      setAnimatedProgress((prev) => {
        const newProgress = prev + 100 / CELL_COUNT;

        // Если достигли 100%, начинаем заново
        if (newProgress > 100) {
          return 0;
        }

        return newProgress;
      });
    }, INTERVAL);

    return () => clearInterval(interval);
  }, [showProgress]);

  // Вычисляем количество заполненных клеток на основе анимированного прогресса
  const filledCells = Math.min(
    Math.floor((animatedProgress / 100) * CELL_COUNT),
    CELL_COUNT
  );

  return (
    <div className="min-h-screen menu-bg text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="text-center max-w-md mx-auto px-4 z-10">
        {/* Логотип */}
        {showLogo && (
          <div className="flex justify-center mb-16">
            <img
              src={logoPath}
              alt="Fragments Logo"
              className="px-3 sm:px-10 max-w-[90%] drop-shadow-xl"
              style={{
                WebkitTransform: "translateZ(0)",
                transform: "translateZ(0)",
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
              }}
            />
          </div>
        )}

        {/* Прогресс бар */}
        {/* {showProgress && progress && (
          <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden text-shadow-md mb-6">
            <div
              className="red-gradient h-6 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
          </div>
        )} */}

        {/* Прогресс бар */}
        <div className="flex justify-center w-full">
          <div className="relative z-10 h-full grid grid-cols-16 grid-rows-1 gap-0.5 w-full max-w-[90%] bg-gray-800/50 backdrop-blur-md rounded-md">
            {Array.from({ length: CELL_COUNT }, (_, index) => {
              const isFilled = index < filledCells;
              return (
                <div
                  key={index}
                  className="rounded-[3px] bg-gray-900 relative w-full"
                  style={{ paddingBottom: "100%" }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isFilled && <Piece color="pink" size="100%" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
