"use client";

import Script from 'next/script';

/**
 * Client Component для инициализации рекламного движка
 * Загружает скрипт рекламы и инициализирует его после загрузки
 */
export function AdManager() {
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
              console.log('Ad manager initialized successfully');
            })
            .catch((e) => {
              console.error('Ad manager initialization error:', e);
            });
        }
      }}
    />
  );
}

