const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const botToken = process.env.STARS_BOT_TOKEN;
if (!botToken) {
  console.error('❌ STARS_BOT_TOKEN environment variable is not set');
  process.exit(1);
}

const webhookUrl = process.argv[2];
if (!webhookUrl) {
  console.error('❌ Please provide webhook URL as argument');
  ;
  ;
  process.exit(1);
}

const bot = new TelegramBot(botToken, { polling: false });

async function setupWebhook() {
  try {
    ;
    ;
    
    // Устанавливаем webhook
    const result = await bot.setWebhook(webhookUrl);
    
    if (result) {
      ;
      
      // Проверяем информацию о webhook
      const webhookInfo = await bot.getWebhookInfo();
      console.log('📋 Webhook info:', {
        url: webhookInfo.url,
        has_custom_certificate: webhookInfo.has_custom_certificate,
        pending_update_count: webhookInfo.pending_update_count,
        last_error_date: webhookInfo.last_error_date,
        last_error_message: webhookInfo.last_error_message
      });
    } else {
      console.error('❌ Failed to set webhook');
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
}

setupWebhook();
