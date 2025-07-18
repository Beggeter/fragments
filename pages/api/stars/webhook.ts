import { NextApiRequest, NextApiResponse } from 'next';
import { UserService, CurrencyService, BoosterService } from '../../../lib/db/services';

// Простая функция для парсинга compact payload
function parseCompactPayload(payload: string): Record<string, any> {
  try {
    const compactData = JSON.parse(payload);
    
    // Обратный маппинг коротких ключей на длинные
    const reverseKeyMapping: Record<string, string> = {
      u: 'userId',
      t: 'itemType',
      i: 'itemId',
      q: 'quantity',
      a: 'amount',
      p: 'price',
      m: 'metadata'
    };

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(compactData)) {
      const longKey = reverseKeyMapping[key] || key;
      result[longKey] = value;
    }

    return result;
  } catch (error) {
    console.error('Error parsing compact payload:', error);
    throw new Error('Invalid payload format');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📦 Stars webhook received:', {
      body: req.body,
      headers: req.headers
    });

    const update = req.body;

    // Обрабатываем pre-checkout query
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      console.log('🔍 Processing pre-checkout query:', query);

      try {
        const paymentData = parseCompactPayload(query.invoice_payload);
        
        // Проверяем существование пользователя
        const user = await UserService.getUserById(paymentData.userId);
        if (!user) {
          console.error('❌ User not found for pre-checkout:', paymentData.userId);
          return res.status(200).json({ 
            ok: false, 
            error_code: 400, 
            description: 'User not found' 
          });
        }

        // Подтверждаем платеж
        console.log('✅ Pre-checkout query approved');
        return res.status(200).json({ ok: true });

      } catch (error) {
        console.error('❌ Pre-checkout query error:', error);
        return res.status(200).json({ 
          ok: false, 
          error_code: 400, 
          description: 'Invalid payload' 
        });
      }
    }

    // Обрабатываем успешный платеж
    if (update.successful_payment) {
      const payment = update.successful_payment;
      console.log('💰 Processing successful payment:', payment);

      try {
        const paymentData = parseCompactPayload(payment.invoice_payload);
        
        // Получаем пользователя
        const user = await UserService.getUserById(paymentData.userId);
        if (!user) {
          console.error('❌ User not found for payment:', paymentData.userId);
          return res.status(200).json({ ok: true }); // Отвечаем успехом, чтобы не было повторных попыток
        }

        // Обрабатываем платеж в зависимости от типа товара
        switch (paymentData.itemType) {
          case 'shards':
            await CurrencyService.addShards(user.telegramId, paymentData.amount);
            console.log('✅ Shards payment processed:', {
              userId: user.telegramId,
              amount: paymentData.amount
            });
            break;
          
          case 'booster':
            await BoosterService.addBooster(user.telegramId, paymentData.itemId, paymentData.quantity || 1);
            console.log('✅ Booster payment processed:', {
              userId: user.telegramId,
              boosterId: paymentData.itemId,
              quantity: paymentData.quantity
            });
            break;
          
          default:
            console.warn('⚠️ Unsupported payment type:', paymentData.itemType);
        }

        return res.status(200).json({ ok: true });

      } catch (error) {
        console.error('❌ Payment processing error:', error);
        return res.status(200).json({ ok: true }); // Отвечаем успехом, чтобы не было повторных попыток
      }
    }

    // Отвечаем успехом для других типов обновлений
    return res.status(200).json({ ok: true });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 