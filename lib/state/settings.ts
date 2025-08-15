import { create } from "zustand";
import { vibrate } from "@/utils/helpers";
import i18n from "@/lib/lang/i18n";

interface SettingsState {
  vibrationValue: number;
  setVibrationValue: (value: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  fullscreenEnabled: boolean;
  setFullscreenEnabled: (enabled: boolean) => void;
  setLanguage: (lang: string) => void;
  // Настройки производительности
  performanceMode: 'high' | 'medium' | 'low';
  setPerformanceMode: (mode: 'high' | 'medium' | 'low') => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  // Инициализируем настройки из localStorage
  const getInitialFullscreenEnabled = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fullscreenEnabled");
      return saved !== null ? saved === "true" : true; // По умолчанию включен
    }
    return true;
  };

  const getInitialPerformanceMode = (): 'high' | 'medium' | 'low' => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("performanceMode") as 'high' | 'medium' | 'low';
      if (saved) return saved;
      
      // Автоопределение на основе устройства
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
      
      if (isMobile && isLowEnd) return 'low';
      if (isMobile) return 'medium';
      return 'high';
    }
    return 'medium';
  };

  const getInitialAnimationsEnabled = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("animationsEnabled");
      if (saved !== null) return saved === "true";
      
      // Отключаем анимации на слабых устройствах
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
      return !(isMobile && isLowEnd);
    }
    return true;
  };

  return {
    vibrationValue: 40,
    setVibrationValue: (value) => {
      vibrate(value);
      set({ vibrationValue: value });
    },
    soundEnabled: true,
    setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    fullscreenEnabled: getInitialFullscreenEnabled(),
    setFullscreenEnabled: (enabled) => {
      // Управляем полноэкранным режимом Telegram WebApp
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (enabled && tg.requestFullscreen && !tg.isFullscreen) {
          tg.requestFullscreen();
        } else if (!enabled && tg.exitFullscreen && tg.isFullscreen) {
          tg.exitFullscreen();
        }
      }
      
      // Сохраняем настройку
      if (typeof window !== "undefined") {
        localStorage.setItem("fullscreenEnabled", enabled.toString());
      }
      
      set({ fullscreenEnabled: enabled });
    },
    setLanguage: (lang) => {
      i18n.changeLanguage(lang);
      if (typeof window !== "undefined") {
        localStorage.setItem("language", lang);
      }
      set({}); // если надо, можешь и состояние хранить, но можно и без
    },
    // Настройки производительности
    performanceMode: getInitialPerformanceMode(),
    setPerformanceMode: (mode) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("performanceMode", mode);
      }
      // Автоматически настраиваем анимации в зависимости от режима
      const animationsEnabled = mode !== 'low';
      if (typeof window !== "undefined") {
        localStorage.setItem("animationsEnabled", animationsEnabled.toString());
      }
      set({ performanceMode: mode, animationsEnabled });
    },
    animationsEnabled: getInitialAnimationsEnabled(),
    setAnimationsEnabled: (enabled) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("animationsEnabled", enabled.toString());
      }
      set({ animationsEnabled: enabled });
    },
  };
});
