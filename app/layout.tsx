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
            // ✅ ИСПРАВЛЕНИЕ: Предотвращаем множественную инициализацию
            let telegramInitialized = false;
            let resizeController = null;
            
            function initTelegramWebApp() {
              if (telegramInitialized) return;
              telegramInitialized = true;
              
              if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                
                try {
                  // Basic initialization
                  tg.ready();
                  tg.expand();
                  tg.disableClosingConfirmation();
                  
                  // Set header color if available
                  if (tg.setHeaderColor) {
                    tg.setHeaderColor('#1a1a2e');
                  }
                  
                  // Viewport setup с защитой от ошибок
                  const root = document.documentElement;
                  const height = tg.viewportHeight || window.innerHeight;
                  const stableHeight = tg.viewportStableHeight || window.innerHeight;
                  
                  root.style.setProperty('--tg-viewport-height', height + 'px');
                  root.style.setProperty('--tg-viewport-stable-height', stableHeight + 'px');
                  
                  // ✅ ИСПРАВЛЕНИЕ: Защищенное добавление resize listener с debounce
                  let resizeTimeout;
                  const handleResize = () => {
                    if (resizeTimeout) clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => {
                      try {
                        const newHeight = tg.viewportHeight || window.innerHeight;
                        const newStableHeight = tg.viewportStableHeight || window.innerHeight;
                        root.style.setProperty('--tg-viewport-height', newHeight + 'px');
                        root.style.setProperty('--tg-viewport-stable-height', newStableHeight + 'px');
                      } catch (e) {
                        console.warn('Failed to update viewport:', e);
                      }
                    }, 100);
                  };
                  
                  // ✅ ИСПРАВЛЕНИЕ: Используем AbortController для безопасной очистки
                  resizeController = new AbortController();
                  window.addEventListener('resize', handleResize, { 
                    signal: resizeController.signal,
                    passive: true 
                  });
                  
                  // Очистка при выгрузке страницы
                  window.addEventListener('beforeunload', () => {
                    if (resizeController) resizeController.abort();
                  }, { once: true });
                  
                  // Handle fullscreen
                  const fullscreenEnabled = localStorage.getItem('fullscreenEnabled');
                  if (fullscreenEnabled !== 'false' && tg.requestFullscreen && !tg.isFullscreen) {
                    tg.requestFullscreen();
                  }
                } catch (error) {
                  console.warn('Telegram WebApp initialization error:', error);
                }
              } else {
                // Fallback for non-Telegram environments
                const root = document.documentElement;
                root.style.setProperty('--tg-viewport-height', '100vh');
                root.style.setProperty('--tg-viewport-stable-height', '100vh');
              }
            }
            
            // ✅ ИСПРАВЛЕНИЕ: Promise-based ожидание с экспоненциальной задержкой
            async function waitForTelegram() {
              return new Promise((resolve) => {
                if (window.Telegram?.WebApp) {
                  resolve(true);
                  return;
                }
                
                let attempts = 0;
                const maxAttempts = 25; // Уменьшено для медленного интернета
                let delay = 100;
                
                const check = () => {
                  if (window.Telegram?.WebApp) {
                    resolve(true);
                  } else if (attempts >= maxAttempts) {
                    console.warn('Telegram WebApp not available after timeout');
                    resolve(false);
                  } else {
                    attempts++;
                    delay = Math.min(delay * 1.4, 1000); // Экспоненциальная задержка
                    setTimeout(check, delay);
                  }
                };
                
                setTimeout(check, delay);
              });
            }
            
            // ✅ ИСПРАВЛЕНИЕ: Инициализация с защитой от медленного интернета
            waitForTelegram().then((available) => {
              if (available) {
                // Дополнительная задержка для стабильности при медленном интернете
                setTimeout(initTelegramWebApp, 200);
              } else {
                // Fallback setup
                const root = document.documentElement;
                root.style.setProperty('--tg-viewport-height', '100vh');
                root.style.setProperty('--tg-viewport-stable-height', '100vh');
              }
            });
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
