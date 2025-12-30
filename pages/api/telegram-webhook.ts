import { NextApiRequest, NextApiResponse } from 'next';
import { UserService, BoosterService, CurrencyService } from '@/lib/db/services';
import { PaymentPayload } from '@/types/shop';
import { CurrencyTransactionType, UserRole } from '@/lib/db/types';
import TelegramBot from 'node-telegram-bot-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    

    // Обрабатываем pre_checkout_query (обязательно для Telegram Stars)
    if (update.pre_checkout_query) {
      const preCheckoutQuery = update.pre_checkout_query;
      

      try {
        // Создаем экземпляр бота для ответа на pre_checkout_query
        const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });

        // Отвечаем "OK" для подтверждения, что товар доступен
        await bot.answerPreCheckoutQuery(preCheckoutQuery.id, true);
        
        
        return res.status(200).json({ ok: true });
      } catch (preCheckoutError) {
        
        
        // Если произошла ошибка, отвечаем с ошибкой
        try {
          const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });
          await bot.answerPreCheckoutQuery(preCheckoutQuery.id, false, { error_message: 'Временная ошибка сервера' });
        } catch (e) {
          
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
      
      return res.status(200).json({ ok: true });
    }

    

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
      
      
    } catch (parseError) {
      
      
      // Fallback для старого формата payload (userId:42;shards:1000)
      const match = payment.invoice_payload.match(/userId:(\d+);shards:(\d+)/);
      if (match) {
        const userId = parseInt(match[1], 10);
        const shards = parseInt(match[2], 10);
        
        
        
        const user = await UserService.getUserById(userId);
        if (!user) {
          
          return res.status(404).json({ error: 'User not found' });
        }

        await UserService.updateUser(userId, { currency: user.currency + shards });
        
        
        return res.status(200).json({ ok: true });
      }
      
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    // Проверяем обязательные поля
    if (!paymentPayload.userId || !paymentPayload.itemType) {
      
      return res.status(400).json({ error: 'Invalid payment payload' });
    }

    // Проверяем существование пользователя
    const user = await UserService.getUserById(paymentPayload.userId);
    if (!user) {
      
      return res.status(404).json({ error: 'User not found' });
    }

    // Обрабатываем платеж в зависимости от типа товара
    switch (paymentPayload.itemType) {
      case 'shards': {
        

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
          
          return res.status(500).json({ error: 'Failed to process payment' });
        }

        
        break;
      }

      case 'booster': {
        

        const quantity = paymentPayload.quantity || 1;

        // Получаем тип бустера из базы данных
        const boosterTypes = await BoosterService.getAllBoosterTypes();
        const boosterType = boosterTypes.find(bt => bt.name.toLowerCase() === paymentPayload.itemId.toLowerCase());
        
        if (!boosterType) {
          
          return res.status(404).json({ error: 'Booster type not found' });
        }

        // Добавляем бустер пользователю
        try {
          await BoosterService.addUserBooster(paymentPayload.userId, boosterType.id, quantity);
          
          
        } catch (boosterError) {
          
          return res.status(500).json({ error: 'Failed to add booster' });
        }
        break;
      }

      case 'subscription': {
        

        // Обрабатываем ZEN подписку
        const subscriptionPeriod = paymentPayload.itemId; // 'month', 'year', etc.
        const price = paymentPayload.price || 0;

        // Проверяем текущую подписку пользователя
        const currentUser = await UserService.getUserById(paymentPayload.userId);
        if (!currentUser) {
          
          return res.status(404).json({ error: 'User not found' });
        }

        // Вычисляем дату окончания подписки
        const now = new Date();
        let endDate: Date;
        
        if (subscriptionPeriod === 'month') {
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        } else if (subscriptionPeriod === 'year') {
          endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        } else {
          // По умолчанию месяц
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        }

        // Если у пользователя уже есть активная подписка, добавляем дни к существующей
        if (currentUser.hasZenSubscription && currentUser.zenSubscriptionEndDate) {
          const currentEndDate = new Date(currentUser.zenSubscriptionEndDate);
          
          // Если текущая подписка еще активна, добавляем к ней
          if (currentEndDate > now) {
            const additionalDays = subscriptionPeriod === 'month' ? 30 : 365;
            endDate = new Date(currentEndDate.getTime() + (additionalDays * 24 * 60 * 60 * 1000));
            
            
          }
        }

        // Обновляем статус подписки пользователя
        try {
          const nextRole =
            currentUser.role === UserRole.USER ? UserRole.PREMIUM : currentUser.role;

          await UserService.updateUser(paymentPayload.userId, {
            hasZenSubscription: true,
            zenSubscriptionEndDate: endDate,
            role: nextRole,
          });
          
          
        } catch (subscriptionError) {
          
          return res.status(500).json({ error: 'Failed to activate subscription' });
        }
        break;
      }

      default:
        
        return res.status(400).json({ error: 'Unknown item type' });
    }

    

    return res.status(200).json({ ok: true });

  } catch (error: any) {
    
    return res.status(500).json({ error: 'Server error' });
  }
} 