"use client";

import React from "react";
import SettingsButton from "@/components/UI/SettingsButton";
import { useSettingsStore } from "@/lib/state/settings";
import cart from "@/public/cart.svg";
import home from "@/public/home.svg";
import replay from "@/public/replay.svg";

interface ToggleSwitchProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isEnabled, onToggle }) => {
  // Базовые размеры
  const containerHeight = "2rem"; // 32px
  const containerWidth = "4rem"; // 56px (соотношение ~1.75:1)
  const thumbSize = "1.5rem"; // 24px (75% от высоты контейнера)
  const padding = "0.3rem"; // 4px отступ

  // Расчет позиции
  const translateDistance = `calc(${containerWidth} - ${thumbSize} - ${padding} * 2)`;

  return (
    <div className="flex items-center">
      <div
        className={`rounded-full transition-colors duration-300 flex items-center backdrop-blur-lg border border-white/20 ${
          isEnabled
            ? "bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
            : "bg-red-600/20"
        }`}
        style={{
          width: containerWidth,
          height: containerHeight,
          padding: padding,
        }}
      >
        <div
          className="bg-white rounded-full transition-transform ease-[linear(0,_0.709_15.6%,_0.929_24.2%,_1.064_33.4%,_1.119_41.6%,_1.131_50.8%,_1.019_84%,_1)] duration-300 transform shadow-lg"
          style={{
            width: thumbSize,
            height: thumbSize,
            transform: isEnabled
              ? `translateX(${translateDistance})`
              : "translateX(0)",
          }}
        />
      </div>
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart?: () => void;
  onGoHome?: () => void;
  onOpenShop?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  onGoHome,
  onOpenShop,
}) => {
  const vibration = useSettingsStore((state) => state.vibrationValue);
  const setVibration = useSettingsStore((state) => state.setVibrationValue);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);

  // Вибрация только вкл/выкл
  const vibrationEnabled = vibration > 0;
  const handleVibrationToggle = () => {
    setVibration(vibrationEnabled ? 0 : 55);
  };

  if (!isOpen) return null;

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
          className="absolute top-4 right-6 text-5xl z-2 text-white hover:text-gray-300 "
          onClick={onClose}
          aria-label="Close settings"
        >
          ×
        </button>
        <h2 className="mb-6 text-4xl z-1 font-bold tracking-wide text-white font-figtree-mulish menu-shadow">
          Настройки
        </h2>
        <div className="flex flex-col gap-4 w-full mb-6">
          <div
            className="settings-gradient backdrop-blur-xl rounded-3xl px-8 py-4 flex items-center justify-between min-h-[9vh] cursor-pointer filter drop-shadow-[2px_2px_2px_rgba(0,0,0,0.4)]"
            onClick={handleVibrationToggle}
          >
            <div className="flex items-center gap-4 menu-shadow">
              <img
                src={vibrationEnabled ? "/vibrateon.svg" : "/vibrateoff.svg"}
                alt={
                  vibrationEnabled ? "Вибрация включена" : "Вибрация выключена"
                }
                className={`w-8 h-8 transition-filter duration-500 `}
                draggable={false}
                style={{ background: "none" }}
              />
              <span className="font-extrabold text-[1.4rem] text-white font-figtree-mulish">
                Вибрация
              </span>
            </div>
            <ToggleSwitch
              isEnabled={vibrationEnabled}
              onToggle={handleVibrationToggle}
            />
          </div>

          <div
            className="settings-gradient backdrop-blur-xl rounded-3xl px-8 py-4 flex items-center justify-between min-h-[9vh] cursor-pointer filter drop-shadow-[2px_2px_2px_rgba(0,0,0,0.4)]"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <div className="flex items-center gap-4 menu-shadow">
              <img
                src={soundEnabled ? "/soundon.svg" : "/soundoff.svg"}
                alt={soundEnabled ? "Sound on" : "Sound off"}
                className={`w-8 h-8 transition-filter duration-500 $`}
                draggable={false}
                style={{ background: "none" }}
              />
              <span className="text-[1.4rem] font-extrabold text-white font-figtree-mulish">
                Звук
              </span>
            </div>
            <ToggleSwitch
              isEnabled={soundEnabled}
              onToggle={() => setSoundEnabled(!soundEnabled)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 items-center w-full">
          {onGoHome && (
            <SettingsButton
              text="Главное меню"
              leftIcon="/home.svg"
              gradientClass="settings-gradient"
              className="rounded-3xl px-8 py-4 font-bold w-[90%] h-16"
              textClasses="font-extrabold text-3xl"
              onClick={onGoHome}
            />
          )}
          {onOpenShop && (
            <SettingsButton
              text="Магазин"
              leftIcon="/cart.svg"
              imageClasses="w-8 h-8"
              gradientClass="settings-gradient"
              className="rounded-3xl px-8 py-4 font-bold w-[90%] h-16"
              textClasses="font-extrabold text-3xl"
              onClick={onOpenShop}
            />
          )}
          {onRestart && (
            <SettingsButton
              text="Начать заново"
              leftIcon="/replay.svg"
              gradientClass="settings-gradient"
              className="rounded-3xl px-8 py-4 font-bold w-[90%] h-16"
              textClasses="font-extrabold text-3xl"
              onClick={onRestart}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
