import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LoadingScreen } from "./LoadingScreen";
import ComingSoonModal from "./UI/ComingSoonModal";
import ClickEffect from "./ClickEffect";
import { useTranslation } from "react-i18next";

interface LeaderboardEntry {
  id: number;
  username: string;
  record: number;
  avatarUrl?: string;
}

interface LeaderboardScreenProps {
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { isAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<"classic" | "zen">("classic");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const fetchLeaderboard = async (showRefreshAnimation = false) => {
    try {
      if (showRefreshAnimation) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const userIdParam = user ? `&userId=${user.id}` : "";
      const gameModeParam = `&gameMode=${activeTab}`;
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
      const headers: HeadersInit = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      const response = await fetch(`/api/leaderboard?limit=20${userIdParam}${gameModeParam}`, { headers });

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await response.json();
      console.log("API Response:", data);
      console.log("User:", user);
      console.log("User Position from API:", data.userPosition);

      // Обрабатываем новую структуру данных
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        setUserPosition(data.userPosition || null);
      } else {
        // Fallback для старой структуры
        setLeaderboard(data);
        setUserPosition(null);
      }
      
      // Сбрасываем состояния загрузки
      setIsLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(t("leaderboard.error"));
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user, t, activeTab]);

  const handleRefresh = () => {
    fetchLeaderboard(true);
  };

  const isUserInVisibleTop20 =
    user && leaderboard.some((entry) => entry.id === user.id);

  // Показываем разделитель и карточку пользователя если он НЕ в топ-20
  const shouldShowUserCard = user && userPosition && !isUserInVisibleTop20 && (activeTab === 'classic' ? user.record > 0 : user.zenRecord > 0);

  // Проверяем, нужно ли показать сообщение для пользователя без рекорда
  const shouldShowNoRecordMessage = user && (activeTab === 'classic' ? user.record === 0 : user.zenRecord === 0);

  // Создаем карточку пользователя для отображения под разделителем
  const getUserCard = () => {
    if (!user || !userPosition) return null;

    const userRecord = activeTab === 'classic' ? user.record : user.zenRecord;

    return {
      id: user.id,
      username: user.username || user.firstName || t('leaderboard.you'),
      record: userRecord || 0,
      avatarUrl:
        user.avatarUrl || "/blue.svg",
      position: userPosition,
    };
  };

  // Проверяем, может ли пользователь играть в Zen режим
  const canAccessZen = isAdmin || user?.role === 'tester' || user?.role === 'premium';

  const handleZenClick = () => {
    if (canAccessZen) {
      setActiveTab("zen");
    } else {
      setShowComingSoon(true);
    }
  };

