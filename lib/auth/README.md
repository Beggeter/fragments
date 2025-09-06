# Новая система авторизации

## 🎯 Обзор

Новая система авторизации построена на основе современной архитектуры с использованием React Context, хуков и сервисов. Она поддерживает авторизацию через Telegram WebApp с использованием `useLaunchParams()`.

## 📁 Структура

```
lib/auth/
├── types.ts                    # Единые типы для авторизации
├── context.tsx                 # AuthContext с провайдером
├── hooks/
│   ├── useAuth.ts             # Главный хук для авторизации
│   ├── useUser.ts             # Хук для работы с пользователем
│   └── useTelegramAuth.ts     # Хук для Telegram авторизации
├── services/
│   ├── authService.ts         # Сервис для API вызовов
│   └── storageService.ts      # Сервис для работы с localStorage
└── README.md                  # Документация
```

## 🚀 Использование

### 1. Провайдер

Оберните ваше приложение в `AuthProvider`:

```tsx
import { AuthProvider } from "@/lib/auth/context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### 2. Основные хуки

#### `useAuth()` - Главный хук авторизации

```tsx
import { useAuth } from "@/lib/auth/context";

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error,
    login,
    logout,
    refreshUser,
    updateUser,
    clearError 
  } = useAuth();

  // Ваша логика
}
```

#### `useUser()` - Работа с пользователем

```tsx
import { useUser } from "@/lib/auth/hooks/useUser";

function UserProfile() {
  const { 
    user, 
    updateCurrency, 
    updateRecord, 
    refreshBalance 
  } = useUser();

  const handleUpdateBalance = async () => {
    const newBalance = await refreshBalance();
    console.log("New balance:", newBalance);
  };
}
```

#### `useTelegramAuth()` - Telegram авторизация

```tsx
import { useTelegramAuth } from "@/lib/auth/hooks/useTelegramAuth";

function TelegramAuth() {
  const { 
    isInTelegram,
    isTelegramAvailable,
    telegramUser,
    loginWithTelegram,
    logout 
  } = useTelegramAuth();

  if (!isInTelegram) {
    return <div>Запустите в Telegram</div>;
  }

  return (
    <button onClick={loginWithTelegram}>
      Войти через Telegram
    </button>
  );
}
```

## 🔧 API

### AuthContext

- `user: User | null` - Данные пользователя
- `isAuthenticated: boolean` - Статус авторизации
- `isLoading: boolean` - Состояние загрузки
- `error: string | null` - Ошибка авторизации
- `login(telegramData: TelegramAuthData): Promise<void>` - Авторизация
- `logout(): void` - Выход
- `refreshUser(): Promise<void>` - Обновление данных пользователя
- `updateUser(updates: Partial<User>): void` - Обновление пользователя
- `clearError(): void` - Очистка ошибки

### useUser

- `user: User | null` - Данные пользователя
- `updateCurrency(amount: number): void` - Обновление валюты
- `updateRecord(record: number, gameMode?: 'classic' | 'zen'): void` - Обновление рекорда
- `refreshBalance(): Promise<number>` - Обновление баланса с сервера

### useTelegramAuth

- `isInTelegram: boolean` - Запущено ли в Telegram
- `isTelegramAvailable: boolean` - Доступны ли данные Telegram
- `telegramUser: User | null` - Данные пользователя из Telegram
- `loginWithTelegram(): Promise<void>` - Авторизация через Telegram
- `logout(): void` - Выход

## 🔄 Автоматическая авторизация

Система автоматически:

1. **Проверяет существующую сессию** при загрузке
2. **Валидирует JWT токен** и обновляет данные пользователя
3. **Пытается авторизоваться через Telegram** если нет валидной сессии
4. **Использует `useLaunchParams()`** для получения данных Telegram
5. **Fallback на `initData`** если `useLaunchParams()` недоступен

## 🛡️ Безопасность

- **JWT токены** с проверкой срока действия
- **Валидация данных** перед отправкой на сервер
- **Очистка localStorage** при ошибках
- **Rate limiting** на сервере
- **Проверка подписи Telegram** на сервере

## 📝 Типы

```typescript
interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'tester' | 'premium';
  currency: number;
  createdAt: string;
  lastLoginAt: string;
  record: number;
  zenRecord: number;
  hasZenSubscription: boolean;
  zenSubscriptionEndDate?: string;
}

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash: string;
  initData?: string;
}
```

## 🔄 Миграция со старой системы

1. **Замените импорты**:
   ```tsx
   // Старое
   import { useAuthStore } from "@/store/authStore";
   import { useUser } from "@/hooks/useUser";
   
   // Новое
   import { useAuth } from "@/lib/auth/context";
   import { useUser } from "@/lib/auth/hooks/useUser";
   ```

2. **Обновите провайдеры**:
   ```tsx
   // Старое
   import { AuthProvider } from "@/components/AuthProvider";
   
   // Новое
   import { AuthProvider } from "@/lib/auth/context";
   ```

3. **Используйте новые хуки** - API совместим с существующим кодом

## 🐛 Отладка

Включите логи в консоли для отладки:

```tsx
// В компоненте
useEffect(() => {
  console.log("Auth state:", { isAuthenticated, user, isLoading, error });
}, [isAuthenticated, user, isLoading, error]);
```

Система автоматически логирует:
- Попытки авторизации
- Ошибки валидации
- Состояние Telegram данных
- Результаты API вызовов
