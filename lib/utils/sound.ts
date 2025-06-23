// Модуль для воспроизведения игровых звуков

import { useSettingsStore } from "@/lib/state/settings";

declare global {
  interface Window {
    __audioBuffers?: Record<string, AudioBuffer>;
    __audioContext?: AudioContext;
  }
}

export const playSound = (src: string) => {
  // Проверяем, включен ли звук
  const enabled =
    typeof window !== "undefined"
      ? window.localStorage.getItem("soundEnabled")
      : null;
  // Если zustand store недоступен (например, вне React), fallback к localStorage
  let soundOn = true;
  try {
    soundOn = useSettingsStore.getState().soundEnabled;
  } catch {
    if (enabled !== null) soundOn = enabled === "true";
  }
  if (!soundOn) return;

  // --- Web Audio API ---
  // @ts-ignore
  const buffers =
    typeof window !== "undefined" ? window.__audioBuffers : undefined;
  // @ts-ignore
  const audioContext =
    typeof window !== "undefined"
      ? window.AudioContext && window.__audioBuffers
        ? window.__audioContext ||
          (window.__audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)())
        : undefined
      : undefined;
  if (buffers && buffers[src] && audioContext) {
    const source = audioContext.createBufferSource();
    source.buffer = buffers[src];
    source.connect(audioContext.destination);
    source.start(0);
    return;
  }

  // --- Audio Pool ---
  // @ts-ignore
  const pool = typeof window !== "undefined" ? window.__audioPool : undefined;
  if (pool && pool[src] && pool[src].length > 0) {
    // Найти свободный (не играющий) Audio
    let audio = pool[src].find((a: HTMLAudioElement) => a.paused || a.ended);
    if (!audio) {
      // Если все заняты — взять первый и сбросить
      audio = pool[src][0];
      audio.pause();
      audio.currentTime = 0;
    }
    audio.currentTime = 0;
    audio.play();
    return;
  }

  // Fallback: старый способ
  const audio = new Audio(src);
  audio.currentTime = 0;
  audio.play();
};

export const playPlacePiece = () => playSound("/audio/place2.wav");
// export const playLineClear = () => playSound('/sounds/clear.mp3');
export const playGameOver = () => playSound('/audio/gameover.wav');
// export const playError = () => playSound('/sounds/error.mp3');
