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
    const currentScore = gameState.score || 0;
    
    console.log('💾 Game-sync - Saving game state:', {
      telegramId,
      userId: user.id,
      currentScore,
      userRecord: user.record,
      willUpdateRecord: currentScore > user.record
    });

    // Найти текущую игру
    let currentGame = await GameService.getCurrentGame(user.id);
    if (currentGame) {
      await GameService.updateGame(currentGame.id, {
        boardState: { grid: gameState.board, width: gameState.board[0]?.length || 8, height: gameState.board.length || 8 },
        currentPieces: gameState.currentPieces,
        score: currentScore,
      });
    } else {
      await GameService.createGame(
        user.id,
        { grid: gameState.board, width: gameState.board[0]?.length || 8, height: gameState.board.length || 8 },
        gameState.currentPieces
      );
    }

    // ВАЖНО: Проверяем и обновляем рекорд если нужно
    let updatedRecord = user.record;
    let recordUpdated = false;
    
    if (currentScore > user.record) {
      console.log('🏆 New record detected during auto-save! Updating from', user.record, 'to', currentScore);
      
      // Проверяем, нет ли уже такого же рекорда в истории (предотвращаем дубликаты)
      const lastRecord = await GameService.getBestRecord(user.id);
      const shouldSaveToHistory = !lastRecord || lastRecord.score !== currentScore;
      
      if (shouldSaveToHistory) {
        // Сохраняем рекорд в историю только если это новый рекорд
        await GameService.saveRecord(user.id, currentScore, 1, {
          autoSaved: true,
          saveType: 'auto-sync',
          timestamp: Date.now()
        });
        console.log('💾 New record saved to history');
      } else {
        console.log('📝 Record already exists in history, skipping duplicate');
      }
      
      // Обновляем рекорд пользователя
      const userUpdateResult = await UserService.updateRecord(user.id, currentScore);
      if (userUpdateResult) {
        updatedRecord = currentScore;
        recordUpdated = true;
      } else {
        console.error('❌ Failed to update user record during auto-save');
      }
      
      console.log('✅ Record updated during auto-save');
    }
    
    return res.status(200).json({ 
      success: true, 
      recordUpdated,
      newRecord: updatedRecord
    });
  } catch (e) {
    console.error('❌ Failed to save game state:', e);
    return res.status(500).json({ error: 'Failed to save game state' });
  }
} 