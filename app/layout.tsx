import type { Metadata } from "next";
import { Figtree, Geist, Geist_Mono, Manrope, Mulish } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { I18nProvider } from "./i18n-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "600", "800", "900", "700"],
  style: ["normal", "italic"],
  variable: "--font-figtree",
});

const mulish = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "800", "700"],
  style: ["normal"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Fragments",
  description: "Play Fragments game!",
  manifest: "/manifest.json",
  other: {
    "telegram-web-app-ready": "true",
    "telegram-web-app-version": "6.0",
  },
};

export const viewport = {
  width: "device-width",
  height: "device-height",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${figtree.variable} ${mulish.variable} antialiased overflow-y-hidden overflow-x-hidden`}
      suppressHydrationWarning={true}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        {/* Telegram Web App Script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        {/* Telegram WebApp Initialization */}
        <Script id="telegram-webapp-init" strategy="afterInteractive">
          {`
            function initTelegramWebApp() {
              if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                
                // Инициализируем WebApp
                tg.ready();
                
                // Включаем полноэкранный режим
                tg.expand();
                
                // Пытаемся включить immersive fullscreen (без верхней рамки)
                // Проверяем настройку пользователя
                const fullscreenEnabled = localStorage.getItem('fullscreenEnabled');
                const shouldEnableFullscreen = fullscreenEnabled !== 'false'; // По умолчанию включен
                
                if (tg.requestFullscreen && shouldEnableFullscreen) {
                  console.log('🎮 Requesting immersive fullscreen mode...');
                  tg.requestFullscreen();
                } else if (!shouldEnableFullscreen) {
                  console.log('🎮 Fullscreen disabled by user setting');
                }
                
                // Отключаем кнопку "Назад" в заголовке
                tg.disableClosingConfirmation();
                
                // Настраиваем тему для лучшей интеграции
                if (tg.setHeaderColor) {
                  tg.setHeaderColor('#1a1a2e');
                }
                
                // Убираем предупреждение о закрытии
                if (tg.enableClosingConfirmation) {
                  tg.enableClosingConfirmation = () => {};
                }
                
                // Функция для обновления viewport размеров
                function updateViewportVars() {
                  const root = document.documentElement;
                  const height = tg.viewportHeight || window.innerHeight;
                  const stableHeight = tg.viewportStableHeight || window.innerHeight;
                  
                  root.style.setProperty('--tg-viewport-height', height + 'px');
                  root.style.setProperty('--tg-viewport-stable-height', stableHeight + 'px');
                  
                  console.log('📏 Viewport updated:', { height, stableHeight });
                }
                
                // Сразу обновляем размеры
                updateViewportVars();
                
                // Слушаем изменения размеров viewport
                if (tg.onEvent) {
                  tg.onEvent('viewportChanged', updateViewportVars);
                  
                  // Слушаем события полноэкранного режима
                  tg.onEvent('fullscreenChanged', () => {
                    console.log('🎮 Fullscreen state changed:', tg.isFullscreen);
                    updateViewportVars();
                    
                    // Обновляем CSS класс для стилизации
                    if (tg.isFullscreen) {
                      document.body.classList.add('tg-fullscreen');
                    } else {
                      document.body.classList.remove('tg-fullscreen');
                    }
                  });
                  
                  tg.onEvent('fullscreenFailed', () => {
                    console.log('❌ Fullscreen request failed');
                  });
                }
                
                // Также слушаем изменения размера окна как fallback
                window.addEventListener('resize', updateViewportVars);
                
                console.log('🎮 Telegram WebApp initialized:', {
                  platform: tg.platform,
                  version: tg.version,
                  viewportHeight: tg.viewportHeight,
                  viewportStableHeight: tg.viewportStableHeight,
                  isExpanded: tg.isExpanded
                });
              } else {
                // Для обычного браузера используем стандартные размеры
                const root = document.documentElement;
                root.style.setProperty('--tg-viewport-height', '100vh');
                root.style.setProperty('--tg-viewport-stable-height', '100vh');
                console.log('🌐 Regular browser mode');
              }
            }
            
            // Инициализируем сразу или после загрузки Telegram script
            if (window.Telegram?.WebApp) {
              initTelegramWebApp();
            } else {
              // Ждем загрузки Telegram script
              let attempts = 0;
              const checkTelegram = setInterval(() => {
                if (window.Telegram?.WebApp || attempts > 10) {
                  clearInterval(checkTelegram);
                  initTelegramWebApp();
                }
                attempts++;
              }, 100);
            }
          `}
        </Script>
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&family=Fredoka:wght@700&display=swap"
          rel="stylesheet"
        ></link>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
