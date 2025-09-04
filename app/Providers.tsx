"use client";
import { useEffect, useState } from "react";
import { init, miniApp } from "@telegram-apps/sdk-react";
import { I18nProvider } from "./i18n-provider";
import { AuthProvider } from "@/components/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Инициализируем Telegram SDK v3
        await init();
        
        // Правильное монтирование компонентов
        if (miniApp.mountSync.isAvailable()) {
          miniApp.mountSync();
          console.log("MiniApp mounted:", miniApp.isMounted());
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Telegram SDK:", error);
        setInitError(error instanceof Error ? error.message : "Initialization failed");
        setIsInitialized(true); // Продолжаем работу даже при ошибке
      }
    };

    initializeSDK();
  }, []);

  // Показываем загрузку пока SDK не инициализирован
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Инициализация Telegram SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <I18nProvider>
      <AuthProvider initError={initError}>
        {children}
      </AuthProvider>
    </I18nProvider>
  );
}
