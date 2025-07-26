import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { 
            board, 
            blocks, 
            score, 
            linesCleared,
            blockPlacements,
            gameState
        } = req.body;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            board,
            blocks,
            score,
            linesCleared,
            blockPlacements,
            gameState
        };

        const logFile = path.join(process.cwd(), 'gamelogs.txt');
        
        // Логирование отключено для ускорения работы
        res.status(200).json({ success: true });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
} 