  const getMedalForPosition = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return user && entry.id === user.id;
  };

  if (isLoading) {
    return <LoadingScreen showProgress={true} />;
  }

  return (
    <div className="flex relative flex-col min-h-screen text-white menu-bg fade-in-animation-fast">
      {/* Верхняя панель */}
      <div className="flex justify-between items-center px-4 py-4 mb-4" style={{ paddingTop: 'calc(var(--tg-content-safe-area-inset-top, 0px) + 16px)' }}>
        <ClickEffect>
          <img
            src="/back.svg"
            onClick={onBack}
            className="clickable flex justify-center items-center w-10 h-10 drop-shadow-xl"
            alt={t("leaderboard.back")}
          />
        </ClickEffect>

        <ClickEffect>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center px-4 py-2 rounded-2xl transition-all duration-300 font-figtree-mulish font-bold ${
              isRefreshing
                ? "bg-gray-600/50 cursor-not-allowed"
                : "bg-white/10 backdrop-blur-md hover:bg-white/20 outline outline-white/20"
            }`}
          >
            <svg
              className={`w-5 h-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing
              ? t("leaderboard.refreshing")
              : t("leaderboard.refresh")}
          </button>
        </ClickEffect>
      </div>

      {/* Табы */}
      <div className="flex gap-2 justify-center px-4">
        <ClickEffect>
          <button
            onClick={() => setActiveTab("classic")}
            className={`px-6 py-3 rounded-full text-lg font-extrabold transition-all duration-300 border font-figtree-mulish ${
              activeTab === "classic"
                ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg border-orange-400"
                : "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 hover:border-white/30"
            }`}
          >
            {/* {t("leaderboard.classic")} */}
            Classic
          </button>
        </ClickEffect>

        <ClickEffect>
          <button
            onClick={handleZenClick}
            className={`px-6 py-3 rounded-full text-lg font-extrabold transition-all duration-300 border font-figtree-mulish ${
              activeTab === "zen"
                ? "bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg border-purple-400"
                : canAccessZen
                ? "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 hover:border-white/30"
                : "bg-gray-600/50 text-gray-400 border-gray-500 cursor-not-allowed"
            }`}
            disabled={!canAccessZen}
          >
            {/* {t("leaderboard.zen")} */}
            Zen
          </button>
        </ClickEffect>
      </div>

      {/* Заголовок */}
      <div className="text-center justify-center pb-2 pt-4">
        <div className="relative inline-block">
          {/* Тень под текстом */}
          <h1 className="absolute text-[2.5rem] sm:text-6xl font-black tracking-wider text-blue-600/30 font-figtree-mulish px-8  transform translate-x-1 translate-y-1">
            LEADERBOARD
          </h1>

          {/* Основной заголовок */}
          <h1 className="relative text-[2.5rem] sm:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 font-figtree-mulish px-8 ">
            LEADERBOARD
          </h1>
        </div>
      </div>

      {/* Контент */}
      <div className="flex flex-col flex-1 justify-start items-center px-2 sm:px-4">
        <div className="w-full max-w-2xl">
          {error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-xl mb-6 font-figtree-mulish">
                {error}
              </div>
              <ClickEffect>
                <button
                  onClick={() => fetchLeaderboard()}
                  className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 px-8 py-3 rounded-2xl transition-all duration-300 font-bold font-figtree-mulish shadow-lg"
                >
                  {t("leaderboard.try_again")}
                </button>
              </ClickEffect>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-figtree-mulish text-lg">
              {t("leaderboard.no_data")}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              <div className="leaderboard-scroll max-h-[60dvh] pb-6 overflow-y-auto">
                {/* Топ-20 */}
                {leaderboard.map((entry, index) => {
                  const position = index + 1;
                  const medal = getMedalForPosition(position);
                  const isCurrentUserEntry = isCurrentUser(entry);

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center p-3 sm:p-4 border-b border-white/10 last:border-b-0 transition-all duration-300 ${
                        isCurrentUserEntry
                          ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30"
                          : "hover:bg-white/10"
                      }`}
                    >
                      {/* Позиция/медаль */}
                      <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 text-white font-bold mr-3 sm:mr-4 font-figtree-mulish text-[1.4rem] sm:text-2xl">
                        {medal || position}
                      </div>

                      {/* Аватар и имя пользователя в контейнере */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center bg-transparent backdrop-blur-md rounded-2xl px-3 py-2  border-black/20">
                          <div className="flex-shrink-0 mr-3">
                            <img
                              src={entry.avatarUrl || "/blue.svg"}
                              alt={entry.username}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 object-cover border-2 border-white/20"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== "/blue.svg") {
                                  target.src = "/blue.svg";
                                }
                              }}
                            />
                          </div>
                          <div className="flex items-center min-w-0 flex-1">
                            <div className="font-bold text-white font-figtree-mulish text-base sm:text-lg truncate">
                              {entry.username}
                              {isCurrentUserEntry && !entry.username && (
                                <span className="ml-2 text-orange-400 font-bold flex-shrink-0">
                                  ({t('leaderboard.you')})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Счёт */}
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-lg sm:text-xl font-bold text-yellow-400 font-figtree-mulish">
                          {entry.record.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Разделитель с точками */}
                {shouldShowUserCard && (
                  <div className="flex justify-center items-center py-6 border-b border-white/10">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* Карточка пользователя */}
                {shouldShowUserCard && getUserCard() && (
                  <div className="flex items-center p-3 sm:p-4 border-b border-white/10 last:border-b-0 transition-all duration-300 bg-gradient-to-r from-orange-500/20 to-red-500/20 ">
                    {/* Позиция */}
                    <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 text-white font-bold mr-3 sm:mr-4 font-figtree-mulish text-[1.4rem] sm:text-2xl">
                      {getUserCard()?.position}
                    </div>

                    {/* Аватар и имя пользователя в контейнере */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center bg-black/10 backdrop-blur-md rounded-2xl px-3 py-2  border-black/20">
                        <div className="flex-shrink-0 mr-3">
                          <img
                            src={getUserCard()?.avatarUrl || "/blue.svg"}
                            alt={getUserCard()?.username}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 object-cover border-2 border-white/20"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== "/blue.svg") {
                                target.src = "/blue.svg";
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="font-bold text-white font-figtree-mulish text-base sm:text-lg truncate">
                            {getUserCard()?.username}
                            {!getUserCard()?.username && (
                              <span className="ml-2 text-orange-400 font-bold flex-shrink-0">
                                ({t('leaderboard.you')})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Счёт */}
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-lg sm:text-xl font-bold text-yellow-400 font-figtree-mulish">
                        {getUserCard()?.record.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Сообщение для пользователей без рекорда */}
                {shouldShowNoRecordMessage && (
                  <div className="flex items-center justify-center p-6 border-t border-white/10">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎮</div>
                      <div className="text-white font-figtree-mulish text-lg font-bold mb-2">
                        {t('leaderboard.no_record_title') || 'Начните играть!'}
                      </div>
                      <div className="text-gray-300 font-figtree-mulish text-sm">
                        {t('leaderboard.no_record_message') || 'Сыграйте свою первую игру, чтобы попасть в рейтинг'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно "Скоро" */}
      {showComingSoon && (
        <ComingSoonModal
          onClose={() => setShowComingSoon(false)}
          feature={t("leaderboard.zen")}
        />
      )}
    </div>
  );
};

export default LeaderboardScreen;
