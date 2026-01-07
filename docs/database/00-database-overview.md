# Структура бази даних — Огляд

> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Концепція Data Engine

База даних побудована за принципом **Data Engine** — повна ізоляція бізнес-логіки від інтерфейсу:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (UI)                            │
│   Dashboard Tabs, Charts, Tables, Forms                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ Server Actions / API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA ENGINE LAYER                           │
│   calculator.ts, scanner.ts, audit-service.ts                   │
│   Формули, агрегації, валідації                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ Supabase Client
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                       │
│   Tables, Views, Functions, RLS Policies                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Схема бази даних

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   accounts  │◄─────│  projects   │◄─────│  services   │
│  (Makerkit) │ 1:N  │             │ 1:N  │             │
└─────────────┘      └──────┬──────┘      └──────┬──────┘
                            │                    │
                     ┌──────┴──────┐      ┌──────┴──────┐
                     │ weekly_stats │      │    scans    │
                     │   (1:N)      │      │   (1:N)     │
                     └─────────────┘      └─────────────┘
                            │
                     ┌──────┴──────┐
                     │ tech_audits │
                     │   (1:N)     │
                     └──────┬──────┘
                            │
                     ┌──────┴──────┐
                     │ pages_audit │
                     │   (1:N)     │
                     └─────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PLAYGROUND TABLES                            │
│  (Публічний доступ, без multi-tenancy)                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ playground_     │  content_       │  eeat_audits                │
│ tech_audits     │  audits         │                             │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ local_indicators│  ukraine_       │  subscriptions              │
│ _audits         │  cities         │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

## Таблиці за модулями

### Ядро системи (Core)

| Таблиця | Призначення | Вкладка |
|---------|-------------|---------|
| `accounts` | Акаунти користувачів (Makerkit) | — |
| `projects` | Проекти клінік | — |
| `subscriptions` | Підписки та платежі | — |

### Аналітика AI Visibility

| Таблиця | Призначення | Вкладка |
|---------|-------------|---------|
| `services` | Послуги для відстеження | Tab 2: AIV Score |
| `scans` | Результати AI-сканувань | Tab 2: AIV Score |
| `weekly_stats` | Тижнева статистика | Tab 1: Звіт, всі KPI |

### Технічний аудит

| Таблиця | Призначення | Вкладка |
|---------|-------------|---------|
| `tech_audits` | Результати тех. аудиту | Tab 3: Технічний аудит |
| `pages_audit` | Аудит окремих сторінок | Tab 3: Технічний аудит |

### Playground (публічні)

| Таблиця | Призначення | Використання |
|---------|-------------|--------------|
| `playground_tech_audits` | Тех. аудит playground | /playground/tech |
| `content_audits` | Аудит контенту | /playground/content |
| `eeat_audits` | E-E-A-T аудит | /playground/eeat |
| `local_indicators_audits` | Локальні показники | /playground/local |

### Довідники

| Таблиця | Призначення | Використання |
|---------|-------------|--------------|
| `ukraine_cities` | Міста України | Onboarding |

---

## Views (Представлення)

| View | Опис |
|------|------|
| `dashboard_metrics_latest` | Останні метрики для кожного проекту |

---

## Функції бази даних

| Функція | Опис |
|---------|------|
| `kit.calculate_clinic_ai_score()` | Розрахунок ClinicAI Score |
| `kit.user_has_organization_access()` | Перевірка доступу до організації |
| `kit.update_updated_at_column()` | Автооновлення `updated_at` |
| `kit.auto_calculate_clinic_ai_score()` | Тригер автооновлення score |

---

## Enum Types

| Type | Values | Використання |
|------|--------|--------------|
| `ai_engine_type` | `openai`, `perplexity`, `claude` | `scans.ai_engine` |

---

## RLS (Row Level Security)

Усі таблиці мають RLS політики:

- **Multi-tenant таблиці** (`projects`, `services`, `scans`, `weekly_stats`, `tech_audits`, `pages_audit`):
  - Доступ через `kit.user_has_organization_access(organization_id)`
  
- **Playground таблиці** (`playground_tech_audits`, `content_audits`, `eeat_audits`, `local_indicators_audits`):
  - Публічний доступ (read/write для всіх)

- **Довідники** (`ukraine_cities`):
  - Публічний read-only доступ

---

## Зв'язки між таблицями

### Primary → Foreign Key

```
accounts.id ─────────────┬─► projects.organization_id
                         └─► subscriptions.account_id

projects.id ─────────────┬─► services.project_id
                         ├─► weekly_stats.project_id
                         └─► tech_audits.project_id

services.id ─────────────┬─► scans.service_id

tech_audits.id ──────────┬─► pages_audit.audit_id
```

---

## Індексування

### Стандартні індекси

Для всіх таблиць створені індекси на:
- Primary keys (автоматично)
- Foreign keys
- `created_at` (для сортування)
- Поля для пошуку (`url`, `domain`, `status`)

### Композитні індекси

| Таблиця | Індекс | Поля |
|---------|--------|------|
| `weekly_stats` | `weekly_stats_project_week_idx` | `(project_id, week_start)` |

---

## Файли документації

| Файл | Опис |
|------|------|
| [01-core-tables.md](./01-core-tables.md) | Ядро: accounts, projects, subscriptions |
| [02-ai-visibility-tables.md](./02-ai-visibility-tables.md) | AI Visibility: services, scans, weekly_stats |
| [03-tech-audit-tables.md](./03-tech-audit-tables.md) | Tech Audit: tech_audits, pages_audit |
| [04-playground-tables.md](./04-playground-tables.md) | Playground: всі публічні таблиці |
| [05-dashboard-tabs-mapping.md](./05-dashboard-tabs-mapping.md) | Маппінг вкладок до таблиць |

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова документація структури БД |
