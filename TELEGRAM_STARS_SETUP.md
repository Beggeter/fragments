# Настройка Telegram Stars с TMA SDK v3

## 🚀 Быстрый старт

### 1. Создание Stars бота

1. Создайте нового бота через @BotFather
2. Получите токен бота
3. Добавьте токен в `.env`:

```env
STARS_BOT_TOKEN=your_stars_bot_token_here
```

### 2. Настройка webhook

```bash
# Для разработки с ngrok
ngrok http 3001
node scripts/setup-stars-webhook.js https://your-ngrok-url.ngrok.io/api/stars/webhook

# Для production
node scripts/setup-stars-webhook.js https://your-domain.com/api/stars/webhook
```

### 3. Инициализация SDK

SDK автоматически инициализируется в `app/page.tsx`:

```typescript
import { init } from '@telegram-apps/sdk';

// Инициализируем SDK при загрузке приложения
await init();
```

## 🔧 Как это работает

### 1. Создание инвойса

```typescript
// API создает инвойс и возвращает invoice_url
const response = await fetch('/api/payment/create-invoice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    item: { type: 'shards', itemId: '100' }
  })
});

const data = await response.json();
// data.invoice_url - URL для открытия инвойса
```

### 2. Открытие инвойса

```typescript
import { invoice } from '@telegram-apps/sdk';

// Открываем инвойс с URL
const status = await invoice.open(invoice_url, 'url');

// Обрабатываем результат
switch (status) {
  case 'paid':
    console.log('✅ Платеж успешен');
    break;
  case 'cancelled':
    console.log('❌ Платеж отменен');
    break;
  case 'failed':
    console.log('❌ Платеж не удался');
    break;
}
```

### 3. Обработка webhook

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

## 📱 Использование в компонентах

### Покупка осколков

```typescript
import { createShardsInvoice, showTelegramAlert } from '@/lib/utils/telegramStars';

const handleShardsPurchase = async () => {
  try {
    const result = await createShardsInvoice(userId, 100, 50);
    
    if (result.success) {
      showTelegramAlert('Осколки успешно куплены!');
      onSuccess();
    } else {
      showTelegramAlert('Ошибка: ' + result.error);
    }
  } catch (error) {
    console.error('Purchase error:', error);
  }
};
```

### Покупка бустера

```typescript
import { createBoosterInvoice, showTelegramAlert } from '@/lib/utils/telegramStars';

const handleBoosterPurchase = async () => {
  try {
    const result = await createBoosterInvoice(userId, 'undo', 'Undo', 1, 20);
    
    if (result.success) {
      showTelegramAlert('Бустер успешно куплен!');
      onSuccess();
    } else {
      showTelegramAlert('Ошибка: ' + result.error);
    }
  } catch (error) {
    console.error('Purchase error:', error);
  }
};
```

## 🧪 Тестирование

### Компоненты для отладки

В режиме разработки доступны компоненты:

- `TestStarsPayment` - тестирование платежей
- `TestInvoiceSystem` - тестирование системы инвойсов

### Проверка окружения

```typescript
import { isTelegramWebApp, getTelegramUserId } from '@/lib/utils/telegramStars';

const checks = {
  'Telegram WebApp': isTelegramWebApp(),
  'User ID': getTelegramUserId() ? 'Найден' : 'Не найден',
  'WebApp Version': window.Telegram?.WebApp?.version || 'Неизвестно'
};
```

## 🔄 Настройка webhook

### Для разработки

```bash
# 1. Запустите ngrok
ngrok http 3001

# 2. Скопируйте HTTPS URL (например: https://abc123.ngrok.io)

# 3. Настройте webhook
node scripts/setup-stars-webhook.js https://abc123.ngrok.io/api/stars/webhook
```

### Для production

```bash
# Настройте webhook с вашим доменом
node scripts/setup-stars-webhook.js https://your-domain.com/api/stars/webhook
```

### Проверка webhook

```bash
# Проверить текущий webhook
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## ⚠️ Важные моменты

1. **Инициализация SDK обязательна** - вызывается в `app/page.tsx`
2. **Используйте invoice_url** - API возвращает URL, а не slug
3. **Открывайте с параметром 'url'** - `invoice.open(url, 'url')`
4. **Обрабатывайте все статусы** - paid, cancelled, failed
5. **Настройте webhook заново** - при смене URL

## 🐛 Устранение неполадок

### SDK не инициализируется

- Проверьте, что приложение запущено через Telegram WebApp
- Убедитесь, что используется последняя версия Telegram

### Webhook не работает

- Проверьте доступность URL из интернета
- Убедитесь, что используется HTTPS (для production)
- Проверьте правильность токена бота

### Инвойс не открывается

- Проверьте, что SDK инициализирован
- Убедитесь, что используется правильный URL
- Проверьте поддержку API: `invoice.isSupported()`

## 📊 Логирование

Все операции логируются в консоль:

```
✅ TMA SDK initialized successfully
💎 Creating shards invoice: { userId: 123456, packAmount: 100, packPrice: 50 }
📄 Invoice created, opening with URL: https://...
💰 Payment status: paid
✅ Payment successful
```

## 🎯 Результат

После правильной настройки:

- ✅ Инвойсы открываются прямо в miniApp
- ✅ Пользователи не переходят в чат
- ✅ Мгновенные уведомления об успехе/ошибке
- ✅ Автоматическое начисление товаров
- ✅ Лучший пользовательский опыт

Это значительно улучшает конверсию и удобство использования! 