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
        
        console.log('🎮 DELETE /api/users/[telegramId]/game - Request data:', {
          telegramId,
          gameToEnd,
          finalScore,
          level,
          gameData,
          userId: user.id,
          currentUserRecord: user.record
        });
        
        if (!gameToEnd || finalScore === undefined) {
          return res.status(400).json({ error: 'Game ID and final score are required' });
        }

        // Сохраняем рекорд
        console.log('💾 Saving record to record_history...');
        const record = await GameService.saveRecord(user.id, finalScore, level || 1, gameData || {});
        console.log('✅ Record saved:', record);

        // Обновляем рекорд пользователя, если нужно
        let updatedUser = user;
        if (finalScore > user.record) {
          console.log('🏆 New record! Updating user record from', user.record, 'to', finalScore);
          const userUpdateResult = await UserService.updateRecord(user.id, finalScore);
          if (userUpdateResult) {
            updatedUser = userUpdateResult;
            console.log('✅ User record updated:', updatedUser);
          } else {
            console.error('❌ Failed to update user record');
          }
        } else {
          console.log('📈 Score', finalScore, 'did not beat current record', user.record);
        }

        // Удаляем игру
        console.log('🗑️ Deleting game...');
        await GameService.deleteGame(gameToEnd);

        // Начисляем валюту за игру
        const currencyReward = Math.floor(finalScore / 10); // 1 валюта за каждые 10 очков
        if (currencyReward > 0) {
          console.log('💰 Awarding currency reward:', currencyReward);
          await CurrencyService.awardGameReward(user.id, currencyReward, { gameId: gameToEnd });
        }

        const newBalance = await CurrencyService.getUserBalance(user.id);
        
        const response = {
          success: true,
          record,
          currencyReward,
          newBalance,
          newRecord: finalScore > user.record ? finalScore : user.record,
        };
        
        console.log('📤 Sending response:', response);
        
        return res.status(200).json(response);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Game API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 