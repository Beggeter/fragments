# 🤖 Telegram Bot для игры Fragments

Этот бот предоставляет интерфейс для игры Fragments прямо в Telegram с кнопкой "🎮 Играть".

## 🚀 Быстрый старт

### 1. Создание бота в Telegram

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям:
   - Введите имя бота (например: "Fragments Game")
   - Введите username бота (например: "fragments_game_bot")
4. Сохраните полученный токен

### 2. Настройка Web App

1. Отправьте команду `/setmenubutton` боту @BotFather
2. Выберите вашего бота
3. Введите URL вашего веб-приложения (например: `https://your-domain.com`)
4. Введите текст кнопки (например: "🎮 Играть")

### 3. Настройка проекта

1. Перейдите в папку бота:
   ```bash
   cd bot
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Создайте файл `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   WEBAPP_URL=https://your-domain.com
   NODE_ENV=development
   ```

4. Запустите бота в режиме разработки:
   ```bash
   npm run dev
   ```

## 🎮 Функции бота

### Основные команды:
- `/start` - Приветствие и главное меню
- `/play` - Быстрый запуск игры

### Кнопки меню:
- 🎮 **Играть** - Открывает веб-приложение игры
- 📊 **Статистика** - Показывает статистику игрока
- 🏆 **Лидеры** - Показывает топ игроков
- 💰 **Валюта** - Показывает валюту и покупки
- ⚡ **Бустеры** - Показывает доступные бустеры
- ℹ️ **Помощь** - Показывает инструкции по игре

## 🔧 Настройка для продакшена

### 1. Настройка webhook

Для продакшена нужно настроить webhook:

```bash
# Установите webhook URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhook/<YOUR_BOT_TOKEN>",
    "allowed_updates": ["message", "callback_query"]
  }'
```

### 2. Переменные окружения для продакшена

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
WEBAPP_URL=https://your-domain.com
NODE_ENV=production
PORT=3001
```

### 3. Запуск в продакшене

```bash
npm run build
npm run prod
```

## 📱 Интеграция с веб-приложением

### 1. Настройка Telegram Web App

В вашем веб-приложении добавьте поддержку Telegram Web App:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 2. Инициализация Web App

```javascript
// В вашем React компоненте
useEffect(() => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
  }
}, []);
```

### 3. Получение данных пользователя

```javascript
const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
if (user) {
  // Отправьте данные на ваш API для авторизации
  const response = await fetch('/api/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...user,
      hash: new URLSearchParams(tg.initData).get('hash')
    })
  });
}
```

## 🔐 Безопасность

### 1. Проверка подписи Telegram

Всегда проверяйте подпись данных от Telegram:

```typescript
import crypto from 'crypto';

function verifyTelegramSignature(authData: any, botToken: string): boolean {
  const dataCheckString = Object.keys(authData)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  
  return hash === authData.hash;
}
```

### 2. Rate Limiting

Добавьте ограничение запросов для предотвращения злоупотреблений.

## 🐛 Отладка

### Логи бота

Бот выводит логи в консоль. Для продакшена рекомендуется настроить логирование в файл.

### Тестирование

1. Запустите бота в режиме разработки
2. Найдите бота в Telegram по username
3. Отправьте команду `/start`
4. Проверьте работу всех кнопок

## 📋 Чек-лист развертывания

- [ ] Создан бот через @BotFather
- [ ] Получен токен бота
- [ ] Настроен Web App URL
- [ ] Установлены зависимости
- [ ] Настроен файл .env
- [ ] Бот запущен и отвечает
- [ ] Кнопка "Играть" работает
- [ ] Веб-приложение интегрировано
- [ ] Проверка подписи настроена
- [ ] Rate limiting добавлен
- [ ] Логирование настроено

## 🔗 Полезные ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web App](https://core.telegram.org/bots/webapps)
- [GrammY Framework](https://grammy.dev/)
- [BotFather](https://t.me/botfather)

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи бота
2. Убедитесь, что токен правильный
3. Проверьте настройки webhook
4. Убедитесь, что веб-приложение доступно по указанному URL 