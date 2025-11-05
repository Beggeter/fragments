"use client";

import React, { useEffect, useState } from 'react';

interface AdOverlayProps {
  isVisible: boolean;
  onAdComplete?: () => void;
}

/**
 * Компонент-подложка для рекламы
 * Обеспечивает единый стиль отображения рекламы
 * Показывается при загрузке и показе рекламы
 */
export const AdOverlay: React.FC<AdOverlayProps> = ({ isVisible, onAdComplete }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setShowLoading(true);
      // Скрываем индикатор загрузки через 2 секунды (когда реклама должна показаться)
      const loadingTimer = setTimeout(() => {
        setShowLoading(false);
      }, 2000);
      return () => clearTimeout(loadingTimer);
    } else {
      // Задержка для анимации исчезновения
      const timer = setTimeout(() => {
        setShouldRender(false);
        setShowLoading(true);
        onAdComplete?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAdComplete]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* Подложка с градиентом для единообразного вида */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20" />
      
      {/* Индикатор загрузки рекламы - показывается только в начале */}
      {showLoading && isVisible && (
        <div className="relative flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/80 text-lg font-medium font-figtree">
            Загрузка рекламы...
          </p>
        </div>
      )}
    </div>
  );
};

