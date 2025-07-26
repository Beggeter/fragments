import { NextApiRequest, NextApiResponse } from 'next';
import { GameLog } from '../../types/game';

// В реальном приложении здесь была бы база данных
const gameLogs: GameLog[] = [];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const log: GameLog = {
        ...req.body,
        timestamp: Date.now(),
      };
      gameLogs.push(log);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Invalid log data' });
    }
  } else if (req.method === 'GET') {
    const { startTime, endTime, eventType } = req.query;
    
    let filteredLogs = [...gameLogs];
    
    if (startTime) {
      filteredLogs = filteredLogs.filter(
        log => log.timestamp >= Number(startTime)
      );
    }
    
    if (endTime) {
      filteredLogs = filteredLogs.filter(
        log => log.timestamp <= Number(endTime)
      );
    }
    
    if (eventType) {
      filteredLogs = filteredLogs.filter(
        log => log.event === eventType
      );
    }
    
    res.status(200).json(filteredLogs);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 