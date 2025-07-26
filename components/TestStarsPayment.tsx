import React, { useState } from 'react';
import { 
  isTelegramWebApp, 
  getTelegramUserId, 
  createShardsInvoice, 
  createBoosterInvoice,
  showTelegramAlert
} from '@/lib/utils/telegramStars';

const TestStarsPayment: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testShardsPurchase = async () => {
    setIsLoading(true);
    setResult('');

    try {
      if (!isTelegramWebApp()) {
        setResult('❌ Telegram WebApp не доступен');
        return;
      }

      const userId = getTelegramUserId();
      if (!userId) {
        setResult('❌ Telegram User ID не найден');
        return;
      }

      console.log('🧪 Testing shards purchase...');
      const response = await createShardsInvoice(userId, 100, 50);

      if (response.success) {
        setResult('✅ Платеж за осколки прошел успешно!');
        showTelegramAlert('Тестовый платеж успешен!');
      } else {
        setResult(`❌ Ошибка: ${response.error}`);
      }

    } catch (error: any) {
      setResult(`❌ Ошибка: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testBoosterPurchase = async () => {
    setIsLoading(true);
    setResult('');

    try {
      if (!isTelegramWebApp()) {
        setResult('❌ Telegram WebApp не доступен');
        return;
      }

      const userId = getTelegramUserId();
      if (!userId) {
        setResult('❌ Telegram User ID не найден');
        return;
      }

      console.log('🧪 Testing booster purchase...');
      const response = await createBoosterInvoice(userId, 'undo', 'Undo', 1, 20);

      if (response.success) {
        setResult('✅ Платеж за бустер прошел успешно!');
        showTelegramAlert('Тестовый платеж успешен!');
      } else {
        setResult(`❌ Ошибка: ${response.error}`);
      }

    } catch (error: any) {
      setResult(`❌ Ошибка: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEnvironment = () => {
    const webApp = (window as any).Telegram?.WebApp;
    const checks = {
      'Telegram WebApp': isTelegramWebApp(),
      'User ID': getTelegramUserId() ? 'Найден' : 'Не найден',
      'WebApp Version': webApp?.version || 'Неизвестно',
      'Platform': webApp?.platform || 'Неизвестно',
      'Environment': process.env.NODE_ENV
    };

    setResult('🔍 Проверка окружения:\n' + 
      Object.entries(checks)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    );
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Показываем только в dev режиме
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 backdrop-blur-sm rounded-2xl p-4 border border-white/20 max-w-sm">
      <h3 className="text-white font-bold mb-3 text-sm">🧪 Test Stars Payment (TMA v3)</h3>
      
      <div className="space-y-2">
        <button
          onClick={checkEnvironment}
          className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-gray-600 text-white hover:bg-gray-700"
        >
          Check Environment
        </button>
        
        <button
          onClick={testShardsPurchase}
          disabled={isLoading}
          className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Тестируем...' : 'Test Shards Purchase'}
        </button>
        
        <button
          onClick={testBoosterPurchase}
          disabled={isLoading}
          className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? 'Тестируем...' : 'Test Booster Purchase'}
        </button>
      </div>
      
      {result && (
        <div className="mt-3 pt-2 border-t border-white/20">
          <div className="text-xs text-white whitespace-pre-line max-h-32 overflow-y-auto">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestStarsPayment; 