import { NextApiRequest, NextApiResponse } from 'next';
import { UserService, GameService, CurrencyService } from '@/lib/db/services';
import { CurrencyTransactionType } from '@/lib/db/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { telegramId } = req.query;

  if (!telegramId || typeof telegramId !== 'string') {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  try {
    const user = await UserService.getUserByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    switch (req.method) {
      case 'GET':
        // Получение текущей игры пользователя
        const currentGame = await GameService.getCurrentGame(user.id);
        const gameStats = await GameService.getUserGameStats(user.id);
        const bestRecord = await GameService.getBestRecord(user.id);
        
        return res.status(200).json({
          currentGame,
          gameStats,
          bestRecord,
        });

      case 'POST':
        // Создание новой игры
        const { boardState, currentPieces } = req.body;
        
        if (!boardState || !currentPieces) {
          return res.status(400).json({ error: 'Board state and current pieces are required' });
        }

        const newGame = await GameService.createGame(user.id, boardState, currentPieces);
        return res.status(201).json(newGame);

      case 'PUT':
        // Обновление состояния игры
        const { gameId, updates } = req.body;
        
        if (!gameId || !updates) {
          return res.status(400).json({ error: 'Game ID and updates are required' });
        }

        const updatedGame = await GameService.updateGame(gameId, updates);
        if (!updatedGame) {
          return res.status(404).json({ error: 'Game not found' });
        }

        return res.status(200).json(updatedGame);

      case 'DELETE':
        // Завершение игры и сохранение рекорда
        const { gameId: gameToEnd, finalScore, level, gameData } = req.body;
        
        if (finalScore === undefined) {
          return res.status(400).json({ error: 'Final score is required' });
        }

        console.log('🎮 Processing game over:', { 
          telegramId, 
          finalScore, 
          currentRecord: user.record, 
          gameId: gameToEnd 
        });

        let record = null;
        let updatedRecord = user.record;
        
        try {
          // Сохраняем рекорд в историю
          record = await GameService.saveRecord(user.id, finalScore, level || 1, gameData || {});
          console.log('✅ Record saved to history:', record.id);

          // Обновляем рекорд пользователя, если нужно
          if (finalScore > user.record) {
            const updatedUser = await UserService.updateRecord(user.id, finalScore);
            updatedRecord = updatedUser ? finalScore : user.record;
            console.log('✅ User record updated:', { oldRecord: user.record, newRecord: updatedRecord });
          }
        } catch (error) {
          console.error('❌ Error saving record:', error);
          return res.status(500).json({ error: 'Failed to save record' });
        }

        // Пытаемся удалить игру, если gameId предоставлен (не критично для сохранения рекорда)
        if (gameToEnd) {
          try {
            const gameDeleted = await GameService.deleteGame(gameToEnd);
            if (gameDeleted) {
              console.log('✅ Game deleted:', gameToEnd);
            } else {
              console.log('⚠️ Game not found for deletion (not critical):', gameToEnd);
            }
          } catch (error) {
            console.error('⚠️ Error deleting game (not critical):', error);
          }
        }

        // Начисляем валюту за игру
        let currencyReward = 0;
        let newBalance = user.currency;
        
        try {
          currencyReward = Math.floor(finalScore / 10); // 1 валюта за каждые 10 очков
          if (currencyReward > 0) {
            await CurrencyService.awardGameReward(user.id, currencyReward, { gameId: gameToEnd });
            console.log('✅ Currency reward granted:', currencyReward);
          }
          newBalance = await CurrencyService.getUserBalance(user.id);
        } catch (error) {
          console.error('⚠️ Error awarding currency (not critical):', error);
        }
        
        console.log('🎉 Game over processed successfully:', {
          finalScore,
          newRecord: updatedRecord,
          currencyReward,
          newBalance
        });

        return res.status(200).json({
          success: true,
          record,
          currencyReward,
          newBalance,
          newRecord: updatedRecord,
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Game API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 