"use client";
import { useEffect } from "react";
import { init } from "@telegram-apps/sdk-react";
import { I18nProvider } from "./i18n-provider";
import { AuthProvider } from "@/lib/auth/context";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    init();
  }, []);

  return (
    <I18nProvider>
      <AuthProvider>{children}</AuthProvider>
    </I18nProvider>
  );
}
