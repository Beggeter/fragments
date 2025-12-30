# BoosterPurchaseModal

Модальное окно для покупки бустеров с выбором количества и учетом баланса игрока.

## Особенности

- **Автоматический расчет максимального количества**: Модальное окно автоматически рассчитывает максимальное количество бустеров, которое может купить игрок с учетом его баланса
- **Интуитивный интерфейс**: Кнопки +/- и слайдер для удобного выбора количества
- **Визуальная обратная связь**: Отображение общей стоимости и сравнение с балансом
- **Валидация**: Кнопка покупки блокируется при недостатке средств
- **Консистентный дизайн**: Использует те же стили, что и ShopScreen

## Использование

```tsx
import BoosterPurchaseModal from "./BoosterPurchaseModal";

const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedBooster, setSelectedBooster] = useState(null);
const playerBalance = 500; // Баланс игрока

const handlePurchase = (quantity: number) => {
  // Логика покупки бустера
  
};

<BoosterPurchaseModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onConfirm={handlePurchase}
  booster={selectedBooster}
  playerBalance={playerBalance}
/>
```

## Пропсы

| Проп | Тип | Описание |
|------|-----|----------|
| `isOpen` | `boolean` | Открыто ли модальное окно |
| `onClose` | `() => void` | Функция закрытия модального окна |
| `onConfirm` | `(quantity: number) => void` | Функция подтверждения покупки с количеством |
| `booster` | `Booster` | Объект бустера для покупки |
| `playerBalance` | `number` | Баланс игрока в кристаллах |

## Структура объекта бустера

```tsx
interface Booster {
  id: string;
  name: string;
  icon: string;
  price: number;
  description: string;
}
```

## Пример интеграции в ShopScreen

Модальное окно уже интегрировано в ShopScreen. При клике на карточку бустера открывается модальное окно с возможностью выбора количества.

## Стили

Модальное окно использует:
- Backdrop blur эффекты
- Градиентные кнопки
- Анимации hover
- Консистентные шрифты (font-mulish, font-figtree)
- Цветовую схему ShopScreen 