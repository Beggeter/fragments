import React from 'react';
import { useGameStore } from '../lib/state/store';

interface LevelDisplayProps {
  className?: string;
}

export const LevelDisplay: React.FC<LevelDisplayProps> = ({ className = '' }) => {
  const {
    score,
    getLevelInfo
  } = useGameStore();

  const levelInfo = getLevelInfo();
  const {
    level: currentLevel,
    name: levelName,
    description: levelDescription,
    progress: progressToNextLevel,
    nextThreshold: nextLevelThreshold,
    isRecordBreaker: isRecordBreakerMode
  } = levelInfo;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className={`level-display ${className}`}>
      <div className="level-header">
        <div className="level-badge">
          <span className="level-number">{currentLevel}</span>
          {isRecordBreakerMode && (
            <span className="record-breaker-indicator">🔥</span>
          )}
        </div>
        <div className="level-info">
          <h3 className="level-name">{levelName}</h3>
          <p className="level-description">{levelDescription}</p>
        </div>
      </div>
      
      {!isRecordBreakerMode && nextLevelThreshold > score && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressToNextLevel * 100}%` }}
            />
          </div>
          <div className="progress-text">
            <span>До следующего уровня: {formatNumber(nextLevelThreshold - score)}</span>
            <span className="progress-percentage">
              {Math.round(progressToNextLevel * 100)}%
            </span>
          </div>
        </div>
      )}
      
      {isRecordBreakerMode && (
        <div className="record-breaker-section">
          <div className="record-breaker-message">
            🏆 Рекордсмен! Игра стала намного сложнее!
          </div>
        </div>
      )}
    </div>
  );
}; 