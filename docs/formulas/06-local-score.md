# Локальні показники (Local Score)

> **Модуль:** `engine/local-score.ts`  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Призначення

Модуль оцінки локальної присутності клініки — наскільки вона оптимізована для локального пошуку та AI-відповідей з географічним контекстом. Важливий для залучення пацієнтів з конкретного міста/району.

---

## Структура модуля

| Показник | Вага | Опис |
|----------|------|------|
| 6.1 Google Business Profile | 25% | Повнота заповнення профілю |
| 6.2 Реакція на відгуки | 20% | Швидкість та якість відповідей |
| 6.3 Взаємодія з GBP | 15% | Покази, кліки, CTR |
| 6.4 Local Backlinks | 15% | Посилання з локальних ресурсів |
| 6.5 Соціальні мережі | 15% | Активність у Facebook, Instagram |
| 6.6 Local Business Schema | 10% | Структуровані дані |

---

## 6.1 Google Business Profile

### Опис

Ступінь заповнення всіх полів у Google Business Profile.

### Алгоритм

```typescript
interface GBPCheck {
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
    posts: { count: number; lastPostDate: Date | null };
    qna: number;
  };
  score: number;
}

async function checkGoogleBusinessProfile(clinicName: string, city: string): Promise<GBPCheck> {
  // Використовуємо Google Places API або Google My Business API
  const profile = await fetchGBPData(clinicName, city);
  
  if (!profile) {
    return { exists: false, score: 0 };
  }
  
  const fields = {
    name: !!profile.name,
    address: !!profile.address,
    phone: !!profile.phone,
    website: !!profile.website,
    category: !!profile.primaryCategory,
    description: !!profile.description && profile.description.length > 50,
    hours: !!profile.openingHours,
    photos: {
      count: profile.photos?.length || 0,
      types: profile.photos?.map(p => p.type) || []
    },
    services: profile.services?.length || 0,
    attributes: profile.attributes?.length || 0,
    posts: {
      count: profile.posts?.length || 0,
      lastPostDate: profile.posts?.[0]?.date || null
    },
    qna: profile.qna?.length || 0
  };
  
  return {
    exists: true,
    completionPercentage: calculateCompletionPercentage(fields),
    fields,
    score: calculateGBPScore(fields)
  };
}
```

### Критерії оцінки

| Критерій | Бали | Примітки |
|----------|------|----------|
| Основні поля (name, address, phone, website) | +20 | Обов'язкові |
| Категорія та опис | +15 | |
| Години роботи | +10 | |
| Фото (10-15+, різних типів) | +15 | exterior, interior, team, equipment |
| Послуги/Категорії (5+) | +10 | |
| Атрибути (15+) | +10 | |
| Google Posts (1+/міс) | +10 | Регулярність |
| Q&A | +10 | |

### Формула

```typescript
function calculateGBPScore(fields: GBPFields): number {
  let score = 0;
  
  // Обов'язкові поля (20 балів)
  if (fields.name && fields.address && fields.phone) score += 20;
  
  // Опис та категорія (15 балів)
  if (fields.category) score += 7;
  if (fields.description) score += 8;
  
  // Години роботи (10 балів)
  if (fields.hours) score += 10;
  
  // Фото (15 балів)
  const photoScore = Math.min(fields.photos.count / 15, 1) * 15;
  score += photoScore;
  
  // Послуги (10 балів)
  const servicesScore = Math.min(fields.services / 10, 1) * 10;
  score += servicesScore;
  
  // Атрибути (10 балів)
  const attributesScore = Math.min(fields.attributes / 15, 1) * 10;
  score += attributesScore;
  
  // Posts (10 балів)
  if (fields.posts.count > 0 && isWithinDays(fields.posts.lastPostDate, 30)) {
    score += 10;
  } else if (fields.posts.count > 0) {
    score += 5;
  }
  
  // Q&A (10 балів)
  const qnaScore = Math.min(fields.qna / 10, 1) * 10;
  score += qnaScore;
  
  return Math.round(score);
}
```

### Приклади

**Добрий:**
```
- 100% заповнених полів
- 20+ якісних фото (екстер'єр, інтер'єр, команда, обладнання)
- Детальний опис послуг
- Години роботи для кожного дня
- 15+ атрибутів
- Регулярні пости (2-4/міс)
```

