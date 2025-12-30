# Database Setup and Usage

## Структура базы данных

База данных разделена на следующие основные таблицы:

### 1. Пользователи (`users`)
- **telegramId**: Уникальный ID пользователя в Telegram
- **username**: Имя пользователя в Telegram
- **firstName/lastName**: Имя и фамилия
- **avatarUrl**: URL аватара (берется из Telegram)
- **role**: Роль пользователя (admin/user/premium)
- **record**: Лучший рекорд пользователя
- **currency**: Количество валюты

### 2. Игры (`user_games`)
- **userId**: Ссылка на пользователя
- **boardState**: JSON с состоянием игрового поля
- **currentPieces**: JSON с текущими доступными фигурами
- **score**: Текущий счет игры
- **level**: Текущий уровень

### 3. Бустеры (`booster_types` и `user_boosters`)
- **booster_types**: Типы доступных бустеров
- **user_boosters**: Бустеры конкретных пользователей

### 4. Транзакции (`currency_transactions`)
- История всех операций с валютой
- Поддержка различных типов транзакций

### 5. Рекорды (`record_history`)
- История рекордов пользователей
- Детальная информация о каждой игре

## Настройка

### 1. Установка зависимостей
```bash
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit tsx @types/pg
```

### 2. Настройка переменных окружения
Создайте файл `.env` в корне проекта:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
NODE_ENV=development
```

### 3. Применение миграций
```bash
# Генерация миграций
npx drizzle-kit generate

# Применение миграций
npx drizzle-kit push

# Или через миграции
npx drizzle-kit migrate
```

### 4. Инициализация начальных данных
```bash
npx tsx scripts/init-db.ts
```

## Использование сервисов

### UserService
```typescript
import { UserService } from '@/lib/db/services';

// Создание пользователя
const user = await UserService.createUser({
  telegramId: '123456789',
  username: 'john_doe',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user'
});

// Получение пользователя
const user = await UserService.getUserByTelegramId('123456789');
```

### GameService
```typescript
import { GameService } from '@/lib/db/services';

// Создание новой игры
const game = await GameService.createGame(userId, boardState, currentPieces);

// Обновление состояния игры
await GameService.updateGame(gameId, { score: 1000, level: 2 });
```

### BoosterService
```typescript
import { BoosterService } from '@/lib/db/services';

// Получение бустеров пользователя
const boosters = await BoosterService.getUserBoostersWithInfo(userId);

// Использование бустера
const success = await BoosterService.useBooster(userId, boosterTypeId);
```

### CurrencyService
```typescript
import { CurrencyService } from '@/lib/db/services';

// Добавление валюты
await CurrencyService.addCurrency(userId, 100, 'game_reward', 'Game completion');

// Покупка бустера
const canAfford = await CurrencyService.canAfford(userId, boosterPrice);
if (canAfford) {
  await CurrencyService.purchaseBooster(userId, boosterTypeId, price);
}
```

## Типы данных

Все типы TypeScript автоматически генерируются из схемы базы данных:

```typescript
import type { User, UserGame, BoosterType, CurrencyTransaction } from '@/lib/db/types';
```

## Индексы и производительность

База данных оптимизирована с помощью индексов:
- `telegram_id_idx` - для быстрого поиска по Telegram ID
- `user_id_idx` - для поиска игр пользователя
- `score_idx` - для сортировки по рекордам
- `created_at_idx` - для временных запросов

## Безопасность

- Все операции с валютой выполняются в транзакциях
- Проверка прав доступа на уровне сервисов
- Валидация данных перед сохранением
- Логирование всех критических операций 