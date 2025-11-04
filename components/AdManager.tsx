"use client";

import { useEffect } from 'react';
import Script from 'next/script';

/**
 * Client Component для инициализации рекламного движка
 * Загружает скрипт рекламы и инициализирует его после загрузки
 */
export function AdManager() {
  useEffect(() => {
    // Проверяем, возможно скрипт уже загружен
    const checkAndInit = () => {
      if (typeof window !== 'undefined' && window.initCdTma && !window.show) {
        window.initCdTma({ id: '6097083' })
          .then((show) => {
            window.show = show;
            console.log('Ad manager initialized successfully');
          })
          .catch((e) => {
            console.error('Ad manager initialization error:', e);
          });
      }
    };

    // Проверяем сразу
    checkAndInit();

    // Проверяем периодически на случай если скрипт загрузится позже
    const interval = setInterval(checkAndInit, 500);
    
    // Очищаем через 10 секунд
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Script
      src="https://js.onclckvd.com/in-stream-ad-admanager/tma.js"
      strategy="afterInteractive"
      onLoad={() => {
        // Инициализируем рекламный движок после загрузки скрипта
        if (typeof window !== 'undefined' && window.initCdTma) {
          window.initCdTma({ id: '6097083' })
            .then((show) => {
              window.show = show;
              console.log('Ad manager initialized successfully (onLoad)');
            })
            .catch((e) => {
              console.error('Ad manager initialization error:', e);
            });
        }
      }}
      onError={(e) => {
        console.error('Failed to load ad script:', e);
      }}
    />
  );
}

