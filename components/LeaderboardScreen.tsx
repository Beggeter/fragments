import React, { useState, useEffect, useRef, useCallback } from "react";
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

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  userPosition: number | null;
}

interface LeaderboardScreenProps {
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { isAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<"classic" | "zen">("classic");
  const [leaderboards, setLeaderboards] = useState<{
    classic: LeaderboardData;
    zen: LeaderboardData;
  }>({
    classic: { leaderboard: [], userPosition: null },
    zen: { leaderboard: [], userPosition: null },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showTabChange, setShowTabChange] = useState(false);
  
  // Состояния для липкой позиции
  const [isUserVisible, setIsUserVisible] = useState(false);
  const [showStickyUser, setShowStickyUser] = useState(false);
  const [isUserInitiallyVisible, setIsUserInitiallyVisible] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userEntryRef = useRef<HTMLDivElement>(null);

  const fetchAllLeaderboards = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userIdParam = user ? `&userId=${user.id}` : "";
      const sessionToken =
        typeof window !== "undefined"
          ? localStorage.getItem("sessionToken")
          : null;
      const headers: HeadersInit = {};
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      // Загружаем данные для обоих режимов параллельно
      const [classicResponse, zenResponse] = await Promise.all([
        fetch(`/api/leaderboard?limit=20${userIdParam}&gameMode=classic`, { headers }),
        fetch(`/api/leaderboard?limit=20${userIdParam}&gameMode=zen`, { headers }),
      ]);

      if (!classicResponse.ok || !zenResponse.ok) {
        throw new Error("Failed to fetch leaderboards");
      }

      const classicData = await classicResponse.json();
      const zenData = await zenResponse.json();

      setLeaderboards({
        classic: {
          leaderboard: classicData.leaderboard || classicData,
          userPosition: classicData.userPosition || null,
        },
        zen: {
          leaderboard: zenData.leaderboard || zenData,
          userPosition: zenData.userPosition || null,
        },
      });

      setIsLoading(false);
    } catch (err) {
      setError(t("leaderboard.error"));
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllLeaderboards();
  }, [user, t]);
  
