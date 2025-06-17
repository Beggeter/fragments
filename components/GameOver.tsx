import React from 'react';
import { useGameStore } from '../lib/state/store';

interface GameOverProps {
  onPlayAgain: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ onPlayAgain }) => {
    const { score } = useGameStore();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
                <p className="text-xl text-gray-300 mb-6">Your score: {score}</p>
                <button
                    onClick={onPlayAgain}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Play Again
                </button>
            </div>
        </div>
    );
}; 