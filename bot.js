require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const adminId = process.env.ADMIN_ID;
const webAppUrl = process.env.WEBAPP_URL;
const termsUrl = process.env.TERMS_URL;

// Главное меню
const getMainMenu = () => {
  return {
    text: `🎮 Добро пожаловать в FRAGMENTS — динамичную головоломку по мотивам Block Blast!\n\n` +
      `Собирай фигуры, зарабатывай очки, используй бустеры и достигай Zen.\n\n` +
      `Ты можешь приобрести осколки, бустеры и подписку ZEN через Telegram Stars прямо в игре.\n\n` +
      `👇 Выберите действие:`,
    reply_markup: Markup.inlineKeyboard([
      [{ text: "▶️ Играть", web_app: { url: webAppUrl } }],
      [{ text: "🛠 Поддержка (RU)", callback_data: "support_ru" }],
      [{ text: "🛠 Support (EN)", callback_data: "support_en" }],
      [{ text: "📄 Условия", callback_data: "terms" }],
    ])
  };
};

// /start с inline-кнопками
bot.start((ctx) => {
  const menu = getMainMenu();
  ctx.reply(menu.text, menu.reply_markup);
});

// Обработка нажатий по callback_data
bot.on("callback_query", async (ctx) => {
  const action = ctx.callbackQuery.data;
  
  console.log(`🔘 Нажата кнопка: ${action}`);

  try {
    // Удаляем предыдущее сообщение
    await ctx.deleteMessage();
    console.log("✅ Предыдущее сообщение удалено");
  } catch (error) {
    console.log("⚠️ Ошибка при удалении сообщения:", error.message);
  }

  switch (action) {
    case "support_ru":
      console.log("📞 Отправляем поддержку RU");
      await ctx.reply(
        `ℹ️ Поддержка по покупкам\n\n` +
          `Если у тебя возникли проблемы с покупкой, пожалуйста, отправь в поддержку:\n\n` +
          `1. Свой @username\n` +
          `2. Название товара (например, ZEN-подписка, бустер и т.д.)\n` +
          `3. Примерное время покупки\n` +
          `4. Что произошло\n\n` +
          `📬 Поддержка: @fragments_support_bot`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Назад", callback_data: "back_to_main" }]
            ]
          }
        }
      );
      break;

    case "support_en":
      console.log("📞 Отправляем поддержку EN");
      await ctx.reply(
        `ℹ️ Purchase Support\n\n` +
          `If you experienced an issue with a purchase, please send us:\n\n` +
          `1. Your @username\n` +
          `2. Product name (e.g. ZEN subscription, booster, etc.)\n` +
          `3. Approximate time of purchase\n` +
          `4. Short description of the issue\n\n` +
          `📬 Contact: @fragments_support_bot`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Back", callback_data: "back_to_main" }]
            ]
          }
        }
      );
      break;

    case "terms":
      console.log("📄 Отправляем условия");
      await ctx.reply(
        `📄 Условия использования:\n\n` +
          `– Все товары являются цифровыми и используются только внутри Mini App FRAGMENTS\n` +
          `– Покупки обрабатываются через Telegram Stars\n` +
          `– Возвраты не предусмотрены, за исключением технических ошибок\n` +
          `– В случае проблем — @fragments_support_bot\n\n` +
          `📄 Terms of Service:\n\n` +
          `– All products are digital and used within the FRAGMENTS Mini App\n` +
          `– Purchases are processed via Telegram Stars\n` +
          `– No refunds unless a technical error occurred\n` +
          `– Contact @fragments_support_bot for any issues\n\n` +
          (termsUrl ? `🔗 ${termsUrl}` : ""),
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Назад", callback_data: "back_to_main" }]
            ]
          }
        }
      );
      break;

    case "back_to_main":
      console.log("🔙 Возвращаемся в главное меню");
      const menu = getMainMenu();
      await ctx.reply(menu.text, menu.reply_markup);
      break;
      
    default:
      console.log(`❓ Неизвестное действие: ${action}`);
  }

  await ctx.answerCbQuery(); // закрыть "часики"
});

// Любое сообщение = обращение → автоответ + пересылка админу
bot.on("message", async (ctx) => {
  const msg = ctx.message.text;
  if (msg.startsWith("/")) return; // не обрабатывать команды

  const user = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name;
  await ctx.reply(
    `✅ Спасибо! Ваше сообщение передано команде.\n` +
      `✅ Thank you! Your message has been forwarded to our team.`
  );

  bot.telegram.sendMessage(adminId, `📩 Новое обращение от ${user}:\n\n${msg}`);
});

bot.launch();
console.log("🤖 FRAGMENTS Бот запущен");
