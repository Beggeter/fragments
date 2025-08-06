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
                
                // Basic initialization
                tg.ready();
                tg.expand();
                tg.disableClosingConfirmation();
                
                // Set header color if available
                if (tg.setHeaderColor) {
                  tg.setHeaderColor('#1a1a2e');
                }
                
                // Simple viewport setup
                const root = document.documentElement;
                const height = tg.viewportHeight || window.innerHeight;
                const stableHeight = tg.viewportStableHeight || window.innerHeight;
                
                root.style.setProperty('--tg-viewport-height', height + 'px');
                root.style.setProperty('--tg-viewport-stable-height', stableHeight + 'px');
                
                // Handle fullscreen if enabled
                const fullscreenEnabled = localStorage.getItem('fullscreenEnabled');
                const shouldEnableFullscreen = fullscreenEnabled !== 'false';
                
                if (tg.requestFullscreen && shouldEnableFullscreen && !tg.isFullscreen) {
                  tg.requestFullscreen();
                }
                
                // Update viewport on resize
                window.addEventListener('resize', () => {
                  const newHeight = tg.viewportHeight || window.innerHeight;
                  const newStableHeight = tg.viewportStableHeight || window.innerHeight;
                  root.style.setProperty('--tg-viewport-height', newHeight + 'px');
                  root.style.setProperty('--tg-viewport-stable-height', newStableHeight + 'px');
                });
              } else {
                // Fallback for non-Telegram environments
                const root = document.documentElement;
                root.style.setProperty('--tg-viewport-height', '100vh');
                root.style.setProperty('--tg-viewport-stable-height', '100vh');
              }
            }
            
            // Initialize immediately if available, otherwise wait
            if (window.Telegram?.WebApp) {
              initTelegramWebApp();
            } else {
              // Wait for Telegram WebApp to load
              let attempts = 0;
              const maxAttempts = 20; // Increased timeout for iOS
              const checkTelegram = setInterval(() => {
                if (window.Telegram?.WebApp || attempts >= maxAttempts) {
                  clearInterval(checkTelegram);
                  initTelegramWebApp();
                }
                attempts++;
              }, 150); // Increased interval for better iOS compatibility
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
