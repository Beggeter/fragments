const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const botToken = process.env.STARS_BOT_TOKEN;
if (!botToken) {
  
  process.exit(1);
}

const webhookUrl = process.argv[2];
if (!webhookUrl) {
  
  
  
  process.exit(1);
}

const bot = new TelegramBot(botToken, { polling: false });

async function setupWebhook() {
  try {
    
    
    
    // Устанавливаем webhook
    const result = await bot.setWebhook(webhookUrl);
    
    if (result) {
      
      
      // Проверяем информацию о webhook
      const webhookInfo = await bot.getWebhookInfo();
      
    } else {
      
    }
  } catch (error) {
    
  }
}

setupWebhook();
