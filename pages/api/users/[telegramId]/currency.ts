import { NextApiRequest, NextApiResponse } from 'next';
import { UserService, CurrencyService } from '@/lib/db/services';
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
        // Получение баланса и истории транзакций
        const balance = await CurrencyService.getUserBalance(user.id);
        const transactions = await CurrencyService.getUserTransactions(user.id, 20);
        const stats = await CurrencyService.getUserTransactionStats(user.id);
        
        return res.status(200).json({
          balance,
          transactions,
          stats,
        });

      case 'POST':
        // Добавление валюты (для админов или системных операций)
        const { amount, type, description, metadata } = req.body;
        
        if (!amount || !type) {
          return res.status(400).json({ error: 'Amount and type are required' });
        }

        if (!Object.values(CurrencyTransactionType).includes(type)) {
          return res.status(400).json({ error: 'Invalid transaction type' });
        }

        const success = await CurrencyService.addCurrency(
          user.id,
          amount,
          type,
          description,
          metadata
        );

        if (!success) {
          return res.status(500).json({ error: 'Failed to add currency' });
        }

        const newBalance = await CurrencyService.getUserBalance(user.id);
        return res.status(200).json({ 
          success: true, 
          newBalance,
          message: 'Currency added successfully' 
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 