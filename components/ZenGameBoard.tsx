import React, { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/lib/state/store";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useGameSave } from "@/hooks/useGameSave";
import GameBoard from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { LoadingScreen } from "@/components/LoadingScreen";

interface ZenGameBoardProps {
  onBackToMenu: () => void;
  onOpenShop?: () => void;
}

export const ZenGameBoard: React.FC<ZenGameBoardProps> = ({ onBackToMenu, onOpenShop }) => {
  const {
    score,
    gameOver,
    initializeGame,
    resetGame,
    updateEngineForUser,
  } = useGameStore();

  const { user } = useUser();
  const { isAdmin } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Используем отдельную систему сохранения для Zen режима
  const { loadGame, saveAfterAction, forceSave } = useGameSave('zen');

  useEffect(() => {
    const initializeZenGame = async () => {
      console.log('🧘 Initializing Zen mode...');
      
      // Обновляем движок для ZEN режима
      updateEngineForUser('zen');
      
      // Пытаемся загрузить сохраненную игру
      const hasSavedGame = await loadGame();
      
      if (!hasSavedGame) {
        // Если нет сохраненной игры, инициализируем новую
        console.log('🧘 Starting new Zen game');
        initializeGame();
      } else {
        console.log('🧘 Loaded saved Zen game');
      }
      
      // Небольшая задержка для плавности
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };

    // Инициализируем игру только один раз при монтировании
    initializeZenGame();
  }, [initializeGame, updateEngineForUser, loadGame]);

  // Сохраняем игру при выходе
  useEffect(() => {
    const handleBeforeUnload = () => {
      forceSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Сохраняем при размонтировании компонента
      forceSave();
    };
  }, [forceSave]);

  const handleRestart = () => {
    resetGame();
    initializeGame();
  };

  const handleBackToMenu = () => {
    // Сохраняем игру перед возвратом в меню
    forceSave();
    // Сбрасываем игру перед возвратом в меню
    resetGame();
    onBackToMenu();
  };

  const handleGameBoardGameOver = useCallback(() => {
    forceSave();
  }, [forceSave]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
              <GameOver 
        onPlayAgain={handleRestart}
        onBackToMenu={handleBackToMenu}
        gameMode="zen"
      />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 relative overflow-hidden">
      {/* ZEN режим - точно такой же интерфейс как в Classic */}
      <GameBoard 
        onScoreUpdate={(score) => {
          // Сохраняем после каждого хода в Zen режиме
          setTimeout(() => saveAfterAction(), 100);
        }}
        onGameOver={handleGameBoardGameOver}
        onExitGame={handleBackToMenu}
        onGoHome={handleBackToMenu}
        onOpenShop={() => {
          // Сохраняем игру перед открытием магазина
          forceSave();
          // Открываем магазин
          onOpenShop?.();
        }}
        gameMode="zen"
      />


    </div>
  );
}; 