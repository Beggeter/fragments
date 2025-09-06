// Сервис для API вызовов авторизации
import { apiFetch } from "@/services/api";
import { TelegramAuthData, User } from "../types";

export class AuthService {
  static async loginWithTelegram(
    telegramData: TelegramAuthData
  ): Promise<{ user: User; sessionToken: string }> {
    const response = await apiFetch<{ user: User; sessionToken: string }>(
      "/auth/tg-login",
      {
        method: "POST",
        body: JSON.stringify(telegramData),
      }
    );
    return response;
  }

  static async refreshUser(
    telegramId: number,
    sessionToken: string
  ): Promise<User> {
    const response = await apiFetch<User>(`/api/users/${telegramId}`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    return response;
  }

  static async updateUser(
    telegramId: number,
    sessionToken: string,
    updates: Partial<User>
  ): Promise<User> {
    const response = await apiFetch<User>(`/api/users/${telegramId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    return response;
  }
}
