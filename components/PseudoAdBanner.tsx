import React from 'react';

const PseudoAdBanner: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 text-center z-50">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-sm font-medium">🎮</span>
        <span className="text-sm">Новые фичи для тестеров!</span>
        <span className="text-sm font-medium">🎮</span>
      </div>
    </div>
  );
};

export default PseudoAdBanner; 