import { initData } from "@telegram-apps/sdk-react";
import { apiFetch } from "./api";
import type { TelegramAuthData } from "@/types/user";
import { useAuthStore } from "@/store/authStore";

export async function tgLogin(): Promise<TelegramAuthData | null> {
  const { isAuthenticated, setIsAuthenticated, setUser } = useAuthStore();

  const user = initData.user?.();
  const hash = initData.hash?.();
  const authDateRaw = initData.authDate?.();
  const authDate = authDateRaw
    ? Math.floor(new Date(authDateRaw).getTime() / 1000)
    : undefined;
  const raw = initData.raw?.();

  if (!user || !hash) {
    console.warn("Telegram initData incomplete, cannot login");
    return null; // безопасно прекращаем авторизацию
  }

  const payload: TelegramAuthData = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    photo_url: user.photo_url,
    auth_date: authDate,
    hash,
    initData: raw,
  };

  if (isAuthenticated) {
    return payload;
  }
  try {
    const res = await apiFetch<TelegramAuthData>("/auth/tg-login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setIsAuthenticated(true);
    setUser(res);
    return res;
  } catch (err) {
    console.error("TG login failed:", err);
    return null;
  }
}