**Поганий:**
```
- Тільки назва, адреса, телефон
- 2-3 застарілих фото
- Немає опису
- Немає годин роботи
- Жодних постів
```

---

## 6.2 Реакція на відгуки

### Опис

Швидкість та якість відповідей на відгуки.

### Алгоритм

```typescript
interface ReviewResponseCheck {
  totalReviews: number;
  reviewsWithResponse: number;
  responseRate: number;           // % відгуків з відповіддю
  avgResponseTime: number | null; // Години до відповіді
  responseWithin24h: number;      // % відповідей протягом 24 год
  negativeHandled: number;        // % негативних з відповіддю
  score: number;
}

async function checkReviewResponses(gbpData: GBPData): Promise<ReviewResponseCheck> {
  const reviews = gbpData.reviews || [];
  
  const reviewsWithResponse = reviews.filter(r => r.ownerResponse);
  const negativeReviews = reviews.filter(r => r.rating <= 2);
  const negativeWithResponse = negativeReviews.filter(r => r.ownerResponse);
  
  // Розрахунок часу відповіді (якщо доступно)
  const responseTimes = reviewsWithResponse
    .filter(r => r.responseTime)
    .map(r => r.responseTime);
  
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : null;
  
  const within24h = responseTimes.filter(t => t <= 24).length;
  
  return {
    totalReviews: reviews.length,
    reviewsWithResponse: reviewsWithResponse.length,
    responseRate: (reviewsWithResponse.length / reviews.length) * 100,
    avgResponseTime,
    responseWithin24h: (within24h / reviewsWithResponse.length) * 100,
    negativeHandled: (negativeWithResponse.length / negativeReviews.length) * 100,
    score: calculateReviewResponseScore(...)
  };
}
```

### Формула

```typescript
function calculateReviewResponseScore(data: ReviewResponseCheck): number {
  let score = 0;
  
  // Процент відповідей (40 балів)
  score += (data.responseRate / 100) * 40;
  
  // Швидкість відповіді (30 балів)
  if (data.responseWithin24h >= 90) {
    score += 30;
  } else if (data.responseWithin24h >= 70) {
    score += 20;
  } else if (data.responseWithin24h >= 50) {
    score += 10;
  }
  
  // Обробка негативних (30 балів)
  score += (data.negativeHandled / 100) * 30;
  
  return Math.round(score);
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| 90%+ відповідей на відгуки | 40 |
| 90%+ відповідей протягом 24 год | 30 |
| 100% негативних з відповіддю | 30 |

---

## 6.3 Взаємодія з Google Business Profile

### Опис

Аналітика показів, кліків та взаємодій з профілем.

### Алгоритм

```typescript
interface GBPInteractionCheck {
  period: 'month' | 'quarter';
  impressions: {
    search: number;
    maps: number;
    total: number;
  };
  actions: {
    websiteClicks: number;
    calls: number;
    directions: number;
    photoViews: number;
    bookings: number;
  };
  ctr: number;  // (actions / impressions) * 100
  score: number;
}

async function checkGBPInteractions(gbpData: GBPData): Promise<GBPInteractionCheck> {
  // Потребує Google My Business API з правами на Insights
  const insights = await fetchGBPInsights(gbpData.placeId);
  
  const totalImpressions = insights.searchImpressions + insights.mapsImpressions;
  const totalActions = 
    insights.websiteClicks + 
    insights.calls + 
    insights.directions + 
    insights.bookings;
  
  return {
    period: 'month',
    impressions: {
      search: insights.searchImpressions,
      maps: insights.mapsImpressions,
      total: totalImpressions
    },
    actions: {
      websiteClicks: insights.websiteClicks,
      calls: insights.calls,
      directions: insights.directions,
      photoViews: insights.photoViews,
      bookings: insights.bookings
    },
    ctr: (totalActions / totalImpressions) * 100,
    score: calculateInteractionScore(totalImpressions, totalActions)
  };
}
```

### Бенчмарки

| CTR | Оцінка |
|-----|--------|
| >10% | Відмінно |
| 5-10% | Добре |
| 2-5% | Середньо |
| <2% | Потребує покращення |

### Формула

```typescript
function calculateInteractionScore(impressions: number, actions: number): number {
  const ctr = (actions / impressions) * 100;
  
  // CTR Score (50 балів)
  let ctrScore = 0;
  if (ctr >= 10) ctrScore = 50;
  else if (ctr >= 5) ctrScore = 35;
  else if (ctr >= 2) ctrScore = 20;
  else ctrScore = 10;
  
  // Volume Score (50 балів) - базується на абсолютних числах
  const volumeScore = Math.min(impressions / 10000, 1) * 50;
  
  return Math.round(ctrScore + volumeScore);
}
```

---

## 6.4 Local Backlinks

### Опис

Посилання з локальних джерел (міські портали, партнери, асоціації).

### Алгоритм

```typescript
interface LocalBacklinksCheck {
  totalBacklinks: number;
  localBacklinks: number;      // З того ж міста
  localDomains: string[];
  linkTypes: {
    cityPortals: number;       // Міські сайти
    localNews: number;         // Локальні ЗМІ
    medicalAssociations: number;
    partners: number;          // Локальні партнери
    directories: number;       // Каталоги
  };
  score: number;
}

