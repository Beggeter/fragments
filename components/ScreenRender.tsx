"use client";

import { useUser } from "@/hooks/useUser";
import { useNavigationStore } from "@/store/navStore";

// Импорты экранов

export default function ScreenRenderer() {
  const { currentScreen, screenData, isLoading } = useNavigationStore();
  const { isAuthenticated, user, isLoading: userLoading } = useUser();
  const { isReady } = useTelegram();

  // Показываем загрузку пока не готовы все системы
  if (!isReady || userLoading || isLoading) {
    return <LoadingScreen />;
  }

  // Если не авторизован, показываем экран входа
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Рендерим соответствующий экран
  switch (currentScreen) {
    case "mainMenu":
      return <MainMenuScreen />;

    case "game":
      return <GameScreen gameMode={screenData.gameMode} />;

    case "gameOver":
      return (
        <GameOverScreen
          score={screenData.score}
          gameMode={screenData.gameMode}
          isNewRecord={screenData.isNewRecord}
        />
      );

    case "shop":
      return <ShopScreen />;

    case "leaderboard":
      return <LeaderboardScreen gameMode={screenData.gameMode} />;

    case "settings":
      return <SettingsScreen />;

    case "profile":
      return <ProfileScreen />;

    case "dailyBonus":
      return <DailyBonusScreen />;

    case "zenMode":
      return <ZenModeScreen />;

    case "pause":
      return <PauseScreen />;

    default:
      return <MainMenuScreen />;
  }
}
