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
  };
});
