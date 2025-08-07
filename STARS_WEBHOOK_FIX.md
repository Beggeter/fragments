# Исправление Stars Webhook для подписок

## ✅ Что было исправлено:

1. **Добавлена обработка подписок в Stars webhook** (`pages/api/stars/webhook.ts`)
2. **Создан скрипт настройки webhook** (`scripts/setup-stars-webhook.js`)
3. **Создан тестовый скрипт** (`scripts/test-stars-webhook.js`)

## 🔧 Как проверить:

### 1. Проверить настройку webhook:
```bash
npm run stars:test-webhook
```

### 2. Если webhook не настроен, настроить его:
```bash
npm run stars:setup-webhook https://your-domain.com/api/stars/webhook
```

### 3. Проверить логи при покупке подписки:
- Откройте консоль браузера
- Попробуйте купить подписку
- Проверьте логи в консоли сервера

## 📋 Ожидаемые логи при успешной покупке:

```
👑 Creating ZEN subscription invoice: { userId: 123, subscriptionPeriod: 'month', priceStars: 50 }
📄 ZEN invoice created, opening with URL: https://...
💰 ZEN payment status: paid
✅ ZEN subscription payment successful
```

В webhook:
```
📦 Stars webhook received: { body: {...}, headers: {...} }
💰 Processing successful payment (Stars): {...}
📅 Processing subscription purchase (Stars): { userId: 123, subscriptionId: 'month', price: 50 }
✅ ZEN subscription activated successfully (Stars): {...}
```

## 🚨 Если что-то не работает:

1. **Проверьте переменные окружения:**
   - `STARS_BOT_TOKEN` - токен Stars бота
   - `TELEGRAM_BOT_TOKEN` - токен основного бота

2. **Проверьте webhook URL:**
   - Должен быть доступен из интернета
   - Должен использовать HTTPS (для production)

3. **Проверьте логи:**
   - Консоль браузера
   - Логи сервера
   - Webhook info через тестовый скрипт

## 🎯 Результат:

После исправления покупка подписок должна работать корректно:
- ✅ Инвойс создается
- ✅ Платеж обрабатывается
- ✅ Подписка активируется
- ✅ Пользователь получает уведомление
