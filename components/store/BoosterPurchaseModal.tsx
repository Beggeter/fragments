import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  isTelegramWebApp, 
  createBoosterInvoice, 
  showTelegramAlert 
} from '@/lib/utils/telegramStars';

interface BoosterPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  onSuccess?: () => void; // Колбэк для успешной покупки через Telegram Stars
  booster: {
    id: string;
    name: string;
    icon: string;
    price: number;
    description: string;
  };
  playerBalance: number;
  onInsufficientFunds?: () => void;
  userId?: number; // Добавляем userId для интеграции с платежами
}

const BoosterPurchaseModal: React.FC<BoosterPurchaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSuccess,
  booster,
  playerBalance,
  onInsufficientFunds,
  userId,
}) => {
  const maxQuantity = Math.floor(playerBalance / booster.price);
  const [quantity, setQuantity] = useState(Math.max(1, maxQuantity));
  const [isLoadingStars, setIsLoadingStars] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {t} = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setQuantity(Math.max(1, maxQuantity));
      setError(null);
    }
  }, [isOpen, maxQuantity]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  // Покупка через Telegram Stars API
  const handlePayWithStars = async () => {
    setIsLoadingStars(true);
    setError(null);

    try {
      if (!userId) {
        setError('Пользователь не авторизован');
        return;
      }

      if (!isTelegramWebApp()) {
        setError('Telegram WebApp не доступен. Убедитесь, что вы запустили приложение через Telegram.');
        return;
      }

      console.log('🚀 Creating Telegram Stars booster invoice:', {
        userId,
        boosterId: booster.id,
        boosterName: booster.name,
        quantity,
        unitPrice: booster.price,
        totalPrice: booster.price * quantity
      });

      // Создаем инвойс через Telegram Stars API
      const result = await createBoosterInvoice(
        userId,
        booster.id,
        booster.name,
        quantity,
        booster.price
      );

      if (result.success) {
        console.log('✅ Telegram Stars booster invoice opened successfully');
        
        // Показываем уведомление пользователю
        showTelegramAlert('Инвойс открыт! Завершите оплату в Telegram.');
        
        // Закрываем модальное окно
        onClose();
        
        // Вызываем колбэк успеха
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(result.error || 'Ошибка создания инвойса');
      }

    } catch (e: any) {
      console.error('❌ Error creating Telegram Stars booster invoice:', e);
      setError('Ошибка создания инвойса: ' + (e.message || 'Неизвестная ошибка'));
    } finally {
      setIsLoadingStars(false);
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

        {/* Цена в Stars */}
        <div className="flex items-center justify-center mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <img src="/tgstar.svg" alt="star" className="w-6 h-6 mr-2" />
          <span className="text-xl font-bold text-yellow-400">
            {quantity > 1 ? `${booster.price} × ${quantity} = ${totalCost}` : booster.price}
          </span>
        </div>

        {/* Выбор количества */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-white font-mulish">Количество:</span>
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
                disabled={quantity >= 10} // Ограничиваем максимальное количество для покупки за Stars
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
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer custom-range"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-400 mb-4 text-center text-sm bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Кнопки покупки */}
        <div className="space-y-3">
          {/* Покупка за Telegram Stars */}
          <button
            onClick={handlePayWithStars}
            disabled={isLoadingStars || quantity < 1}
            className="w-full px-6 py-4 text-lg font-bold rounded-2xl transition-all bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <img src="/tgstar.svg" alt="star" className="w-8 h-8" />
            <span className="text-lg font-bold">
              {isLoadingStars ? 'Создание инвойса...' : `💫 Купить за ${totalCost} Stars`}
            </span>
          </button>

          {/* Покупка за осколки (для пользователей с достаточным балансом) */}
          {!isInsufficient ? (
            <button
              onClick={() => onConfirm(quantity)}
              disabled={totalCost > playerBalance || quantity < 1}
              className="w-full px-6 py-4 text-lg font-bold rounded-2xl transition-all bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-mulish flex items-center justify-center gap-3"
            >
              <img src="/crystal.svg" alt="crystal" className="w-8 h-8" />
              <span className="text-lg font-bold">Купить за {totalCost} осколков</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onInsufficientFunds) onInsufficientFunds();
                onClose();
              }}
              className="w-full px-6 py-4 text-lg font-bold rounded-2xl transition-all bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-3"
            >
              <img src="/crystal.svg" alt="crystal" className="w-8 h-8" />
              <span className="text-lg font-bold">Недостаточно осколков</span>
            </button>
          )}
        </div>

        <button 
          className="mt-6 w-full text-white/70 hover:text-white text-sm transition-colors" 
          onClick={onClose} 
          disabled={isLoadingStars}
        >
          Отмена
        </button>
      </div>
    </div>
  );
};

export default BoosterPurchaseModal; 