  useEffect(() => {
    if (showTabChange) {
      const timeout = setTimeout(() => setShowTabChange(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [showTabChange]);



  const currentLeaderboard = leaderboards[activeTab];
  const leaderboard = currentLeaderboard.leaderboard;
  const userPosition = currentLeaderboard.userPosition;

  const isUserInVisibleTop20 = Boolean(
    user && leaderboard.some((entry) => entry.id === user.id)
  );

  const shouldShowUserCard =
    user &&
    userPosition &&
    !isUserInVisibleTop20 &&
    (activeTab === "classic" ? user.record > 0 : user.zenRecord > 0);

  const shouldShowNoRecordMessage =
    user &&
    (activeTab === "classic" ? user.record === 0 : user.zenRecord === 0);

  const getUserCard = () => {
    if (!user || !userPosition) return null;

    const userRecord = activeTab === "classic" ? user.record : user.zenRecord;

    return {
      id: user.id,
      username: user.username || user.firstName || t("leaderboard.you"),
      record: userRecord || 0,
      avatarUrl: user.avatarUrl || "/blue.svg",
      position: userPosition,
    };
  };

  const canAccessZen =
    isAdmin || user?.role === "tester" || user?.role === "premium";

  const handleZenClick = () => {
    if (canAccessZen) {
      setActiveTab("zen");
      setShowTabChange(true)
    } else {
      setShowComingSoon(true);
    }
  };

  const getMedalForPosition = (position: number) => {
    switch (position) {
      case 1:
        return "/record.png";
      case 2:
        return "/cup_silver.svg";
      case 3:
        return "/cup_bronze.svg";
      default:
        return null;
    }
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return user && entry.id === user.id;
  };

  // Компонент липкой карточки пользователя
  const StickyUserCard = () => {
    if (!user || !userPosition) return null;

    const userRecord = activeTab === "classic" ? user.record : user.zenRecord;
    const position = userPosition;

    return (
      <div className="sticky bottom-0 z-10 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-md border-t border-orange-500/30 shadow-lg">
        <div className="flex items-center p-3 sm:p-4">
          {/* Позиция */}
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 text-white font-bold mr-3 sm:mr-4 font-figtree-mulish text-[1.4rem] sm:text-2xl">
            {position}
          </div>

          {/* Аватар и имя пользователя */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center bg-black/10 backdrop-blur-md rounded-2xl px-3 py-2 border-black/20">
              <div className="flex-shrink-0 mr-3">
                <img
                  src={user.avatarUrl || "/blue.svg"}
                  alt={user.username || user.firstName}
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
                  {user.username || user.firstName || t("leaderboard.you")}
                  {!user.username && !user.firstName && (
                    <span className="ml-2 text-orange-400 font-bold flex-shrink-0">
                      ({t("leaderboard.you")})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Счёт */}
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-lg sm:text-xl font-bold text-yellow-400 font-figtree-mulish">
              {userRecord?.toLocaleString() || "0"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Функция для проверки видимости пользователя в таблице
  const checkUserVisibility = useCallback(() => {
    if (!scrollContainerRef.current || !userEntryRef.current || !user) return;

    const container = scrollContainerRef.current;
    const userEntry = userEntryRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const userEntryRect = userEntry.getBoundingClientRect();
    
    // Проверяем, видна ли запись пользователя в контейнере
    const isVisible = 
      userEntryRect.top >= containerRect.top && 
      userEntryRect.bottom <= containerRect.bottom;
    
    setIsUserVisible(isVisible);
    
    // Определяем, был ли пользователь изначально виден (в начале списка)
    const isInitiallyVisible = userEntryRect.top >= containerRect.top && userEntryRect.top <= containerRect.top + 100;
    setIsUserInitiallyVisible(isInitiallyVisible);
    
    // Показываем липкую карточку в зависимости от ситуации:
    // 1. Если пользователь не виден и есть скролл - показываем сверху
    // 2. Если пользователь был изначально виден, но теперь не виден - показываем сверху
    const hasScroll = container.scrollHeight > container.clientHeight;
    const shouldShowSticky = !isVisible && hasScroll && isUserInVisibleTop20;
    setShowStickyUser(shouldShowSticky);
  }, [user, isUserInVisibleTop20]);

  // Обработчик скролла
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkUserVisibility();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkUserVisibility]);

  // Проверяем видимость при изменении данных
  useEffect(() => {
    // Небольшая задержка для корректного рендеринга
    const timer = setTimeout(() => {
      checkUserVisibility();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [leaderboard, checkUserVisibility]);

  // Сбрасываем состояние липкой карточки при смене таба
  useEffect(() => {
    setShowStickyUser(false);
    setIsUserVisible(false);
    setIsUserInitiallyVisible(false);
  }, [activeTab]);

  if (isLoading) {
    return <LoadingScreen showProgress={true} />;
  }

  return (
    <div className="flex relative flex-col min-h-screen text-white menu-bg fade-in-animation-fast">
      {/* Верхняя панель */}
      <div
        className="flex justify-between items-center px-4 py-4"
        style={{
          paddingTop: "calc(var(--tg-content-safe-area-inset-top, 0px) + 16px)",
        }}
      >
        <ClickEffect>
          <img
            src="/back.svg"
            onClick={onBack}
            className="clickable flex justify-center items-center w-10 h-10 drop-shadow-xl"
            alt={t("leaderboard.back")}
          />
        </ClickEffect>
      </div>

      {/* Табы */}
      <div className="flex gap-2 justify-center px-4 mb-4">
        <ClickEffect>
          <button
            onClick={() => {setShowTabChange(true); setActiveTab("classic")}}
            className={`px-6 py-3 rounded-full text-lg font-extrabold transition-all duration-300 border font-figtree-mulish ${
              activeTab === "classic"
                ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg border-orange-400"
                : "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 hover:border-white/30"
            }`}
          >
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
            Zen
          </button>
        </ClickEffect>
      </div>

      {/* Заголовок */}
      <div className="text-center justify-center pb-2 pt-4">
        <div className="relative inline-block">
          <h1 className="absolute text-[2.5rem] sm:text-6xl font-black tracking-wider text-blue-600/30 font-figtree-mulish px-8  transform translate-x-1 translate-y-1">
            LEADERBOARD
          </h1>
          <h1 className="relative text-[2.5rem] sm:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 font-figtree-mulish px-8 ">
            LEADERBOARD
          </h1>
        </div>
      </div>

      {/* Контент */}
      <div className={`flex flex-col flex-1 justify-start items-center px-2 sm:px-4 ${showTabChange ? 'slide-in-animation' : ''} `}>
        <div className="w-full max-w-2xl">
          {error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-xl mb-6 font-figtree-mulish">
                {error}
              </div>
              <ClickEffect>
                <button
                  onClick={() => fetchAllLeaderboards()}
                  className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 px-8 py-3 rounded-2xl transition-all duration-300 font-bold font-figtree-mulish shadow-lg"
                >
                  {t("leaderboard.try_again")}
                </button>
              </ClickEffect>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-figtree-mulish text-lg">
              {t("leaderboard.no_data")}
              {/* Покажем карточку пользователя даже если таблица пуста */}
              {(user && userPosition && (activeTab === "classic" ? user.record > 0 : user.zenRecord > 0)) && (
                <div className="mt-6">
                  <StickyUserCard />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden h-[60dvh] flex flex-col">
              <div className="leaderboard-scroll flex-1 overflow-y-auto" ref={scrollContainerRef}>
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
                      ref={(el) => {
                        if (isCurrentUserEntry) {
                          userEntryRef.current = el;
                        }
                      }}
                    >
                      {/* Позиция/медаль */}
                      <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 text-white font-bold mr-3 sm:mr-4 font-figtree-mulish text-[1.4rem] sm:text-2xl">
                        {medal ? (
                          <img src={medal} className="h-8 w-8" />
                        ) : (
                          position
                        )}
                      </div>

                      {/* Аватар и имя пользователя в контейнере */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`flex items-center bg-transparent backdrop-blur-md rounded-2xl px-3 py-2 border-black/20 
                          ${
                            position === 1
                              ? "outline-1 outline-amber-400 drop-shadow-[0_0_8px_#FBBF24]"
                              : position === 2
                              ? "outline-1 outline-[#bbe1ff] drop-shadow-[0_0_8px_#a7c9e4]"
                              : position === 3
                              ? "outline-1 outline-[#df9856] drop-shadow-[0_0_8px_#df9856]"
                              : ""
                          }`}
                        >
                          <div className="flex-shrink-0 mr-3">
                            <img
                              src={entry.avatarUrl || "/blue.svg"}
                              alt={entry.username}
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 object-cover border-2 border-white/20
                                ${
                                  position === 1
                                    ? "outline-2 outline-amber-400 "
                                    : position === 2
                                    ? "outline-1 outline-[#bbe1ff]"
                                    : position === 3
                                    ? "outline-1 outline-[#df9856]"
                                    : ""
                                }
                                `}
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
                                  ({t("leaderboard.you")})
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



                {/* Сообщение для пользователей без рекорда */}
                {shouldShowNoRecordMessage && (
                  <div className="flex items-center justify-center p-6 border-t border-white/10">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🎮</div>
                      <div className="text-white font-figtree-mulish text-lg font-bold mb-2">
                        {t("leaderboard.no_record_title") || "Начните играть!"}
                      </div>
                      <div className="text-gray-300 font-figtree-mulish text-sm">
                        {activeTab === "classic"
                          ? t("leaderboard.no_record_message")
                          : t("leaderboard.no_record_message_zen")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Липкая карточка пользователя внизу:
                 - показываем, если пользователь находится в топ-20, но его запись не видна (скролл)
                 - или если пользователя нет в топ-20, но у него есть рекорд и вычисленная позиция */}
              {(showStickyUser || (user && userPosition && !isUserInVisibleTop20 && (activeTab === "classic" ? user.record > 0 : user.zenRecord > 0))) && (
                <StickyUserCard />
              )}
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