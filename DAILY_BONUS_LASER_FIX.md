# Исправление проблемы с бустером "whirlwind" в Daily Bonus

## Проблема

При нажатии на кнопку "Daily Bonus" на проде возникала клиентская ошибка из-за несоответствия между конфигурацией daily bonus и доступными бустерами в базе данных.

## Диагностика

1. **Конфигурация daily bonus** содержала бустер "laser" в `lib/data/dailyBonusConfig.json`
2. **База данных** содержит только бустеры "undo", "bomb", "whirlwind"
3. **Компонент DailyBonusModal** не мог корректно отобразить иконку для несуществующего бустера
4. **Сервис DailyBonusService** не обрабатывал ошибку при отсутствии бустера в БД

## Исправления

### 1. Обновление конфигурации daily bonus

**Файл:** `lib/data/dailyBonusConfig.json`

Заменил все упоминания бустера "laser" на "whirlwind":

```json
{
  "regular": { "type": "booster", "name": "whirlwind", "quantity": 1 },
  "premium": { "type": "booster", "name": "whirlwind", "quantity": 2 }
}
```

### 2. Упрощение обработки иконок

**Файл:** `components/DailyBonusModal.tsx`

Убрал обработку несуществующего бустера "laser" из функции `renderImage`:

```typescript
const boosterSrc = reward.boosterType === "undo" 
  ? "/boosters/back.png" 
  : reward.boosterType === "bomb"
  ? "/boosters/bomb.svg"
  : reward.boosterType === "whirlwind"
  ? "/boosters/whirlwind.svg"
  : "/boosters/bomb.svg"; // fallback
```

### 3. Обновление типов

**Файл:** `types/components.ts`

Оставил только существующие бустеры в типе `Booster`:

```typescript
export type Booster = 'undo' | 'bomb' | 'whirlwind';
```

### 4. Улучшение обработки ошибок

**Файл:** `lib/db/services/dailyBonusService.ts`

Добавлена обработка случая, когда бустер не найден в базе данных:

```typescript
if (boosterType) {
  await BoosterService.addUserBooster(userId, boosterType.id, reward.quantity);
} else {
  console.error(`Booster type '${reward.name}' not found in database`);
  // Можно либо выбросить ошибку, либо продолжить без выдачи бустера
}
```

## Тестирование исправлений

```bash
node scripts/test-daily-bonus-laser-fix.js
```

## Проверка на проде

1. **Перезапустите сервер** после деплоя

2. **Проверьте в браузере:**
   - Откройте консоль (F12)
   - Нажмите на кнопку "Daily Bonus"
   - Убедитесь, что модальное окно открывается без ошибок
   - Проверьте, что иконки whirlwind отображаются корректно

## Файлы, которые были изменены

- `lib/data/dailyBonusConfig.json` - заменен laser на whirlwind
- `types/components.ts` - убран laser из типа Booster
- `components/DailyBonusModal.tsx` - убрана обработка иконки laser
- `lib/db/services/dailyBonusService.ts` - улучшена обработка ошибок
- `scripts/test-daily-bonus-laser-fix.js` - обновлен тестовый скрипт

## Альтернативные решения

Если проблема сохраняется, можно также:

1. **Добавить бустер "laser" в базу данных** (если планируется его использование)
2. **Добавить более строгую валидацию** в API
3. **Использовать React Error Boundary** для обработки ошибок
4. **Добавить fallback иконки** для неизвестных бустеров

## Мониторинг

После деплоя следите за:
- Ошибками в консоли браузера
- Логами сервера при получении daily bonus
- Корректностью отображения иконок в модальном окне
- Успешностью получения бустеров whirlwind 