# AI Visibility Tables — Аналітика видимості в AI

> **Модуль:** AI Visibility Analytics  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Огляд модуля

Ці таблиці зберігають дані для:
- **Tab 1: Звіт** — Головний дашборд з ClinicAI Score
- **Tab 2: AIV Score** — Аналіз видимості послуг в AI
- **Tab 7: Конкуренти** — Scatter plot конкурентів

---

## 2.1 services

Медичні послуги/ключові слова для відстеження в AI-відповідях.

### Структура

```sql
CREATE TABLE public.services (
    id               uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    project_id       uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name             text NOT NULL,
    search_query     text NOT NULL,
    path             text,
    location_city    text,
    location_country text,
    created_at       timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at       timestamptz DEFAULT timezone('utc', now()) NOT NULL
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `project_id` | `uuid` | ❌ | — | FK → `projects.id` |
| `name` | `text` | ❌ | — | Назва послуги (напр. "МРТ") |
| `search_query` | `text` | ❌ | — | Запит для AI (напр. "Де зробити МРТ в Києві?") |
| `path` | `text` | ✅ | — | URL сторінки послуги на сайті |
| `location_city` | `text` | ✅ | — | Місто (напр. "Київ") |
| `location_country` | `text` | ✅ | — | Країна (напр. "UA") |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |
| `updated_at` | `timestamptz` | ❌ | `now()` | Дата оновлення |

### Приклади даних

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "project_id": "...",
  "name": "УЗД серця",
  "search_query": "Де зробити УЗД серця в Києві найкраща клініка?",
  "path": "/services/usd-sercia",
  "location_city": "Київ",
  "location_country": "UA"
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `services_project_id_idx` | `project_id` |
| `services_search_query_idx` | `search_query` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `services_select` | SELECT | Через `projects.organization_id` |
| `services_insert` | INSERT | Через `projects.organization_id` |
| `services_update` | UPDATE | Через `projects.organization_id` |
| `services_delete` | DELETE | Через `projects.organization_id` |

### Тригери

| Тригер | Подія | Функція |
|--------|-------|---------|
| `update_services_updated_at` | BEFORE UPDATE | Оновлення `updated_at` |

### Використання у вкладках

**Tab 2: AIV Score (Аналіз послуг)**
- Таблиця послуг з видимістю
- Dropdown для вибору послуги

---

## 2.2 scans

Результати AI-сканувань для кожної послуги.

### Структура

```sql
CREATE TYPE ai_engine_type AS ENUM ('openai', 'perplexity', 'claude');

