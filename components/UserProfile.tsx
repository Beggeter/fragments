'use client';

import React, { useState, useEffect } from 'react';
import type { User } from '@/lib/db/types';
import { LoadingNumberAnimation } from './LoadingNumberAnimation';

interface UserProfileProps {
  telegramId: string;
}

interface UserData {
  user: User;
  balance: number;
  transactions: any[];
  stats: any;
  currentGame: any;
  gameStats: any;
  bestRecord: any;
  userBoosters: any[];
  availableBoosters: any[];
}

export default function UserProfile({ telegramId }: UserProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [telegramId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Получаем данные пользователя
      const userResponse = await fetch(`/api/users/${telegramId}`);
      const user = await userResponse.json();
      
      if (!userResponse.ok) {
        throw new Error(user.error || 'Failed to fetch user data');
      }

      // Получаем данные валюты
      const currencyResponse = await fetch(`/api/users/${telegramId}/currency`);
      const currencyData = await currencyResponse.json();
      
      // Получаем данные игры
      const gameResponse = await fetch(`/api/users/${telegramId}/game`);
      const gameData = await gameResponse.json();
      
      // Получаем данные бустеров
      const boostersResponse = await fetch(`/api/users/${telegramId}/boosters`);
      const boostersData = await boostersResponse.json();

      setUserData({
        user,
        ...currencyData,
        ...gameData,
        ...boostersData,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const purchaseBooster = async (boosterTypeId: number, price: number) => {
    try {
      const response = await fetch(`/api/users/${telegramId}/boosters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          boosterTypeId,
          quantity: 1,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Обновляем данные пользователя
        await fetchUserData();
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert('Failed to purchase booster');
    }
  };

  const useBooster = async (boosterTypeId: number) => {
    try {
      const response = await fetch(`/api/users/${telegramId}/boosters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'use',
          boosterTypeId,
          quantity: 1,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Обновляем данные пользователя
        await fetchUserData();
        alert(result.message);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert('Failed to use booster');
    }
  };

  if (loading) {
    return <div className="p-4">Loading user profile...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!userData) {
    return <div className="p-4">User not found</div>;
  }

  const { user, balance, stats, gameStats, bestRecord, userBoosters, availableBoosters } = userData;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Профиль пользователя */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4">
          {user.avatarUrl && (
            <img 
              src={user.avatarUrl} 
              alt="Avatar" 
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600">@{user.username}</p>
            <p className="text-sm text-gray-500">Role: {user.role}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            {loading ? (
              <div className="text-2xl font-bold text-blue-600">
                <LoadingNumberAnimation
                  isLoading={true}
                  minDigits={4}
                  speed={50}
                />
              </div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">{user.record}</div>
            )}
            <div className="text-sm text-gray-600">Best Record</div>
          </div>
          <div className="text-center">
            {loading ? (
              <div className="text-2xl font-bold text-green-600">
                <LoadingNumberAnimation
                  isLoading={true}
                  minDigits={3}
                  speed={50}
                />
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{balance}</div>
            )}
            <div className="text-sm text-gray-600">Currency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{gameStats?.totalGames || 0}</div>
            <div className="text-sm text-gray-600">Games Played</div>
          </div>
        </div>
      </div>

      {/* Статистика игр */}
      {gameStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Game Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{gameStats.averageScore}</div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{gameStats.totalLinesCleared}</div>
              <div className="text-sm text-gray-600">Lines Cleared</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{gameStats.averageGameTime}s</div>
              <div className="text-sm text-gray-600">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{gameStats.totalPiecesPlaced}</div>
              <div className="text-sm text-gray-600">Pieces Placed</div>
            </div>
          </div>
        </div>
      )}

      {/* Бустеры */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Boosters</h2>
        
        {/* Доступные бустеры */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Available Boosters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBoosters.map((booster) => {
              const userBooster = userBoosters.find(ub => ub.boosterTypeId === booster.id);
              const quantity = userBooster?.quantity || 0;
              
              return (
                <div key={booster.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold">{booster.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{booster.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Price: {booster.price}</span>
                    <span className="text-sm font-medium">Owned: {quantity}</span>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => purchaseBooster(booster.id, booster.price)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Buy
                    </button>
                    {quantity > 0 && (
                      <button
                        onClick={() => useBooster(booster.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        Use
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* История транзакций */}
      {stats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Currency Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{stats.totalEarned}</div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{stats.totalSpent}</div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.totalTransactions}</div>
              <div className="text-sm text-gray-600">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{stats.netChange}</div>
              <div className="text-sm text-gray-600">Net Change</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 