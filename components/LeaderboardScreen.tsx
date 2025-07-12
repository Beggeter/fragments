import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LoadingNumberAnimation } from "./LoadingNumberAnimation";
import ComingSoonModal from "./UI/ComingSoonModal";

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
  const { user } = useUser();
  const { isAdminAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'classic' | 'zen'>('classic');
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

      const userIdParam = user ? `&userId=${user.id}` : '';
      const response = await fetch(`/api/leaderboard?limit=20${userIdParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      console.log('API Response:', data);
      console.log('User:', user);
      console.log('User Position from API:', data.userPosition);
      
      // Обрабатываем новую структуру данных
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        setUserPosition(data.userPosition);
      } else {
        // Fallback для старой структуры
        setLeaderboard(data);
        setUserPosition(null);
      }
      
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Ошибка загрузки таблицы лидеров');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const handleRefresh = () => {
    fetchLeaderboard(true);
  };

  const handleZenClick = () => {
    setShowComingSoon(true);
  };

  const getMedalForPosition = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return user && entry.id === user.id;
  };

  // Проверяем, есть ли пользователь в видимой части топ-20
  const isUserInVisibleTop20 = user && leaderboard.some(entry => entry.id === user.id);
  
  // Показываем позицию внизу только если пользователь НЕ в топ-20
  const shouldShowBottomPosition = user && userPosition && !isUserInVisibleTop20;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-2xl font-bold mb-4">Загрузка...</div>
          <div className="text-lg">
            <LoadingNumberAnimation isLoading={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-white hover:text-yellow-400 transition-colors"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Назад
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isRefreshing 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <svg 
              className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Обновление...' : 'Обновить'}
          </button>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
          Таблица лидеров
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('classic')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'classic'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Классический
            </button>
            <button
              onClick={handleZenClick}
              className="px-6 py-2 rounded-md font-medium text-gray-300 hover:text-white transition-colors"
            >
              Zen
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`max-w-2xl mx-auto ${shouldShowBottomPosition ? 'pb-20' : ''}`}>
          {error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-xl mb-4">{error}</div>
              <button
                onClick={() => fetchLeaderboard()}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Нет данных для отображения
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-700 overflow-hidden">
              <div className="leaderboard-scroll max-h-96 overflow-y-auto">
                {leaderboard.map((entry, index) => {
                  const position = index + 1;
                  const medal = getMedalForPosition(position);
                  const isCurrentUserEntry = isCurrentUser(entry);
                  
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center p-4 border-b border-gray-700 last:border-b-0 ${
                        isCurrentUserEntry
                          ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30'
                          : 'hover:bg-gray-700/50'
                      } transition-colors`}
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 text-white font-bold mr-4">
                        {medal || position}
                      </div>
                      
                      {/* Avatar */}
                      <div className="flex-shrink-0 mr-4">
                        <img
                          src={entry.avatarUrl || '/record.png'}
                          alt={entry.username}
                          className="w-10 h-10 rounded-full bg-gray-600 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/record.png';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="font-medium text-white">
                            {entry.username}
                            {isCurrentUserEntry && (
                              <span className="ml-2 text-orange-400 font-bold">(Вы)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-400">
                          {entry.record.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Panel - User Position */}
      {shouldShowBottomPosition && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 z-50">
          <div className="container mx-auto max-w-2xl">
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-orange-500/20 rounded-lg px-4 py-3 border border-orange-500/30">
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.username || user.firstName || 'User'}
                    className="w-8 h-8 rounded-full mr-3"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/record.png';
                    }}
                  />
                )}
                <span className="text-orange-300 font-bold">
                  Ваша позиция: #{userPosition}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <ComingSoonModal
          onClose={() => setShowComingSoon(false)}
          feature="Zen режим"
        />
      )}
    </div>
  );
};

export default LeaderboardScreen; 