CREATE TABLE public.scans (
    id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    service_id   uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    ai_engine    ai_engine_type NOT NULL,
    visible      boolean NOT NULL DEFAULT false,
    position     integer,
    raw_response text,
    analyzed_at  timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `service_id` | `uuid` | ❌ | — | FK → `services.id` |
| `ai_engine` | `ai_engine_type` | ❌ | — | AI-движок (`openai`, `perplexity`, `claude`) |
| `visible` | `boolean` | ❌ | `false` | Чи видима послуга в AI-відповіді |
| `position` | `integer` | ✅ | — | Позиція в списку (1, 2, 3...) |
| `raw_response` | `text` | ✅ | — | Сирий текст AI-відповіді |
| `analyzed_at` | `timestamptz` | ❌ | `now()` | Дата аналізу |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |

### Значення `ai_engine`

| Значення | Опис |
|----------|------|
| `openai` | ChatGPT (GPT-4) |
| `perplexity` | Perplexity AI |
| `claude` | Anthropic Claude |

### Приклади даних

```json
{
  "id": "...",
  "service_id": "...",
  "ai_engine": "openai",
  "visible": true,
  "position": 2,
  "raw_response": "1. Клініка Борис\n2. Добробут\n3. Медіком...",
  "analyzed_at": "2025-01-03T10:00:00Z"
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `scans_service_id_idx` | `service_id` |
| `scans_ai_engine_idx` | `ai_engine` |
| `scans_analyzed_at_idx` | `analyzed_at` |
| `scans_visible_idx` | `visible` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `scans_select` | SELECT | Через `services → projects.organization_id` |
| `scans_insert` | INSERT | Через `services → projects.organization_id` |
| `scans_update` | UPDATE | Через `services → projects.organization_id` |
| `scans_delete` | DELETE | Через `services → projects.organization_id` |

### Використання у вкладках

**Tab 2: AIV Score**
- Розрахунок Visibility Rate: `(visible_scans / total_scans) * 100`
- Середня позиція: `AVG(position) WHERE visible = true`
- Витяг конкурентів з `raw_response`

**Tab 7: Конкуренти**
- Scatter plot з агрегацією по доменах з `raw_response`

---

## 2.3 weekly_stats

Тижнева агрегована статистика для трендових графіків.

### Структура

```sql
CREATE TABLE public.weekly_stats (
    id               uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    project_id       uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    week_start       date NOT NULL,
    clinic_ai_score  double precision,
    visability_score double precision,
    avg_position     double precision,
    tech_score       double precision,
    content_score    double precision,
    eeat_score       double precision,
    local_score      double precision,
    created_at       timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at       timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE (project_id, week_start)
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `project_id` | `uuid` | ❌ | — | FK → `projects.id` |
| `week_start` | `date` | ❌ | — | Початок тижня (понеділок) |
| `clinic_ai_score` | `double precision` | ✅ | — | ClinicAI Score (0-100) |
| `visability_score` | `double precision` | ✅ | — | Visibility Score (0-100) |
| `avg_position` | `double precision` | ✅ | — | Середня позиція |
| `tech_score` | `double precision` | ✅ | — | Tech Score (0-100) |
| `content_score` | `double precision` | ✅ | — | Content Score (0-100) |
| `eeat_score` | `double precision` | ✅ | — | E-E-A-T Score (0-100) |
| `local_score` | `double precision` | ✅ | — | Local Score (0-100) |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |
| `updated_at` | `timestamptz` | ❌ | `now()` | Дата оновлення |

### Формула ClinicAI Score (автоматичний тригер)

```
clinic_ai_score = 0.25 × visability_score 
                + 0.20 × tech_score 
                + 0.20 × content_score 
                + 0.15 × eeat_score 
                + 0.10 × local_score
```

### Приклади даних

```json
{
  "id": "...",
  "project_id": "...",
  "week_start": "2025-01-06",
  "clinic_ai_score": 73.5,
  "visability_score": 85.0,
  "avg_position": 2.3,
  "tech_score": 78.0,
  "content_score": 65.0,
  "eeat_score": 70.0,
  "local_score": 82.0
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| Unique | `(project_id, week_start)` |
| `weekly_stats_project_id_idx` | `project_id` |
| `weekly_stats_week_start_idx` | `week_start` |
| `weekly_stats_project_week_idx` | `(project_id, week_start)` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `weekly_stats_select` | SELECT | Через `projects.organization_id` |
| `weekly_stats_insert` | INSERT | Через `projects.organization_id` |
| `weekly_stats_update` | UPDATE | Через `projects.organization_id` |
| `weekly_stats_delete` | DELETE | Через `projects.organization_id` |

### Тригери

| Тригер | Подія | Функція |
|--------|-------|---------|
| `update_weekly_stats_updated_at` | BEFORE UPDATE | Оновлення `updated_at` |
| `auto_calculate_clinic_ai_score` | BEFORE INSERT/UPDATE | Автоматичний розрахунок `clinic_ai_score` |

### Використання у вкладках

**Tab 1: Звіт (Головний дашборд)**

| KPI Card | Поле | Формат |
|----------|------|--------|
| ClinicAI Score | `clinic_ai_score` | 0-100 |
| Видимість послуг | `visability_score` | % |
| Середня позиція | `avg_position` | 1.0 - 10.0 |
| Tech Optimization | `tech_score` | 0-100 |
| Content Optimization | `content_score` | 0-100 |
| E-E-A-T Signal | `eeat_score` | 0-100 |
| Local Signal | `local_score` | 0-100 |

**Line Chart (Динаміка ClinicAI Score)**
- Query: `SELECT week_start, clinic_ai_score FROM weekly_stats WHERE project_id = ? ORDER BY week_start`

---

## 2.4 dashboard_metrics_latest (VIEW)

Останні метрики для кожного проекту.

### Структура

```sql
CREATE VIEW public.dashboard_metrics_latest AS
SELECT DISTINCT ON (project_id)
    project_id,
    week_start,
    clinic_ai_score,
    visability_score,
    avg_position,
    tech_score,
    content_score,
    eeat_score,
    local_score,
    created_at,
    updated_at
FROM public.weekly_stats
WHERE clinic_ai_score IS NOT NULL
ORDER BY project_id, week_start DESC;
```

### Використання

```typescript
// Отримати останні метрики для проекту
const { data } = await supabase
  .from('dashboard_metrics_latest')
  .select('*')
  .eq('project_id', projectId)
  .single();
```

---

## Зв'язки між таблицями

```
projects.id ─────────────┬─► services.project_id
                         └─► weekly_stats.project_id

services.id ─────────────┬─► scans.service_id
```

---

## Агрегаційні запити

### Visibility Rate

```sql
SELECT 
    COUNT(*) FILTER (WHERE visible = true) * 100.0 / COUNT(*) as visibility_rate
FROM scans s
JOIN services sv ON s.service_id = sv.id
WHERE sv.project_id = :project_id;
```

### Average Position

```sql
SELECT AVG(position) as avg_position
FROM scans s
JOIN services sv ON s.service_id = sv.id
WHERE sv.project_id = :project_id
  AND s.visible = true
  AND s.position IS NOT NULL;
```

### Competitor Aggregation

```sql
-- Витяг доменів з raw_response та агрегація
-- Реалізовано в TypeScript: aggregateCompetitorStats()
```

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова документація AI Visibility tables |