async function checkLocalBacklinks(domain: string, city: string): Promise<LocalBacklinksCheck> {
  // Використовуємо Ahrefs/Moz/Semrush API або власний краулер
  const backlinks = await fetchBacklinks(domain);
  
  // Фільтруємо локальні
  const localBacklinks = backlinks.filter(link => 
    isLocalDomain(link.sourceDomain, city)
  );
  
  // Класифікуємо типи
  const linkTypes = {
    cityPortals: localBacklinks.filter(l => isCityPortal(l.sourceDomain)).length,
    localNews: localBacklinks.filter(l => isLocalNews(l.sourceDomain)).length,
    medicalAssociations: localBacklinks.filter(l => isMedicalAssoc(l.sourceDomain)).length,
    partners: localBacklinks.filter(l => isLocalBusiness(l.sourceDomain)).length,
    directories: localBacklinks.filter(l => isDirectory(l.sourceDomain)).length
  };
  
  return {
    totalBacklinks: backlinks.length,
    localBacklinks: localBacklinks.length,
    localDomains: [...new Set(localBacklinks.map(l => l.sourceDomain))],
    linkTypes,
    score: calculateLocalBacklinksScore(localBacklinks.length)
  };
}
```

### Критерії оцінки

| Кількість локальних доменів | Оцінка |
|-----------------------------|--------|
| <5 | Погано (20 балів) |
| 5-10 | Середньо (50 балів) |
| 10-20 | Добре (75 балів) |
| >20 | Відмінно (100 балів) |

### Формула

```typescript
function calculateLocalBacklinksScore(localDomainCount: number): number {
  if (localDomainCount < 5) return 20;
  if (localDomainCount < 10) return 50;
  if (localDomainCount < 20) return 75;
  return 100;
}
```

---

## 6.5 Активність у соціальних мережах

### Опис

Перевірка активності в локальних соцмережах.

### Алгоритм

```typescript
interface SocialMediaCheck {
  facebook: {
    exists: boolean;
    hasCorrectNAP: boolean;
    hasGeoTags: boolean;
    followersCount: number;
    lastPostDate: Date | null;
    postsPerMonth: number;
  } | null;
  instagram: {
    exists: boolean;
    hasCorrectNAP: boolean;
    hasGeoTags: boolean;
    followersCount: number;
    lastPostDate: Date | null;
    postsPerMonth: number;
  } | null;
  score: number;
}

