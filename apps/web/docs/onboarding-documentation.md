# Онбординг — Документація

## Огляд

Онбординг — це процес реєстрації нових користувачів у системі. Він складається з 6 кроків, які збирають інформацію про клініку, показують аналіз позиціонування, та створюють обліковий запис з підпискою.

## Потік онбордингу

```
domain-geo → benchmark → topics → analysis → account → pricing
```

## Компоненти

| Крок | Компонент | Файл |
|------|-----------|------|
| 1 | StepDomainGeo | `components/onboarding/StepDomainGeo.tsx` |
| 2 | StepBenchmark | `components/onboarding/StepBenchmark.tsx` |
| 3 | StepTopics | `components/onboarding/StepTopics.tsx` |
| 4 | StepAnalysis | `components/onboarding/StepAnalysis.tsx` |
| 5 | StepAccount | `components/onboarding/StepAccount.tsx` |
| 6 | StepPricing | `components/onboarding/StepPricing.tsx` |

---

## Крок 1: Домен та геолокація (StepDomainGeo)

### Опис
Комбінований крок, де користувач вводить домен клініки та вибирає географічне розташування.

### Функціональність
- **Вибір країни** — за замовчуванням Україна (UA)
- **Вибір міста** — динамічний список міст залежно від країни
- **Введення домену** — URL сайту клініки

### Для України (UA)
- Автоматичний пошук клініки в базі даних (`ukraine-clinics.ts`)
- Пошук конкурентів у тому ж місті
- Пріоритет конкурентів: Великі → Середні → Малі клініки

### Збережені дані
```typescript
{
  domain: string;      // "friendlic.clinic"
  region: string;      // "UA"
  city: string;        // "Київ"
  language: string;    // "uk"
  clinicName: string;  // "Френдлік" (з бази або з домену)
  competitors: Array<{ name: string; url: string }>
}
```

### Ключові функції
- `findClinicByUrl(url)` — пошук клініки за URL
- `findCompetitors(city, excludeUrl)` — пошук до 4 конкурентів у місті
- `getCitiesByCountryCode(code)` — отримання списку міст

---

## Крок 2: Результати аналізу (StepBenchmark)

### Опис
Показує результати аналізу AI-видимості клініки порівняно з конкурентами.

### Метрики
| Метрика | Опис | Діапазон |
|---------|------|----------|
| Позиція | Місце серед конкурентів | 2 – кількість клінік |
| AI видимість | Поточний рівень видимості | 15-34% |
| Потенціал росту | Можливе покращення | 51-70% |

### Логіка розрахунку позиції
```typescript
function getClinicPosition(clinicName: string, competitorCount: number): number {
  const totalClinics = competitorCount + 1;
  // Позиція в нижній половині (показує можливість покращення)
  const minPosition = Math.ceil(totalClinics / 2);
  const maxPosition = totalClinics;
  // Детермінований результат на основі хешу імені
  return position; // min 2, max totalClinics
}
```

### Відображення конкурентів
- Показує до 4 конкурентів з їх оцінками
- Візуалізація через прогрес-бари

---

## Крок 3: Вибір тем (StepTopics)

### Опис
Користувач вибирає теми контенту, які хоче відстежувати та покращувати.

### Функціональність
- Локалізовані теми (українська/англійська)
- Множинний вибір
- Візуальні картки з іконками

### Збережені дані
```typescript
{
  topics: string[]  // ["dental", "cosmetic", "surgery"]
}
```

---

## Крок 4: Процес аналізу (StepAnalysis)

### Опис
Анімований екран, що показує процес аналізу клініки.

### Функціональність
- Прогрес-бар
- Анімовані повідомлення про етапи аналізу
- Автоматичний перехід після завершення

---

## Крок 5: Створення акаунту (StepAccount)

### Опис
Форма реєстрації нового користувача.

