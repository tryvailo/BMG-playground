# Оптимізація контенту (Content Optimization)

> **Модуль:** `engine/content-score.ts`  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Призначення

Модуль аналізу та оцінки контенту сайту з точки зору його оптимізації для GEO (Generative Engine Optimization). Оцінює структуру, повноту, унікальність та якість контенту.

---

## Структура модуля

| Показник | Вага | Опис |
|----------|------|------|
| 4.1 Сторінки напрямків | 10% | Окремі сторінки для напрямків |
| 4.2 Сторінки послуг | 15% | Детальні сторінки послуг |
| 4.3 Сторінки лікарів | 15% | Профілі лікарів |
| 4.4 Архітектура сайту | 15% | Внутрішнє лінкування |
| 4.5 Блог | 10% | Наявність та активність |
| 4.6 Унікальність контенту | 15% | Оригінальність тексту |
| 4.7 Водянистість тексту | 5% | Якість копірайту |
| 4.8 Авторитетність посилань | 5% | Якість зовнішніх посилань |
| 4.9 FAQ | 5% | Наявність FAQ |
| 4.10-4.11 Контакти | 5% | Адреса та телефон |

---

## 4.1 Сторінки напрямків

### Опис

Перевірка наявності окремих сторінок для кожного медичного напрямку (кардіологія, гінекологія тощо).

### Алгоритм

```typescript
interface DirectionPagesCheck {
  totalDirections: number;      // Всього напрямків у sitemap
  hasUniqueContent: boolean[];  // Чи унікальний контент кожної
  score: number;                // 0-100
}

async function checkDirectionPages(sitemapUrl: string): Promise<DirectionPagesCheck> {
  // 1. Парсинг sitemap.xml
  const urls = await parseSitemap(sitemapUrl);
  
  // 2. Фільтрація URL напрямків (за патернами)
  const directionUrls = urls.filter(url => 
    url.includes('/directions/') || 
    url.includes('/specialties/') ||
    url.includes('/напрямки/')
  );
  
  // 3. Перевірка унікальності контенту
  const uniquenessResults = await checkContentUniqueness(directionUrls);
  
  return {
    totalDirections: directionUrls.length,
    hasUniqueContent: uniquenessResults,
    score: calculateDirectionScore(directionUrls.length, uniquenessResults)
  };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Є окремі сторінки напрямків | +40 |
| Кожна сторінка має унікальний контент | +30 |
| Більше 5 напрямків | +15 |
| Більше 10 напрямків | +15 |

### Приклади

**Добрий:** Окремі сторінки "/cardiology", "/gynecology" з унікальним контентом

**Поганий:** Всі напрямки на одній сторінці "/services" без деталізації

---

## 4.2 Сторінки послуг

### Опис

Перевірка детальних сторінок для кожної послуги з описом, цінами, процедурою.

### Алгоритм

```typescript
interface ServicePagesCheck {
  totalServices: number;
  hasDetailedDescription: number;  // Кількість з описом >300 слів
  hasPricing: number;              // Кількість з цінами
  hasSchema: number;               // Кількість з MedicalProcedure schema
  score: number;
}

