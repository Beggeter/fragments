"use client";

import React, { useEffect } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useUserStore } from "@/store/user";
import { useAuth } from "@/components/AuthProvider";

export const AuthTest: React.FC = () => {
  const { isTelegramReady, isInTelegram, telegramUser, autoAuth, initData, launchParams, hasLaunchParams } = useTelegram();
  const { user, admin, isAuthenticated, isAdmin, isLoading } = useUserStore();
  const { isInitialized, error } = useAuth();

  // Автоматическая авторизация при готовности Telegram
  useEffect(() => {
    console.log('AuthTest useEffect:', {
      isTelegramReady,
      isInTelegram,
      isAuthenticated,
      isAdmin,
      telegramUser: !!telegramUser,
      initData: !!initData,
      launchParams: !!launchParams,
      launchParamsKeys: launchParams ? Object.keys(launchParams) : [],
      tgWebAppData: !!(launchParams && launchParams.tgWebAppData)
    });
    
    if (isTelegramReady && isInTelegram && !isAuthenticated && !isAdmin) {
      console.log('Attempting autoAuth...');
      autoAuth().then(result => {
        console.log('AutoAuth result:', result);
      }).catch(error => {
        console.error('AutoAuth error:', error);
      });
    }
  }, [isTelegramReady, isInTelegram, isAuthenticated, isAdmin, autoAuth]);

  if (!isInitialized) {
    return (
      <div className="p-4 bg-blue-100 border border-blue-300 rounded">
        <h3 className="font-bold text-blue-800">🔄 Инициализация...</h3>
        <p className="text-blue-600">Загружаем систему авторизации...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <h3 className="font-bold text-red-800">❌ Ошибка инициализации</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded">
      <h3 className="font-bold text-gray-800 mb-4">🔐 Статус авторизации</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Telegram готов:</span> 
          <span className={isTelegramReady ? "text-green-600" : "text-red-600"}>
            {isTelegramReady ? " ✅" : " ❌"}
          </span>
        </div>
        
        <div>
          <span className="font-medium">В Telegram:</span> 
          <span className={isInTelegram ? "text-green-600" : "text-red-600"}>
            {isInTelegram ? " ✅" : " ❌"}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Загрузка:</span> 
          <span className={isLoading ? "text-yellow-600" : "text-green-600"}>
            {isLoading ? " ⏳" : " ✅"}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Авторизован:</span> 
          <span className={isAuthenticated ? "text-green-600" : "text-red-600"}>
            {isAuthenticated ? " ✅" : " ❌"}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Админ:</span> 
          <span className={isAdmin ? "text-green-600" : "text-red-600"}>
            {isAdmin ? " ✅" : " ❌"}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Параметры запуска:</span> 
          <span className={hasLaunchParams ? "text-green-600" : "text-red-600"}>
            {hasLaunchParams ? " ✅" : " ❌"}
          </span>
        </div>
      </div>

      {/* Кнопка для ручной авторизации */}
      <div className="mt-4">
        <button
          onClick={() => {
            console.log('Manual auth attempt...');
            autoAuth().then(result => {
              console.log('Manual auth result:', result);
            }).catch(error => {
              console.error('Manual auth error:', error);
            });
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={!isTelegramReady || !isInTelegram || isAuthenticated || isAdmin}
        >
          {isAuthenticated || isAdmin ? 'Уже авторизован' : 'Попробовать авторизацию'}
        </button>
      </div>

      {telegramUser && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-medium text-blue-800">Telegram пользователь:</h4>
          <p className="text-blue-600">ID: {telegramUser.id}</p>
          <p className="text-blue-600">Имя: {telegramUser.first_name}</p>
          {telegramUser.username && (
            <p className="text-blue-600">Username: @{telegramUser.username}</p>
          )}
        </div>
      )}

      {user && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <h4 className="font-medium text-green-800">Пользователь:</h4>
          <p className="text-green-600">ID: {user.id}</p>
          <p className="text-green-600">Telegram ID: {user.telegramId}</p>
          <p className="text-green-600">Имя: {user.firstName}</p>
          <p className="text-green-600">Роль: {user.role}</p>
          <p className="text-green-600">Валюта: {user.currency}</p>
        </div>
      )}

      {admin && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
          <h4 className="font-medium text-purple-800">Админ:</h4>
          <p className="text-purple-600">ID: {admin.id}</p>
          <p className="text-purple-600">Telegram ID: {admin.telegramId}</p>
          <p className="text-purple-600">Имя: {admin.firstName}</p>
          <p className="text-purple-600">Истекает: {admin.expiresAt}</p>
        </div>
      )}

      {initData && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800">InitData:</h4>
          <p className="text-yellow-600">Hash: {initData.hash ? "✅" : "❌"}</p>
          <p className="text-yellow-600">Auth Date: {initData.authDate ? String(initData.authDate) : "N/A"}</p>
          <p className="text-yellow-600">Raw: {initData.raw ? "✅" : "❌"}</p>
        </div>
      )}

      {launchParams && Object.keys(launchParams).length > 0 && (
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded">
          <h4 className="font-medium text-indigo-800">Launch Params:</h4>
          <p className="text-indigo-600 mb-2">Keys: {Object.keys(launchParams).join(', ')}</p>
          <pre className="text-indigo-600 text-xs overflow-auto">
            {JSON.stringify(launchParams, null, 2)}
          </pre>
        </div>
      )}

      {/* Отображение сырых данных для отладки */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <h4 className="font-medium text-gray-800">Debug Info:</h4>
        <p className="text-gray-600 text-sm">
          isTelegramReady: {isTelegramReady ? '✅' : '❌'}<br/>
          isInTelegram: {isInTelegram ? '✅' : '❌'}<br/>
          telegramUser: {telegramUser ? '✅' : '❌'}<br/>
          initData: {initData ? '✅' : '❌'}<br/>
          launchParams: {launchParams ? '✅' : '❌'}<br/>
          tgWebAppData: {launchParams && launchParams.tgWebAppData ? '✅' : '❌'}
        </p>
      </div>
    </div>
  );
};
