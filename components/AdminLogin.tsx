"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './UI/Button';

interface AdminLoginProps {
  onLoginSuccess: (adminToken: string, expiresAt: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Сохраняем админ-статус в localStorage
        localStorage.setItem('adminToken', data.adminToken);
        localStorage.setItem('adminExpiresAt', data.expiresAt);
        
        onLoginSuccess(data.adminToken, data.expiresAt);
      } else {
        setError(data.error || 'Неверный пароль');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const response = await fetch('/api/admin/generate-password', {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Новый пароль сгенерирован!\nПроверьте консоль сервера для получения пароля.');
      } else {
        alert('Ошибка генерации пароля');
      }
    } catch (err) {
      alert('Ошибка генерации пароля');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔐 Админ Панель</h1>
          <p className="text-gray-300">Введите пароль для доступа к админ-функциям</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              maxLength={6}
              pattern="[0-9]{6}"
              title="Пароль должен содержать 6 цифр"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || password.length !== 6}
            variant="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? 'Проверка...' : 'Войти как админ'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/20">
          <button
            onClick={handleGeneratePassword}
            className="w-full py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            🔑 Сгенерировать новый пароль
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>Пароль действителен 12 часов</p>
          <p>Проверьте консоль сервера для получения пароля</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 