"use client";

import React from "react";
import MenuButton from "@/components/UI/MenuButton";
import { useSettingsStore } from "@/lib/state/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart?: () => void;
  onGoHome?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  onGoHome,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="relative fade-in-animation-fast bg-blue-600/20 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-6 text-4xl text-white hover:text-gray-300 focus:outline-none"
          onClick={onClose}
          aria-label="Close settings"
        >
          ×
        </button>
        <h2 className="mb-8 text-4xl font-bold tracking-wide text-white font-figtree menu-shadow">
          Settings
        </h2>
        <div className="grid grid-cols-2 gap-8 w-full mb-8">
          <div
            className="bg-gray-800/20 backdrop-blur-xl rounded-xl px-6 py-4 flex
           flex-col gap-4 items-center justify-center min-h-[120px]"
          >
            <div className="flex justify-center items-center w-full">
              <span className="text-xl font-semibold text-white font-fig">
                Vibrate
              </span>
            </div>
            <div className="flex gap-4 items-center w-full">
              <input
                type="range"
                min={10}
                max={100}
                value={vibration}
                step={10}
                className="w-full accent-green-500 custom-range"
                onChange={(e) => handleVibrChange(e.target.value)}
              />
            </div>
          </div>
          <div
            className="flex items-center justify-center bg-gray-800/20 backdrop-blur-xl rounded-xl min-h-[120px]"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <button
              className="flex justify-center items-center p-0 bg-transparent border-none transition-all"
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
        <div className="flex flex-col gap-4 items-center  w-full">
          {onGoHome && (
            <MenuButton
              text="Home"
              gradientClass="settings-gradient"
              className="rounded-3xl px-8 py-4 font-bold w-[80%]"
              textClasses="font-extrabold  text-3xl"
              onClick={onGoHome}
            />
          )}
          {onRestart && (
            <MenuButton
              text="Restart"
              gradientClass="settings-gradient "
              className="rounded-3xl px-8 py-4 font-bold w-[80%]"
              textClasses="font-extrabold  text-3xl"
              onClick={onRestart}
            />
          )}
          <MenuButton
            text="Close"
            gradientClass="settings-gradient"
            className="rounded-3xl px-8 py-4 font-bold w-[80%]"
            textClasses="font-extrabold  text-3xl"
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
