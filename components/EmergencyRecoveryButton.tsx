// components/EmergencyRecoveryButton.tsx
// ✅ Компонент кнопки экстренного восстановления

"use client";

import React, { useState, useEffect } from 'react';
import { manualRecovery } from '@/lib/utils/emergencyRecovery';

interface EmergencyRecoveryButtonProps {
  className?: string;
  showAfterDelay?: number; // Показывать кнопку через N секунд бездействия
}

export const EmergencyRecoveryButton: React.FC<EmergencyRecoveryButtonProps> = ({
  className = "",
  showAfterDelay = 10000 // 10 секунд по умолчанию
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
      setIsVisible(false); // Скрываем кнопку при активности
    };

    // Отслеживаем активность пользователя
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Проверяем необходимость показа кнопки
    const checkInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity > showAfterDelay && !isVisible) {
        setIsVisible(true);
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(checkInterval);
    };
  }, [lastActivity, showAfterDelay, isVisible]);

  const handleRecovery = async () => {
    if (isRecovering) return;

    setIsRecovering(true);
    
    try {
      await manualRecovery({
        timeout: 3000,
        maxAttempts: 2,
        forceReload: false
      });
      
      // Скрываем кнопку после успешного восстановления
      setTimeout(() => {
        setIsVisible(false);
        setIsRecovering(false);
        setLastActivity(Date.now());
      }, 3000);
      
    } catch (error) {
      console.error('Recovery failed:', error);
      setIsRecovering(false);
    }
  };

  const handleForceReload = () => {
    if (confirm('Принудительно перезагрузить приложение? Несохраненные данные будут потеряны.')) {
      localStorage.setItem('emergency_reload', Date.now().toString());
      window.location.reload();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] ${className}`}>
      <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-3 text-white shadow-lg border border-red-400/30">
        <div className="text-sm font-medium mb-2">Интерфейс не отвечает?</div>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRecovery}
            disabled={isRecovering}
            className={`px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors ${
              isRecovering ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isRecovering ? '🔄 Восстановление...' : '🚑 Восстановить'}
          </button>
          
          <button
            onClick={handleForceReload}
            className="px-3 py-2 bg-red-800 hover:bg-red-900 rounded text-xs transition-colors"
          >
            🔄 Перезагрузить
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs transition-colors"
          >
            Закрыть
          </button>
        </div>
        
        <div className="text-xs text-red-200 mt-2">
          Если проблемы повторяются, попробуйте перезапустить Telegram
        </div>
      </div>
    </div>
  );
};

export default EmergencyRecoveryButton;
