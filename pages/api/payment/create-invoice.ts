import { NextApiRequest, NextApiResponse } from 'next';
import TelegramBot from 'node-telegram-bot-api';
import { SHARD_PACKS, BOOSTERS, ZEN_SUBS } from '@/components/store/storeItems';
import { UserService } from '@/lib/db/services';

const botToken = process.env.STARS_BOT_TOKEN;
if (!botToken) {
  throw new Error('STARS_BOT_TOKEN environment variable is not set');
}

const bot = new TelegramBot(botToken, { polling: false });

interface CreateInvoiceRequest {
  userId: number;
  item: {
    type: 'shards' | 'booster' | 'subscription';
    itemId: string;
    quantity?: number;
    price?: number;
  };
}

interface CreateInvoiceResponse {
  success: boolean;
  invoice_url?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CreateInvoiceResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, item }: CreateInvoiceRequest = req.body;

    if (!userId || !item) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId and item are required' 
      });
    }

    // Проверяем существование пользователя
    const user = await UserService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let invoiceData: any;
    let paymentPayload: any;

    // Создаем инвойс в зависимости от типа товара
    switch (item.type) {
      case 'shards': {
        const shardPack = SHARD_PACKS.find(pack => pack.amount.toString() === item.itemId);
        if (!shardPack) {
          return res.status(404).json({ success: false, error: 'Shard pack not found' });
        }

        // Создаем compact payload
        paymentPayload = {
          u: userId,               // userId
          t: 'shards',            // itemType  
          i: item.itemId,         // itemId
          a: shardPack.amount,    // amount
          p: shardPack.price,     // price
        };

        invoiceData = {
          title: `Пакет осколков (${shardPack.amount})`,
          description: `Пополните баланс на ${shardPack.amount} осколков`,
          payload: JSON.stringify(paymentPayload),
          currency: 'XTR', // Telegram Stars
          prices: [{
            label: `${shardPack.amount} осколков`,
            amount: shardPack.price
          }],
          need_name: false,
          need_phone_number: false,
          need_email: false,
          need_shipping_address: false,
          is_flexible: false,
        };
        break;
      }

      case 'booster': {
        const booster = BOOSTERS.find(b => b.id === item.itemId);
        if (!booster) {
          return res.status(404).json({ success: false, error: 'Booster not found' });
        }

        const quantity = item.quantity || 1;
        const totalPrice = booster.price_stars * quantity;

        // Создаем compact payload
        paymentPayload = {
          u: userId,               // userId
          t: 'booster',           // itemType
          i: item.itemId,         // itemId  
          q: quantity,            // quantity
          a: quantity,            // amount
          p: totalPrice,          // price
        };

        invoiceData = {
          title: `${booster.name} ${quantity > 1 ? `x${quantity}` : ''}`,
          description: `Покупка бустера ${booster.name}${quantity > 1 ? ` в количестве ${quantity} шт.` : ''}`,
          payload: JSON.stringify(paymentPayload),
          currency: 'XTR',
          prices: [{
            label: `${booster.name}${quantity > 1 ? ` x${quantity}` : ''}`,
            amount: totalPrice
          }],
          need_name: false,
          need_phone_number: false,
          need_email: false,
          need_shipping_address: false,
          is_flexible: false,
        };
        break;
      }

      case 'subscription': {
        const subscriptionPeriod = item.itemId; // '1m', '3m', '6m', '12m', etc.
        
        // НАЙТИ ЦЕНУ ИЗ БАЗЫ ДАННЫХ, А НЕ ИЗ КЛИЕНТА!
        const subscription = ZEN_SUBS.find(sub => sub.period === subscriptionPeriod);
        if (!subscription) {
          return res.status(404).json({ success: false, error: 'Subscription not found' });
        }
        
        const price = subscription.priceStars; // Берем цену из базы данных
        
        if (!price || price <= 0) {
          return res.status(400).json({ success: false, error: 'Invalid subscription price' });
        }

        // Создаем compact payload
        paymentPayload = {
          u: userId,               // userId
          t: 'subscription',      // itemType
          i: subscriptionPeriod,  // itemId (period)
          p: price,               // price
        };

        const periodText = subscriptionPeriod === 'month' ? 'месяц' : 
                          subscriptionPeriod === 'year' ? 'год' : 
                          subscriptionPeriod;

        invoiceData = {
          title: `ZEN подписка (${periodText})`,
          description: `Подписка ZEN на ${periodText} с премиум бонусами`,
          payload: JSON.stringify(paymentPayload),
          currency: 'XTR',
          prices: [{
            label: `ZEN подписка (${periodText})`,
            amount: price
          }],
          need_name: false,
          need_phone_number: false,
          need_email: false,
          need_shipping_address: false,
          is_flexible: false,
        };
        break;
      }

      default:
        return res.status(400).json({ success: false, error: 'Invalid item type' });
    }

    // Проверяем размер payload (максимум 128 байт для Telegram Stars)
    const payloadString = JSON.stringify(paymentPayload);
    const payloadSize = Buffer.byteLength(payloadString, 'utf8');
    
    

    if (payloadSize > 128) {
      
      return res.status(400).json({ 
        success: false, 
        error: `Payload too large: ${payloadSize} bytes (max 128 bytes)` 
      });
    }

    // Создаем инвойс через Bot API
    try {
      const invoice_url = await bot.createInvoiceLink(
        invoiceData.title,
        invoiceData.description,
        payloadString, // payload
        '', // provider_token (пустой для Telegram Stars)
        invoiceData.currency,
        invoiceData.prices,
        invoiceData
      );

      if (!invoice_url) {
        
        throw new Error('Failed to create invoice URL');
      }

      

      return res.status(200).json({
        success: true,
        invoice_url
      });

    } catch (telegramError: any) {
      
      return res.status(500).json({
        success: false,
        error: `Failed to create invoice: ${telegramError.message}`
      });
    }

  } catch (error: any) {
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 