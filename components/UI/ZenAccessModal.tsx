import React from "react";
import ClickEffect from "../ClickEffect";
import CrownIcon from "./CrownIcon";
import StarsIcon from "./StarsIcon";

interface ZenAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShop: () => void;
}

export const ZenAccessModal: React.FC<ZenAccessModalProps> = ({
  isOpen,
  onClose,
  onOpenShop,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-purple-900/95 to-pink-900/95 rounded-3xl p-8 max-w-md mx-4 border border-white/20 shadow-2xl">
        {/* Закрывающая кнопка */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Контент */}
        <div className="text-center">
          {/* Иконка */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              {/* <CrownIcon className="w-12 h-12 text-white" /> */}
              <StarsIcon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Подзаголовок */}
          <h3 className="text-xl font-bold text-white mb-6 font-figtree-mulish">
            Оформи ZEN и получай больше!
          </h3>

          {/* Описание */}
          <p className="text-white/90 mb-6 leading-relaxed text-lg">
            Твоя ZEN-подписка откроет доступ к супербонусам:
          </p>

          {/* Преимущества */}
          <div className="bg-white/10 rounded-2xl p-6 mb-6">
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <span className="text-white text-base">
                  <span className="font-bold">
                    + 115{" "}
                    <img
                      src={"/crystal.svg"}
                      className="w-4 h-4 inline align-middle"
                    ></img>{" "}
                    осколков
                  </span>{" "}
                  и <span className="font-bold">5 бустеров</span> в месяц —
                  просто за ежедневный вход
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧨</span>
                <span className="text-white text-base">
                  Бонусом даём: <span className="font-bold">«Бомба»</span>,{" "}
                  <span className="font-bold">«Вихрь»</span> и{" "}
                  <span className="font-bold">«Отмена хода»</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚫</span>
                <span className="text-white text-base font-bold">
                  Без рекламы
                </span>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <p className="text-white/80 mb-6 leading-relaxed text-sm">
            Подписка окупается с первых дней — активируй ZEN и играй с
            привилегиями!
          </p>

          {/* Кнопка */}
          <div className="flex flex-col gap-3">
            <ClickEffect>
              <button
                onClick={() => {
                  onOpenShop();
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
              >
                Оформить ZEN
              </button>
            </ClickEffect>

            <ClickEffect>
              <button
                onClick={onClose}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-2xl transition-colors duration-200"
              >
                Позже
              </button>
            </ClickEffect>
          </div>
        </div>
      </div>
    </div>
  );
};
