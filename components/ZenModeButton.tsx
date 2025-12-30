import React from 'react';
import { useUser } from '../hooks/useUser';
import { useAdminAuth } from '../hooks/useAdminAuth';

interface ZenModeButtonProps {
  onZenModeClick: () => void;
}

const ZenModeButton: React.FC<ZenModeButtonProps> = ({ onZenModeClick }) => {
  const { user } = useUser();
  const { isAdmin } = useAdminAuth();

  const isZenModeAvailable = user?.role === 'premium' || user?.role === 'admin' || user?.role === 'tester' || isAdmin;

  if (!isZenModeAvailable) {
    return null; // Не показываем кнопку, если режим недоступен
  }

  return (
    <button
      onClick={onZenModeClick}
      className="relative group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300"
    >
      <div className="flex items-center justify-center space-x-3">
        <div className="text-2xl">🧘</div>
        <div className="text-center">
          <div className="text-lg font-semibold">ZEN Mode</div>
          <div className="text-sm opacity-90">Расслабляющая игра</div>
        </div>
      </div>
      
      {/* Эффект свечения */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200 -z-10"></div>
      
      {/* Анимация частиц */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="absolute top-0 left-1/4 w-1 h-1 bg-white opacity-60 animate-ping"></div>
        <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white opacity-60 animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-white opacity-60 animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>
    </button>
  );
};

export default ZenModeButton; 