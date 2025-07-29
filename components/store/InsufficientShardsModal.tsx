import React from "react";
import { useTranslation } from "react-i18next";
import ClickEffect from "../ClickEffect";
import MenuButton from "../UI/MenuButton";

interface InsufficientShardsModalProps {
  isOpen: boolean;
  currentBalance: number;
  requiredBalance: number;
  totalCostStars: number;
  onClose: () => void;
  onTopUp: () => void;
  onBuyWithStars: () => void;
  onChangeAmount: () => void;
  isLoading?: boolean;
}

const InsufficientShardsModal: React.FC<InsufficientShardsModalProps> = ({
  isOpen,
  currentBalance,
  requiredBalance,
  totalCostStars,
  onClose,
  onTopUp,
  onBuyWithStars,
  onChangeAmount,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <ClickEffect
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative fade-in-animation-fast bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок и кнопка закрытия */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl font-bold text-white font-mulish">
            {t("shop.insufficient_title", "Недостаточно осколков")}
          </div>
          <ClickEffect>
            <button
              className="text-4xl text-white hover:text-gray-300"
              onClick={onClose}
              disabled={isLoading}
              aria-label={t("common.close", "Закрыть")}
            >
              ×
            </button>
          </ClickEffect>
        </div>


        {/* Баланс и потребности */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg space-y-2 mb-6 font-figtree">
          <div className="flex justify-between">
            <span>{t("shop.your_balance", "Ваш баланс")}:</span>
            <span className="font-bold flex items-center gap-1 text-xl">
              {currentBalance}{" "}
              <img src="/crystal.svg" alt="shard" className="w-6 h-6" />
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t("shop.needed", "Нужно")}:</span>
            <span className="font-bold flex items-center gap-1 text-xl">
              {requiredBalance}{" "}
              <img src="/crystal.svg" alt="shard" className="w-6 h-6" />
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t("shop.alternative_price", "Или за звёзды")}:</span>
            <span className="font-bold flex items-center gap-1 text-yellow-400 text-xl">
              {totalCostStars}{" "}
              <img src="/tgstar.svg" alt="star" className="w-6 h-6" />
            </span>
          </div>
        </div>

        {/* Кнопки */}
        <div className="space-y-3">
          <MenuButton
            onClick={onTopUp}
            disabled={isLoading}
            leftIcon="/crystal.svg"
            imageClasses="w-7 h-7"
            text={t("shop.top_up", "Пополнить баланс")}
            gap="gap-0"
            textClasses="text-lg font-bold"
            innerShadows={false}
            gradientClass="shards-gradient"
            className="w-full font-bold rounded-2xl transition-all     "
          />

          <MenuButton
            onClick={onBuyWithStars}
            disabled={isLoading}
            leftIcon="/tgstar.svg"
            imageClasses="w-7 h-7"
            text={t("shop.buy_with_stars", "Купить за звёзды")}
            textClasses="text-lg font-bold"
            gradientClass="stars-gradient"
            innerShadows={false}
            gap="gap-0"
            className="w-full  rounded-2xl transition-all "
          />

          <MenuButton
            onClick={onChangeAmount}
            disabled={isLoading}
            text={t("shop.change_quantity", "Изменить количество")}
            textClasses="text-lg text-white/70 hover:text-white"
            gradientClass=""
            className="w-full px-6 py-3 transition-colors"
          />
        </div>
      </div>
    </ClickEffect>
  );
};

export default InsufficientShardsModal;
