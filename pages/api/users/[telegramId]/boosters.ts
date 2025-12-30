import { NextApiRequest, NextApiResponse } from 'next';
import { UserService, BoosterService, CurrencyService } from '@/lib/db/services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { telegramId } = req.query;

  

  if (!telegramId || typeof telegramId !== 'string') {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  const isDev = process.env.NODE_ENV === 'development';
  const adminMode = req.cookies?.adminMode === 'true';
  let effectiveTelegramId = telegramId;
  if (isDev && adminMode) {
    // Разрешаем админ-доступ к любому пользователю (например, 610936383)
    effectiveTelegramId = telegramId;
  }

  

  try {
    const user = await UserService.getUserByTelegramId(effectiveTelegramId);
    if (!user) {
      
      return res.status(404).json({ error: 'User not found' });
    }
    

    switch (req.method) {
      case 'GET':
        // Получение бустеров пользователя
        
        const userBoosters = await BoosterService.getUserBoostersWithInfo(user.id);
        const availableBoosters = await BoosterService.getAllBoosterTypes();
        
        
        
        
        return res.status(200).json({
          userBoosters,
          availableBoosters,
        });

      case 'POST':
        // Покупка или использование бустера
        const { action, boosterTypeId, quantity = 1 } = req.body;
        
        if (!action || !boosterTypeId) {
          return res.status(400).json({ error: 'Action and boosterTypeId are required' });
        }

        const boosterType = await BoosterService.getBoosterTypeByName(boosterTypeId);
        if (!boosterType) {
          return res.status(404).json({ error: 'Booster type not found' });
        }

        if (action === 'purchase') {
          // Покупка бустера
          const canAfford = await CurrencyService.canAfford(user.id, boosterType.price * quantity);
          if (!canAfford) {
            return res.status(400).json({ error: 'Insufficient currency' });
          }

          const purchaseSuccess = await CurrencyService.purchaseBooster(
            user.id,
            boosterType.id,
            boosterType.price * quantity
          );

          if (!purchaseSuccess) {
            return res.status(500).json({ error: 'Failed to purchase booster' });
          }

          await BoosterService.addUserBooster(user.id, boosterType.id, quantity);
          
          const newBalance = await CurrencyService.getUserBalance(user.id);
          return res.status(200).json({
            success: true,
            newBalance,
            message: `Successfully purchased ${quantity} ${boosterType.name}`,
          });

        } else if (action === 'use') {
          // Использование бустера
          const canUse = await BoosterService.canUseBooster(user.id, boosterType.id, quantity);
          if (!canUse) {
            return res.status(400).json({ error: 'Not enough boosters to use' });
          }

          const useSuccess = await BoosterService.useBooster(user.id, boosterType.id, quantity);
          if (!useSuccess) {
            return res.status(500).json({ error: 'Failed to use booster' });
          }

          return res.status(200).json({
            success: true,
            effect: boosterType.effect,
            message: `Successfully used ${quantity} ${boosterType.name}`,
          });

        } else {
          return res.status(400).json({ error: 'Invalid action. Use "purchase" or "use"' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    
    return res.status(500).json({ error: 'Internal server error' });
  }
} 