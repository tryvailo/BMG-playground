# Технічна оптимізація (Tech Audit)

> **Модуль:** `engine/tech-audit.ts`  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Призначення

Модуль технічної оптимізації перевіряє технічні аспекти сайту, які впливають на видимість в AI-системах та пошукових системах. Включає перевірки файлів (llms.txt, robots.txt, sitemap.xml), безпеки, швидкості та schema markup.

---

## Структура модуля

Технічна оптимізація складається з багатьох підмодулів:

1. **Файлові перевірки** — llms.txt, robots.txt, sitemap.xml
2. **Безпека** — HTTPS, SSL
3. **Мобільна адаптивність** — viewport, mobile score
4. **Schema Markup** — 8 типів медичних схем
5. **Meta-теги** — title, description, canonical, lang, hreflang
6. **Швидкість** — PageSpeed (desktop/mobile)
7. **Зовнішні посилання** — broken links, trusted domains
8. **Дублікати** — www/non-www, trailing slash

---

## 3.1 Наявність llms.txt

### Опис

Перевірка існування файлу llms.txt, який допомагає AI-системам розуміти структуру сайту.

### Алгоритм

```typescript
async function checkLlmsTxt(baseUrl: string): Promise<LlmsTxtCheck> {
  const llmsTxtUrl = `${baseUrl.replace(/\/$/, '')}/llms.txt`;
  
  const response = await fetch(llmsTxtUrl, {
    method: 'GET',
    headers: { 'User-Agent': 'TechAuditBot/1.0' },
    signal: AbortSignal.timeout(5000)
  });

  if (response.ok) {
    const content = await response.text();
    return {
      exists: true,
      size: new Blob([content]).size,
      contentPreview: content.substring(0, 200).replace(/\n/g, ' ').trim()
    };
  }

  return { exists: false, size: 0, contentPreview: '' };
}
```

### Вихідні дані

| Поле | Тип | Опис |
|------|-----|------|
| `exists` | `boolean` | Чи існує файл |
| `size` | `number` | Розмір у байтах |
| `contentPreview` | `string` | Перші 200 символів |

---

## 3.2 Оптимізація llms.txt

### Опис

AI-аналіз вмісту llms.txt на відповідність рекомендаціям.

### Алгоритм

```typescript
async function analyzeLlmsTxt(content: string): Promise<LlmsTxtAnalysis> {
  // Використовує GPT-4o-mini для аналізу
  // Критерії оцінки:
  // - Markdown структура
  // - Наявність ключових секцій (About, Services, Doctors, Contacts)
  // - Унікальні переваги
  // - Актуальність контактів
  // - Відсутність "шуму"
}
```

### Базовий скорінг (без AI)

```typescript
let score = 0;
if (exists) score += 50;           // Файл існує
if (content.trim().length > 0) score += 30;  // Має контент
if (size > 0 && size < 100000) score += 20;  // Розумний розмір
return Math.min(score, 100);
```

### Критерії ідеального llms.txt

1. ✅ Структурований у Markdown
2. ✅ Містить "скарбничі" URL (About, Services, Doctors, Contacts)
3. ✅ Короткі описи та переваги
4. ✅ Актуальні контакти та години роботи
5. ✅ Не заблокований robots.txt
6. ✅ Структуровані блоки (FAQ, ключові факти)
7. ✅ Без реклами та зайвої інформації

### Вихідні дані

| Поле | Тип | Опис |
|------|-----|------|
| `score` | `number` | 0-100 |
| `summary` | `string` | Короткий вердикт |
| `missing_sections` | `string[]` | Відсутні секції |
| `recommendations` | `string[]` | Рекомендації |

---

## 3.3-3.4 robots.txt

### Перевірка наявності

```typescript
async function checkRobotsTxt(baseUrl: string): Promise<{
  present: boolean;
  valid: boolean;
}> {
  const robotsTxtUrl = new URL('/robots.txt', baseUrl).toString();
  const response = await fetch(robotsTxtUrl, { method: 'GET' });

  if (response.ok) {
    const content = await response.text();
    const hasUserAgent = content.toLowerCase().includes('user-agent');
    return { present: true, valid: hasUserAgent };
  }

  return { present: false, valid: false };
}
```

### Критерії валідності

