#!/usr/bin/env node

/**
 * Скрипт для настройки webhook для Telegram Stars
 * Использование: node scripts/setup-stars-webhook.js <webhook_url>
 */

const https = require('https');
const http = require('http');

// Получаем параметры из командной строки
const webhookUrl = process.argv[2];
const botToken = process.env.STARS_BOT_TOKEN;

if (!webhookUrl) {
  console.error('❌ Ошибка: Не указан URL webhook');
  console.log('Использование: node scripts/setup-stars-webhook.js <webhook_url>');
  console.log('Пример: node scripts/setup-stars-webhook.js https://your-domain.com/api/stars/webhook');
  process.exit(1);
}

if (!botToken) {
  console.error('❌ Ошибка: Не найден токен бота в переменной окружения STARS_BOT_TOKEN');
  process.exit(1);
}

console.log('🔗 Настройка webhook для Telegram Stars...');
console.log('📡 URL:', webhookUrl);
console.log('🤖 Bot Token:', botToken.substring(0, 10) + '...');

// Данные для запроса
const postData = JSON.stringify({
  url: webhookUrl,
  allowed_updates: ['pre_checkout_query', 'successful_payment']
});

// Опции для запроса
const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${botToken}/setWebhook`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// Отправляем запрос
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.ok) {
        console.log('✅ Webhook успешно настроен!');
        console.log('📊 Информация о webhook:');
        console.log('  URL:', response.result.url);
        console.log('  Has custom certificate:', response.result.has_custom_certificate);
        console.log('  Pending updates:', response.result.pending_update_count);
        console.log('  Max connections:', response.result.max_connections);
      } else {
        console.error('❌ Ошибка настройки webhook:', response.description);
        console.error('Error code:', response.error_code);
      }
    } catch (error) {
      console.error('❌ Ошибка парсинга ответа:', error);
      console.log('Ответ сервера:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Ошибка запроса:', error.message);
});

// Отправляем данные
req.write(postData);
req.end();

console.log('⏳ Отправляем запрос...'); 