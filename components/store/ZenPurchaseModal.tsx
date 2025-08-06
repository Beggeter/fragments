import React from "react";
import TgStarIcon from "../UI/TgStarIcon";

interface ZenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: "crystals" | "stars") => void;
  subscription: {
    period: string;
    priceCrystals: number;
    priceStars: number;
    bonuses: { count: number; name: string; icon: string }[];
  };
  playerBalanceCrystals: number;
}

const ZenPurchaseModal: React.FC<ZenPurchaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  subscription,
  playerBalanceCrystals,

}) => {
  if (!isOpen) return null;

  const canAffordCrystals = playerBalanceCrystals >= subscription.priceCrystals;

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
        <div className="flex justify-between items-center mb-6 gap-4">
        <span className="font-fig text-4xl font-extrabold italic">ZEN</span>
          <div className="flex gap-2 items-center text-xl font-bold font-figtree">
            <img src="/crystal.svg" alt="shard" className="w-7 h-7" />
            <span>{playerBalanceCrystals}</span>
          </div>
          
        </div>

        {/* Информация о подписке */}
        <div className="flex flex-col items-center mb-6 p-4 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10">
          <div className="text-2xl font-extrabold text-white font-mulish menu-shadow mb-3">
            {subscription.period}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            +
            {subscription.bonuses.map((bonus, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-br from-white/20 to-white/10 px-3 py-1.5 shadow-md"
              >
                <img
                  src={bonus.icon}
                  alt={bonus.name}
                  className="w-7 h-7 drop-shadow-lg"
                />
                <span className="font-figtree text-lg font-bold text-white menu-shadow">
                  x{bonus.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопки покупки */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => onConfirm("crystals")}
            disabled={!canAffordCrystals}
            className="w-full px-6 py-4 text-lg font-bold rounded-2xl transition-all bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-mulish flex items-center justify-center gap-3"
          >
            <img src="/crystal.svg" alt="crystal" className="w-8 h-8" />
            <span className="text-2xl font-bold font-figtree">
              {subscription.priceCrystals}
            </span>
          </button>
          <button
            onClick={() => onConfirm("stars")}
           
            className="w-full px-6 py-4 text-lg font-bold rounded-2xl transition-all bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-mulish flex items-center justify-center gap-3"
          >
            <TgStarIcon className="w-8 h-8" />
            <span className="text-2xl font-bold font-figtree">
              {subscription.priceStars}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZenPurchaseModal; 