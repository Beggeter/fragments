import { safeLocalStorage } from "@/lib/utils/telegramSDK";

export class StorageService {
  private static readonly KEYS = {
    SESSION_TOKEN: "sessionToken",
    USER_DATA: "userData",
    ADMIN_TOKEN: "adminToken",
    ADMIN_EXPIRES: "adminExpiresAt",
  } as const;

  static setSession(sessionToken: string, userData: any): void {
    try {
      safeLocalStorage.setItem(this.KEYS.SESSION_TOKEN, sessionToken);
      // Не сохраняем currency в localStorage - всегда получаем с сервера
      const { currency, ...userDataForStorage } = userData;
      safeLocalStorage.setItem(
        this.KEYS.USER_DATA,
        JSON.stringify(userDataForStorage)
      );
    } catch (error) {
      console.error("Failed to save session:", error);
      this.clearSession();
    }
  }

  static getSession(): { sessionToken: string | null; userData: any | null } {
    try {
      const sessionToken = safeLocalStorage.getItem(this.KEYS.SESSION_TOKEN);
      const userDataStr = safeLocalStorage.getItem(this.KEYS.USER_DATA);
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      return { sessionToken, userData };
    } catch (error) {
      console.error("Failed to get session:", error);
      return { sessionToken: null, userData: null };
    }
  }

  static clearSession(): void {
    safeLocalStorage.removeItem(this.KEYS.SESSION_TOKEN);
    safeLocalStorage.removeItem(this.KEYS.USER_DATA);
  }

  static setAdminSession(adminToken: string, expiresAt: string): void {
    safeLocalStorage.setItem(this.KEYS.ADMIN_TOKEN, adminToken);
    safeLocalStorage.setItem(this.KEYS.ADMIN_EXPIRES, expiresAt);
  }

  static getAdminSession(): {
    adminToken: string | null;
    expiresAt: string | null;
  } {
    const adminToken = safeLocalStorage.getItem(this.KEYS.ADMIN_TOKEN);
    const expiresAt = safeLocalStorage.getItem(this.KEYS.ADMIN_EXPIRES);
    return { adminToken, expiresAt };
  }

  static clearAdminSession(): void {
    safeLocalStorage.removeItem(this.KEYS.ADMIN_TOKEN);
    safeLocalStorage.removeItem(this.KEYS.ADMIN_EXPIRES);
  }
}
