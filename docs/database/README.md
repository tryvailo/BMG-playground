# Database Documentation

Документація структури бази даних для AI Visibility Platform.

## Файли

| Файл | Опис |
|------|------|
| [00-database-overview.md](./00-database-overview.md) | Загальний огляд, схема, зв'язки |
| [01-core-tables.md](./01-core-tables.md) | Ядро: accounts, projects, subscriptions, ukraine_cities |
| [02-ai-visibility-tables.md](./02-ai-visibility-tables.md) | AI Visibility: services, scans, weekly_stats |
| [03-tech-audit-tables.md](./03-tech-audit-tables.md) | Tech Audit: tech_audits, pages_audit |
| [04-playground-tables.md](./04-playground-tables.md) | Playground: всі публічні таблиці |
| [05-dashboard-tabs-mapping.md](./05-dashboard-tabs-mapping.md) | Маппінг вкладок дашборду до таблиць |

## Швидкий перегляд таблиць

### Multi-tenant (RLS)

| Таблиця | Опис |
|---------|------|
| `accounts` | Акаунти користувачів |
| `projects` | Проекти клінік |
| `services` | Послуги для відстеження |
| `scans` | Результати AI-сканувань |
| `weekly_stats` | Тижнева статистика |
| `tech_audits` | Технічні аудити |
| `pages_audit` | Аудит сторінок |
| `subscriptions` | Підписки та платежі |

### Playground (Public)

| Таблиця | Опис |
|---------|------|
| `playground_tech_audits` | Технічний аудит (demo) |
| `content_audits` | Аудит контенту |
| `eeat_audits` | E-E-A-T аудит |
| `local_indicators_audits` | Локальні показники |

### Довідники

| Таблиця | Опис |
|---------|------|
| `ukraine_cities` | Міста України |

## Діаграма зв'язків

```
accounts ─────┬───► projects ─────┬───► services ───► scans
              │                   │
              │                   ├───► weekly_stats
              │                   │
              │                   └───► tech_audits ───► pages_audit
              │
              └───► subscriptions
```

## Формули

Головні формули винесені в [docs/formulas/](../formulas/):
- [01-clinic-ai-score.md](../formulas/01-clinic-ai-score.md) — ClinicAI Score
- [02-aiv-score.md](../formulas/02-aiv-score.md) — AIV Score per service

## Changelog

| Версія | Дата | Опис |
|--------|------|------|
| 1.0 | 2025-01-03 | Початкова документація |