async function checkSocialMedia(clinicName: string, websiteUrl: string): Promise<SocialMediaCheck> {
  // Шукаємо профілі на сайті
  const html = await fetch(websiteUrl).then(r => r.text());
  const $ = load(html);
  
  const facebookUrl = $('a[href*="facebook.com"]').attr('href');
  const instagramUrl = $('a[href*="instagram.com"]').attr('href');
  
  const facebook = facebookUrl ? await analyzeFacebookProfile(facebookUrl) : null;
  const instagram = instagramUrl ? await analyzeInstagramProfile(instagramUrl) : null;
  
  return {
    facebook,
    instagram,
    score: calculateSocialScore(facebook, instagram)
  };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Профіль існує | +20 |
| Коректні NAP дані | +20 |
| Геотеги/локальний контент | +20 |
| Регулярні пости (2+/тиждень) | +20 |
| Хороша кількість підписників | +20 |

---

## 6.6 Local Business Schema

### Опис

Наявність структурованих даних LocalBusiness.

### Алгоритм

```typescript
interface LocalSchemaCheck {
  hasLocalBusinessSchema: boolean;
  fields: {
    name: boolean;
    address: boolean;
    telephone: boolean;
    openingHours: boolean;
    geo: boolean;           // latitude, longitude
    areaServed: boolean;
    priceRange: boolean;
  };
  isValid: boolean;
  score: number;
}

function checkLocalBusinessSchema(html: string): LocalSchemaCheck {
  const $ = load(html);
  const schemas = parseAllJsonLd($);
  
  const localBusinessSchema = schemas.find(s => 
    hasSchemaType(s, ['LocalBusiness', 'MedicalBusiness', 'HealthAndBeautyBusiness'])
  );
  
  if (!localBusinessSchema) {
    return { hasLocalBusinessSchema: false, score: 0 };
  }
  
  const fields = {
    name: !!localBusinessSchema.name,
    address: !!localBusinessSchema.address,
    telephone: !!localBusinessSchema.telephone,
    openingHours: !!localBusinessSchema.openingHours,
    geo: !!(localBusinessSchema.geo?.latitude && localBusinessSchema.geo?.longitude),
    areaServed: !!localBusinessSchema.areaServed,
    priceRange: !!localBusinessSchema.priceRange
  };
  
  const filledFields = Object.values(fields).filter(v => v).length;
  const isValid = fields.name && fields.address && fields.telephone;
  
  return {
    hasLocalBusinessSchema: true,
    fields,
    isValid,
    score: calculateLocalSchemaScore(filledFields, isValid)
  };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Schema існує | +30 |
| Обов'язкові поля (name, address, phone) | +30 |
| Години роботи | +15 |
| Геокоординати | +15 |
| Зона обслуговування | +5 |
| Діапазон цін | +5 |

---

## Агрегований Local Score

### Формула

```typescript
function calculateLocalScore(checks: LocalChecks): number {
  const weights = {
    gbpProfile: 0.25,
    reviewResponses: 0.20,
    gbpInteractions: 0.15,
    localBacklinks: 0.15,
    socialMedia: 0.15,
    localSchema: 0.10
  };
  
  return Math.round(
    checks.gbpProfile.score * weights.gbpProfile +
    checks.reviewResponses.score * weights.reviewResponses +
    checks.gbpInteractions.score * weights.gbpInteractions +
    checks.localBacklinks.score * weights.localBacklinks +
    checks.socialMedia.score * weights.socialMedia +
    checks.localSchema.score * weights.localSchema
  );
}
```

---

## Edge Cases

### 1. Немає Google Business Profile

```typescript
if (!gbpData.exists) {
  return {
    score: 10,
    critical: true,
    message: 'Google Business Profile not found - critical for local SEO'
  };
}
```

### 2. Нова клініка без відгуків

```typescript
if (totalReviews < 5) {
  // Не штрафуємо за відсутність відповідей
  return {
    reviewResponseScore: 50,
    note: 'Not enough reviews to evaluate response rate'
  };
}
```

### 3. Відсутній доступ до GBP Insights

```typescript
if (!hasGBPApiAccess) {
  return {
    interactionScore: null,
    note: 'GBP Insights not available - requires API access'
  };
}
```

### 4. Клініка без соціальних мереж

```typescript
if (!facebook && !instagram) {
  return {
    socialScore: 30,
    recommendation: 'Consider creating social media profiles'
  };
}
```

---

## Залежності

### Зовнішні API

- **Google Places API** — базова інформація про профіль
- **Google My Business API** — детальна аналітика (потребує верифікації)
- **Ahrefs/Moz/Semrush API** — аналіз backlinks
- **Facebook Graph API** — аналіз Facebook сторінок
- **Instagram Basic Display API** — аналіз Instagram профілів

### Альтернативи без API

- Скрапінг публічних даних
- Ручне введення даних користувачем
- Інтеграція з Google Search Console

---

## Нотатки з міграції

### Поточний стан

Модуль Local Score **частково реалізований**:
- `localScore` (1-10) обчислюється в `ai/scanner.ts` на основі AI-аналізу відповідей
- LocalBusiness Schema перевіряється в `html-parser.ts`
- Інші метрики потребують окремої імплементації

### Код для міграції

```typescript
// З apps/web/lib/modules/ai/scanner.ts
localScore: number; // 1-10, based on physical address presence

// З apps/web/lib/modules/audit/utils/html-parser.ts
hasLocalBusiness: boolean;
```

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова специфікація на основі Functionality.md |
