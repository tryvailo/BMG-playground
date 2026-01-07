# Dashboard Tabs Mapping — Відповідність вкладок до таблиць

> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Огляд Dashboard

Dashboard складається з 7 вкладок, кожна з яких використовує специфічні таблиці та поля.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD                                │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────────────────────────┤
│ 1   │ 2   │ 3   │ 4   │ 5   │ 6   │ 7   │                         │
│Звіт │AIV  │Tech │Content│EEAT│Local│Конку-│                        │
│     │Score│Audit│      │    │     │ренти │                        │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────────────────────────┘
```

---

## Tab 1: Звіт (Сумарний звіт)

### Призначення
Головний дашборд з ClinicAI Score та ключовими KPI.

### Таблиці

| Таблиця | Використання |
|---------|--------------|
| `weekly_stats` | Всі метрики |
| `dashboard_metrics_latest` (view) | Останні значення |
| `projects` | Назва та домен клініки |
| `scans` | Розрахунок visibility (якщо немає weekly_stats) |

### Поля

| UI Element | Таблиця | Поле | Формат |
|------------|---------|------|--------|
| **ClinicAI Score** | `weekly_stats` | `clinic_ai_score` | 0-100 |
| **Видимість послуг** | `weekly_stats` | `visability_score` | 0-100% |
| **Середня позиція** | `weekly_stats` | `avg_position` | 1.0-10.0 |
| **Tech Optimization** | `weekly_stats` | `tech_score` | 0-100 |
| **Content Optimization** | `weekly_stats` | `content_score` | 0-100 |
| **E-E-A-T Signal** | `weekly_stats` | `eeat_score` | 0-100 |
| **Local Signal** | `weekly_stats` | `local_score` | 0-100 |
| **Line Chart** | `weekly_stats` | `week_start`, `clinic_ai_score` | Історія |
| **Clinic Name** | `projects` | `name` | Text |

### Формула ClinicAI Score

```typescript
clinic_ai_score = 
  0.25 * visability_score +
  0.20 * tech_score +
  0.20 * content_score +
  0.15 * eeat_score +
  0.10 * local_score
```

### Query

```typescript
// Останні метрики
const { data } = await supabase
  .from('dashboard_metrics_latest')
  .select('*')
  .eq('project_id', projectId)
  .single();

// Історія для графіка
const { data: history } = await supabase
  .from('weekly_stats')
  .select('week_start, clinic_ai_score')
  .eq('project_id', projectId)
  .order('week_start', { ascending: true });
```

---

## Tab 2: AIV Score (Аналіз послуг)

### Призначення
Детальний аналіз видимості кожної послуги в AI-системах.

### Таблиці

| Таблиця | Використання |
|---------|--------------|
| `services` | Список послуг |
| `scans` | Результати сканувань |
| `weekly_stats` | `visability_score`, `avg_position` |

### Поля — KPI Cards

| UI Element | Джерело | Поле/Формула |
|------------|---------|--------------|
| **Visibility Rate** | `scans` | `(visible_count / total_count) * 100` |
| **Avg Position** | `scans` | `AVG(position) WHERE visible = true` |
| **Total Services** | `services` | `COUNT(*)` |

### Поля — Services Table

| Column | Таблиця | Поле |
|--------|---------|------|
| Послуга | `services` | `name` |
| Сторінка | `services` | `path` |
| Країна | `services` | `location_country` |
| Місто | `services` | `location_city` |
| Видимість | `scans` | `visible` |
| URL в AI | Витяг з `scans.raw_response` | — |
| Позиція | `scans` | `position` (формат: "2(5)") |
| AIV Score | Розрахунок | `calculateServiceAivScore()` |
| Конкуренти | Витяг з `scans.raw_response` | — |

### Формула AIV Score (per service)

```typescript
AIV Score = V * (
  (V * 100 * 0.30) +       // Visibility part
  (P_Score * 0.25) +        // Position part
  (C * 0.20)                // Competitor part
)

де:
V = visible ? 1 : 0
P_Score = position === 1 ? 100 : (1 - position/totalResults) * 100
C = competitorsAvgScore (0-100)
```

### Query

```typescript
// Отримати послуги з останніми сканами
const { data: services } = await supabase
  .from('services')
  .select(`
    *,
    scans (
      id,
      ai_engine,
      visible,
      position,
      raw_response,
      analyzed_at
    )
  `)
  .eq('project_id', projectId)
  .order('created_at', { ascending: true });
