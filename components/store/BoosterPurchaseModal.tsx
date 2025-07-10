import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface BoosterPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  booster: {
    id: string;
    name: string;
    icon: string;
    price: number;
    description: string;
  };
  playerBalance: number;
  onInsufficientFunds?: () => void;
}

const BoosterPurchaseModal: React.FC<BoosterPurchaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  booster,
  playerBalance,
  onInsufficientFunds,
}) => {
  const maxQuantity = Math.floor(playerBalance / booster.price);
  const [quantity, setQuantity] = useState(maxQuantity);
  const {t} = useTranslation()
  useEffect(() => {
    if (isOpen) {
      setQuantity(maxQuantity);
    }
  }, [isOpen, maxQuantity]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const totalCost = quantity * booster.price;

  if (!isOpen) return null;

  const isInsufficient = totalCost > playerBalance;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative fade-in-animation-fast bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Баланс в верхней части */}
        <div className="flex justify-end items-center mb-6">
          <div className="flex gap-2 items-center text-xl font-bold font-figtree">
            <img src="/crystal.svg" alt="shard" className="w-7 h-7" />
            <span>{playerBalance}</span>
          </div>
        </div>

        {/* Информация о бустере */}
        <div className="flex items-center mb-6 p-4 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10">
          <img 
            src={booster.icon} 
            alt={booster.name} 
            className="w-16 h-16 drop-shadow-lg mr-4" 
          />
          <div>
            <div className="text-xl font-extrabold text-white font-mulish menu-shadow mb-1">
              {booster.name}
            </div>
            <div className="text-sm text-white/80 font-mulish">
              {t(`shop.booster_${booster.id}_desc`)}
            </div>
          </div>
        </div>

        {/* Выбор количества */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-white font-mulish">{t("shop.quantity")}:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="flex justify-center items-center w-8 h-8 text-lg font-black rounded-full border shadow-md backdrop-blur-md transition-all bg-blue-500/20 border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 font-mulish disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="text-2xl font-extrabold text-white font-figtree min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= maxQuantity}
                className="flex justify-center items-center w-8 h-8 text-lg font-black rounded-full border shadow-md backdrop-blur-md transition-all bg-blue-500/20 border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 font-mulish disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Слайдер для быстрого выбора */}
          <div className="mb-4">
            <input
              type="range"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer custom-range"
            />
           
          </div>

          {/* Максимальное количество */}
          {/* <div className="text-sm text-white/70 text-center font-mulish">
            Максимум: {maxQuantity} шт. (по {booster.price} кристаллов)
          </div> */}
        </div>

        {/* Кнопка покупки или недостаточно средств */}
        {isInsufficient ? (
          <button
            type="button"
            onClick={() => {
              if (onInsufficientFunds) onInsufficientFunds();
              onClose();
            }}
            className="w-full px-6 py-4 text-lg font-bold rounded-2xl transition-all bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-3"
          >
            <img src="/crystal.svg" alt="crystal" className="w-8 h-8" />
            <span className="text-2xl font-bold font-figtree">Недостаточно</span>
          </button>
        ) : (
          <button
            onClick={() => onConfirm(quantity)}
            disabled={totalCost > playerBalance || quantity < 1}
            className="w-full px-6 py-4 text-lg font-bold rounded-2xl transition-all bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-mulish flex items-center justify-center gap-3"
          >
            <img src="/crystal.svg" alt="crystal" className="w-8 h-8" />
            <span className="text-2xl font-bold font-figtree">{totalCost}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BoosterPurchaseModal; 