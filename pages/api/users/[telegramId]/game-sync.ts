import { NextApiRequest, NextApiResponse } from 'next';
import { UserService, GameService } from '@/lib/db/services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { telegramId } = req.query;
  if (!telegramId || typeof telegramId !== 'string') {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  let user;
  try {
    user = await UserService.getUserByTelegramId(telegramId);
    if (!user) return res.status(404).json({ error: 'User not found' });
  } catch (e) {
    return res.status(500).json({ error: 'User lookup failed' });
  }

  let gameState;
  try {
    gameState = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (!gameState || !gameState.board || !gameState.currentPieces) {
    return res.status(400).json({ error: 'Missing board or currentPieces' });
  }

  try {
    // Найти текущую игру
    let currentGame = await GameService.getCurrentGame(user.id);
    if (currentGame) {
      await GameService.updateGame(currentGame.id, {
        boardState: { grid: gameState.board, width: gameState.board[0]?.length || 8, height: gameState.board.length || 8 },
        currentPieces: gameState.currentPieces,
        score: gameState.score || 0,
      });
    } else {
      await GameService.createGame(
        user.id,
        { grid: gameState.board, width: gameState.board[0]?.length || 8, height: gameState.board.length || 8 },
        gameState.currentPieces
      );
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save game state' });
  }
} 