async function checkServicePages(urls: string[]): Promise<ServicePagesCheck> {
  const serviceUrls = urls.filter(url => 
    url.includes('/services/') || 
    url.includes('/procedures/')
  );
  
  const results = await Promise.all(
    serviceUrls.map(async url => {
      const html = await fetch(url).then(r => r.text());
      const $ = load(html);
      
      return {
        wordCount: $('main').text().split(/\s+/).length,
        hasPricing: $('*:contains("ціна")').length > 0 || 
                    $('*:contains("вартість")').length > 0,
        hasSchema: hasSchemaType($, ['MedicalProcedure'])
      };
    })
  );
  
  return {
    totalServices: serviceUrls.length,
    hasDetailedDescription: results.filter(r => r.wordCount > 300).length,
    hasPricing: results.filter(r => r.hasPricing).length,
    hasSchema: results.filter(r => r.hasSchema).length,
    score: calculateServiceScore(results)
  };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Є окремі сторінки послуг | +30 |
| Опис >300 слів на сторінці | +25 |
| Вказана вартість | +20 |
| Є MedicalProcedure schema | +25 |

---

## 4.3 Сторінки лікарів

### Опис

Перевірка персональних профілів лікарів з біографією, фото, спеціалізацією.

### Алгоритм

```typescript
interface DoctorPagesCheck {
  totalDoctors: number;
  hasPhoto: number;
  hasBio: number;           // >100 слів біографії
  hasCredentials: number;   // Дипломи, сертифікати
  hasExperience: number;    // Роки досвіду
  hasSchema: number;        // Physician schema
  score: number;
}

async function checkDoctorPages(urls: string[]): Promise<DoctorPagesCheck> {
  const doctorUrls = urls.filter(url => 
    url.includes('/doctors/') || 
    url.includes('/team/') ||
    url.includes('/лікарі/')
  );
  
  const results = await Promise.all(
    doctorUrls.map(async url => {
      const html = await fetch(url).then(r => r.text());
      const $ = load(html);
      
      return {
        hasPhoto: $('img[alt*="doctor"]').length > 0 || 
                  $('img[alt*="лікар"]').length > 0,
        hasBio: $('main').text().split(/\s+/).length > 100,
        hasCredentials: $('*:contains("сертифікат")').length > 0 ||
                        $('*:contains("диплом")').length > 0,
        hasExperience: $('*:contains("досвід")').length > 0 ||
                       $('*:contains("років")').length > 0,
        hasSchema: hasSchemaType($, ['Physician', 'MedicalDoctor'])
      };
    })
  );
  
  return calculateDoctorScore(results);
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Є окремі сторінки лікарів | +20 |
| Фото лікаря | +15 |
| Біографія >100 слів | +20 |
| Сертифікати/дипломи | +15 |
| Вказаний досвід | +15 |
| Physician schema | +15 |

---

## 4.4 Архітектура сайту

### Опис

Оцінка логічної структури, ієрархії та внутрішнього лінкування.

### Алгоритм

```typescript
interface SiteArchitectureCheck {
  maxDepth: number;           // Максимальна глибина вкладеності
  avgInternalLinks: number;   // Середня кількість внутрішніх посилань
  orphanPages: number;        // Сторінки без вхідних посилань
  circularLinking: boolean;   // Наявність кругових посилань
  score: number;
}

async function analyzeSiteArchitecture(urls: string[]): Promise<SiteArchitectureCheck> {
  const linkGraph = new Map<string, string[]>();
  
  // Будуємо граф посилань
  for (const url of urls) {
    const html = await fetch(url).then(r => r.text());
    const $ = load(html);
    const links = $('a[href^="/"]').map((_, el) => $(el).attr('href')).get();
    linkGraph.set(url, links);
  }
  
  // Аналізуємо граф
  return {
    maxDepth: calculateMaxDepth(linkGraph),
    avgInternalLinks: calculateAvgLinks(linkGraph),
    orphanPages: findOrphanPages(linkGraph),
    circularLinking: hasCircularLinking(linkGraph),
    score: calculateArchitectureScore(linkGraph)
  };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Глибина ≤3 рівні | +25 |
| Середня кількість посилань ≥5 | +25 |
| Немає orphan pages | +25 |
| Є кругове лінкування (Лікар→Послуга→Напрямок→Філія) | +25 |

---

## 4.5 Блог

### Опис

Перевірка наявності та активності блогу/статей.

### Алгоритм

```typescript
interface BlogCheck {
  exists: boolean;
  totalArticles: number;
  recentArticles: number;      // За останні 3 місяці
  avgWordCount: number;
  hasInternalLinks: boolean;   // Посилання на послуги
  updateFrequency: 'active' | 'moderate' | 'inactive';
  score: number;
}

async function checkBlog(baseUrl: string): Promise<BlogCheck> {
  const blogUrls = ['/blog', '/articles', '/статті', '/новини'];
  
  for (const path of blogUrls) {
    const response = await fetch(`${baseUrl}${path}`);
    if (response.ok) {
      const html = await response.text();
      const articles = parseArticles(html);
      
      return {
        exists: true,
        totalArticles: articles.length,
        recentArticles: articles.filter(a => isRecent(a.date, 90)).length,
        avgWordCount: calculateAvgWordCount(articles),
        hasInternalLinks: checkInternalLinks(articles),
        updateFrequency: determineFrequency(articles),
        score: calculateBlogScore(articles)
      };
    }
  }
  
  return { exists: false, score: 0 };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Блог існує | +20 |
| 20+ статей | +20 |
| Оновлення 2+ рази на місяць | +20 |
| Середня довжина >2000 слів | +20 |
| Посилання на послуги/лікарів | +20 |

**Поганий показник:** Блог не оновлювався 3-6 місяців, або <5 старих статей

---

## 4.6 Унікальність контенту

### Опис

Перевірка оригінальності текстів (відсутність плагіату).

### Алгоритм

```typescript
interface ContentUniquenessCheck {
  pagesChecked: number;
  avgUniqueness: number;       // Середній % унікальності
  duplicatePages: string[];    // Сторінки з унікальністю <80%
  score: number;
}

async function checkContentUniqueness(urls: string[]): Promise<ContentUniquenessCheck> {
  // Інтеграція з Copyleaks / власний аналізатор
  const results = await Promise.all(
    urls.slice(0, 20).map(async url => {
      const html = await fetch(url).then(r => r.text());
      const $ = load(html);
      const text = $('main').text();
      
      // Порівняння з іншими сторінками сайту
      const similarity = await checkSimilarity(text, urls);
      
      return {
        url,
        uniqueness: 100 - similarity
      };
    })
  );
  
  return {
    pagesChecked: results.length,
    avgUniqueness: avg(results.map(r => r.uniqueness)),
    duplicatePages: results.filter(r => r.uniqueness < 80).map(r => r.url),
    score: calculateUniquenessScore(results)
  };
}
```

### Критерії оцінки

| Рівень унікальності | Бали |
|---------------------|------|
| >95% | 100 |
| 90-95% | 80 |
| 80-90% | 60 |
| <80% | 20 |

**Формула:**
```
Score = avgUniqueness * (1 - duplicatePages.length / pagesChecked * 0.5)
```

---

## 4.7 Водянистість тексту

### Опис

Вимірювання частки "пустих" слів, що знижують якість контенту.

### Алгоритм

```typescript
interface WaterinessCheck {
  avgWateriness: number;   // Середній % водянистості
  score: number;
}

const STOP_WORDS = [
  'дуже', 'часто', 'багато', 'деякі', 'просто', 'також',
  'особливо', 'насправді', 'звичайно', 'зазвичай', 'досить',
  'можливо', 'мабуть', 'взагалі', 'якось', 'трохи'
];

function calculateWateriness(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const stopWordCount = words.filter(w => STOP_WORDS.includes(w)).length;
  
  return (stopWordCount / words.length) * 100;
}
```

### Критерії оцінки

| Водянистість | Оцінка | Бали |
|--------------|--------|------|
| <10% | Відмінно | 100 |
| 10-15% | Добре | 80 |
| 15-25% | Прийнятно | 60 |
| >25% | Погано | 30 |

**Норма для медичного контенту:** <25%

---

## 4.8 Авторитетність посилань і цитувань

### Опис

Перевірка якості зовнішніх посилань на авторитетні джерела.

### Алгоритм

```typescript
interface AuthoritativeLinksCheck {
  totalExternalLinks: number;
  authoritativeLinks: number;
  percentage: number;
  score: number;
}

const AUTHORITATIVE_DOMAINS = {
  // Міжнародні організації
  'who.int': true,
  'nih.gov': true,
  'cdc.gov': true,
  'ecdc.europa.eu': true,
  
  // Українські організації
  'moz.gov.ua': true,
  'phc.org.ua': true,
  
  // Наукові бази
  'pubmed.ncbi.nlm.nih.gov': true,
  'ncbi.nlm.nih.gov': true,
  'medlineplus.gov': true,
  'cochrane.org': true,
  
  // Медичні асоціації
  'ufmo.org.ua': true,
  'amzu.info': true,
  
  // Університети (домени .edu, .edu.ua)
  // Перевіряються окремо за патерном
};

function checkAuthoritativeLinks(externalLinks: string[]): AuthoritativeLinksCheck {
  const authoritative = externalLinks.filter(link => {
    const domain = getDomain(link);
    return AUTHORITATIVE_DOMAINS[domain] || 
           domain?.endsWith('.edu') ||
           domain?.endsWith('.edu.ua') ||
           domain?.endsWith('.gov') ||
           domain?.endsWith('.gov.ua');
  });
  
  return {
    totalExternalLinks: externalLinks.length,
    authoritativeLinks: authoritative.length,
    percentage: (authoritative.length / externalLinks.length) * 100,
    score: calculateAuthoritativeScore(authoritative.length, externalLinks.length)
  };
}
```

### Критерії оцінки

| % авторитетних посилань | Бали |
|-------------------------|------|
| >50% | 100 |
| 30-50% | 75 |
| 15-30% | 50 |
| <15% | 25 |

---

## 4.9 FAQ

### Опис

Перевірка наявності FAQ з відповідями на типові питання.

### Алгоритм

```typescript
interface FAQCheck {
  exists: boolean;
  questionsCount: number;
  avgAnswerLength: number;
  hasFAQSchema: boolean;
  score: number;
}

async function checkFAQ(html: string): Promise<FAQCheck> {
  const $ = load(html);
  
  // Шукаємо FAQ секцію
  const faqSection = $('#faq, .faq, [data-section="faq"]');
  
  if (faqSection.length === 0) {
    // Шукаємо за FAQPage schema
    const hasFAQSchema = hasSchemaType($, ['FAQPage']);
    return { exists: hasFAQSchema, questionsCount: 0, score: hasFAQSchema ? 30 : 0 };
  }
  
  // Парсимо питання-відповіді
  const questions = faqSection.find('dt, .question, h3, h4');
  const answers = faqSection.find('dd, .answer, p');
  
  return {
    exists: true,
    questionsCount: questions.length,
    avgAnswerLength: calculateAvgLength(answers),
    hasFAQSchema: hasSchemaType($, ['FAQPage']),
    score: calculateFAQScore(questions.length, answers)
  };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| FAQ існує | +30 |
| 10+ питань | +20 |
| Відповіді >200 слів | +25 |
| FAQPage schema | +25 |

**Поганий показник:** FAQ відсутній або <3 питань

---

## 4.10-4.11 Контактна інформація

### Адреса

```typescript
interface AddressCheck {
  hasAddress: boolean;
  hasBranches: boolean;
  branchesCount: number;
  score: number;
}

function checkAddress(html: string): AddressCheck {
  const $ = load(html);
  
  // Шукаємо адресу
  const addressPatterns = [
    /вул\.\s*[А-Яа-яЇїІіЄєҐґ\s\d,]+/,
    /м\.\s*[А-Яа-яЇїІіЄєҐґ]+/,
    /пр\.\s*[А-Яа-яЇїІіЄєҐґ\s\d]+/
  ];
  
  const text = $('body').text();
  const hasAddress = addressPatterns.some(p => p.test(text));
  
  // Перевіряємо LocalBusiness schema для філіалів
  const hasBranches = hasSchemaType($, ['LocalBusiness']);
  
  return {
    hasAddress,
    hasBranches,
    branchesCount: countBranches($),
    score: hasAddress ? 100 : 0
  };
}
```

### Телефон

```typescript
interface PhoneCheck {
  hasPhone: boolean;
  isClickable: boolean;   // tel: link
  score: number;
}

function checkPhone(html: string): PhoneCheck {
  const $ = load(html);
  
  // Шукаємо телефони
  const phoneLinks = $('a[href^="tel:"]');
  const hasPhone = phoneLinks.length > 0;
  
  // Альтернативно — пошук за патерном
  const phonePattern = /\+?\d{2,3}[\s-]?\(?\d{2,3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/;
  const hasPhoneText = phonePattern.test($('body').text());
  
  return {
    hasPhone: hasPhone || hasPhoneText,
    isClickable: phoneLinks.length > 0,
    score: hasPhone ? 100 : (hasPhoneText ? 70 : 0)
  };
}
```

---

## Агрегований Content Score

### Формула

```typescript
function calculateContentScore(checks: ContentChecks): number {
  const weights = {
    directions: 0.10,
    services: 0.15,
    doctors: 0.15,
    architecture: 0.15,
    blog: 0.10,
    uniqueness: 0.15,
    wateriness: 0.05,
    authoritative: 0.05,
    faq: 0.05,
    contacts: 0.05
  };
  
  return (
    checks.directions.score * weights.directions +
    checks.services.score * weights.services +
    checks.doctors.score * weights.doctors +
    checks.architecture.score * weights.architecture +
    checks.blog.score * weights.blog +
    checks.uniqueness.score * weights.uniqueness +
    (100 - checks.wateriness.avgWateriness) * weights.wateriness +
    checks.authoritative.score * weights.authoritative +
    checks.faq.score * weights.faq +
    checks.contacts.score * weights.contacts
  );
}
```

---

## Edge Cases

### 1. Сайт без блогу

```typescript
if (!blogCheck.exists) {
  // Не штрафувати занадто сильно — блог опціональний
  return { score: 30, reason: 'No blog found - consider adding one' };
}
```

### 2. Односторінковий сайт

```typescript
if (urls.length < 5) {
  return {
    score: 20,
    warning: 'Site has very few pages - expand content structure'
  };
}
```

### 3. Іноземномовний контент

```typescript
// Визначення мови для коректного аналізу водянистості
const lang = $('html').attr('lang') || detectLanguage(text);
const stopWords = STOP_WORDS[lang] || STOP_WORDS['uk'];
```

---

## Нотатки з міграції

### Поточний стан

На даний момент модуль content optimization **не має повної реалізації** в коді. Потрібно:

1. Створити сервіс для краулінгу сайту (sitemap парсер)
2. Імплементувати кожну перевірку окремо
3. Додати інтеграцію з AI для аналізу якості тексту
4. Створити агрегатор для фінального Content Score

### Рекомендовані залежності

- `firecrawl` — краулінг сайтів (вже є в проекті)
- `cheerio` — парсинг HTML
- OpenAI API — аналіз якості тексту

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова специфікація на основі Functionality.md |
