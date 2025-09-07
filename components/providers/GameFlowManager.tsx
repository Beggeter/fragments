"use client";

import { useState, useCallback } from "react";
import { useGameStore } from "@/lib/state/store";
import { useUser } from "@/hooks/useUser";

interface GameFlowManagerProps {
  onGameOver: () => void;
  onScoreUpdate: (score: number) => void;
}

export const GameFlowManager: React.FC<GameFlowManagerProps> = ({
  onGameOver,
  onScoreUpdate
}) => {
  const [score, setScore] = useState(0);
  const [shopReturnTo, setShopReturnTo] = useState<string | null>(null);
  const [isIntentionalRestart, setIsIntentionalRestart] = useState(false);
  
  const { user, sessionToken, updateUser, refreshBalance } = useUser();

  const handleGameOver = useCallback(async () => {
    try {
      const { score: gameScore } = useGameStore.getState();
      const telegramId = user?.telegramId || 
        (process.env.NODE_ENV === "development" ? "610936383" : null);

      if (telegramId && gameScore > 0) {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (sessionToken) {
          headers["Authorization"] = `Bearer ${sessionToken}`;
        }

        // Определяем режим игры для отправки на сервер
        const gameMode = shopReturnTo === "zen mode" ? "zen" : "classic";
        const endpoint = gameMode === "zen"
          ? `/api/users/${telegramId}/zen-game`
          : `/api/users/${telegramId}/game`;

        const response = await fetch(endpoint, {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            gameId: 1,
            finalScore: gameScore,
            level: 1,
            gameMode: gameMode,
            gameData: {
              gameDuration: Date.now(),
              piecesPlaced: useGameStore.getState().piecesPlaced || 0,
            },
          }),
        });

        if (response.ok) {
          const result = JSON.parse(await response.text());
          await refreshBalance();

          if (result.newRecord !== undefined && user) {
            if (gameMode === "zen") {
              updateUser({ zenRecord: result.newRecord });
            } else {
              updateUser({ record: result.newRecord });
            }
          }
        }
      }
    } catch (error) {
      console.error('Game over error:', error);
    }

    onGameOver();
  }, [user, sessionToken, updateUser, refreshBalance, shopReturnTo, onGameOver]);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    onScoreUpdate(newScore);
  }, [onScoreUpdate]);

  const handleRestartComplete = useCallback(() => {
    setIsIntentionalRestart(false);
  }, []);

  const setShopReturn = useCallback((screen: string | null) => {
    setShopReturnTo(screen);
  }, []);

  const setIntentionalRestart = useCallback((value: boolean) => {
    setIsIntentionalRestart(value);
  }, []);

  return {
    score,
    shopReturnTo,
    isIntentionalRestart,
    handleGameOver,
    handleScoreUpdate,
    handleRestartComplete,
    setShopReturn,
    setIntentionalRestart
  };
};