1. ✅ Містить директиву `User-agent`
2. ✅ Вказаний шлях до sitemap
3. ✅ Не блокує важливі сторінки
4. ✅ Дозволяє доступ до `/` 

### Приклад ідеальної конфігурації

```
User-agent: *
Disallow: /admin/
Disallow: /login/
Allow: /
Sitemap: https://example.com/sitemap.xml
```

---

## 3.5 HTTPS

### Алгоритм

```typescript
function checkHttps(url: string): boolean {
  return url.startsWith('https://');
}
```

### Логіка

- Просто перевіряємо чи URL починається з `https://`
- Додатково можна перевірити SSL-сертифікат

---

## 3.6 Мобільна адаптивність

### Алгоритм

```typescript
function checkMobileFriendly(
  html: string,
  mobilePageSpeedScore: number | null
): boolean {
  const $ = load(html);
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const goodMobileScore = mobilePageSpeedScore !== null && mobilePageSpeedScore >= 50;
  
  return hasViewport && goodMobileScore;
}
```

### Критерії

1. ✅ Наявність `<meta name="viewport">`
2. ✅ Mobile PageSpeed Score ≥ 50

---

## 3.7-3.14 Schema Markup

### Типи схем для перевірки

| Тип | Опис | Пріоритет |
|-----|------|-----------|
| `MedicalOrganization` | Медична організація | Високий |
| `LocalBusiness` | Локальний бізнес | Високий |
| `Physician` | Лікар | Середній |
| `MedicalSpecialty` | Медична спеціалізація | Середній |
| `MedicalProcedure` | Медична процедура | Середній |
| `FAQPage` | Сторінка FAQ | Середній |
| `Review` | Відгуки | Середній |
| `BreadcrumbList` | Хлібні крихти | Низький |

### Алгоритм парсингу JSON-LD

```typescript
function analyzeSchemaMarkup($: CheerioAPI): SchemaAnalysis {
  const allTypes: string[] = [];
  
  // Знаходимо всі JSON-LD блоки
  $('script[type="application/ld+json"]').each((_, element) => {
    const content = $(element).html();
    const schema = parseJsonLd(content);
    const types = extractSchemaTypes(schema);
    allTypes.push(...types);
  });

  // Перевіряємо наявність кожного типу
  return {
    hasMedicalOrganization: hasSchemaType(allTypes, ['MedicalOrganization', 'MedicalBusiness']),
    hasLocalBusiness: hasSchemaType(allTypes, ['LocalBusiness', 'MedicalBusiness']),
    hasPhysician: hasSchemaType(allTypes, ['Physician', 'MedicalDoctor']),
    hasMedicalSpecialty: hasSchemaType(allTypes, ['MedicalSpecialty']),
    hasMedicalProcedure: hasSchemaType(allTypes, ['MedicalProcedure', 'MedicalTest']),
    hasFAQPage: hasSchemaType(allTypes, ['FAQPage']),
    hasReview: hasSchemaType(allTypes, ['Review', 'AggregateRating']),
    hasBreadcrumbList: hasSchemaType(allTypes, ['BreadcrumbList'])
  };
}
```

### Нормалізація типів

```typescript
function hasSchemaType(types: string[], targetTypes: string[]): boolean {
  const normalizedTypes = types.map(t => 
    t.toLowerCase()
     .replace(/^https?:\/\/schema\.org\//, '')
     .replace(/^schema\.org\//, '')
  );
  
  return normalizedTypes.some(type =>
    targetTypes.some(target => 
      type === target.toLowerCase() ||
      type.includes(target.toLowerCase())
    )
  );
}
```

---

## 3.15-3.16 Lang та Hreflang

### Перевірка lang

```typescript
const lang = $('html').attr('lang') || null;
const isValid = lang !== null && lang.length >= 2;
```

### Перевірка hreflang

```typescript
function extractHreflangs($: CheerioAPI, baseUrl: string): HreflangEntry[] {
  const hreflangs: HreflangEntry[] = [];
  
  $('link[rel="alternate"][hreflang]').each((_, element) => {
    const lang = $(element).attr('hreflang');
    const href = $(element).attr('href');
    
    if (lang && href) {
      hreflangs.push({
        lang,
        url: new URL(href, baseUrl).toString()
      });
    }
  });

  return hreflangs;
}
```