```

---

## Tab 3: Технічна оптимізація

### Призначення
Результати технічного аудиту сайту.

### Таблиці

| Таблиця | Використання |
|---------|--------------|
| `tech_audits` | Результати аудиту |
| `pages_audit` | Аудит окремих сторінок |
| `weekly_stats` | `tech_score` |

### Поля — Overview Cards

| UI Element | Таблиця | Поле |
|------------|---------|------|
| **Tech Score** | `weekly_stats` | `tech_score` |
| **llms.txt** | `tech_audits` | `llms_txt_present`, `llms_txt_score` |
| **robots.txt** | `tech_audits` | `robots_txt_present`, `robots_txt_valid` |
| **Sitemap** | `tech_audits` | `sitemap_present` |
| **HTTPS** | `tech_audits` | `https_enabled` |
| **Mobile** | `tech_audits` | `mobile_friendly` |

### Поля — Speed Section

| UI Element | Таблиця | Поле |
|------------|---------|------|
| Desktop Score | `tech_audits` | `desktop_speed_score` |
| Mobile Score | `tech_audits` | `mobile_speed_score` |
| LCP | `tech_audits` | `speed_metrics->lcp` |
| FCP | `tech_audits` | `speed_metrics->fcp` |
| CLS | `tech_audits` | `speed_metrics->cls` |
| TBT | `tech_audits` | `speed_metrics->tbt` |
| TTFB | `tech_audits` | `speed_metrics->ttfb` |

### Поля — Schema Checklist

| UI Element | Таблиця | Поле |
|------------|---------|------|
| MedicalOrganization | `tech_audits` | `schema_summary->hasMedicalOrganization` |
| LocalBusiness | `tech_audits` | `schema_summary->hasLocalBusiness` |
| Physician | `tech_audits` | `schema_summary->hasPhysician` |
| MedicalSpecialty | `tech_audits` | `schema_summary->hasMedicalSpecialty` |
| MedicalProcedure | `tech_audits` | `schema_summary->hasMedicalProcedure` |
| FAQPage | `tech_audits` | `schema_summary->hasFAQPage` |
| Review | `tech_audits` | `schema_summary->hasReview` |
| BreadcrumbList | `tech_audits` | `schema_summary->hasBreadcrumbList` |

### Поля — Pages Table

| Column | Таблиця | Поле |
|--------|---------|------|
| URL | `pages_audit` | `url` |
| Status | `pages_audit` | `status_code` |
| Title | `pages_audit` | `title`, `title_length` |
| Description | `pages_audit` | `description`, `description_length` |
| H1 | `pages_audit` | `h1` |
| Word Count | `pages_audit` | `word_count` |
| Issues | `pages_audit` | `issues` |

### Query

```typescript
// Останній аудит
const { data: audit } = await supabase
  .from('tech_audits')
  .select('*')
  .eq('project_id', projectId)
  .eq('status', 'completed')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

// Сторінки аудиту
const { data: pages } = await supabase
  .from('pages_audit')
  .select('*')
  .eq('audit_id', auditId);
