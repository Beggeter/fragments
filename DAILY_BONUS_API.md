# API Ежедневных Бонусов

## Описание

API для системы ежедневных бонусов, где игроки могут получать награды каждый день после 00:00 по серверу.

## Особенности

- **4 недели**: Система делится на 4 недели, привязанные к каждому игроку
- **Сброс прогресса**: Если игрок пропускает день, прогресс сбрасывается к первому дню первой недели
- **Премиум бонусы**: Игроки с ролью `premium`, `admin` или `tester` получают дополнительные награды
- **Типы наград**: Валюта и бустеры (bomb, laser, whirlwind)

## Endpoints

### GET `/api/users/[telegramId]/bonus`

Получить состояние ежедневных бонусов пользователя.

**Параметры:**
- `telegramId` (string) - Telegram ID пользователя

**Ответ:**
```json
{
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "regular": { "type": "currency", "amount": 100 },
          "premium": { "type": "currency", "amount": 150 }
        }
        // ... остальные дни
      ]
    }
    // ... остальные недели
  ],
  "currentWeek": 1,
  "currentDay": 3,
  "canClaimToday": true,
  "todayReward": { "type": "currency", "amount": 150 }
}
```

**Коды ответов:**
- `200` - Успешно
- `400` - Неверный telegram ID
- `404` - Пользователь не найден
- `500` - Внутренняя ошибка сервера

### POST `/api/users/[telegramId]/bonus`

Получить ежедневный бонус.

**Параметры:**
- `telegramId` (string) - Telegram ID пользователя

**Тело запроса:** Пустое

**Ответ при успехе:**
```json
{
  "success": true,
  "reward": { "type": "currency", "amount": 150 },
  "message": "Bonus claimed successfully"
}
```

**Ответ при ошибке:**
```json
{
  "success": false,
  "error": "Cannot claim bonus today"
}
```

**Коды ответов:**
- `200` - Бонус получен успешно
- `400` - Нельзя получить бонус сегодня / Неверный telegram ID
- `404` - Пользователь не найден
- `405` - Неверный метод запроса
- `500` - Внутренняя ошибка сервера

## Конфигурация

Конфигурация бонусов находится в файле `lib/data/dailyBonusConfig.json`:

```json
{
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "regular": { "type": "currency", "amount": 100 },
          "premium": { "type": "currency", "amount": 150 }
        }
      ]
    }
  ]
}
```

### Типы наград

**Валютные награды:**
```json
{ "type": "currency", "amount": 100 }
```

**Бустеры:**
```json
{ "type": "booster", "name": "bomb", "quantity": 1 }
```

Доступные бустеры:
- `bomb` - Бомба
- `laser` - Лазер  
- `whirlwind` - Вихрь

## Логика работы

1. **Первый вход**: Пользователь начинает с недели 1, дня 1
2. **Ежедневный бонус**: После 00:00 можно получить новый бонус
3. **Пропуск дня**: Если игрок не получил бонус вчера, прогресс сбрасывается к началу
4. **Премиум статус**: Игроки с ролями `premium`, `admin`, `tester` получают улучшенные награды
5. **Цикл**: После 4-й недели система начинается сначала

## Установка

1. Применить миграцию базы данных:
```bash
npm run ts-node scripts/apply-daily-bonus-migration.ts
```

2. Убедиться, что бустеры инициализированы в базе данных

## Примеры использования

### Получение состояния бонусов
```javascript
const response = await fetch('/api/users/123456789/bonus');
const bonusState = await response.json();
console.log(bonusState.canClaimToday); // true/false
```

### Получение бонуса
```javascript
const response = await fetch('/api/users/123456789/bonus', {
  method: 'POST'
});
const result = await response.json();
if (result.success) {
  console.log('Получен бонус:', result.reward);
}
``` 