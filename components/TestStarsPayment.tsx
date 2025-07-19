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
        setResult('✅ Инвойс для осколков открыт успешно!');
        showTelegramAlert('Тестовый инвойс открыт!');
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
        setResult('✅ Инвойс для бустера открыт успешно!');
        showTelegramAlert('Тестовый инвойс открыт!');
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
      'Stars API': webApp?.mainButton?.showInvoice ? '✅ Доступен' : '❌ Недоступен',
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
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-white/20 max-w-sm">
      <h3 className="text-white font-bold mb-3">🧪 Test Stars Payment</h3>
      
      <div className="space-y-2 mb-3">
        <button
          onClick={checkEnvironment}
          className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Проверить окружение
        </button>
        
        <button
          onClick={testShardsPurchase}
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Тестирование...' : 'Тест осколков (100 за 50 Stars)'}
        </button>
        
        <button
          onClick={testBoosterPurchase}
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Тестирование...' : 'Тест бустера (Undo за 20 Stars)'}
        </button>
      </div>

      {result && (
        <div className="text-xs text-white/80 bg-white/10 rounded-lg p-2 whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
};

export default TestStarsPayment; 