# Настройка Telegram Stars интеграции

Этот документ описывает, как настроить интеграцию с Telegram Stars для прямых платежей в WebApp.

## Что изменилось

Вместо отправки инвойсов в чат с ботом, теперь инвойсы открываются прямо в WebApp через Telegram Stars API.

### Преимущества новой системы:
- ✅ Прямые платежи в WebApp без перехода в чат
- ✅ Лучший пользовательский опыт
- ✅ Меньше шагов для покупки
- ✅ Автоматическая обработка платежей

## Настройка

### 1. Создание Stars бота

1. Создайте нового бота через @BotFather
2. Отправьте команду `/newbot` и следуйте инструкциям
3. Получите токен бота
4. Добавьте токен в переменные окружения:

```env
# Telegram Stars Bot
STARS_BOT_TOKEN=your_stars_bot_token_here
```

### 2. Настройка webhook'а

Для production:

```bash
# Замените на ваш домен
node scripts/setup-stars-webhook.js https://your-domain.com/api/stars/webhook
```

Для разработки (с ngrok):

```bash
# Установите ngrok если еще не установлен
npm install -g ngrok

# Запустите туннель
ngrok http 3001

# Настройте webhook с полученным URL
node scripts/setup-stars-webhook.js https://your-ngrok-url.ngrok.io/api/stars/webhook
```

### 3. Проверка настройки

После настройки webhook'а вы должны увидеть:

```
✅ Webhook set successfully!
📊 Webhook info: {
  "url": "https://your-domain.com/api/stars/webhook",
  "has_custom_certificate": false,
  "pending_update_count": 0,
  "max_connections": 40
}
```

## Как это работает

### 1. Создание инвойса

Когда пользователь нажимает "Купить за Telegram Stars":

```typescript
// В компоненте ShardPurchaseModal или BoosterPurchaseModal
const result = await createShardsInvoice(userId, pack.amount, pack.price);

if (result.success) {
  // Инвойс открывается прямо в WebApp
  showTelegramAlert('Инвойс открыт! Завершите оплату в Telegram.');
}
```

### 2. Обработка платежа

Telegram автоматически отправляет webhook на ваш сервер:

```
POST /api/stars/webhook
{
  "update_id": 123456789,
  "successful_payment": {
    "currency": "XTR",
    "total_amount": 5000,
    "invoice_payload": "{\"u\":123456,\"t\":\"shards\",\"i\":\"100\",\"a\":100,\"p\":50}",
    "telegram_payment_charge_id": "charge_123456789",
    "provider_payment_charge_id": "provider_123456789"
  }
}
```

### 3. Начисление товара

Сервер автоматически обрабатывает платеж и начисляет товар:

```typescript
// В /api/stars/webhook.ts
const paymentData = parseCompactPayload(payment.invoice_payload);

switch (paymentData.itemType) {
  case 'shards':
    await CurrencyService.addShards(user.telegramId, paymentData.amount);
    break;
  
  case 'booster':
    await BoosterService.addBooster(user.telegramId, paymentData.itemId, paymentData.quantity);
    break;
}
```

## Структура payload

Для экономии места используется compact payload:

```json
{
  "u": 123456,        // userId
  "t": "shards",      // itemType
  "i": "100",         // itemId
  "a": 100,           // amount
  "p": 50             // price
}
```

## Тестирование

### 1. Тестовый режим

Для тестирования используйте тестовые Stars:

1. Создайте тестового бота
2. Получите тестовые Stars через @BotFather
3. Протестируйте покупки

### 2. Логирование

Все операции логируются в консоль:

```
💎 Creating Telegram Stars invoice for shard purchase: { userId: 123456, packAmount: 100, packPrice: 50 }
✅ Telegram Stars invoice opened successfully
💰 Processing successful payment: { currency: "XTR", total_amount: 5000, ... }
✅ Shards payment processed: { userId: 123456, amount: 100 }
```

## Устранение неполадок

### Ошибка "MainButton not available"

Убедитесь, что:
- Приложение запущено через Telegram WebApp
- Используется последняя версия Telegram
- WebApp поддерживает Stars API

### Ошибка "Payload too large"

Уменьшите размер данных в payload:
- Используйте короткие ключи
- Уберите ненужные метаданные
- Максимальный размер: 128 байт

### Webhook не работает

Проверьте:
1. URL webhook'а доступен из интернета
2. Используется HTTPS (для production)
3. Токен бота правильный
4. Сервер отвечает 200 OK

### Платежи не обрабатываются

Проверьте логи сервера:
```bash
# В консоли разработки
npm run dev

# Или в production логах
```

## Безопасность

- ✅ Все webhook'и проверяются
- ✅ Payload валидируется
- ✅ Пользователи проверяются
- ✅ Ошибки обрабатываются безопасно

## Миграция с старой системы

Старая система отправки инвойсов в чат больше не используется. Все покупки теперь происходят через Telegram Stars API прямо в WebApp.

## Поддержка

Если у вас возникли проблемы:

1. Проверьте логи в консоли браузера и сервера
2. Убедитесь, что webhook настроен правильно
3. Проверьте, что бот имеет права на Stars
4. Убедитесь, что используется HTTPS (для production) 