### Логіка оцінки

- Якщо 1 мовна версія → hreflang необов'язковий
- Якщо 2+ мовних версій → перевіряємо коректність налаштувань

---

## 3.17 Зовнішні посилання

### Алгоритм

```typescript
async function checkLinksStatus(links: string[], targetDomain: string): Promise<ExternalLinkAnalysis> {
  const externalLinks = links.filter(link => 
    getDomain(link) !== targetDomain
  );

  // Обмеження: максимум 15 посилань
  const linksToCheck = externalLinks.slice(0, 15);

  const results = await Promise.allSettled(
    linksToCheck.map(async url => {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      return {
        url,
        status: response.status,
        isTrusted: isTrustedDomain(getDomain(url))
      };
    })
  );

  const broken = results.filter(r => 
    r.status === 'fulfilled' && 
    (r.value.status === 404 || r.value.status >= 500)
  ).length;

  return { total: externalLinks.length, broken, list: results };
}
```

### Список довірених доменів

```typescript
const trustedDomains = [
  'who.int',
  'nih.gov',
  'cdc.gov',
  'wikipedia.org',
  'mayo.edu',
  'clevelandclinic.org',
  'hopkinsmedicine.org',
  'webmd.com',
  'healthline.com',
  'medlineplus.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov'
];
```

---

## 3.18-3.20 Meta-теги

### Title

```typescript
const title = $('title').text().trim() || null;
const titleLength = title ? title.length : null;

// Валідація
const issues = [];
if (!title) {
  issues.push('Missing title tag');
} else if (titleLength < 30 || titleLength > 60) {
  issues.push(`Title length is ${titleLength} chars (recommended: 30-60)`);
}
```

**Критерії:**
- Оптимальна довжина: 50-60 символів
- Починається з ключового слова
- Включає геолокацію

### Description

```typescript
const description = $('meta[name="description"]').attr('content')?.trim() || null;
const descriptionLength = description ? description.length : null;

if (!description) {
  issues.push('Missing meta description');
} else if (descriptionLength < 120 || descriptionLength > 160) {
  issues.push(`Description length is ${descriptionLength} chars (recommended: 120-160)`);
}
```

### Canonical

```typescript
const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
const isCanonicalMatch = canonicalUrl === currentUrl;

if (!canonicalUrl) {
  issues.push('Missing canonical URL');
} else if (!isCanonicalMatch) {
  issues.push('Canonical URL does not match current URL');
}
```

---

## 3.21-3.23 Noindex, Nofollow, Дублікати

### Noindex перевірка

```typescript
const metaRobots = $('meta[name="robots"]').attr('content') || null;
const isIndexed = !metaRobots || !metaRobots.toLowerCase().includes('noindex');
```

**Вихід:** Список сторінок з noindex для ручної перевірки

### Nofollow рекомендації

- 70-80% посилань мають бути dofollow
- nofollow для: рекламних, партнерських, UGC

### Перевірка дублікатів

```typescript
async function checkTechnicalDuplicates(url: string): Promise<DuplicatesCheck> {
  const urlObj = new URL(url);
  
  // WWW vs non-WWW
  const wwwVariant = url.includes('www.') 
    ? url.replace('www.', '')
    : url.replace('://', '://www.');
  
  // Trailing slash
  const slashVariant = url.endsWith('/') 
    ? url.slice(0, -1) 
    : url + '/';
  
  // HTTP vs HTTPS
  const httpVariant = url.replace('https://', 'http://');

  return {
    wwwRedirect: await checkRedirect(url, wwwVariant),
    trailingSlash: await checkRedirect(url, slashVariant),
    httpRedirect: await checkRedirect(url, httpVariant)
  };
}
```

**Статуси:**
- `ok` — редірект працює правильно
- `duplicate` — обидва URL працюють (проблема)
- `error` — помилка перевірки

---

## 3.24-3.25 Швидкість (PageSpeed)

### Алгоритм

