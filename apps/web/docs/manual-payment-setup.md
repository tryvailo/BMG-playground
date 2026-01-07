# Система ручной оплаты для украинского рынка

## Обзор

Реализована минимально сложная система для обработки ручных платежей для украинского рынка:
- **UA клиенты**: Сразу получают доступ в админку с ограниченным функционалом. После оплаты (которую отмечают продавцы) получают полный доступ.
- **EU клиенты**: Используют Stripe для автоматической оплаты.

**Важно**: Счета выставляют продавцы вручную через админ-панель. Клиенты не запрашивают счета самостоятельно.

## Компоненты системы

### 1. База данных

**Таблица `subscriptions`** (`supabase/migrations/20250130_add_subscriptions_table.sql`):
- Хранит информацию о подписках
- Поддерживает два метода оплаты: `stripe` (EU) и `manual` (UA)
- Статусы: `pending`, `paid`, `failed`, `canceled`
- Поля для ручной оплаты: `invoice_number`, `metadata` (компания, контакты)

### 2. API Endpoints

**POST `/api/subscriptions/mark-paid`**:
- Админ-эндпоинт для отметки оплаты
- Принимает: `subscriptionId`
- Обновляет статус на `paid` и устанавливает `expires_at`
- После отметки оплаты клиент получает полный доступ ко всем функциям

### 3. Checkout страница

**`/checkout/[planId]`**:
- Автоматически определяет регион по локали (`ukr` = UA, остальное = EU)
- Для UA: автоматически создает подписку со статусом `pending` и редиректит в админку
- Для EU: показывает форму Stripe (когда будет готова)

### 4. Админ-панель

**`/admin/users`**:
- Список всех подписок
- Фильтрация по статусу и поиск
- Кнопка "Mark as Paid" для ручных платежей
- Отображение информации о пользователе, плане, счете
- **Продавцы создают подписки вручную** для клиентов через эту панель

### 5. Система ограничения доступа

**Компонент `SubscriptionGate`** (`components/subscription-gate.tsx`):
- Ограничивает доступ к функциям на основе статуса подписки
- `requireFullAccess={true}`: требует оплаченную подписку
- `requireFullAccess={false}`: разрешает доступ для pending и paid подписок
- Показывает сообщения о ограниченном доступе

**Утилиты** (`lib/utils/subscription.ts`):
- `hasActiveSubscription()`: проверка активной (оплаченной) подписки
- `hasPendingSubscription()`: проверка pending подписки
- `getSubscriptionAccessLevel()`: получение уровня доступа ('full' | 'limited' | 'none')

**Компонент `SubscriptionStatus`**:
- Отображается на странице настроек (`/home/settings`)
- Показывает текущий статус подписки
- Для pending подписок показывает сообщение об ограниченном доступе

## Как использовать

### Для пользователей (UA):

1. Перейти на `/checkout/[planId]` (например, `/ukr/checkout/starter`)
2. Автоматически создается подписка со статусом `pending`
3. Пользователь редиректится в админку (`/home`)
4. **Ограниченный доступ**: пользователь видит интерфейс, но некоторые функции заблокированы
5. Продавец выставляет счет и отправляет клиенту
6. После оплаты продавец отмечает "Mark as Paid" в админ-панели
7. **Полный доступ**: пользователь получает доступ ко всем функциям

### Для продавцов/админов:

1. Перейти на `/admin/users`
2. **Создать подписку** для клиента (если еще не создана через checkout):
   - Найти пользователя
   - Создать подписку с нужным планом
3. Выставить счет клиенту (вне системы)
4. После получения оплаты:
   - Найти подписку клиента
   - Нажать "Mark as Paid"
5. Клиент автоматически получает полный доступ

### Использование компонента ограничения доступа:

```tsx
import { SubscriptionGate } from '~/components/subscription-gate';

// Ограничить доступ - только для оплаченных подписок
<SubscriptionGate requireFullAccess={true}>
  <PremiumFeature />
</SubscriptionGate>

// Разрешить доступ для pending и paid подписок
<SubscriptionGate requireFullAccess={false}>
  <BasicFeature />
</SubscriptionGate>
```

## Применение миграции

```bash
cd apps/web

# Локально
pnpm supabase:reset

# Или применить только новую миграцию через Supabase Dashboard:
# 1. Открыть SQL Editor
# 2. Скопировать содержимое supabase/migrations/20250130_add_subscriptions_table.sql
# 3. Выполнить
```

## Регенерация типов (после применения миграции)

```bash
cd apps/web
pnpm supabase:typegen
```

## Безопасность

⚠️ **Важно**: В продакшене необходимо:
1. Добавить проверку роли админа в `/api/subscriptions/mark-paid`
2. Ограничить доступ к `/admin/users` только для админов
3. Настроить RLS политики для таблицы `subscriptions` (базовая политика уже есть)

## Расширение для Stripe (EU)

Когда будет готова интеграция со Stripe:
1. Обновить `handleSubmit` в `checkout/[planId]/page.tsx` для EU региона
2. Использовать `payment_method: 'stripe'` при создании подписки
3. Обновлять статус через Stripe webhooks

## Структура данных

```typescript
interface Subscription {
  id: string;
  account_id: string; // UUID пользователя
  plan_id: string;
  plan_name: string;
  price: number;
  currency: string;
  billing_interval: 'month' | 'year';
  payment_method: 'stripe' | 'manual';
  payment_status: 'pending' | 'paid' | 'failed' | 'canceled';
  invoice_number: string | null; // Для ручных платежей
  stripe_subscription_id: string | null; // Для Stripe
  metadata: {
    companyName?: string;
    contactEmail?: string;
    phone?: string;
    billingAddress?: string;
  };
  expires_at: string | null;
  paid_at: string | null;
  paid_by: string | null; // UUID админа
}
```

