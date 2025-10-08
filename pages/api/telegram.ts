import type { NextApiRequest, NextApiResponse } from "next";
import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

const WEBAPP_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://fragmentstgm.ru?v=2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const body = req.body;
    const chatId = body.message?.chat?.id;
    const messageText = body.message?.text;
    const userId = body.message?.from?.id;

    

    // Обрабатываем команды
    if (messageText && chatId) {
      switch (messageText) {
        case "/start":
          await handleStartCommand(chatId, userId);
          break;
        
        case "/shop":
          await handleShopCommand(chatId);
          break;
        
        case "/help":
          await handleHelpCommand(chatId);
          break;
        
        case "/balance":
          await handleBalanceCommand(chatId, userId);
          break;
        
        default:
          // Если это не команда, отправляем стандартный ответ
          if (messageText.startsWith('/')) {
            await bot.sendMessage(
              chatId,
              "❓ Неизвестная команда. Используйте /help для просмотра доступных команд."
            );
          }
          break;
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// Обработчик команды /start
async function handleStartCommand(chatId: number, userId?: number) {
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🎮 Играть",
            web_app: { url: WEBAPP_URL },
          },
        ],
        [
          {
            text: "🛍️ Магазин",
            callback_data: "open_shop",
          },
          {
            text: "ℹ️ Помощь",
            callback_data: "help",
          },
        ],
      ],
    },
  };

  const welcomeMessage = `🎮 Добро пожаловать в Fragments!

🔥 Захватывающая головоломка-тетрис с:
• Уникальными блоками и комбо
• Системой бустеров для сложных ситуаций  
• Соревнованиями с друзьями
• Покупками через Telegram Stars ⭐

🎯 Размещайте блоки, собирайте линии, зарабатывайте очки!

Нажмите "Играть" чтобы начать приключение! 🚀`;

  await bot.sendMessage(chatId, welcomeMessage, options);

  
}

// Обработчик команды /shop
async function handleShopCommand(chatId: number) {
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🛍️ Открыть магазин",
            web_app: { url: `${WEBAPP_URL}?tab=shop` },
          },
        ],
      ],
    },
  };

  const shopMessage = `🛍️ **Магазин Fragments**

💎 **Осколки** - внутриигровая валюта
• Покупайте бустеры
• Продолжайте игру после поражения
• Разблокируйте новые возможности

🚀 **Бустеры**:
• **Отмена хода** - исправьте ошибку
• **Бомба** - взрыв 3×3 области
• **Вихрь** - очистка всего поля

⭐ **Оплата через Telegram Stars** - быстро и безопасно!

Откройте магазин в приложении ↓`;

  await bot.sendMessage(chatId, shopMessage, { 
    ...options, 
    parse_mode: 'Markdown' 
  });
}

// Обработчик команды /help
async function handleHelpCommand(chatId: number) {
  const helpMessage = `❓ **Помощь по Fragments**

🎮 **Как играть:**
• Перетаскивайте блоки на поле
• Собирайте полные линии для очистки
• Зарабатывайте очки и комбо
• Используйте бустеры в сложных ситуациях

🛍️ **Покупки:**
• Покупайте товары за Telegram Stars ⭐
• Получайте осколки для игровых улучшений
• Все платежи безопасны через Telegram

📱 **Команды бота:**
/start - главное меню
/shop - открыть магазин  
/help - эта справка
/balance - показать баланс

🎯 **Цель**: набрать максимальное количество очков!

Удачной игры! 🍀`;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
}

// Обработчик команды /balance  
async function handleBalanceCommand(chatId: number, userId?: number) {
  if (!userId) {
    await bot.sendMessage(chatId, "❌ Не удалось определить ваш ID пользователя.");
    return;
  }

  try {
    // Используем прямое обращение к сервису вместо HTTP запроса для избежания циркулярной зависимости
    const { UserService } = await import('@/lib/db/services');
    const user = await UserService.getUserByTelegramId(userId.toString());
    
    if (user) {
      const balance = user.currency || 0;
      
      const balanceMessage = `💰 **Ваш баланс**

💎 Осколки: **${balance.toLocaleString()}**

🛍️ Хотите пополнить баланс? Используйте /shop или откройте магазин в игре!`;

      await bot.sendMessage(chatId, balanceMessage, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, "❌ Пользователь не найден. Запустите игру для создания аккаунта.");
    }
  } catch (error) {
    
    await bot.sendMessage(chatId, "❌ Ошибка при получении баланса. Попробуйте позже.");
  }
}
