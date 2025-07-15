import { NextApiRequest, NextApiResponse } from 'next';
import TelegramBot from 'node-telegram-bot-api';
import { CreateInvoiceRequest, CreateInvoiceResponse, PaymentPayload, TelegramInvoice } from '@/types/shop';
import { SHARD_PACKS, BOOSTERS } from '@/components/store/storeItems';
import { UserService } from '@/lib/db/services';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });

export default async function handler(req: NextApiRequest, res: NextApiResponse<CreateInvoiceResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, item, telegramChatId }: CreateInvoiceRequest = req.body;

    if (!userId || !item || !telegramChatId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId, item and telegramChatId are required' 
      });
    }

    // Проверяем существование пользователя
    const user = await UserService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let invoiceData: TelegramInvoice;
    let paymentPayload: PaymentPayload;

    // Создаем инвойс в зависимости от типа товара
    switch (item.type) {
      case 'shards': {
        const shardPack = SHARD_PACKS.find(pack => pack.amount.toString() === item.itemId);
        if (!shardPack) {
          return res.status(404).json({ success: false, error: 'Shard pack not found' });
        }

        paymentPayload = {
          userId,
          itemType: 'shards',
          itemId: item.itemId,
          amount: shardPack.amount,
          price: shardPack.price,
          metadata: item.metadata,
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
          photo_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fragmentstgm.ru'}${shardPack.icon}`,
          photo_width: 200,
          photo_height: 200,
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

        paymentPayload = {
          userId,
          itemType: 'booster',
          itemId: item.itemId,
          quantity,
          amount: quantity,
          price: totalPrice,
          metadata: item.metadata,
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
          photo_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fragmentstgm.ru'}${booster.icon}`,
          photo_width: 200,
          photo_height: 200,
        };
        break;
      }

      default:
        return res.status(400).json({ success: false, error: 'Invalid item type' });
    }

    // Отправляем инвойс пользователю
    try {
      const invoiceMessage = await bot.sendInvoice(
        telegramChatId,
        invoiceData.title,
        invoiceData.description,
        JSON.stringify(paymentPayload), // payload
        '', // provider_token (пустой для Telegram Stars)
        invoiceData.currency,
        invoiceData.prices,
        {
          photo_url: invoiceData.photo_url,
          photo_width: invoiceData.photo_width,
          photo_height: invoiceData.photo_height,
          need_name: false,
          need_phone_number: false,
          need_email: false,
          need_shipping_address: false,
          send_phone_number_to_provider: false,
          send_email_to_provider: false,
          is_flexible: false,
        }
      );

      console.log('✅ Invoice sent successfully:', {
        userId,
        telegramChatId,
        itemType: item.type,
        itemId: item.itemId,
        messageId: invoiceMessage.message_id
      });

      return res.status(200).json({
        success: true,
        invoiceLink: `https://t.me/c/${Math.abs(telegramChatId)}/${invoiceMessage.message_id}`
      });

    } catch (telegramError: any) {
      console.error('❌ Error sending invoice:', telegramError);
      return res.status(500).json({
        success: false,
        error: `Failed to send invoice: ${telegramError.message}`
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