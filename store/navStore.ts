import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type Screen =
  | "loading"
  | "login"
  | "mainMenu"
  | "game"
  | "gameOver"
  | "shop"
  | "leaderboard"
  | "settings"
  | "profile"
  | "dailyBonus"
  | "zenMode"
  | "pause";

export type GameMode = "classic" | "zen";

interface NavigationState {
  // Текущий экран
  currentScreen: Screen;

  // История экранов для навигации назад
  screenHistory: Screen[];

  // Игровой режим
  gameMode: GameMode | null;

  // Данные для передачи между экранами
  screenData: Record<string, any>;

  // Состояние загрузки
  isLoading: boolean;

  // Действия
  navigateTo: (screen: Screen, data?: any, addToHistory?: boolean) => void;
  goBack: () => void;
  setLoading: (loading: boolean) => void;
  setGameMode: (mode: GameMode) => void;
  clearScreenData: () => void;
  reset: () => void;
}

const initialState = {
  currentScreen: "loading" as Screen,
  screenHistory: [] as Screen[],
  gameMode: null as GameMode | null,
  screenData: {} as Record<string, any>,
  isLoading: true,
};

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      navigateTo: (
        screen: Screen,
        data?: any,
        addToHistory: boolean = true
      ) => {
        const { currentScreen, screenHistory } = get();

        set((state) => ({
          currentScreen: screen,
          screenHistory: addToHistory
            ? [...screenHistory, currentScreen]
            : screenHistory,
          screenData: data || {},
          isLoading: false,
        }));
      },

      goBack: () => {
        const { screenHistory } = get();

        if (screenHistory.length > 0) {
          const previousScreen = screenHistory[screenHistory.length - 1];

          set((state) => ({
            currentScreen: previousScreen,
            screenHistory: screenHistory.slice(0, -1),
            screenData: {},
          }));
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setGameMode: (mode: GameMode) => {
        set({ gameMode: mode });
      },

      clearScreenData: () => {
        set({ screenData: {} });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "navigation-store",
    }
  )
);
