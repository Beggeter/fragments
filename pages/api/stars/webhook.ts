import { NextApiRequest, NextApiResponse } from 'next';
import TelegramBot from 'node-telegram-bot-api';
import { UserService, CurrencyService, BoosterService } from '../../../lib/db/services';
import { UserRole } from '@/lib/db/types';
import { SHARD_PACKS, BOOSTERS, ZEN_SUBS } from '@/components/store/storeItems';

const botToken = process.env.STARS_BOT_TOKEN;
if (!botToken) {
  throw new Error('STARS_BOT_TOKEN environment variable is not set');
}

const bot = new TelegramBot(botToken, { polling: false });

const adminId = process.env.ADMIN_ID;
const webAppUrl = process.env.WEBAPP_URL;
const termsUrl = process.env.TERMS_URL;

function getMainMenu() {
  const inline_keyboard = [
    webAppUrl
      ? [{ text: "▶️ Играть", web_app: { url: webAppUrl } }]
      : [],
    [{ text: "🧩 Fragments channel", url: "https://t.me/Fragments_Games" }],
    [{ text: "🛠 Поддержка (RU)", callback_data: "support_ru" }],
    [{ text: "🛠 Support (EN)", callback_data: "support_en" }],
    // [{ text: "📄 Условия", callback_data: "terms" }],
  ].filter(row => row.length > 0); // удаляем пустые строки

  return {
    text: `🎮 Добро пожаловать в FRAGMENTS — динамичную головоломку по мотивам Block Blast!\n\n` +
      `Собирай фигуры, зарабатывай очки, используй бустеры и достигай Zen.\n\n` +
      `Ты можешь приобрести осколки, бустеры и подписку ZEN через Telegram Stars прямо в игре.\n\n` +
      `👇 Выберите действие:`,
    reply_markup: {
      inline_keyboard
    }
  };
}

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
    
    throw new Error('Invalid payload format');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    

    const update = req.body;

    // Обрабатываем pre-checkout query
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      

      try {
        const paymentData = parseCompactPayload(query.invoice_payload);

        // Проверяем существование пользователя
        const user = await UserService.getUserById(paymentData.userId);
        if (!user) {
          

          // Отвечаем через answerPreCheckoutQuery
          await bot.answerPreCheckoutQuery(query.id, false, { error_message: 'User not found' });
          return res.status(200).json({ ok: true });
        }

        // Подтверждаем платеж через answerPreCheckoutQuery
        
        await bot.answerPreCheckoutQuery(query.id, true);
        return res.status(200).json({ ok: true });

      } catch (error) {
        

        // Отвечаем через answerPreCheckoutQuery с ошибкой
        await bot.answerPreCheckoutQuery(query.id, false, { error_message: 'Invalid payload' });
        return res.status(200).json({ ok: true });
      }
    }

    // Обрабатываем успешный платеж (Stars mini-app)
    if (update.successful_payment) {
      const payment = update.successful_payment;
      
      await handleSuccessfulPayment(payment, res);
      return;
    }

    // Обрабатываем успешный платеж (обычный бот)
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      
      await handleSuccessfulPayment(payment, res);
      return;
    }

    // --- ДОБАВЛЕНО: обработка команд, callback_query и обычных сообщений ---
    // 1. Callback Query
    if (update.callback_query) {
      const ctx = update.callback_query;
      const action = ctx.data;
      const chatId = ctx.message?.chat?.id;
      const messageId = ctx.message?.message_id;
      try {
        if (messageId && chatId) {
          // Удаляем предыдущее сообщение (если возможно)
          try {
            await bot.deleteMessage(chatId, messageId);
          } catch (error) {
            // ignore
          }
        }
        switch (action) {
          case "support_ru":
            await bot.sendMessage(chatId, `ℹ️ Поддержка по покупкам\n\nЕсли у тебя возникли проблемы с покупкой, пожалуйста, отправь в чат:\n\n1. Свой @username\n2. Название товара (например, ZEN-подписка, бустер и т.д.)\n3. Примерное время покупки\n4. Что произошло`, {
              reply_markup: {
                inline_keyboard: [[{ text: "🔙 Назад", callback_data: "back_to_main" }]]
              }
            });
            break;
          case "support_en":
            await bot.sendMessage(chatId, `ℹ️ Purchase Support\n\nIf you experienced an issue with a purchase, please send us:\n\n1. Your @username\n2. Product name (e.g. ZEN subscription, booster, etc.)\n3. Approximate time of purchase\n4. Short description of the issue`, {
              reply_markup: {
                inline_keyboard: [[{ text: "🔙 Back", callback_data: "back_to_main" }]]
              }
            });
            break;
          case "terms":
            await bot.sendMessage(chatId, `📄 Условия использования:\n\n– Все товары являются цифровыми и используются только внутри Mini App FRAGMENTS\n– Покупки обрабатываются через Telegram Stars\n– Возвраты не предусмотрены, за исключением технических ошибок\n– В случае проблем — @fragments_support_bot\n\n📄 Terms of Service:\n\n– All products are digital and used within the FRAGMENTS Mini App\n– Purchases are processed via Telegram Stars\n– No refunds unless a technical error occurred\n– Contact @fragments_support_bot for any issues\n\n${termsUrl ? `🔗 ${termsUrl}` : ""}`, {
              reply_markup: {
                inline_keyboard: [[{ text: "🔙 Назад", callback_data: "back_to_main" }]]
              }
            });
            break;
          case "back_to_main":
            const menu = getMainMenu();
            await bot.sendMessage(chatId, menu.text, { reply_markup: menu.reply_markup });
            break;
          default:
            // Неизвестное действие — показываем главное меню с сообщением
            await bot.sendMessage(chatId, "❓ Неизвестная команда. Возвращаемся в главное меню.", {
              reply_markup: {
                inline_keyboard: [[{ text: "🔙 В главное меню", callback_data: "back_to_main" }]]
              }
            });
            break;
        }
        await bot.answerCallbackQuery(ctx.id);
      } catch (e) {
        // ignore
      }
      return res.status(200).json({ ok: true });
    }

    // 2. Команды и обычные сообщения
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || "";
      // Команды
      if (text.startsWith("/start") || text.startsWith("/menu")) {
        const menu = getMainMenu();
        await bot.sendMessage(chatId, menu.text, { reply_markup: menu.reply_markup });
        return res.status(200).json({ ok: true });
      }
      if (text.startsWith("/help")) {
        await bot.sendMessage(chatId, `🤖 Команды бота FRAGMENTS:\n\n/start - Начать игру\n/menu - Главное меню\n/help - Эта справка\n\n🎮 Играйте в захватывающую головоломку FRAGMENTS!`);
        return res.status(200).json({ ok: true });
      }
      // Обычные сообщения (не команда)
      if (!text.startsWith("/")) {
        const user = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
        await bot.sendMessage(chatId, `✅ Спасибо! Ваше сообщение передано команде.\n✅ Thank you! Your message has been forwarded to our team.`);
        if (adminId) {
          await bot.sendMessage(adminId, `📩 Новое обращение от ${user}:\n\n${text}`);
        }
        return res.status(200).json({ ok: true });
      }
    }

    // Отвечаем успехом для других типов обновлений
    return res.status(200).json({ ok: true });

  } catch (error: any) {
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Вынесенная функция для обработки успешного платежа
async function handleSuccessfulPayment(payment: any, res: NextApiResponse) {
  try {
    const paymentData = parseCompactPayload(payment.invoice_payload);
    
    // КРИТИЧЕСКИ ВАЖНО: Проверяем фактически оплаченную сумму
    const actualPaidAmount = payment.total_amount || 0;
    let expectedPrice = 0;
    
    // Получаем ожидаемую цену из базы данных в зависимости от типа товара
    switch (paymentData.itemType) {
      case 'shards': {
        const shardPack = SHARD_PACKS.find(pack => pack.amount.toString() === paymentData.itemId);
        if (!shardPack) {
          console.error(`[SECURITY] Shard pack not found: ${paymentData.itemId}`);
          return res.status(200).json({ ok: true });
        }
        expectedPrice = shardPack.price;
        break;
      }
      case 'booster': {
        const booster = BOOSTERS.find(b => b.id === paymentData.itemId);
        if (!booster) {
          console.error(`[SECURITY] Booster not found: ${paymentData.itemId}`);
          return res.status(200).json({ ok: true });
        }
        const quantity = Number(paymentData.quantity) || 1;
        expectedPrice = booster.price_stars * quantity;
        break;
      }
      case 'subscription': {
        const subscription = ZEN_SUBS.find(sub => sub.period === paymentData.itemId);
        if (!subscription) {
          console.error(`[SECURITY] Subscription not found: ${paymentData.itemId}`);
          return res.status(200).json({ ok: true });
        }
        expectedPrice = subscription.priceStars;
        break;
      }
      default:
        console.error(`[SECURITY] Unknown item type: ${paymentData.itemType}`);
        return res.status(200).json({ ok: true });
    }
    
    // СРАВНИВАЕМ ФАКТИЧЕСКУЮ ОПЛАЧЕННУЮ СУММУ С ОЖИДАЕМОЙ ЦЕНОЙ
    if (actualPaidAmount !== expectedPrice) {
      console.error(`[SECURITY] Price mismatch! Expected: ${expectedPrice}, Paid: ${actualPaidAmount}, UserId: ${paymentData.userId}, ItemType: ${paymentData.itemType}, ItemId: ${paymentData.itemId}`);
      // НЕ ОБРАБАТЫВАЕМ ПЛАТЕЖ - возможна попытка обмана
      return res.status(200).json({ ok: true });
    }
    
    // Получаем пользователя
    const user = await UserService.getUserById(paymentData.userId);
    if (!user) {
      
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
        
        break;
      case 'booster': {
        // Robust parsing of booster identifier: allow numeric ID or string name
        const rawItemId = paymentData.itemId;
        let boosterTypeId: number | null = null;

        if (typeof rawItemId === 'number') {
          boosterTypeId = rawItemId;
        } else if (typeof rawItemId === 'string') {
          const n = Number(rawItemId);
          if (Number.isFinite(n)) {
            boosterTypeId = n;
          } else {
            // Try resolve by name
            const byName = await BoosterService.getBoosterTypeByName(rawItemId);
            if (byName) boosterTypeId = byName.id;
          }
        }

        if (!Number.isFinite(boosterTypeId as number)) {
          
          // Do not fail webhook; acknowledge to avoid repeated retries
          return res.status(200).json({ ok: true });
        }

        const qty = Number.isFinite(paymentData.quantity) && paymentData.quantity > 0
          ? paymentData.quantity
          : 1;

        await BoosterService.addUserBooster(user.id, boosterTypeId as number, qty);
        
        break;
      }
      case 'subscription': {
        // Обрабатываем ZEN подписку
        const rawPeriod = String(paymentData.itemId || '').toLowerCase(); // '1m', '3m', '6m', '12m'
        
        // Получаем подписку из базы данных для проверки периода
        const subscription = ZEN_SUBS.find(sub => sub.period === rawPeriod);
        if (!subscription) {
          console.error(`[SECURITY] Subscription not found: ${rawPeriod}`);
          return res.status(200).json({ ok: true });
        }
        
        // Нормализуем длительность в днях
        const periodDays = rawPeriod === '12m' ? 365 : 
                          rawPeriod === '6m' ? 180 :
                          rawPeriod === '3m' ? 90 : 30;
        const now = new Date();
        const currentEnd = user.hasZenSubscription && user.zenSubscriptionEndDate
          ? new Date(user.zenSubscriptionEndDate)
          : null;
        const base = currentEnd && currentEnd > now ? currentEnd : now;
        const endDate = new Date(base.getTime() + periodDays * 24 * 60 * 60 * 1000);

        // Обновляем статус подписки пользователя
        try {
          const nextRole =
            user.role === UserRole.USER ? UserRole.PREMIUM : user.role;

          await UserService.updateUser(paymentData.userId, {
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
        
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    
    return res.status(200).json({ ok: true });
  }
} 