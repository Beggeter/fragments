import { create } from "zustand";
import { vibrate } from "@/utils/helpers";
import i18n from "@/lib/lang/i18n";

interface SettingsState {
  vibrationValue: number;
  setVibrationValue: (value: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  return {
    vibrationValue: 40,
    setVibrationValue: (value) => {
      vibrate(value);
      set({ vibrationValue: value });
    },
    soundEnabled: true,
    setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    setLanguage: (lang) => {
      i18n.changeLanguage(lang);
      if (typeof window !== "undefined") {
        localStorage.setItem("language", lang);
      }
      set({}); // если надо, можешь и состояние хранить, но можно и без
    },
  };
});
