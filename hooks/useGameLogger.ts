import { useCallback } from 'react';
import { GameLog } from '../types/game';

export const useGameLogger = () => {
  const logEvent = useCallback(async (_log: Omit<GameLog, 'timestamp'>) => {
    // Network logging disabled on client
    return;
  }, []);

  const getLogs = useCallback(async (
    _startTime?: number,
    _endTime?: number,
    _eventType?: GameLog['event']
  ) => {
    // Network logging disabled on client
    return [] as any[];
  }, []);

  return {
    logEvent,
    getLogs,
  };
}; 