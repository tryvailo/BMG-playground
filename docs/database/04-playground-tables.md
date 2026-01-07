# Playground Tables — Публічні аудити

> **Модуль:** Playground (Demo/Trial)  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Огляд модуля

Playground таблиці зберігають результати аудитів без прив'язки до проектів:
- Публічний доступ (без авторизації)
- Використовуються для демонстрації та trial-версії
- RLS дозволяє read/write для всіх

---

## 4.1 playground_tech_audits

Технічний аудит з playground.

### Структура

```sql
CREATE TABLE public.playground_tech_audits (
    id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    url          text NOT NULL,
    created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    audit_result jsonb NOT NULL,
    domain       text
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `url` | `text` | ❌ | — | URL аудиту |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |
| `audit_result` | `jsonb` | ❌ | — | Повний результат аудиту |
| `domain` | `text` | ✅ | — | Домен сайту |

### Структура `audit_result` (JSONB)

```typescript
interface EphemeralAuditResult {
  // Базова інформація
  url: string;
  timestamp: string;
  
  // File Checks
  llmsTxt: {
    present: boolean;
    score: number;
    data: LlmsTxtData;
  };
  robotsTxt: {
    present: boolean;
    valid: boolean;
  };
  sitemap: {
    present: boolean;
  };
  
  // Security
  https: boolean;
  mobileFriendly: boolean;
  
  // Speed
  desktop: {
    score: number;
    metrics: SpeedMetrics;
  };
  mobile: {
    score: number;
    metrics: SpeedMetrics;
  };
  
  // Schema
  schema: SchemaSummary;
  
  // Meta
  meta: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    lang: string | null;
  };
  
  // AI Analysis (optional)
  aiAnalysis?: {
    overallScore: number;
    summary: string;
    recommendations: string[];
  };
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `playground_tech_audits_url_idx` | `url` |
| `playground_tech_audits_created_at_idx` | `created_at DESC` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `playground_tech_audits_select` | SELECT | `true` |
| `playground_tech_audits_insert` | INSERT | `true` |
| `playground_tech_audits_update` | UPDATE | `true` |
| `playground_tech_audits_delete` | DELETE | `true` |

---

## 4.2 content_audits

Аудит оптимізації контенту.

### Структура

```sql
CREATE TABLE public.content_audits (
    id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    url          text NOT NULL,
    created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    audit_result jsonb NOT NULL
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `url` | `text` | ❌ | — | URL аудиту |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |
| `audit_result` | `jsonb` | ❌ | — | Повний результат аудиту |

### Структура `audit_result` (JSONB)

```typescript
interface ContentAuditResult {
  url: string;
  timestamp: string;
  overallScore: number;  // 0-100
  
  // 4.1 Сторінки напрямків
  directionPages: {
    total: number;
    hasUniqueContent: boolean;
    score: number;
  };
  
  // 4.2 Сторінки послуг
  servicePages: {
    total: number;
    hasDetailedDescription: number;
    hasPricing: number;
    hasSchema: number;
    score: number;
  };
  
  // 4.3 Сторінки лікарів
  doctorPages: {
    total: number;
    hasPhoto: number;
    hasBio: number;
    hasCredentials: number;
    hasSchema: number;
    score: number;
  };
  
  // 4.4 Архітектура сайту
  architecture: {
    maxDepth: number;
    avgInternalLinks: number;
    orphanPages: number;
    score: number;
  };
  
  // 4.5 Блог
  blog: {
    exists: boolean;
    totalArticles: number;
    recentArticles: number;
    avgWordCount: number;
    score: number;
  };
  
  // 4.6 Унікальність контенту
  uniqueness: {
    avgUniqueness: number;
    duplicatePages: string[];
    score: number;
  };
  
  // 4.7 Водянистість тексту
  wateriness: {
    avgWateriness: number;
    score: number;
  };
  
  // 4.8 Авторитетність посилань
  authoritative: {
    totalExternalLinks: number;
    authoritativeLinks: number;
    percentage: number;
    score: number;
  };
  
  // 4.9 FAQ
  faq: {
    exists: boolean;
    questionsCount: number;
    hasFAQSchema: boolean;
    score: number;
  };
  
  // 4.10-4.11 Контакти
  contacts: {
    hasAddress: boolean;
    hasPhone: boolean;
    isClickable: boolean;
    score: number;
  };
  
