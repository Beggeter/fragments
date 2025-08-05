import React from 'react';
import ClickEffect from '../ClickEffect';

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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Контент */}
        <div className="text-center">
          {/* Иконка */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl">
              🧘
            </div>
          </div>

          {/* Заголовок */}
          <h2 className="text-2xl font-bold text-white mb-4 font-figtree-mulish">
            ZEN режим
          </h2>

          {/* Описание */}
          <p className="text-white/80 mb-6 leading-relaxed">
            ZEN режим доступен только для подписчиков. 
            Получите доступ к расслабляющей игре без рекламы и с дополнительными возможностями.
          </p>

          {/* Преимущества */}
          <div className="bg-white/10 rounded-2xl p-4 mb-6">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-white text-sm">Без рекламы</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-white text-sm">Скидки на бустеры</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-white text-sm">Расслабляющий режим игры</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <span className="text-white text-sm">Участие в розыгрышах призов</span>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col gap-3">
            <ClickEffect>
              <button
                onClick={() => {
                  onOpenShop();
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Получить подписку
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