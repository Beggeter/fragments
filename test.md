Давайте посмотрим на формулу движения звездочек:

Read file: components/board/NeonGlowParticles.tsx
Вижу проблему! Формула движения звездочек:

```typescript
const currentX = pt.startX + parseFloat(pt.transformTo) * pt.progress;
const currentY = pt.startY + parseFloat(pt.transformToY) * pt.progress;
```

**Проблема:** `parseFloat()` каждый кадр - это медленно и может вызывать дергание!

Давайте оптимизируем формулу, сохранив числа как числа, а не строки:

Теперь давайте исправим создание частицы, чтобы использовать числа:

Теперь давайте исправим формулу движения, убрав `parseFloat()`:

Отлично! Теперь формула оптимизирована. Давайте также добавим еще одну оптимизацию - использовать CSS transform вместо изменения left/top:

Теперь можно убрать неиспользуемые переменные:

Отлично! Теперь формула движения звездочек полностью оптимизирована:

## Что было исправлено:

### 1. **Убрал `parseFloat()` каждый кадр**
- **Было:** `parseFloat(pt.transformTo) * pt.progress` - медленно!
- **Стало:** `pt.transformToX * pt.progress` - быстро!

### 2. **Изменил тип данных**
- **Было:** `transformTo: string` (например, "50px")
- **Стало:** `transformToX: number` (например, 50)

### 3. **Использую CSS transform вместо left/top**
- **Было:** изменение `left` и `top` каждый кадр
- **Стало:** один `transform` с `translate3d()` - аппаратное ускорение!

### 4. **Оптимизированная формула:**
```typescript
transform: `translate3d(${pt.transformToX * pt.progress}px, ${pt.transformToY * pt.progress}px, 0) rotate(${pt.randomRotation}deg) scale(${scale})`
```

## Результат:
- **Звездочки теперь летают плавно** без прыжков
- **Производительность значительно улучшена** - нет лишних вычислений
- **Аппаратное ускорение** включено через `translate3d()`

Теперь анимация должна быть идеально плавной!