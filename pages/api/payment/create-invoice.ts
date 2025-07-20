import { NextApiRequest, NextApiResponse } from 'next';
import TelegramBot from 'node-telegram-bot-api';
import { SHARD_PACKS, BOOSTERS } from '@/components/store/storeItems';
import { UserService } from '@/lib/db/services';

const bot = new TelegramBot(process.env.STARS_BOT_TOKEN!, { polling: false });

interface CreateInvoiceRequest {
  userId: number;
  item: {
    type: 'shards' | 'booster';
    itemId: string;
    quantity?: number;
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
        const totalPrice = booster.price * quantity;

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

      default:
        return res.status(400).json({ success: false, error: 'Invalid item type' });
    }

    // Проверяем размер payload (максимум 128 байт для Telegram Stars)
    const payloadString = JSON.stringify(paymentPayload);
    const payloadSize = Buffer.byteLength(payloadString, 'utf8');
    
    console.log('📦 Payload info:', {
      payload: payloadString,
      size: payloadSize,
      maxSize: 128
    });

    if (payloadSize > 128) {
      console.error('❌ Payload too large:', { size: payloadSize, payload: payloadString });
      return res.status(400).json({ 
        success: false, 
        error: `Payload too large: ${payloadSize} bytes (max 128 bytes)` 
      });
    }

    // Создаем инвойс через Bot API
    try {
      const invoiceMessage = await bot.sendInvoice(
        userId, // Используем userId как chat_id
        invoiceData.title,
        invoiceData.description,
        payloadString, // payload
        '', // provider_token (пустой для Telegram Stars)
        invoiceData.currency,
        invoiceData.prices,
        invoiceData
      );

      // Извлекаем invoice_url из результата sendInvoice
      const invoice_url = (invoiceMessage as any).invoice?.invoice_url || 
                         (invoiceMessage as any).invoice_url || 
                         null;

      if (!invoice_url) {
        console.error('❌ Invoice response structure:', JSON.stringify(invoiceMessage, null, 2));
        throw new Error('Failed to get invoice URL');
      }

      console.log('✅ Invoice created successfully:', {
        userId,
        itemType: item.type,
        itemId: item.itemId,
        invoice_url
      });

      return res.status(200).json({
        success: true,
        invoice_url
      });

    } catch (telegramError: any) {
      console.error('❌ Error creating invoice:', telegramError);
      return res.status(500).json({
        success: false,
        error: `Failed to create invoice: ${telegramError.message}`
      });
    }

  } catch (error: any) {
    console.error('❌ Error in create-invoice API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 