```

---

## Tab 4: Оптимізація контенту

### Призначення
Аналіз якості та структури контенту.

### Таблиці

| Таблиця | Використання |
|---------|--------------|
| `weekly_stats` | `content_score` |
| `content_audits` (playground) | Детальні результати |

### Поля — KPI Cards

| UI Element | Джерело | Поле |
|------------|---------|------|
| **Content Score** | `weekly_stats` | `content_score` |

### Поля — Sections (з content_audits.audit_result)

| Section | JSON Path | Формат |
|---------|-----------|--------|
| Сторінки напрямків | `audit_result->directionPages->score` | 0-100 |
| Сторінки послуг | `audit_result->servicePages->score` | 0-100 |
| Сторінки лікарів | `audit_result->doctorPages->score` | 0-100 |
| Архітектура | `audit_result->architecture->score` | 0-100 |
| Блог | `audit_result->blog->score` | 0-100 |
| Унікальність | `audit_result->uniqueness->score` | 0-100 |
| Водянистість | `audit_result->wateriness->score` | 0-100 |
| Авторитетні посилання | `audit_result->authoritative->score` | 0-100 |
| FAQ | `audit_result->faq->score` | 0-100 |
| Контакти | `audit_result->contacts->score` | 0-100 |

---

## Tab 5: E-E-A-T показники

### Призначення
Оцінка Experience, Expertise, Authoritativeness, Trustworthiness.

### Таблиці

| Таблиця | Використання |
|---------|--------------|
| `weekly_stats` | `eeat_score` |
| `eeat_audits` (playground) | Детальні результати |

### Поля — KPI Cards

| UI Element | Джерело | Поле |
|------------|---------|------|
| **E-E-A-T Score** | `weekly_stats` | `eeat_score` |

### Поля — Sections (з eeat_audits.audit_result)

| Section | JSON Path | Формат |
|---------|-----------|--------|
| Автори статей | `audit_result->authors->score` | 0-100 |
| Експертність лікарів | `audit_result->doctorExpertise->score` | 0-100 |
| Досвід клініки | `audit_result->clinicExperience->score` | 0-100 |
| Репутація | `audit_result->reputation->score` | 0-100 |
| Історії пацієнтів | `audit_result->caseStudies->score` | 0-100 |
| NAP консистентність | `audit_result->napConsistency->score` | 0-100 |
| Прозорість | `audit_result->transparency->score` | 0-100 |
| Ліцензії | `audit_result->licenses->score` | 0-100 |
| Наукові джерела | `audit_result->scientificSources->score` | 0-100 |
| Приватність | `audit_result->privacy->score` | 0-100 |
| Спільнота | `audit_result->community->score` | 0-100 |

---

## Tab 6: Локальні показники

### Призначення
Оцінка локальної присутності (GBP, backlinks, social).

### Таблиці

| Таблиця | Використання |
|---------|--------------|
| `weekly_stats` | `local_score` |
| `local_indicators_audits` (playground) | Детальні результати |

### Поля — KPI Cards

| UI Element | Джерело | Поле |
|------------|---------|------|
| **Local Score** | `weekly_stats` | `local_score` |

### Поля — Sections (з local_indicators_audits.audit_result)

| Section | JSON Path | Формат |
|---------|-----------|--------|
| Google Business Profile | `audit_result->gbpProfile->score` | 0-100 |
| Реакція на відгуки | `audit_result->reviewResponses->score` | 0-100 |
| GBP Interactions | `audit_result->gbpInteractions->score` | 0-100 |
| Local Backlinks | `audit_result->localBacklinks->score` | 0-100 |
| Соціальні мережі | `audit_result->socialMedia->score` | 0-100 |
| Local Schema | `audit_result->localSchema->score` | 0-100 |

---

## Tab 7: Аналіз конкурентів

### Призначення
Порівняння з топ-10 конкурентами.

### Таблиці

| Таблиця | Використання |
|---------|--------------|
| `scans` | Витяг конкурентів з `raw_response` |
| `weekly_stats` | Історичні дані для динаміки |
| `projects` | Домен клієнта для позначення |

### Поля — Scatter Plot

| Axis | Джерело | Розрахунок |
|------|---------|------------|
| X (Position) | `scans` | `AVG(position)` per domain |
| Y (AI Score) | `scans` | `visibilityRate * 0.6 + positionScore * 0.4` |
| Size | `scans` | Count of appearances |
| Color | `projects` | Green = your domain, Orange = top-3, Gray = others |

### Алгоритм агрегації

```typescript
// Витяг доменів з raw_response
function extractDomainsFromResponse(rawResponse: string): string[]

// Агрегація статистики
function aggregateCompetitorStats(scans: Scan[], clientDomain?: string): CompetitorPoint[]

// Результат
interface CompetitorPoint {
  domain: string;
  avgPosition: number | null;
  aiScore: number;
  isClient: boolean;
  mentions: number;
}
```

### Поля — Competitors Table

| Column | Джерело | Розрахунок |
|--------|---------|------------|
| Rank | Сортування | By `aiScore` DESC |
| Name | Extracted | Domain name |
| Website | Extracted | Full URL |
| ClinicAI Score | Calculated | `aggregateCompetitorStats()` |
| Avg Position | Calculated | `AVG(position)` |
| Is You | `projects` | `domain === project.domain` |

---

## Data Flow Diagram

```
                    ┌─────────────────┐
                    │   User Request  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Server Action  │
                    │getDashboardMetrics│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌───────────┐  ┌───────────────┐  ┌─────────┐
      │  projects │  │  weekly_stats │  │  scans  │
      └─────┬─────┘  └───────┬───────┘  └────┬────┘
            │                │               │
            │                │               │
            └────────────────┼───────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Calculator    │
                    │ calculateClinicAIScore │
                    │ aggregateCompetitorStats │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │DashboardMetricsResponse│
                    │  { kpis, history, competitors } │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Dashboard UI  │
                    │  (7 Tabs)       │
                    └─────────────────┘
```

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова документація Tab Mapping |
