import React from "react";
import BackgroundAnimation from "@/components/UI/BackgroundAnimation";

interface LoadingScreenProps {
  progress?: {
    loaded: number;
    total: number;
    percentage: number;
  };
  showProgress?: boolean;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  logoPath?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  showProgress = false,
  title = "Fragments",
  subtitle,
  showLogo = true,
  logoPath = "/logo-frame.svg",
}) => {
  return (
    <div className="min-h-screen menu-bg text-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="text-center max-w-md mx-auto px-4 z-10">
        {/* Логотип или название игры */}
        <div className="mb-12">
          {showLogo ? (
            <div className="flex justify-center mb-6">
              <img
                src={logoPath}
                alt="Fragments Logo"
                className="px-3 sm:px-10 max-w-[90%]  drop-shadow-xl"
                style={{
                  WebkitTransform: "translateZ(0)",
                  transform: "translateZ(0)",
                  WebkitBackfaceVisibility: "hidden",
                  backfaceVisibility: "hidden",
                }}
              />
            </div>
          ) : (
            <div className="text-6xl font-bold font-figtree text-white mb-4 tracking-wide text-shadow-md">
              {title}
            </div>
          )}

          {subtitle && (
            <div className="text-2xl font-bold font-figtree text-white mb-4 tracking-wide text-shadow-md">
            {subtitle}
          </div>
          )}
        </div>

        {/* Прогресс бар - показываем только если showProgress = true и есть progress */}
        {showProgress && progress && (
          <>
            <div className="mb-8">
              <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden text-shadow-md">
                <div
                  className="red-gradient h-6 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Процент загрузки */}
            <div className="text-4xl font-extrabold font-figtree text-green-400 mb-4 text-shadow-md">
              {Math.min(progress.percentage, 100)}%
            </div>

            {/* Статус загрузки */}
            <div className="text-xl font-figtree text-white font-bold mb-8 text-shadow-md">
              Loading resources: {Math.min(progress.loaded, progress.total)} of {progress.total} ...
            </div>
          </>
        )}
      </div>
    </div>
  );
};