  // AI рекомендації
  recommendations?: string[];
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `content_audits_url_idx` | `url` |
| `content_audits_created_at_idx` | `created_at DESC` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `content_audits_select` | SELECT | `true` |
| `content_audits_insert` | INSERT | `true` |
| `content_audits_update` | UPDATE | `true` |
| `content_audits_delete` | DELETE | `true` |

---

## 4.3 eeat_audits

E-E-A-T аудит (Experience, Expertise, Authoritativeness, Trustworthiness).

### Структура

```sql
CREATE TABLE public.eeat_audits (
    id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    url          text NOT NULL,
    created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    audit_result jsonb NOT NULL,
    multi_page   boolean DEFAULT false,
    filter_type  text,
    max_pages    integer
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `url` | `text` | ❌ | — | URL аудиту |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |
| `audit_result` | `jsonb` | ❌ | — | Повний результат аудиту |
| `multi_page` | `boolean` | ✅ | `false` | Чи multi-page аналіз |
| `filter_type` | `text` | ✅ | — | Тип фільтра сторінок |
| `max_pages` | `integer` | ✅ | — | Максимум проаналізованих сторінок |

### Структура `audit_result` (JSONB)

```typescript
interface EEATAuditResult {
  url: string;
  timestamp: string;
  overallScore: number;  // 0-100
  
  // 5.1 Автори статей
  authors: {
    totalBlogPages: number;
    pagesWithAuthor: number;
    authorsWithCredentials: number;
    score: number;
  };
  
  // 5.2 Експертність лікарів
  doctorExpertise: {
    totalDoctors: number;
    withDiploma: number;
    withCertificates: number;
    withAssociations: number;
    withYearsExperience: number;
    score: number;
  };
  
  // 5.3 Досвід клініки
  clinicExperience: {
    hasYearsInBusiness: boolean;
    yearsValue: number | null;
    hasPatientCount: boolean;
    hasCaseStudies: boolean;
    caseStudiesCount: number;
    score: number;
  };
  
  // 5.4 Репутація
  reputation: {
    googleMaps: { rating: number; reviewCount: number } | null;
    docUa: { rating: number; reviewCount: number } | null;
    likarni: { rating: number; reviewCount: number } | null;
    avgRating: number;
    totalReviews: number;
    score: number;
  };
  
  // 5.5 Історії пацієнтів
  caseStudies: {
    hasCasesSection: boolean;
    totalCases: number;
    structuredCases: number;
    score: number;
  };
  
  // 5.6 NAP консистентність
  napConsistency: {
    siteNAP: { name: string; address: string; phone: string };
    matchPercentage: number;
    score: number;
  };
  
  // 5.7 Прозорість
  transparency: {
    hasLegalEntity: boolean;
    hasFullAddress: boolean;
    hasPhoneNumbers: boolean;
    hasEmail: boolean;
    hasContactForm: boolean;
    hasMap: boolean;
    hasWorkingHours: boolean;
    score: number;
  };
  
  // 5.8 Ліцензії
  licenses: {
    hasLicenseSection: boolean;
    licenseCount: number;
    hasLicenseImages: boolean;
    hasAccreditations: boolean;
    score: number;
  };
  
  // 5.9 Наукові джерела
  scientificSources: {
    totalMedicalArticles: number;
    articlesWithSources: number;
    percentage: number;
    score: number;
  };
  
  // 5.10 Приватність
  privacy: {
    hasPrivacyPolicy: boolean;
    hasTermsOfService: boolean;
    hasGDPRCompliance: boolean;
    score: number;
  };
  
  // 5.11 Взаємодія зі спільнотою
  community: {
    hasConferenceMentions: boolean;
    hasPublications: boolean;
    hasProfessionalMemberships: boolean;
    score: number;
  };
  
