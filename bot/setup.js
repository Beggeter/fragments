#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 Настройка Telegram бота для игры Fragments\n');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupBot() {
  try {
    console.log('📋 Шаг 1: Создание бота в Telegram');
    console.log('1. Откройте @BotFather в Telegram');
    console.log('2. Отправьте команду /newbot');
    console.log('3. Следуйте инструкциям для создания бота');
    console.log('4. Сохраните полученный токен\n');

    const botToken = await askQuestion('Введите токен вашего бота: ');
    
    if (!botToken || botToken.length < 10) {
      console.log('❌ Неверный токен бота');
      return;
    }

    console.log('\n📋 Шаг 2: Настройка Web App');
    console.log('1. Отправьте команду /setmenubutton боту @BotFather');
    console.log('2. Выберите вашего бота');
    console.log('3. Введите URL вашего веб-приложения');
    console.log('4. Введите текст кнопки: "🎮 Играть"\n');

    const webappUrl = await askQuestion('Введите URL вашего веб-приложения (например: https://your-domain.com): ');
    
    if (!webappUrl || !webappUrl.startsWith('http')) {
      console.log('❌ Неверный URL');
      return;
    }

    console.log('\n📋 Шаг 3: Создание файла .env');
    
    const envContent = `TELEGRAM_BOT_TOKEN=${botToken}
WEBAPP_URL=${webappUrl}
NODE_ENV=development
PORT=3001
`;

    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Файл .env создан');

    console.log('\n📋 Шаг 4: Установка зависимостей');
    console.log('Выполните команду: npm install');

    console.log('\n📋 Шаг 5: Запуск бота');
    console.log('Выполните команду: npm run dev');

    console.log('\n🎉 Настройка завершена!');
    console.log('\n📱 Теперь вы можете:');
    console.log('1. Найти вашего бота в Telegram');
    console.log('2. Отправить команду /start');
    console.log('3. Нажать кнопку "🎮 Играть"');
    console.log('4. Наслаждаться игрой!');

    console.log('\n🔗 Полезные ссылки:');
    console.log('- Telegram Bot API: https://core.telegram.org/bots/api');
    console.log('- Telegram Web App: https://core.telegram.org/bots/webapps');
    console.log('- GrammY Framework: https://grammy.dev/');

  } catch (error) {
    console.error('❌ Ошибка при настройке:', error.message);
  } finally {
    rl.close();
  }
}

setupBot(); 