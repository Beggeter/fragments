const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const botToken = process.env.STARS_BOT_TOKEN;
if (!botToken) {
  console.error('❌ STARS_BOT_TOKEN environment variable is not set');
  process.exit(1);
}

const bot = new TelegramBot(botToken, { polling: false });

async function testWebhook() {
  try {
    console.log('🔍 Testing Stars webhook...');
    
    // Получаем информацию о webhook
    const webhookInfo = await bot.getWebhookInfo();
    console.log('📋 Webhook info:', {
      url: webhookInfo.url,
      has_custom_certificate: webhookInfo.has_custom_certificate,
      pending_update_count: webhookInfo.pending_update_count,
      last_error_date: webhookInfo.last_error_date,
      last_error_message: webhookInfo.last_error_message
    });

    if (webhookInfo.url) {
      console.log('✅ Webhook is configured');
      
      if (webhookInfo.pending_update_count > 0) {
        console.log(`⚠️ There are ${webhookInfo.pending_update_count} pending updates`);
      }
      
      if (webhookInfo.last_error_message) {
        console.log(`❌ Last error: ${webhookInfo.last_error_message}`);
      }
    } else {
      console.log('❌ Webhook is not configured');
    }

    // Проверяем информацию о боте
    const botInfo = await bot.getMe();
    console.log('🤖 Bot info:', {
      id: botInfo.id,
      username: botInfo.username,
      first_name: botInfo.first_name,
      can_join_groups: botInfo.can_join_groups,
      can_read_all_group_messages: botInfo.can_read_all_group_messages,
      supports_inline_queries: botInfo.supports_inline_queries
    });

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

testWebhook();
