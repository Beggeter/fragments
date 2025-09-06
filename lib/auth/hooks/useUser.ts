// Хук для работы с пользователем
import { useAuth } from "../context";
import { User } from "../types";

export function useUser() {
  const { user, updateUser, refreshUser } = useAuth();

  const updateCurrency = (newAmount: number) => {
    if (user) {
      updateUser({ currency: newAmount });
    }
  };

  const updateRecord = (
    newRecord: number,
    gameMode: "classic" | "zen" = "classic"
  ) => {
    if (user) {
      const updates =
        gameMode === "zen" ? { zenRecord: newRecord } : { record: newRecord };
      updateUser(updates);
    }
  };

  const refreshBalance = async () => {
    await refreshUser();
    return user?.currency || 0;
  };

  return {
    user,
    updateCurrency,
    updateRecord,
    refreshBalance,
  };
}