### Поля
- Email (обов'язкове)
- Пароль (обов'язкове, мін. 6 символів)

### Процес
1. Валідація даних
2. Створення користувача через Supabase Auth
3. Збереження `userId` для наступного кроку
4. Автоматичний перехід до вибору плану

### Обробка помилок
- Користувач вже існує → спроба входу
- Невалідний email/пароль → повідомлення про помилку

---

## Крок 6: Вибір плану підписки (StepPricing)

### Опис
Користувач вибирає тарифний план та період оплати.

### Плани

| План | Ціна/місяць | Ціна/рік | Опис |
|------|-------------|----------|------|
| Starter | $99 | $990 | Базовий план |
| Growth | $399 | $3,990 | Розширений план |
| Enterprise | $499 | $4,990 | Повний функціонал |

### Метод оплати
- **Україна (UA)** — ручна оплата (manual), статус `pending`
- **Інші країни** — Stripe (у розробці)

### Процес після вибору плану
1. Виклик API `/api/projects/create-from-onboarding`
2. Створення проекту з даними онбордингу
3. Створення підписки зі статусом `pending`
4. Редірект на `/home`

---

## API Endpoints

### POST /api/projects/create-from-onboarding

Створює проект та підписку на основі даних онбордингу.

**Request Body:**
```json
{
  "userId": "uuid",
  "domain": "clinic.com",
  "clinicName": "My Clinic",
  "region": "UA",
  "city": "Київ",
  "language": "uk",
  "planId": "starter",
  "interval": "month"
}
```

**Response:**
```json
{
  "success": true,
  "project": { ... },
  "message": "Project created successfully"
}
```

### Що створюється:
1. **Account** — якщо не існує
2. **Project** — з доменом, назвою, налаштуваннями
3. **Weekly Stats** — початкові дані для графіків (12 місяців)
4. **Subscription** — підписка з обраним планом

---

## База даних

### Таблиця: subscriptions

```sql
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY,
  account_id uuid REFERENCES accounts(id),
  plan_id varchar(100),        -- 'starter', 'growth', 'enterprise'
  plan_name varchar(255),      -- 'Starter', 'Growth', 'Enterprise'
  price decimal(10,2),         -- 99.00, 399.00, 499.00
  currency varchar(3),         -- 'USD'
  billing_interval varchar(20), -- 'month' or 'year'
  payment_method varchar(20),  -- 'stripe' or 'manual'
  payment_status varchar(20),  -- 'pending', 'paid', 'failed', 'canceled'
  paid_at timestamp,
  expires_at timestamp,
  created_at timestamp,
  updated_at timestamp
);
```

### Статуси підписки

| Статус | Опис | Доступ |
|--------|------|--------|
| `pending` | Очікує оплати | Обмежений |
| `paid` | Оплачено | Повний |
| `failed` | Помилка оплати | Немає |
| `canceled` | Скасовано | Немає |

---

## Адмін-панель

### URL: `/admin/users`

### Функціональність
- Список всіх користувачів
- Список підписок
- **Mark as Paid** — підтвердження оплати

### Процес підтвердження оплати
1. Адмін натискає "Mark as Paid"
2. API `/api/subscriptions/mark-paid` оновлює:
   - `payment_status` → `'paid'`
   - `paid_at` → поточна дата
   - `expires_at` → +1 місяць/рік
3. Користувач отримує повний доступ

---

## Контроль доступу

### Компонент: SubscriptionGate

```tsx
<SubscriptionGate requireFullAccess={true}>
  <ProtectedContent />
</SubscriptionGate>
```

### Рівні доступу

| Рівень | Статус підписки | Доступ |
|--------|-----------------|--------|
| `full` | `paid` + не прострочено | Повний |
| `limited` | `pending` | Обмежений |
| `none` | Немає підписки | Тільки онбординг |

---

## Файлова структура

```
apps/web/
├── app/[locale]/onboarding/
│   └── page.tsx              # Головна сторінка онбордингу
├── components/onboarding/
│   ├── OnboardingLayout.tsx  # Layout з візуальною панеллю
│   ├── StepDomainGeo.tsx     # Крок 1: Домен + Геолокація
│   ├── StepBenchmark.tsx     # Крок 2: Результати аналізу
│   ├── StepTopics.tsx        # Крок 3: Вибір тем
│   ├── StepAnalysis.tsx      # Крок 4: Процес аналізу
│   ├── StepAccount.tsx       # Крок 5: Створення акаунту
│   └── StepPricing.tsx       # Крок 6: Вибір плану
├── lib/data/
│   ├── ukraine-clinics.ts    # База клінік України
│   └── cities.ts             # База міст
└── app/api/projects/
    └── create-from-onboarding/
        └── route.ts          # API створення проекту
```

---

## Дизайн-токени (Horizon UI)

```typescript
const HORIZON = {
  primary: '#4318FF',      // Основний колір (індіго)
  primaryLight: '#4318FF15', // Світлий акцент
  secondary: '#A3AED0',    // Вторинний (сірий)
  success: '#01B574',      // Зелений (успіх)
  warning: '#FFB547',      // Жовтий (увага)
  background: '#F4F7FE',   // Фон
  textPrimary: '#1B2559',  // Основний текст
  textSecondary: '#A3AED0', // Вторинний текст
};
```

---

## Поширені проблеми та рішення

### Проблема: Підписка не створюється
**Причина:** Проект вже існує, код повертався до створення підписки.
**Рішення:** Функція `createSubscriptionIfNeeded()` викликається для всіх сценаріїв.

### Проблема: Mark as Paid не працює
**Причина:** RLS політики блокують оновлення чужих підписок.
**Рішення:** Використання `getSupabaseServerAdminClient()` в API.

### Проблема: Некоректна позиція (#19 з 4)
**Причина:** Позиція генерувалась без урахування кількості конкурентів.
**Рішення:** `getClinicPosition()` тепер враховує `competitorCount`.

---

## Оновлення

| Дата | Зміни |
|------|-------|
| 2025-01 | Створено документацію |
| 2025-01 | Виправлено створення підписки |
| 2025-01 | Виправлено Mark as Paid |
| 2025-01 | Україна за замовчуванням |
| 2026-01 | Додано noindex сторінок аналіз (3.21) |
| 2026-01 | Інтегровано аналіз дублікатів контенту (3.23) |
