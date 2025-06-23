import { create } from 'zustand';
import { vibrate } from '@/utils/helpers';

interface SettingsState {
  vibrationValue: number;
  setVibrationValue: (value: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  // Здесь можно добавить другие настройки
}

export const useSettingsStore = create<SettingsState>((set) => ({
  vibrationValue: 40,
  setVibrationValue: (value) => {
    vibrate(value);
    set({ vibrationValue: value });
  },
  soundEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
})); 