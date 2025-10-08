const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const botToken = process.env.STARS_BOT_TOKEN;
if (!botToken) {
  
  process.exit(1);
}

const bot = new TelegramBot(botToken, { polling: false });

async function testWebhook() {
  try {
    
    
    // Получаем информацию о webhook
    const webhookInfo = await bot.getWebhookInfo();
    

    if (webhookInfo.url) {
      
      
      if (webhookInfo.pending_update_count > 0) {
        
      }
      
      if (webhookInfo.last_error_message) {
        
      }
    } else {
      
    }

    // Проверяем информацию о боте
    const botInfo = await bot.getMe();
    

  } catch (error) {
    
  }
}

testWebhook();
