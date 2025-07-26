import { useCallback } from 'react';
import { GameLog } from '../types/game';

export const useGameLogger = () => {
  const logEvent = useCallback(async (log: Omit<GameLog, 'timestamp'>) => {
    try {
      const response = await fetch('/api/game-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        console.error('Failed to log game event:', await response.text());
      }
    } catch (error) {
      console.error('Error logging game event:', error);
    }
  }, []);

  const getLogs = useCallback(async (
    startTime?: number,
    endTime?: number,
    eventType?: GameLog['event']
  ) => {
    try {
      const params = new URLSearchParams();
      if (startTime) params.append('startTime', startTime.toString());
      if (endTime) params.append('endTime', endTime.toString());
      if (eventType) params.append('eventType', eventType);

      const response = await fetch(`/api/game-log?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch game logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching game logs:', error);
      return [];
    }
  }, []);

  return {
    logEvent,
    getLogs,
  };
}; 