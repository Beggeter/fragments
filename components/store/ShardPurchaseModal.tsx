import React, { useState } from 'react';
import { ShardPurchaseModalProps } from '@/types/shop';
import { 
  isTelegramWebApp, 
  createShardsInvoice, 
  showTelegramAlert 
} from '@/lib/utils/telegramStars';
import TgStarIcon from "../UI/TgStarIcon";

const ShardPurchaseModal: React.FC<ShardPurchaseModalProps> = ({ isOpen, onClose, pack, userId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !pack) return null;

  // --- Оплата через Telegram Stars API ---
  const handlePayWithStars = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!userId) {
        setError('Пользователь не авторизован');
        setIsLoading(false);
        return;
      }

      if (!isTelegramWebApp()) {
        setError('Telegram WebApp не доступен. Убедитесь, что вы запустили приложение через Telegram.');
        setIsLoading(false);
        return;
      }

      //   userId,
      //   packAmount: pack.amount,
      //   packPrice: pack.price
      // });

      // Создаем инвойс через Telegram Stars API
      const result = await createShardsInvoice(userId, pack.amount, pack.price);

      if (result.success) {
        
        // Показываем уведомление пользователю
        showTelegramAlert('Оплата прошла успешно! Осколки начислены.');
        
        // Закрываем модальное окно
        onClose();
        
        // Вызываем колбэк успеха
        onSuccess();
      } else {
        if (result.error === 'Payment cancelled') {
          showTelegramAlert('Оплата отменена');
        } else {
          throw new Error(result.error || 'Ошибка создания инвойса');
        }
      }

    } catch (e: any) {
      setError('Ошибка создания инвойса: ' + (e.message || 'Неизвестная ошибка'));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Тестовая покупка (dev-режим) ---
  const handleTestPurchase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userId) {
        setError('Пользователь не авторизован');
        setIsLoading(false);
        return;
      }

      // Эмулируем успешную покупку через backend
      const res = await fetch('/api/shards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          amount: pack.amount, 
          price: pack.price, 
          test: true 
        })
      });
      
      if (res.ok) {
        onSuccess();
      } else {
        const errorData = await res.json();
        setError('Ошибка тестовой покупки: ' + (errorData.error || 'Неизвестная ошибка'));
      }
    } catch (e: any) {
      setError('Ошибка: ' + (e.message || 'Неизвестная ошибка'));
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative fade-in-animation-fast bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center mb-6">
          <img src={pack.icon} alt="shards" className="w-16 h-16 mb-2" />
          <div className="text-2xl font-extrabold text-white mb-2">Пакет: {pack.amount.toLocaleString()} осколков</div>
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <TgStarIcon className="w-7 h-7" />
            <span>{pack.price}</span>
          </div>
          {pack.label && (
            <div className={`mt-2 px-3 py-1 rounded-full text-sm font-bold ${
              pack.labelType === 'discount' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
            }`}>
              {pack.label}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-400 mb-4 text-center text-sm bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            className="w-full px-6 py-4 text-lg font-bold rounded-2xl transition-all bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePayWithStars}
            disabled={isLoading}
          >
            {isLoading ? 'Создание инвойса...' : '💫 Купить за Telegram Stars'}
          </button>

          {/* Показываем тестовую кнопку только в dev режиме */}
          {process.env.NODE_ENV === 'development' && (
            <button
              className="w-full px-6 py-3 text-base font-bold rounded-2xl transition-all bg-gradient-to-r from-gray-500 to-gray-700 text-white shadow-lg hover:from-gray-600 hover:to-gray-800 disabled:opacity-50"
              onClick={handleTestPurchase}
              disabled={isLoading}
            >
              {isLoading ? 'Покупка...' : '🧪 Тестовая покупка (dev)'}
            </button>
          )}
        </div>

        <button 
          className="mt-6 w-full text-white/70 hover:text-white text-sm transition-colors" 
          onClick={onClose} 
          disabled={isLoading}
        >
          Отмена
        </button>
      </div>
    </div>
  );
};

export default ShardPurchaseModal; 