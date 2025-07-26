"use client";

import React from "react";
import SettingsButton from "@/components/UI/SettingsButton";
import { useSettingsStore } from "@/lib/state/settings";
import ClickEffect from "../ClickEffect";
import { useTranslation } from "react-i18next";

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
  const { t, i18n: i18nextInstance } = useTranslation();
  const vibration = useSettingsStore((state) => state.vibrationValue);
  const setVibration = useSettingsStore((state) => state.setVibrationValue);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const fullscreenEnabled = useSettingsStore((state) => state.fullscreenEnabled);
  const setFullscreenEnabled = useSettingsStore((state) => state.setFullscreenEnabled);
  const { setLanguage } = useSettingsStore();

  // Вибрация только вкл/выкл
  const vibrationEnabled = vibration > 0;
  const handleVibrationToggle = () => {
    setVibration(vibrationEnabled ? 0 : 55);
  };

  const languages = [
    { code: "en", label: "English" },
    { code: "ru", label: "Русский" },
  ];
  const currentLang = i18nextInstance.language;

  if (!isOpen) return null;

  return (
    <ClickEffect
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="relative fade-in-animation-fast bg-blue-600/20 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Language Switcher */}
       
        <ClickEffect>
          <button
            className="absolute top-4 right-6 text-5xl z-2 text-white hover:text-gray-300 "
            onClick={onClose}
            aria-label={t("settings.close")}
          >
            ×
          </button>
        </ClickEffect>
        <h2 className="mb-6 text-4xl z-1 font-bold tracking-wide text-white font-figtree-mulish menu-shadow">
          {t("settings.title")}
        </h2>
        <div className="flex flex-col gap-4 w-full mb-6">
          <div
            className="settings-gradient backdrop-blur-xl rounded-3xl px-8 py-4 flex items-center justify-between min-h-[9vh] cursor-pointer filter drop-shadow-[2px_2px_2px_rgba(0,0,0,0.4)]"
            onClick={handleVibrationToggle}
          >
            <div className="flex items-center gap-4 menu-shadow">
              <img
                src={vibrationEnabled ? "/vibrateon.svg" : "/vibrateoff.svg"}
                alt={vibrationEnabled ? t("settings.vibration_on") : t("settings.vibration_off")}
                className={`w-8 h-8 transition-filter duration-500 `}
                draggable={false}
                style={{ background: "none" }}
              />
              <span className="font-extrabold text-[1.4rem] text-white font-figtree-mulish">
                {t("settings.vibration")}
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
                alt={soundEnabled ? t("settings.sound_on") : t("settings.sound_off")}
                className={`w-8 h-8 transition-filter duration-500 $`}
                draggable={false}
                style={{ background: "none" }}
              />
              <span className="text-[1.4rem] font-extrabold text-white font-figtree-mulish">
                {t("settings.sound")}
              </span>
            </div>
            <ToggleSwitch
              isEnabled={soundEnabled}
              onToggle={() => setSoundEnabled(!soundEnabled)}
            />
          </div>

          {/* Fullscreen Toggle - показываем только в Telegram WebApp */}
          {/* {typeof window !== "undefined" && window.Telegram?.WebApp && (
            <div
              className="settings-gradient backdrop-blur-xl rounded-3xl px-8 py-4 flex items-center justify-between min-h-[9vh] cursor-pointer filter drop-shadow-[2px_2px_2px_rgba(0,0,0,0.4)]"
              onClick={() => setFullscreenEnabled(!fullscreenEnabled)}
            >
              <div className="flex items-center gap-4 menu-shadow">
                <span className="text-2xl">🔲</span>
                <span className="text-[1.4rem] font-extrabold text-white font-figtree-mulish">
                  {t("settings.fullscreen")}
                </span>
              </div>
              <ToggleSwitch
                isEnabled={fullscreenEnabled}
                onToggle={() => setFullscreenEnabled(!fullscreenEnabled)}
              />
            </div>
          )} */}
          {/* <div className="settings-gradient backdrop-blur-xl rounded-3xl px-8 py-4 flex items-center justify-between min-h-[9vh] mb-4">
          <div className="flex items-center gap-4 menu-shadow">
            <span className="text-2xl">🌐</span>
            <span className="font-extrabold text-[1.4rem] text-white font-figtree-mulish">
              {t('settings.language') || 'Language'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-200
                ${currentLang === 'en' ? 'border-blue-400 bg-blue-900/80 scale-110 shadow-lg' : 'border-white/30 bg-blue-900/40 hover:border-blue-400 hover:scale-105'}`}
              aria-label="English"
              title="English"
            >
              <span role="img" aria-label="English">🇬🇧</span>
            </button>
            <button
              onClick={() => setLanguage('ru')}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-200
                ${currentLang === 'ru' ? 'border-blue-400 bg-blue-900/80 scale-110 shadow-lg' : 'border-white/30 bg-blue-900/40 hover:border-blue-400 hover:scale-105'}`}
              aria-label="Русский"
              title="Русский"
            >
              <span role="img" aria-label="Русский">🇷🇺</span>
            </button>
          </div>
        </div> */}
        </div>
        <div className="flex flex-col gap-4 items-center w-full">
          {onGoHome && (
            <SettingsButton
              text={t("settings.main_menu")}
              leftIcon="/home.svg"
              gradientClass="settings-gradient"
              className="rounded-3xl px-8 py-4 font-bold w-[90%] h-16"
              textClasses="font-extrabold text-3xl"
              onClick={onGoHome}
            />
          )}
          {onOpenShop && (
            <SettingsButton
              text={t("settings.shop")}
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
              text={t("settings.restart")}
              leftIcon="/replay.svg"
              gradientClass="settings-gradient"
              className="rounded-3xl px-8 py-4 font-bold w-[90%] h-16"
              textClasses="font-extrabold text-3xl"
              onClick={onRestart}
            />
          )}
        </div>
      </div>
    </ClickEffect>
  );
};

export default SettingsModal;
