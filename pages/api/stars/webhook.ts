import { NextApiRequest, NextApiResponse } from 'next';
import TelegramBot from 'node-telegram-bot-api';
import { UserService, CurrencyService, BoosterService } from '../../../lib/db/services';

const botToken = process.env.STARS_BOT_TOKEN;
if (!botToken) {
  throw new Error('STARS_BOT_TOKEN environment variable is not set');
}

const bot = new TelegramBot(botToken, { polling: false });

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
          
          // Отвечаем через answerPreCheckoutQuery
          await bot.answerPreCheckoutQuery(query.id, false, { error_message: 'User not found' });
          return res.status(200).json({ ok: true });
        }

        // Подтверждаем платеж через answerPreCheckoutQuery
        console.log('✅ Pre-checkout query approved');
        await bot.answerPreCheckoutQuery(query.id, true);
        return res.status(200).json({ ok: true });

      } catch (error) {
        console.error('❌ Pre-checkout query error:', error);
        
        // Отвечаем через answerPreCheckoutQuery с ошибкой
        await bot.answerPreCheckoutQuery(query.id, false, { error_message: 'Invalid payload' });
        return res.status(200).json({ ok: true });
      }
    }

    // Обрабатываем успешный платеж (Stars mini-app)
    if (update.successful_payment) {
      const payment = update.successful_payment;
      console.log('💰 Processing successful payment (Stars):', payment);
      await handleSuccessfulPayment(payment, res);
      return;
    }

    // Обрабатываем успешный платеж (обычный бот)
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      console.log('💰 Processing successful payment (message):', payment);
      await handleSuccessfulPayment(payment, res);
      return;
    }

    // Отвечаем успехом для других типов обновлений
    return res.status(200).json({ ok: true });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 

// Вынесенная функция для обработки успешного платежа
async function handleSuccessfulPayment(payment: any, res: NextApiResponse) {
  try {
    const paymentData = parseCompactPayload(payment.invoice_payload);
    // Получаем пользователя
    const user = await UserService.getUserById(paymentData.userId);
    if (!user) {
      console.error('❌ User not found for payment:', paymentData.userId);
      return res.status(200).json({ ok: true });
    }
    // Обрабатываем платеж в зависимости от типа товара
    switch (paymentData.itemType) {
      case 'shards':
        await CurrencyService.addCurrency(
          user.id,
          paymentData.amount,
          'STARS_PURCHASE' as any,
          `Stars purchase: ${paymentData.amount} shards`
        );
        console.log('✅ Shards payment processed:', {
          userId: user.id,
          telegramId: user.telegramId,
          amount: paymentData.amount
        });
        break;
      case 'booster':
        await BoosterService.addUserBooster(user.id, parseInt(paymentData.itemId), paymentData.quantity || 1);
        console.log('✅ Booster payment processed:', {
          userId: user.id,
          telegramId: user.telegramId,
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
    return res.status(200).json({ ok: true });
  }
} 