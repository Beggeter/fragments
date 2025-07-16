# Настройка оплаты через Telegram Stars

## Обзор системы

Теперь в вашем проекте реализована полная система оплаты через Telegram Stars (XTR). При нажатии на покупку товара в магазине пользователю в бот приходит инвойс на оплату, а после успешной оплаты товар автоматически начисляется пользователю.

## Возможности

### 🛍️ Покупка товаров
- **Осколки (Shards)** - игровая валюта разных номиналов
- **Бустеры** - игровые улучшения (Undo, Bomb, Whirlwind)
- **Подписки** - ZEN подписки (готово к расширению)

### 💫 Способы оплаты
- **Telegram Stars** - основной способ оплаты через инвойсы
- **Осколки** - внутриигровая валюта (для бустеров)
- **Тестовая покупка** - для разработки (только в dev режиме)

## Настройка

### 1. Переменные окружения

Убедитесь, что в `.env.local` указаны:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 2. Настройка бота в BotFather

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Настройте Web App:
   ```
   /setdomain
   /mybots -> ваш бот -> Bot Settings -> Domain -> yourdomain.com
   ```
4. Настройте команды:
   ```
   /setcommands
   start - Главное меню
   shop - Магазин
   help - Помощь
   balance - Показать баланс
   ```

### 3. Настройка Telegram Stars

1. В [@BotFather] включите Payments:
   ```
   /mybots -> ваш бот -> Bot Settings -> Payments
   ```
2. Подключите Telegram Stars как провайдера платежей
3. Настройте webhook для получения уведомлений о платежах

### 4. Настройка webhook

Установите webhook для вашего бота:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/api/telegram-webhook"}'
```

## Как это работает

### Процесс покупки

1. **Пользователь выбирает товар** в магазине WebApp
2. **Нажимает "Купить за Telegram Stars"**
3. **Система создает инвойс** через API `/api/payment/create-invoice`
4. **Инвойс отправляется** пользователю в бот
5. **Пользователь оплачивает** через Telegram
6. **Webhook получает уведомление** о successful_payment
7. **Товар автоматически начисляется** пользователю

### API Endpoints

#### POST `/api/payment/create-invoice`
Создает и отправляет инвойс пользователю.

**Параметры:**
```typescript
{
  userId: number;
  item: {
    type: 'shards' | 'booster' | 'subscription';
    itemId: string;
    quantity?: number;
    metadata?: Record<string, any>;
  };
  telegramChatId: number;
}
```

#### POST `/api/telegram-webhook`
Обрабатывает уведомления от Telegram о платежах и начисляет товары.

### Структура данных

#### PaymentPayload
```typescript
{
  userId: number;
  itemType: 'shards' | 'booster' | 'subscription';
  itemId: string;
  quantity?: number;
  amount: number; // количество для начисления
  price: number;  // цена в Stars
  metadata?: Record<string, any>;
}
```

## Логирование

Система ведет подробное логирование всех операций:
- 📥 Получение webhook'ов
- 💰 Обработка платежей  
- ✅ Успешные покупки
- ❌ Ошибки и исключения

## Тестирование

### Dev режим
В development режиме доступна кнопка "Тестовая покупка" для эмуляции успешных платежей без реальных денег.

### Команды бота
- `/start` - Приветствие и главное меню
- `/shop` - Информация о магазине
- `/help` - Справка по игре
- `/balance` - Текущий баланс пользователя

## Безопасность

- ✅ Проверка подписи Telegram (отключена для тестирования)
- ✅ Rate limiting для предотвращения атак
- ✅ Валидация всех входящих данных
- ✅ Безопасная обработка payload
- ✅ Логирование всех операций

## Поддерживаемые товары

### Осколки (Shards)
- 20 осколков - 10 XTR
- 60 осколков - 25 XTR  
- 150 осколков - 60 XTR
- 400 осколков - 140 XTR
- 1000 осколков - 330 XTR (-17%)
- 2500 осколков - 800 XTR (-20%)

### Бустеры
- **Undo** - 20 XTR (отмена хода)
- **Bomb** - 60 XTR (взрыв 3×3)
- **Whirlwind** - 80 XTR (очистка поля)

## Расширение

Система легко расширяется для новых типов товаров:

1. Добавьте новый тип в `PaymentItem.type`
2. Обновите обработку в `create-invoice.ts`
3. Добавьте логику начисления в `telegram-webhook.ts`
4. Создайте UI для нового товара

## Мониторинг

Отслеживайте работу системы через логи:
```bash
# Проверка webhook'ов
tail -f logs/webhook.log

# Проверка платежей  
tail -f logs/payments.log
```

---

**Система готова к работе!** 🚀

Теперь пользователи могут покупать товары за Telegram Stars прямо в боте, а товары будут автоматически начисляться после оплаты. 