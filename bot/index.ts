import { Bot, webhookCallback } from 'grammy';
import { run } from '@grammyjs/runner';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// Обработчик команды /start
bot.command('start', async (ctx) => {
  const welcomeMessage = `
🎮 Добро пожаловать в игру Fragments!

Это увлекательная игра-головоломка, где нужно собирать фигуры из фрагментов.

Нажмите кнопку "🎮 Играть" чтобы начать игру прямо в Telegram!
  `;

  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Играть',
            web_app: {
              url: process.env.WEBAPP_URL || 'http://localhost:3000'
            }
          }
        ]
      ]
    }
  });
});

// Обработчик команды /play
bot.command('play', async (ctx) => {
  await ctx.reply('🎮 Открываю игру...', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Играть',
            web_app: {
              url: process.env.WEBAPP_URL || 'http://localhost:3000'
            }
          }
        ]
      ]
    }
  });
});

// Обработчик callback запросов (только для кнопки "Играть")
bot.on('callback_query', async (ctx) => {
  const callbackData = ctx.callbackQuery.data;

  if (callbackData === 'play') {
    await ctx.answerCallbackQuery('Открываю игру...');
    // Кнопка уже открывает Web App, дополнительных действий не нужно
  } else {
    await ctx.answerCallbackQuery('Неизвестная команда');
  }
});

// Обработчик ошибок
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Запуск бота
if (process.env.NODE_ENV === 'production') {
  // Для продакшена используем webhook
  const app = express();
  app.use(express.json());
  app.use(`/${process.env.TELEGRAM_BOT_TOKEN}`, webhookCallback(bot, 'express'));
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🤖 Bot webhook server running on port ${PORT}`);
  });
} else {
  // Для разработки используем polling
  console.log('🤖 Starting bot in development mode...');
  run(bot);
  console.log('✅ Bot is running!');
}

export default bot; 