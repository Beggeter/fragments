"use client";

import React from "react";
import MenuButton from "@/components/UI/MenuButton";
import { useSettingsStore } from "@/lib/state/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRestart,
}) => {
  const vibration = useSettingsStore((state) => state.vibrationValue);
  const setVibration = useSettingsStore((state) => state.setVibrationValue);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);

  if (!isOpen) return null;
  const handleVibrChange = (vibr: string) => {
    const value = Number(vibr);
    setVibration(value);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center min-h-screen w-full bg-black/40"
      style={{ zIndex: 9999 }}
    >
      <div
        className="flex flex-col items-center gap-10 h-[60%] min-h-fit max-w-md
       w-[90vw] bg-[var(--game-background)] rounded-3xl p-8 shadow-2xl border-2 border-gray-700 relative"
      >
        <button
          className="absolute top-4 right-4 text-3xl text-white hover:text-gray-300 focus:outline-none"
          onClick={onClose}
          aria-label="Close settings"
        >
          ×
        </button>
        <h2 className="text-4xl font-bold font-figtree text-white mb-4 tracking-wide menu-shadow">
          Settings
        </h2>
        <div className="grid grid-cols-2 gap-8 w-full">
          <div
            className="bg-gray-800 rounded-xl px-6 py-4 flex
           flex-col gap-4 items-center justify-center min-h-[120px]"
          >
            <div className="flex w-full justify-center items-center ">
              <span className="text-xl text-white font-semibold">Vibrate</span>
            </div>
            <div className="flex w-full items-center gap-4">
              <input
                type="range"
                min={10}
                max={100}
                value={vibration}
                step={10}
                className="w-full accent-green-500  custom-range"
                onChange={(e) => handleVibrChange(e.target.value)}
              />
            </div>
          </div>
          <div
            className="flex items-center justify-center bg-gray-800 rounded-xl min-h-[120px]"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <button
              className="p-0 bg-transparent border-none flex items-center justify-center transition-all"
              aria-label="Toggle sound"
              style={{ boxShadow: "none" }}
            >
              <img
                src={soundEnabled ? "/soundon.svg" : "/soundoff.svg"}
                alt={soundEnabled ? "Sound on" : "Sound off"}
                className={`w-15 h-15 transition-filter duration-500 ${
                  !soundEnabled
                    ? "drop-shadow-[0_0_7px_#fc3b2d]"
                    : "drop-shadow-[0_0_7px_#22c55e]"
                }`}
                draggable={false}
                style={{ background: "none" }}
              />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full items-center pt-6">
          {onRestart && (
            <MenuButton
              text="Restart"
              gradientClass="green-gradient"
              className="rounded-3xl px-8 py-4 font-bold w-[60%]"
              textClasses="font-black italic text-3xl"
              onClick={onRestart}
            />
          )}
          <MenuButton
            text="Close"
            gradientClass="red-gradient"
            className="rounded-3xl px-8 py-4 font-bold w-[60%] mt-4"
            textClasses="font-black italic text-3xl"
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
