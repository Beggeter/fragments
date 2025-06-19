import React, { useEffect, useState } from "react";
import { BlockColor } from "../lib/data/types";
import { LoadingScreen } from "../components/LoadingScreen";

interface ResourceLoaderProps {
  colors: BlockColor[];
  onLoadingComplete: () => void;
  children: React.ReactNode;
}

interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const ResourceLoader: React.FC<ResourceLoaderProps> = ({
  colors,
  onLoadingComplete,
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<LoadingProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });

  useEffect(() => {
    const loadResources = async () => {
      const startTime = Date.now();
      const MIN_LOADING_TIME = 1000; // Минимальное время показа загрузки

      // Список всех ресурсов для загрузки
      const resources = [
        // SVG блоки
        ...colors.map((color) => `/${color}.svg`),
        // Бустеры
        "/boosters/back.png",
        "/boosters/laser.png",
        "/boosters/spinner.png",
        // Основные UI элементы
        "/logo-frame.svg",
        "/stars.svg",
        "/powerups.svg",
        "/settings.svg",
        "/cart.svg",
        "/bullseye.svg",
        "/infinity.svg",
        "/globe.svg",
        "/window.svg",
        "/file.svg",
        "/lh.svg",
        "/romn.svg",
        // PWA иконки
        "/web-app-manifest-192x192.png",
        "/web-app-manifest-512x512.png",
        "/icon-192x192.png",
      
        // Дополнительные иконки
        "/apple-icon.png",
        "/favicon.ico",
        "/icon0.svg",
        "/icon1.png",
        // Telegram Web App ресурсы
        "https://telegram.org/js/telegram-web-app.js",
      ];

      setProgress({
        loaded: 0,
        total: resources.length,
        percentage: 0,
      });

      // Функция для обновления прогресса
      const updateProgress = (success: boolean = true) => {
        setProgress((prev) => {
          const newLoaded = Math.min(prev.loaded + 1, prev.total);
          const newPercentage = Math.min(
            Math.round((newLoaded / prev.total) * 100),
            100
          );
          return {
            loaded: newLoaded,
            total: prev.total,
            percentage: newPercentage,
          };
        });
      };

      const loadPromises = resources.map((src) => {
        return new Promise<void>((resolve) => {
          // Определяем тип ресурса
          const isImage = /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(src);
          const isScript = /\.js$/i.test(src) || src.includes('telegram.org');
          
          if (isImage) {
            const img = new Image();
            
            img.onload = () => {
              updateProgress(true);
              resolve();
            };
            
            img.onerror = () => {
              console.warn(`Failed to load image: ${src}`);
              updateProgress(false);
              resolve();
            };
            
            img.src = src;
          } else if (isScript) {
            // Для скриптов просто считаем как загруженные
            updateProgress(true);
            resolve();
          } else {
            // Для остальных ресурсов используем fetch
            fetch(src)
              .then(() => {
                updateProgress(true);
                resolve();
              })
              .catch(() => {
                console.warn(`Failed to load resource: ${src}`);
                updateProgress(false);
                resolve();
              });
          }
        });
      });

      try {
        await Promise.all(loadPromises);

        // Ждем минимальное время показа загрузки
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < MIN_LOADING_TIME) {
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_LOADING_TIME - elapsedTime)
          );
        }

        setIsLoading(false);
        onLoadingComplete();
      } catch (error) {
        console.error("Error loading resources:", error);
        // Даже при ошибках продолжаем игру
        setIsLoading(false);
        onLoadingComplete();
      }
    };

    loadResources();
  }, [colors, onLoadingComplete]);

  if (isLoading) {
    return <LoadingScreen progress={progress} showProgress={true} />;
  }

  return <>{children}</>;
};
