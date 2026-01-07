# Core Tables — Ядро системи

> **Модуль:** Core (Makerkit + Extensions)  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## 1.1 accounts

Базова таблиця користувачів з Makerkit SaaS Starter.

### Структура

```sql
CREATE TABLE public.accounts (
    id          uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name        varchar(255) NOT NULL,
    email       varchar(320) UNIQUE,
    picture_url varchar(1000),
    public_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at  timestamp with time zone,
    updated_at  timestamp with time zone,
    created_by  uuid REFERENCES auth.users,
    updated_by  uuid REFERENCES auth.users
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ = `auth.users.id` |
| `name` | `varchar(255)` | ❌ | — | Ім'я користувача |
| `email` | `varchar(320)` | ✅ | — | Email (унікальний) |
| `picture_url` | `varchar(1000)` | ✅ | — | URL аватара |
| `public_data` | `jsonb` | ❌ | `'{}'` | Публічні дані акаунту |
| `created_at` | `timestamptz` | ✅ | — | Дата створення |
| `updated_at` | `timestamptz` | ✅ | — | Дата оновлення |
| `created_by` | `uuid` | ✅ | — | Хто створив |
| `updated_by` | `uuid` | ✅ | — | Хто оновив |

### Індекси

- Primary key on `id`
- Unique index on `email`

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `accounts_read` | SELECT | `auth.uid() = id` |
| `accounts_update` | UPDATE | `auth.uid() = id` |

### Тригери

| Тригер | Подія | Функція |
|--------|-------|---------|
| `protect_account_fields` | BEFORE UPDATE | Захист `id`, `email` від зміни |
| `on_auth_user_created` | AFTER INSERT on `auth.users` | Створення акаунту |
| `on_auth_user_updated` | AFTER UPDATE on `auth.users` | Синхронізація email |

### Зв'язки

```
accounts.id ◄─── projects.organization_id
accounts.id ◄─── subscriptions.account_id
```

---

## 1.2 projects

Проекти клінік для відстеження AI-видимості.

### Структура

```sql
CREATE TABLE public.projects (
    id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    domain          text NOT NULL,
    name            text NOT NULL,
    settings        jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at      timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at      timestamptz DEFAULT timezone('utc', now()) NOT NULL
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `organization_id` | `uuid` | ❌ | — | FK → `accounts.id` |
| `domain` | `text` | ❌ | — | Домен клініки (напр. `clinic.com`) |
| `name` | `text` | ❌ | — | Назва проекту |
| `settings` | `jsonb` | ❌ | `'{}'` | Налаштування проекту |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |
| `updated_at` | `timestamptz` | ❌ | `now()` | Дата оновлення |

### Структура `settings` (JSONB)

```typescript
interface ProjectSettings {
  targetCountries?: string[];    // ['UA', 'PL']
  targetLanguages?: string[];    // ['uk', 'en']
  [key: string]: unknown;
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `projects_organization_id_idx` | `organization_id` |
| `projects_domain_idx` | `domain` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `projects_select` | SELECT | `kit.user_has_organization_access(organization_id)` |
| `projects_insert` | INSERT | `kit.user_has_organization_access(organization_id)` |
| `projects_update` | UPDATE | `kit.user_has_organization_access(organization_id)` |
| `projects_delete` | DELETE | `kit.user_has_organization_access(organization_id)` |

### Тригери

| Тригер | Подія | Функція |
|--------|-------|---------|
| `update_projects_updated_at` | BEFORE UPDATE | Оновлення `updated_at` |

### Зв'язки

```
accounts.id ────► projects.organization_id

projects.id ◄─── services.project_id
projects.id ◄─── weekly_stats.project_id
projects.id ◄─── tech_audits.project_id
```

---

## 1.3 subscriptions

Підписки та платежі (підтримка Stripe + ручних платежів).

### Структура

```sql
CREATE TABLE public.subscriptions (
    id                      uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    account_id              uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    plan_id                 varchar(100) NOT NULL,
    plan_name               varchar(255) NOT NULL,
    price                   decimal(10, 2) NOT NULL,
    currency                varchar(3) DEFAULT 'USD',
    billing_interval        varchar(20) NOT NULL,  -- 'month' | 'year'
    payment_method          varchar(20) NOT NULL,  -- 'stripe' | 'manual'
    payment_status          varchar(20) NOT NULL DEFAULT 'pending',
    invoice_number          varchar(100),
    stripe_subscription_id  varchar(255),
    stripe_customer_id      varchar(255),
    paid_at                 timestamptz,
    paid_by                 uuid REFERENCES auth.users,
    expires_at              timestamptz,
    canceled_at             timestamptz,
    metadata                jsonb DEFAULT '{}'::jsonb,
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now()
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `account_id` | `uuid` | ❌ | — | FK → `accounts.id` |
| `plan_id` | `varchar(100)` | ❌ | — | ID тарифного плану |
| `plan_name` | `varchar(255)` | ❌ | — | Назва плану |
| `price` | `decimal(10,2)` | ❌ | — | Ціна |
| `currency` | `varchar(3)` | ✅ | `'USD'` | Валюта (USD, UAH, EUR) |
| `billing_interval` | `varchar(20)` | ❌ | — | `'month'` або `'year'` |
| `payment_method` | `varchar(20)` | ❌ | — | `'stripe'` або `'manual'` |
| `payment_status` | `varchar(20)` | ❌ | `'pending'` | Статус платежу |
| `invoice_number` | `varchar(100)` | ✅ | — | Номер рахунку (manual) |
| `stripe_subscription_id` | `varchar(255)` | ✅ | — | Stripe Subscription ID |
| `stripe_customer_id` | `varchar(255)` | ✅ | — | Stripe Customer ID |
| `paid_at` | `timestamptz` | ✅ | — | Дата оплати |
| `paid_by` | `uuid` | ✅ | — | Адмін, що підтвердив оплату |
| `expires_at` | `timestamptz` | ✅ | — | Дата закінчення |
| `canceled_at` | `timestamptz` | ✅ | — | Дата скасування |
| `metadata` | `jsonb` | ✅ | `'{}'` | Додаткові дані |
| `created_at` | `timestamptz` | ✅ | `now()` | Дата створення |
| `updated_at` | `timestamptz` | ✅ | `now()` | Дата оновлення |

### Значення `payment_status`

| Значення | Опис |
|----------|------|
| `pending` | Очікує оплати |
| `paid` | Оплачено |
| `failed` | Помилка оплати |
| `canceled` | Скасовано |

### Структура `metadata` (JSONB)

```typescript
interface SubscriptionMetadata {
  companyName?: string;      // Для юросіб (UA)
  contactPerson?: string;    // Контактна особа
  phone?: string;            // Телефон
  edrpou?: string;           // ЄДРПОУ (UA)
  [key: string]: unknown;
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `subscriptions_account_id_idx` | `account_id` |
| `subscriptions_payment_status_idx` | `payment_status` |
| `subscriptions_payment_method_idx` | `payment_method` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `subscriptions_read_own` | SELECT | `account_id = auth.uid()` |

### Тригери

| Тригер | Подія | Функція |
|--------|-------|---------|
| `update_subscriptions_updated_at` | BEFORE UPDATE | Оновлення `updated_at` |

---

## 1.4 ukraine_cities

Довідник міст України для онбордингу.

### Структура

```sql
CREATE TABLE public.ukraine_cities (
    id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name         text NOT NULL,
    country_code text NOT NULL DEFAULT 'UA',
    created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE (name, country_code)
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `name` | `text` | ❌ | — | Назва міста |
| `country_code` | `text` | ❌ | `'UA'` | ISO код країни |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| Unique | `(name, country_code)` |
| `ukraine_cities_country_code_idx` | `country_code` |
| `ukraine_cities_name_idx` | `name` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `ukraine_cities_read` | SELECT | `true` (публічний read) |

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова документація core tables |