  // AI рекомендації
  recommendations?: string[];
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `eeat_audits_url_idx` | `url` |
| `eeat_audits_created_at_idx` | `created_at DESC` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `eeat_audits_select` | SELECT | `true` |
| `eeat_audits_insert` | INSERT | `true` |
| `eeat_audits_update` | UPDATE | `true` |
| `eeat_audits_delete` | DELETE | `true` |

---

## 4.4 local_indicators_audits

Аудит локальних показників.

### Структура

```sql
CREATE TABLE public.local_indicators_audits (
    id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    url          text NOT NULL,
    created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    audit_result jsonb NOT NULL,
    clinic_name  text,
    city         text,
    place_id     text
);
```

### Поля

| Поле | Тип | Nullable | Default | Опис |
|------|-----|----------|---------|------|
| `id` | `uuid` | ❌ | `uuid_generate_v4()` | Первинний ключ |
| `url` | `text` | ❌ | — | URL аудиту |
| `created_at` | `timestamptz` | ❌ | `now()` | Дата створення |
| `audit_result` | `jsonb` | ❌ | — | Повний результат аудиту |
| `clinic_name` | `text` | ✅ | — | Назва клініки |
| `city` | `text` | ✅ | — | Місто |
| `place_id` | `text` | ✅ | — | Google Place ID |

### Структура `audit_result` (JSONB)

```typescript
interface LocalIndicatorsAuditResult {
  url: string;
  timestamp: string;
  overallScore: number;  // 0-100
  
  // 6.1 Google Business Profile
  gbpProfile: {
    exists: boolean;
    completionPercentage: number;
    fields: {
      name: boolean;
      address: boolean;
      phone: boolean;
      website: boolean;
      category: boolean;
      description: boolean;
      hours: boolean;
      photos: { count: number; types: string[] };
      services: number;
      attributes: number;
      posts: { count: number; lastPostDate: string | null };
      qna: number;
    };
    score: number;
  };
  
  // 6.2 Реакція на відгуки
  reviewResponses: {
    totalReviews: number;
    reviewsWithResponse: number;
    responseRate: number;
    avgResponseTime: number | null;
    negativeHandled: number;
    score: number;
  };
  
  // 6.3 GBP Interactions (якщо доступно)
  gbpInteractions?: {
    impressions: { search: number; maps: number; total: number };
    actions: { websiteClicks: number; calls: number; directions: number };
    ctr: number;
    score: number;
  };
  
  // 6.4 Local Backlinks
  localBacklinks: {
    totalBacklinks: number;
    localBacklinks: number;
    localDomains: string[];
    score: number;
  };
  
  // 6.5 Соціальні мережі
  socialMedia: {
    facebook: {
      exists: boolean;
      hasCorrectNAP: boolean;
      followersCount: number;
      postsPerMonth: number;
    } | null;
    instagram: {
      exists: boolean;
      hasCorrectNAP: boolean;
      followersCount: number;
      postsPerMonth: number;
    } | null;
    score: number;
  };
  
  // 6.6 Local Business Schema
  localSchema: {
    hasLocalBusinessSchema: boolean;
    fields: {
      name: boolean;
      address: boolean;
      telephone: boolean;
      openingHours: boolean;
      geo: boolean;
      areaServed: boolean;
      priceRange: boolean;
    };
    isValid: boolean;
    score: number;
  };
  
  // Google Place Details
  placeDetails?: {
    placeId: string;
    rating: number;
    reviewCount: number;
    address: string;
    phone: string;
    website: string;
  };
  
  // AI рекомендації
  recommendations?: string[];
}
```

### Індекси

| Індекс | Поля |
|--------|------|
| Primary key | `id` |
| `local_indicators_audits_url_idx` | `url` |
| `local_indicators_audits_created_at_idx` | `created_at DESC` |

### RLS Policies

| Policy | Operation | Правило |
|--------|-----------|---------|
| `local_indicators_audits_select` | SELECT | `true` |
| `local_indicators_audits_insert` | INSERT | `true` |
| `local_indicators_audits_update` | UPDATE | `true` |
| `local_indicators_audits_delete` | DELETE | `true` |

---

## Спільні характеристики Playground таблиць

### Публічний доступ

Усі playground таблиці мають однакову RLS політику:

```sql
-- Дозволяє все для всіх
CREATE POLICY {table}_select ON public.{table} FOR SELECT USING (true);
CREATE POLICY {table}_insert ON public.{table} FOR INSERT WITH CHECK (true);
CREATE POLICY {table}_update ON public.{table} FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY {table}_delete ON public.{table} FOR DELETE USING (true);
```

### Grants

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.{table} TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.{table} TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.{table} TO anon;
```

### Очистка старих даних

Рекомендується періодична очистка:

```sql
-- Видалення аудитів старше 30 днів
DELETE FROM playground_tech_audits 
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM content_audits 
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM eeat_audits 
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM local_indicators_audits 
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова документація Playground tables |
