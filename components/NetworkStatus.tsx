// components/NetworkStatus.tsx
// ✅ Компонент для отображения состояния сети пользователю

"use client";

import React, { useState, useEffect } from 'react';
import { networkMonitor, NetworkInfo, shouldUseDataSaver } from '@/lib/utils/networkOptimizer';

interface NetworkStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  showDetails = false, 
  className = "" 
}) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Подписываемся на изменения сети
    const unsubscribe = networkMonitor.subscribe((info) => {
      setNetworkInfo(info);
      
      // Показываем предупреждение для медленных соединений
      if (info && ['slow-2g', '2g'].includes(info.effectiveType)) {
        setShowWarning(true);
        // Скрываем через 5 секунд
        setTimeout(() => setShowWarning(false), 5000);
      }
    });

    // Отслеживаем состояние online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Устанавливаем начальное состояние
    setIsOnline(navigator.onLine);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className={`fixed top-4 left-4 right-4 z-50 bg-red-500/90 backdrop-blur-sm rounded-lg p-3 text-white text-center ${className}`}>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
          <span className="font-medium">Отсутствует подключение к интернету</span>
        </div>
        <p className="text-red-200 text-sm mt-1">
          Проверьте соединение и попробуйте снова
        </p>
      </div>
    );
  }

  if (showWarning && networkInfo) {
    const isSlowConnection = ['slow-2g', '2g'].includes(networkInfo.effectiveType);
    const dataSaverMode = shouldUseDataSaver();

    if (isSlowConnection || dataSaverMode) {
      return (
        <div className={`fixed top-4 left-4 right-4 z-50 bg-yellow-500/90 backdrop-blur-sm rounded-lg p-3 text-white text-center ${className}`}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
            <span className="font-medium">
              {isSlowConnection ? 'Медленное соединение' : 'Режим экономии данных'}
            </span>
          </div>
          <p className="text-yellow-200 text-sm mt-1">
            {isSlowConnection 
              ? 'Приложение адаптируется под ваше соединение'
              : 'Включена оптимизация для экономии трафика'
            }
          </p>
          <button 
            onClick={() => setShowWarning(false)}
            className="text-yellow-200 text-xs underline mt-1 hover:text-white"
          >
            Понятно
          </button>
        </div>
      );
    }
  }

  // Показываем детальную информацию если включен режим отладки
  if (showDetails && networkInfo) {
    return (
      <div className={`fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-2 text-white text-xs ${className}`}>
        <div className="space-y-1">
          <div>📶 Тип: {networkInfo.effectiveType}</div>
          <div>⚡ Скорость: {networkInfo.downlink?.toFixed(1)} Mbps</div>
          <div>🕐 Задержка: {networkInfo.rtt}ms</div>
          {networkInfo.saveData && <div>💾 Экономия данных: Вкл</div>}
        </div>
      </div>
    );
  }

  return null;
};

export default NetworkStatus;
