# Tech Audit Tables — Технічна оптимізація

> **Модуль:** Technical Optimization  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Огляд модуля

Ці таблиці зберігають дані для:
- **Tab 3: Технічна оптимізація** — Результати технічного аудиту

---

## 3.1 tech_audits

Високорівневі результати технічного аудиту проекту.

### Структура

```sql
CREATE TABLE public.tech_audits (
    id                  uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    project_id          uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at          timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    status              text NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    
    -- File Checks
    llms_txt_present    boolean,
    llms_txt_score      integer CHECK (llms_txt_score >= 0 AND llms_txt_score <= 100),
    llms_txt_data       jsonb DEFAULT '{}'::jsonb NOT NULL,
    robots_txt_present  boolean,
    robots_txt_valid    boolean,
    sitemap_present     boolean,
    
    -- Security & Tech
    https_enabled       boolean,
    mobile_friendly     boolean,
    
    -- Speed (Aggregated from Homepage)
    desktop_speed_score integer CHECK (desktop_speed_score >= 0 AND desktop_speed_score <= 100),
    mobile_speed_score  integer CHECK (mobile_speed_score >= 0 AND mobile_speed_score <= 100),
    speed_metrics       jsonb DEFAULT '{}'::jsonb NOT NULL,
    
    -- Schema Overview
    schema_summary      jsonb DEFAULT '{}'::jsonb NOT NULL
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `project_id` | `uuid` | ❌ | — | FK → `projects.id` |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |
| `status` | `text` | ❌ | — | `'running'`, `'completed'`, `'failed'` |

#### File Checks

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `llms_txt_present` | `boolean` | ✅ | Чи існує llms.txt |
| `llms_txt_score` | `integer` | ✅ | Score оптимізації llms.txt (0-100) |
| `llms_txt_data` | `jsonb` | ❌ | Деталі аналізу llms.txt |
| `robots_txt_present` | `boolean` | ✅ | Чи існує robots.txt |
| `robots_txt_valid` | `boolean` | ✅ | Чи валідний robots.txt |
| `sitemap_present` | `boolean` | ✅ | Чи існує sitemap.xml |

#### Security & Tech

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `https_enabled` | `boolean` | ✅ | Чи увімкнено HTTPS |
| `mobile_friendly` | `boolean` | ✅ | Чи мобільно-адаптивний |

#### Speed

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `desktop_speed_score` | `integer` | ✅ | PageSpeed Desktop (0-100) |
| `mobile_speed_score` | `integer` | ✅ | PageSpeed Mobile (0-100) |
| `speed_metrics` | `jsonb` | ❌ | Core Web Vitals |

#### Schema

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `schema_summary` | `jsonb` | ❌ | Знайдені типи Schema.org |

### Структура `llms_txt_data` (JSONB)

```typescript
interface LlmsTxtData {
  exists: boolean;
  size: number;               // Розмір у байтах
  contentPreview: string;     // Перші 200 символів
  score: number;              // 0-100
  summary?: string;           // AI-аналіз
  missing_sections?: string[]; // Відсутні секції
  recommendations?: string[]; // Рекомендації
}
```

### Структура `speed_metrics` (JSONB)

```typescript
interface SpeedMetrics {
  lcp?: number;   // Largest Contentful Paint (ms)
  fcp?: number;   // First Contentful Paint (ms)
  cls?: number;   // Cumulative Layout Shift
  tbt?: number;   // Total Blocking Time (ms)
  ttfb?: number;  // Time To First Byte (ms)
}
```

### Структура `schema_summary` (JSONB)

```typescript
interface SchemaSummary {
  hasMedicalOrganization: boolean;
  hasLocalBusiness: boolean;
  hasPhysician: boolean;
  hasMedicalSpecialty: boolean;
  hasMedicalProcedure: boolean;
  hasFAQPage: boolean;
  hasReview: boolean;
  hasBreadcrumbList: boolean;
}
```

### Приклади даних

```json
{
  "id": "...",
  "project_id": "...",
  "status": "completed",
  "llms_txt_present": true,
  "llms_txt_score": 75,
  "llms_txt_data": {
    "exists": true,
    "size": 2048,
    "contentPreview": "# Клініка Добробут\n\n## Про нас...",
    "score": 75,
    "missing_sections": ["FAQ", "Contacts"]
  },
  "robots_txt_present": true,
  "robots_txt_valid": true,
  "sitemap_present": true,
  "https_enabled": true,
  "mobile_friendly": true,
  "desktop_speed_score": 85,
  "mobile_speed_score": 62,
  "speed_metrics": {
    "lcp": 1800,
    "fcp": 1200,
    "cls": 0.05,
    "tbt": 150,
    "ttfb": 450
  },
  "schema_summary": {
    "hasMedicalOrganization": true,
    "hasLocalBusiness": true,
    "hasPhysician": true,
    "hasMedicalSpecialty": false,
    "hasMedicalProcedure": false,
    "hasFAQPage": true,
    "hasReview": true,
    "hasBreadcrumbList": true
  }
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `tech_audits_project_id_idx` | `project_id` |
| `tech_audits_created_at_idx` | `created_at` |
| `tech_audits_status_idx` | `status` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `tech_audits_select` | SELECT | Через `projects.organization_id` |
| `tech_audits_insert` | INSERT | Через `projects.organization_id` |
| `tech_audits_update` | UPDATE | Через `projects.organization_id` |
| `tech_audits_delete` | DELETE | Через `projects.organization_id` |

### Використання у вкладках

**Tab 3: Технічна оптимізація**

| UI Element | Поле |
|------------|------|
| llms.txt Status | `llms_txt_present`, `llms_txt_score` |
| robots.txt Status | `robots_txt_present`, `robots_txt_valid` |
| Sitemap Status | `sitemap_present` |
| HTTPS Badge | `https_enabled` |
| Mobile Friendly Badge | `mobile_friendly` |
| Desktop Speed Gauge | `desktop_speed_score` |
| Mobile Speed Gauge | `mobile_speed_score` |
| Core Web Vitals | `speed_metrics` |
| Schema Checklist | `schema_summary` |

---

## 3.2 pages_audit

Детальний аудит окремих сторінок.

### Структура

```sql
CREATE TABLE public.pages_audit (
    id                 uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    audit_id           uuid NOT NULL REFERENCES public.tech_audits(id) ON DELETE CASCADE,
    url                text NOT NULL,
    status_code        integer,
    
    -- Meta Tags
    title              text,
    title_length       integer,
    description        text,
    description_length integer,
    canonical_url      text,
    is_canonical_match boolean,
    h1                 text,
    
    -- Indexing
    meta_robots        text,
    is_indexed         boolean,
    
    -- Content
    word_count         integer,
    lang_attribute     text,
    
    -- Issues
    is_duplicate       boolean,
    issues             jsonb DEFAULT '[]'::jsonb NOT NULL
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `audit_id` | `uuid` | ❌ | — | FK → `tech_audits.id` |
| `url` | `text` | ❌ | — | URL сторінки |
| `status_code` | `integer` | ✅ | — | HTTP статус (200, 404, 500) |

#### Meta Tags

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `title` | `text` | ✅ | Тег `<title>` |
| `title_length` | `integer` | ✅ | Довжина title |
| `description` | `text` | ✅ | Meta description |
| `description_length` | `integer` | ✅ | Довжина description |
| `canonical_url` | `text` | ✅ | Canonical URL |
| `is_canonical_match` | `boolean` | ✅ | `url === canonical_url` |
| `h1` | `text` | ✅ | Тег `<h1>` |

#### Indexing

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `meta_robots` | `text` | ✅ | Значення meta robots |
| `is_indexed` | `boolean` | ✅ | Чи індексується сторінка |

#### Content

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `word_count` | `integer` | ✅ | Кількість слів |
| `lang_attribute` | `text` | ✅ | Атрибут `lang` |

#### Issues

| Поле | Тип | Nullable | Опис |
|------|-----|----------|------|
| `is_duplicate` | `boolean` | ✅ | Чи є дублікатом |
| `issues` | `jsonb` | ❌ | Масив проблем |

### Структура `issues` (JSONB)

```typescript
type PageIssue = string;

// Приклади:
const issues: PageIssue[] = [
  "Title too long (75 chars, max 60)",
  "Missing meta description",
  "Canonical URL mismatch",
  "Broken internal link: /old-page",
  "Missing H1 tag",
  "Low word count (< 300)"
];
```

### Приклади даних

```json
{
  "id": "...",
  "audit_id": "...",
  "url": "https://clinic.com/services/mri",
  "status_code": 200,
  "title": "МРТ діагностика | Клініка Добробут",
  "title_length": 35,
  "description": "Сучасна МРТ діагностика на апаратах Siemens...",
  "description_length": 145,
  "canonical_url": "https://clinic.com/services/mri",
  "is_canonical_match": true,
  "h1": "МРТ діагностика",
  "meta_robots": null,
  "is_indexed": true,
  "word_count": 850,
  "lang_attribute": "uk",
  "is_duplicate": false,
  "issues": []
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `pages_audit_audit_id_idx` | `audit_id` |
| `pages_audit_url_idx` | `url` |
| `pages_audit_status_code_idx` | `status_code` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `pages_audit_select` | SELECT | Через `tech_audits → projects.organization_id` |
| `pages_audit_insert` | INSERT | Через `tech_audits → projects.organization_id` |
| `pages_audit_update` | UPDATE | Через `tech_audits → projects.organization_id` |
| `pages_audit_delete` | DELETE | Через `tech_audits → projects.organization_id` |

### Використання у вкладках

**Tab 3: Технічна оптимізація**

| UI Element | Query |
|------------|-------|
| Pages Table | `SELECT * FROM pages_audit WHERE audit_id = ?` |
| Issues Summary | `SELECT issues FROM pages_audit WHERE audit_id = ?` |
| 404 Errors Count | `COUNT(*) WHERE status_code = 404` |
| Duplicate Pages | `COUNT(*) WHERE is_duplicate = true` |
| Noindex Pages | `COUNT(*) WHERE is_indexed = false` |

---

## Зв'язки між таблицями

```
projects.id ─────────────┬─► tech_audits.project_id

tech_audits.id ──────────┬─► pages_audit.audit_id
```

---

## Агрегаційні запити

### Tech Score Calculation

```sql
-- Базовий Tech Score (без AI-аналізу)
SELECT 
    (CASE WHEN llms_txt_present THEN 8 ELSE 0 END +
     CASE WHEN robots_txt_present THEN 6 ELSE 0 END +
     CASE WHEN sitemap_present THEN 6 ELSE 0 END +
     CASE WHEN https_enabled THEN 10 ELSE 0 END +
     CASE WHEN mobile_friendly THEN 5 ELSE 0 END +
     CASE WHEN desktop_speed_score >= 50 THEN 10 ELSE 5 END +
     CASE WHEN mobile_speed_score >= 50 THEN 10 ELSE 5 END) as tech_score
FROM tech_audits
WHERE project_id = :project_id
ORDER BY created_at DESC
LIMIT 1;
```

### Latest Audit

```sql
SELECT * FROM tech_audits
WHERE project_id = :project_id
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 1;
```

### Pages with Issues

```sql
SELECT url, issues
FROM pages_audit
WHERE audit_id = :audit_id
  AND jsonb_array_length(issues) > 0
ORDER BY jsonb_array_length(issues) DESC;
```

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова документація Tech Audit tables |
