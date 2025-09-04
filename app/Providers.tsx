"use client";
import { useEffect, useState } from "react";
import { init, miniApp } from "@telegram-apps/sdk";
import { I18nProvider } from "./i18n-provider";
import { AuthProvider } from "@/components/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      try {
        init();
      } catch (error) {
        console.error("Failed to initialize @telegram-apps/sdk:", error);
        setIsInitialized(false);
      } finally {
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(false);
    }

    if (miniApp.mountSync.isAvailable()) {
      miniApp.mountSync();
    }

    if (miniApp.isMounted()) {
      miniApp.ready();
    }
  }, []);

  return (
    <I18nProvider>
      <AuthProvider>{children}</AuthProvider>
    </I18nProvider>
  );
}
