import React from 'react';
import Image from 'next/image';

interface Booster {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  disabled?: boolean;
}

interface BoostersPanelProps {
  currency: number;
  onBoosterClick: (boosterId: string) => void;
  className?: string;
}

const boosters: Booster[] = [
  {
    id: 'undo',
    name: 'Undo',
    description: 'Отменяет последний ход',
    price: 5,
    icon: '/stars.svg', // Используем stars.svg для Undo
  },
  {
    id: 'laser',
    name: 'Лазер',
    description: 'Удаляет целую строку/столбец',
    price: 15,
    icon: '/bullseye.svg', // Используем bullseye.svg для Лазера
  },
  {
    id: 'spinner',
    name: 'Спиннер',
    description: 'Полностью очищает поле',
    price: 49,
    icon: '/powerups.svg', // Используем powerups.svg для Спиннера
  },
];

export const BoostersPanel: React.FC<BoostersPanelProps> = ({
  currency,
  onBoosterClick,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Заголовок панели */}
      <div className="flex items-center gap-2 text-white">
        <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-sm">
          ₽
        </div>
        <span className="font-figtree font-bold text-lg">{currency}</span>
      </div>

      {/* Панель бустеров */}
      <div className="flex gap-3 w-full justify-center">
        {boosters.map((booster) => {
          const canAfford = currency >= booster.price;
          
          return (
            <button
              key={booster.id}
              onClick={() => onBoosterClick(booster.id)}
              disabled={!canAfford}
              className={`
                relative flex flex-col items-center gap-2 p-3 rounded-xl
                transition-all duration-200 transform hover:scale-105
                ${canAfford 
                  ? 'bg-gray-800 hover:bg-gray-700 cursor-pointer' 
                  : 'bg-gray-900 opacity-50 cursor-not-allowed'
                }
                border-2 ${canAfford ? 'border-gray-600 hover:border-gray-500' : 'border-gray-700'}
              `}
            >
              {/* Иконка бустера */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Image
                  src={booster.icon}
                  alt={booster.name}
                  width={32}
                  height={32}
                  className={`${!canAfford ? 'grayscale' : ''}`}
                />
              </div>

              {/* Название бустера */}
              <div className="text-center">
                <div className="font-figtree font-bold text-white text-sm">
                  {booster.name}
                </div>
                
                {/* Цена */}
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-xs">
                    ₽
                  </div>
                  <span className={`font-figtree font-bold text-xs ${
                    canAfford ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {booster.price}
                  </span>
                </div>
              </div>

              {/* Индикатор доступности */}
              {!canAfford && (
                <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl flex items-center justify-center">
                  <div className="text-white text-xs font-bold">НЕДОСТУПЕН</div>
                </div>
              )}

              {/* Эффект при наведении */}
              {canAfford && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Подсказка */}
      <div className="text-gray-400 text-xs text-center font-figtree">
        Нажмите на бустер для активации
      </div>
    </div>
  );
}; 