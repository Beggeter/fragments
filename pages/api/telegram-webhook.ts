import { NextApiRequest, NextApiResponse } from 'next';
import { UserService, BoosterService, CurrencyService } from '@/lib/db/services';
import { PaymentPayload } from '@/types/shop';
import { CurrencyTransactionType } from '@/lib/db/types';
import TelegramBot from 'node-telegram-bot-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    console.log('📥 Telegram webhook received:', JSON.stringify(update, null, 2));

    // Обрабатываем pre_checkout_query (обязательно для Telegram Stars)
    if (update.pre_checkout_query) {
      const preCheckoutQuery = update.pre_checkout_query;
      console.log('🔍 Processing pre_checkout_query:', {
        id: preCheckoutQuery.id,
        currency: preCheckoutQuery.currency,
        totalAmount: preCheckoutQuery.total_amount,
        payloadLength: preCheckoutQuery.invoice_payload?.length
      });

      try {
        // Создаем экземпляр бота для ответа на pre_checkout_query
        const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });

        // Отвечаем "OK" для подтверждения, что товар доступен
        await bot.answerPreCheckoutQuery(preCheckoutQuery.id, true);
        
        console.log('✅ Pre-checkout query answered successfully');
        return res.status(200).json({ ok: true });
      } catch (preCheckoutError) {
        console.error('❌ Error answering pre-checkout query:', preCheckoutError);
        
        // Если произошла ошибка, отвечаем с ошибкой
        try {
          const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });
          await bot.answerPreCheckoutQuery(preCheckoutQuery.id, false, { error_message: 'Временная ошибка сервера' });
        } catch (e) {
          console.error('❌ Failed to answer pre-checkout query with error:', e);
        }
        
        return res.status(500).json({ error: 'Pre-checkout error' });
      }
    }

    // Обрабатываем команды бота
    if (update.message?.text === '/start') {
      // Здесь можно добавить логику для команды /start если нужно
      return res.status(200).json({ ok: true });
    }

    // Обрабатываем успешные платежи
    const payment = update?.message?.successful_payment;
    if (!payment) {
      console.log('ℹ️ No payment in update, skipping');
      return res.status(200).json({ ok: true });
    }

    console.log('💰 Processing successful payment:', {
      telegramPaymentChargeId: payment.telegram_payment_charge_id,
      totalAmount: payment.total_amount,
      currency: payment.currency,
      payloadLength: payment.invoice_payload?.length
    });

    // Парсим payload
    let paymentPayload: PaymentPayload;
    try {
      const parsedPayload = JSON.parse(payment.invoice_payload);
      
      // Проверяем формат payload - новый компактный или старый
      if (parsedPayload.u !== undefined) {
        // Новый компактный формат с короткими именами полей
        paymentPayload = {
          userId: parsedPayload.u,
          itemType: parsedPayload.t,
          itemId: parsedPayload.i,
          quantity: parsedPayload.q,
          amount: parsedPayload.a,
          price: parsedPayload.p,
        };
      } else {
        // Старый формат
        paymentPayload = parsedPayload;
      }
      
      console.log('📋 Parsed payment payload:', paymentPayload);
    } catch (parseError) {
      console.error('❌ Failed to parse payment payload:', parseError);
      
      // Fallback для старого формата payload (userId:42;shards:1000)
      const match = payment.invoice_payload.match(/userId:(\d+);shards:(\d+)/);
      if (match) {
        const userId = parseInt(match[1], 10);
        const shards = parseInt(match[2], 10);
        
        console.log('🔄 Using legacy payload format:', { userId, shards });
        
        const user = await UserService.getUserById(userId);
        if (!user) {
          console.error('❌ User not found for legacy payment:', userId);
          return res.status(404).json({ error: 'User not found' });
        }

        await UserService.updateUser(userId, { currency: user.currency + shards });
        
        console.log('✅ Legacy payment processed successfully:', { userId, shards });
        return res.status(200).json({ ok: true });
      }
      
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    // Проверяем обязательные поля
    if (!paymentPayload.userId || !paymentPayload.itemType) {
      console.error('❌ Missing required fields in payment payload:', paymentPayload);
      return res.status(400).json({ error: 'Invalid payment payload' });
    }

    // Проверяем существование пользователя
    const user = await UserService.getUserById(paymentPayload.userId);
    if (!user) {
      console.error('❌ User not found:', paymentPayload.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Обрабатываем платеж в зависимости от типа товара
    switch (paymentPayload.itemType) {
      case 'shards': {
        console.log('💎 Processing shards purchase:', {
          userId: paymentPayload.userId,
          amount: paymentPayload.amount,
          price: paymentPayload.price
        });

        // Начисляем осколки пользователю
        const success = await CurrencyService.addCurrency(
          paymentPayload.userId,
          paymentPayload.amount,
          CurrencyTransactionType.CURRENCY_PURCHASE,
          `Покупка пакета осколков (${paymentPayload.amount} шт.) за ${paymentPayload.price} XTR`,
          {
            telegramPaymentChargeId: payment.telegram_payment_charge_id,
            providerPaymentChargeId: payment.provider_payment_charge_id,
            itemType: 'shards',
            itemId: paymentPayload.itemId,
            price: paymentPayload.price,
            currency: payment.currency
          }
        );

        if (!success) {
          console.error('❌ Failed to add currency to user:', paymentPayload.userId);
          return res.status(500).json({ error: 'Failed to process payment' });
        }

        console.log('✅ Shards purchased successfully:', {
          userId: paymentPayload.userId,
          amount: paymentPayload.amount,
          newBalance: user.currency + paymentPayload.amount
        });
        break;
      }

      case 'booster': {
        console.log('🚀 Processing booster purchase:', {
          userId: paymentPayload.userId,
          boosterId: paymentPayload.itemId,
          quantity: paymentPayload.quantity || 1,
          price: paymentPayload.price
        });

        const quantity = paymentPayload.quantity || 1;

        // Получаем тип бустера из базы данных
        const boosterTypes = await BoosterService.getAllBoosterTypes();
        const boosterType = boosterTypes.find(bt => bt.name.toLowerCase() === paymentPayload.itemId.toLowerCase());
        
        if (!boosterType) {
          console.error('❌ Booster type not found:', paymentPayload.itemId);
          return res.status(404).json({ error: 'Booster type not found' });
        }

        // Добавляем бустер пользователю
        try {
          await BoosterService.addUserBooster(paymentPayload.userId, boosterType.id, quantity);
          
          console.log('✅ Booster purchased successfully:', {
            userId: paymentPayload.userId,
            boosterTypeId: boosterType.id,
            quantity: quantity
          });
        } catch (boosterError) {
          console.error('❌ Failed to add booster to user:', boosterError);
          return res.status(500).json({ error: 'Failed to add booster' });
        }
        break;
      }

      case 'subscription': {
        console.log('📅 Processing subscription purchase:', {
          userId: paymentPayload.userId,
          subscriptionId: paymentPayload.itemId,
          price: paymentPayload.price
        });

        // TODO: Реализовать логику подписок когда она будет готова
        console.log('⚠️ Subscription processing not implemented yet');
        break;
      }

      default:
        console.error('❌ Unknown item type:', paymentPayload.itemType);
        return res.status(400).json({ error: 'Unknown item type' });
    }

    console.log('✅ Payment processed successfully:', {
      userId: paymentPayload.userId,
      itemType: paymentPayload.itemType,
      itemId: paymentPayload.itemId,
      telegramPaymentChargeId: payment.telegram_payment_charge_id
    });

    return res.status(200).json({ ok: true });

  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ error: 'Server error' });
  }
} 