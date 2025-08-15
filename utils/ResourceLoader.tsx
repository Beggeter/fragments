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

// --- Audio Pool ---
const AUDIO_FILES = [
  '/audio/place2.wav',
  '/audio/gameover.wav',
  '/audio/click.wav',
];
const AUDIO_POOL_SIZE = 4;

function createAudioPool() {
  const pool: Record<string, HTMLAudioElement[]> = {};
  AUDIO_FILES.forEach((src) => {
    pool[src] = [];
    for (let i = 0; i < AUDIO_POOL_SIZE; i++) {
      const audio = new window.Audio(src);
      audio.preload = 'auto';
      pool[src].push(audio);
    }
  });
  // @ts-ignore
  window.__audioPool = pool;
}

// --- Web Audio API ---
let audioContext: AudioContext | null = null;
async function loadAndDecodeAudio(src: string): Promise<AudioBuffer | null> {
  if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  try {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.warn('Failed to load/decode audio', src, e);
    return null;
  }
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
      const MIN_LOADING_TIME = 1000;
      // ✅ ИСПРАВЛЕНИЕ: Максимальное время ожидания при медленном интернете
      const MAX_LOADING_TIME = 10000; // 10 секунд максимум

      // ✅ ИСПРАВЛЕНИЕ: Только критические ресурсы для первоначальной загрузки
      const criticalResources = [
        ...colors.map((color) => `/${color}.svg`),
        "/logo-frame.svg",
        "/infinity.svg",
        "/stars.svg",
        "/cart.svg",
        "/gift.svg",
        "/record.png",
      ];

      // Некритические ресурсы загружаются в фоне
      const nonCriticalResources = [
        "/boosters/back.png",
        "/boosters/bomb.svg",
        "/boosters/whirlwind.svg",
        "/crystal.svg",
        "/2crystals.svg",
        "/3crystals.svg",
        "/4crystals.svg",
        "/9crystals.svg",
        "/powerups.svg",
        "/settings.svg",
        "/bullseye.svg",
        "/globe.svg",
        "/window.svg",
        "/file.svg",
        "/lh.svg",
        "/romn.svg",
        "/replay.svg",
        "/vibrateon.svg",
        "/vibrateoff.svg",
        "/soundon.svg",
        "/soundoff.svg",
        "/web-app-manifest-192x192.png",
        "/web-app-manifest-512x512.png",
        "/icon-192x192.png",
        "/apple-icon.png",
        "/favicon.ico",
        "/icon0.svg",
        "/icon1.png",
      ];

      setProgress({
        loaded: 0,
        total: criticalResources.length,
        percentage: 0,
      });

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

      // ✅ ИСПРАВЛЕНИЕ: Загружаем ресурсы с timeout
      const loadWithTimeout = (src: string, timeout: number = 5000) => {
        return Promise.race([
          new Promise<void>((resolve, reject) => {
            const isImage = /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(src);
            
            if (isImage) {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => reject(new Error(`Failed to load: ${src}`));
              img.src = src;
            } else {
              fetch(src)
                .then(() => resolve())
                .catch(reject);
            }
          }),
          new Promise<void>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);
      };

      try {
        // ✅ ИСПРАВЛЕНИЕ: Загружаем критические ресурсы с коротким timeout
        const criticalPromises = criticalResources.map(async (src) => {
          try {
            await loadWithTimeout(src, 3000); // 3 секунды на каждый критический ресурс
            updateProgress(true);
          } catch (error) {
            console.warn(`Failed to load critical resource: ${src}`, error);
            updateProgress(false); // Продолжаем даже при ошибках
          }
        });

        // ✅ ИСПРАВЛЕНИЕ: Используем Promise.allSettled вместо Promise.all
        await Promise.allSettled(criticalPromises);

        // ✅ ИСПРАВЛЕНИЕ: Создаём аудиопул только если есть поддержка
        try {
          createAudioPool();
        } catch (error) {
          console.warn('Failed to create audio pool:', error);
        }

        // ✅ ИСПРАВЛЕНИЕ: Загружаем аудио асинхронно, не блокируя UI
        setTimeout(async () => {
          try {
            const buffers: Record<string, AudioBuffer> = {};
            for (const src of AUDIO_FILES) {
              try {
                const buf = await loadAndDecodeAudio(src);
                if (buf) buffers[src] = buf;
              } catch (error) {
                console.warn(`Failed to load audio: ${src}`, error);
              }
            }
            // @ts-ignore
            window.__audioBuffers = buffers;
          } catch (error) {
            console.warn('Failed to load audio resources:', error);
          }
        }, 100);

        // ✅ ИСПРАВЛЕНИЕ: Загружаем некритические ресурсы в фоне после показа UI
        setTimeout(() => {
          nonCriticalResources.forEach(async (src) => {
            try {
              await loadWithTimeout(src, 8000); // Больше времени для некритических
            } catch (error) {
              console.warn(`Failed to load non-critical resource: ${src}`, error);
            }
          });
        }, 500);

        // ✅ ИСПРАВЛЕНИЕ: Ждем минимальное время, но не превышаем максимальное
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < MIN_LOADING_TIME && elapsedTime < MAX_LOADING_TIME) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(MIN_LOADING_TIME - elapsedTime, MAX_LOADING_TIME - elapsedTime))
          );
        }

        setIsLoading(false);
        onLoadingComplete();
      } catch (error) {
        console.error("Error loading resources:", error);
        // ✅ ИСПРАВЛЕНИЕ: Всегда продолжаем работу приложения
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