```typescript
async function fetchPageSpeed(
  url: string,
  strategy: 'mobile' | 'desktop'
): Promise<PageSpeedResult> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}`;
  
  const response = await fetch(apiUrl, {
    signal: AbortSignal.timeout(60000) // 60 секунд
  });

  const data = await response.json();
  
  return {
    score: Math.round(data.lighthouseResult.categories.performance.score * 100),
    metrics: {
      lcp: data.lighthouseResult.audits['largest-contentful-paint']?.numericValue,
      fcp: data.lighthouseResult.audits['first-contentful-paint']?.numericValue,
      cls: data.lighthouseResult.audits['cumulative-layout-shift']?.numericValue,
      tbt: data.lighthouseResult.audits['total-blocking-time']?.numericValue,
      ttfb: data.lighthouseResult.audits['server-response-time']?.numericValue
    }
  };
}
```

### TTFB (Time To First Byte)

```typescript
async function measureTTFB(url: string): Promise<PerformanceCheck> {
  const startTime = Date.now();
  
  await fetch(url, { signal: AbortSignal.timeout(10000) });
  
  const ttfbMs = Date.now() - startTime;
  
  return {
    ttfbMs,
    rating: ttfbMs < 600 ? 'Good' : 'Poor'
  };
}
```

**Константи:**
- `THRESHOLD_GOOD`: 600 ms
- `THRESHOLD_TIMEOUT`: 10000 ms

---

## Агрегований Tech Score

### Формула (рекомендована)

```typescript
function calculateTechScore(audit: TechAuditResult): number {
  let score = 0;
  let maxScore = 0;

  // Файли (20 балів)
  maxScore += 20;
  if (audit.files.llmsTxt.present) score += 8;
  if (audit.files.robots) score += 6;
  if (audit.files.sitemap) score += 6;

  // Безпека (15 балів)
  maxScore += 15;
  if (audit.security.https) score += 10;
  if (audit.security.mobileFriendly) score += 5;

  // Schema (25 балів)
  maxScore += 25;
  const schemaCount = Object.values(audit.schema).filter(v => v).length;
  score += Math.min(schemaCount * 3, 25);

  // Meta (20 балів)
  maxScore += 20;
  if (audit.meta.title) score += 5;
  if (audit.meta.description) score += 5;
  if (audit.meta.canonical) score += 5;
  if (audit.meta.lang) score += 5;

  // Швидкість (20 балів)
  maxScore += 20;
  if (audit.speed.desktop && audit.speed.desktop >= 50) score += 10;
  if (audit.speed.mobile && audit.speed.mobile >= 50) score += 10;

  return Math.round((score / maxScore) * 100);
}
```

---

## Edge Cases

### 1. Timeout при fetch

```typescript
try {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000)
  });
} catch (error) {
  if (error.name === 'TimeoutError') {
    return { exists: false, error: 'timeout' };
  }
  throw error;
}
```

### 2. Невалідний JSON-LD

```typescript
function parseJsonLd(content: string): JsonLdSchema | null {
  try {
    return JSON.parse(content);
  } catch {
    // Спроба unescaping HTML entities
    const unescaped = content
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    try {
      return JSON.parse(unescaped);
    } catch {
      return null; // Ігноруємо malformed JSON-LD
    }
  }
}
```

### 3. Відсутній API key

```typescript
if (!process.env.GOOGLE_PAGESPEED_API_KEY) {
  console.warn('GOOGLE_PAGESPEED_API_KEY not set, skipping PageSpeed check');
  return { score: null, metrics: {} };
}
```

---

## Залежності

### Зовнішні API

- **Google PageSpeed Insights API** — швидкість сайту
- **OpenAI API** — AI-аналіз llms.txt та загальний аналіз

### Внутрішні бібліотеки

- `cheerio` — парсинг HTML
- `fetch` — HTTP-запити

---

## Нотатки з міграції

### Старий код

- `apps/web/lib/modules/audit/live-scanner.ts` — базові перевірки
- `apps/web/lib/modules/audit/tech-audit-service.ts` — повний аудит
- `apps/web/lib/modules/audit/ephemeral-audit.ts` — "легкий" аудит
- `apps/web/lib/modules/audit/utils/html-parser.ts` — парсинг HTML
- `apps/web/lib/modules/audit/utils/llms-analyzer.ts` — AI-аналіз llms.txt
- `apps/web/lib/modules/audit/utils/tech-audit-analyzer.ts` — AI-аналіз аудиту

### Що винести

1. Чисту логіку перевірок без Supabase
2. Формули скорінгу
3. Константи (пороги, списки доменів)

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова специфікація на основі аналізу коду |
