import React, { useState } from "react";

interface ShardPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: { amount: number; price: number; label?: string; icon: string };
  userId: number;
  onSuccess: () => void;
}

const isTelegramWebApp = () => typeof window !== 'undefined' && !!window.Telegram?.WebApp;

const ShardPurchaseModal: React.FC<ShardPurchaseModalProps> = ({ isOpen, onClose, pack, userId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // --- Оплата через Telegram Stars ---
  const handlePayWithStars = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isTelegramWebApp() && window.Telegram?.WebApp?.openInvoice) {
        // Формируем payload для webhook (userId и amount)
        const payload = `userId:${userId};shards:${pack.amount}`;
        // Открываем инвойс (пример, параметры могут отличаться)
        window.Telegram.WebApp.openInvoice({
          slug: 'shards', // должен быть настроен в BotFather
          description: `Пакет осколков (${pack.amount})`,
          payload,
          amount: pack.price * 100, // копейки/центы
          currency: 'RUB', // или другая валюта
        }, (status) => {
          if (status === 'paid') {
            onSuccess();
          } else if (status === 'cancelled') {
            setError('Платёж отменён');
          }
          setIsLoading(false);
        });
      } else {
        setError('Оплата через Telegram Stars доступна только в Telegram WebApp');
        setIsLoading(false);
      }
    } catch (e) {
      setError('Ошибка оплаты: ' + (e instanceof Error ? e.message : ''));
      setIsLoading(false);
    }
  };

  // --- Тестовая покупка (dev-режим) ---
  const handleTestPurchase = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Эмулируем успешную покупку через backend
      const res = await fetch('/api/shards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: pack.amount, price: pack.price, test: true })
      });
      if (res.ok) {
        onSuccess();
      } else {
        setError('Ошибка тестовой покупки');
      }
    } catch (e) {
      setError('Ошибка: ' + (e instanceof Error ? e.message : ''));
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative fade-in-animation-fast bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center mb-6">
          <img src={pack.icon} alt="shards" className="w-16 h-16 mb-2" />
          <div className="text-2xl font-extrabold text-white mb-2">Пакет: {pack.amount} осколков</div>
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <img src="/tgstar.svg" alt="star" className="w-7 h-7" />
            <span>{pack.price}</span>
          </div>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <button
          className="w-full px-6 py-4 text-lg font-bold rounded-2xl transition-all bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg hover:from-yellow-500 hover:to-yellow-600 mb-4 disabled:opacity-50"
          onClick={handlePayWithStars}
          disabled={isLoading}
        >
          {isLoading ? 'Ожидание оплаты...' : 'Купить за Telegram Stars'}
        </button>
        <button
          className="w-full px-6 py-3 text-base font-bold rounded-2xl transition-all bg-gradient-to-r from-gray-500 to-gray-700 text-white shadow-lg hover:from-gray-600 hover:to-gray-800 disabled:opacity-50"
          onClick={handleTestPurchase}
          disabled={isLoading}
        >
          {isLoading ? 'Покупка...' : 'Тестовая покупка (dev)'}
        </button>
        <button className="mt-6 w-full text-white/70 hover:text-white text-sm" onClick={onClose} disabled={isLoading}>Отмена</button>
      </div>
    </div>
  );
};

export default ShardPurchaseModal; 