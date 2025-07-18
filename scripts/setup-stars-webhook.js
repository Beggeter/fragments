#!/usr/bin/env node

/**
 * Скрипт для настройки webhook'а Telegram Stars
 * 
 * Использование:
 * node scripts/setup-stars-webhook.js <webhook-url>
 * 
 * Пример:
 * node scripts/setup-stars-webhook.js https://your-domain.com/api/stars/webhook
 */

const https = require('https');
const http = require('http');

async function setupWebhook(webhookUrl) {
  try {
    console.log('🔗 Setting up Stars webhook...');
    console.log('📡 Webhook URL:', webhookUrl);

    // Проверяем, что URL валидный
    const url = new URL(webhookUrl);
    if (!url.protocol.startsWith('http')) {
      throw new Error('Webhook URL must use HTTP or HTTPS protocol');
    }

    // Отправляем запрос на настройку webhook
    const response = await fetch('http://localhost:3001/api/stars/setup-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ webhookUrl })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Webhook set successfully!');
      console.log('📊 Webhook info:', JSON.stringify(result.webhookInfo, null, 2));
    } else {
      console.error('❌ Failed to set webhook:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your development server is running on port 3001');
      console.log('   Run: npm run dev');
    }
    
    process.exit(1);
  }
}

// Получаем webhook URL из аргументов командной строки
const webhookUrl = process.argv[2];

if (!webhookUrl) {
  console.error('❌ Webhook URL is required');
  console.log('');
  console.log('Usage: node scripts/setup-stars-webhook.js <webhook-url>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/setup-stars-webhook.js https://your-domain.com/api/stars/webhook');
  console.log('');
  process.exit(1);
}

// Настраиваем webhook
setupWebhook(webhookUrl); 