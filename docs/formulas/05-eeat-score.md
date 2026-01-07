# E-E-A-T показники (Experience, Expertise, Authoritativeness, Trustworthiness)

> **Модуль:** `engine/eeat-score.ts`  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Призначення

E-E-A-T — це чотири ключові критерії довіри до сайту від Google: Experience (Досвід), Expertise (Експертність), Authoritativeness (Авторитетність), Trustworthiness (Довіра). Особливо важливі для медичних сайтів (YMYL — Your Money Your Life).

---

## Структура модуля

| Показник | Вага | Опис |
|----------|------|------|
| 5.1 Автори | 10% | Автори статей з медичними регаліями |
| 5.2 Експертність лікарів | 15% | Підтверджена кваліфікація |
| 5.3 Досвід клініки | 15% | Кейси, роки роботи, кількість пацієнтів |
| 5.4 Репутація | 15% | Оцінки на зовнішніх платформах |
| 5.5 Історії пацієнтів | 10% | Case studies |
| 5.6 GEO + NAP | 10% | Консистентність даних |
| 5.7 Прозорість | 10% | Контакти, юрособа |
| 5.8 Ліцензії | 5% | Акредитації та ліцензії |
| 5.9 Наукові джерела | 5% | Посилання на дослідження |
| 5.10 Приватність | 2.5% | Privacy Policy |
| 5.11 Взаємодія зі спільнотою | 2.5% | Конференції, публікації |

---

## 5.1 Автори статей

### Опис

Перевірка чи вказані автори з медичними регаліями на статтях блогу.

### Алгоритм

```typescript
interface AuthorsCheck {
  totalBlogPages: number;
  pagesWithAuthor: number;
  authorsWithCredentials: number;   // Дипломи, сертифікати
  percentage: number;
  score: number;
}

async function checkAuthors(blogUrls: string[]): Promise<AuthorsCheck> {
  const results = await Promise.all(
    blogUrls.map(async url => {
      const html = await fetch(url).then(r => r.text());
      const $ = load(html);
      
      // Шукаємо блок автора
      const authorBlock = $('.author, [rel="author"], .post-author, .article-author');
      const hasAuthor = authorBlock.length > 0;
      
      if (!hasAuthor) return { hasAuthor: false, hasCredentials: false };
      
      // Перевіряємо регалії
      const authorText = authorBlock.text().toLowerCase();
      const hasCredentials = 
        authorText.includes('к.м.н') ||
        authorText.includes('д.м.н') ||
        authorText.includes('лікар') ||
        authorText.includes('доктор') ||
        authorText.includes('сертифік') ||
        authorText.includes('member') ||
        authorText.includes('стаж');
      
      return { hasAuthor: true, hasCredentials };
    })
  );
  
  const pagesWithAuthor = results.filter(r => r.hasAuthor).length;
  const authorsWithCredentials = results.filter(r => r.hasCredentials).length;
  
  return {
    totalBlogPages: blogUrls.length,
    pagesWithAuthor,
    authorsWithCredentials,
    percentage: (pagesWithAuthor / blogUrls.length) * 100,
    score: calculateAuthorsScore(pagesWithAuthor, authorsWithCredentials, blogUrls.length)
  };
}
```

### Формула

```
Authors Score = (pagesWithAuthor / totalBlogPages) × 50 + 
                (authorsWithCredentials / pagesWithAuthor) × 50
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| 100% статей з автором | 50 |
| 100% авторів з регаліями | 50 |

---

## 5.2 Експертність лікарів

### Опис

Перевірка підтвердження досвіду та кваліфікації лікарів.

### Алгоритм

```typescript
interface DoctorExpertiseCheck {
  totalDoctors: number;
  withDiploma: number;
  withCertificates: number;
  withAssociations: number;    // Членство в асоціаціях
  withYearsExperience: number; // Вказані роки досвіду
  score: number;
}

async function checkDoctorExpertise(doctorUrls: string[]): Promise<DoctorExpertiseCheck> {
  const results = await Promise.all(
    doctorUrls.map(async url => {
      const html = await fetch(url).then(r => r.text());
      const $ = load(html);
      const text = $('main').text().toLowerCase();
      
      return {
        hasDiploma: text.includes('диплом') || text.includes('освіта'),
        hasCertificates: text.includes('сертифікат') || text.includes('курс'),
        hasAssociations: text.includes('асоціац') || text.includes('член') || text.includes('товариств'),
        hasYears: /\d+\s*(років|рік|років досвіду|years)/i.test(text)
      };
    })
  );
  
  return {
    totalDoctors: doctorUrls.length,
    withDiploma: results.filter(r => r.hasDiploma).length,
    withCertificates: results.filter(r => r.hasCertificates).length,
    withAssociations: results.filter(r => r.hasAssociations).length,
    withYearsExperience: results.filter(r => r.hasYears).length,
    score: calculateExpertiseScore(results, doctorUrls.length)
  };
}
```

### Формула

```
Expertise Score = (withCredentials / totalDoctors) × 100

де withCredentials = лікарі з хоча б 2 з 4 показників
```

---

## 5.3 Досвід клініки

### Опис

Демонстрація реального досвіду: кейси, роки роботи, кількість пацієнтів.

### Алгоритм

```typescript
interface ClinicExperienceCheck {
  hasYearsInBusiness: boolean;
  yearsValue: number | null;
  hasPatientCount: boolean;
  patientCountValue: number | null;
  hasCaseStudies: boolean;
  caseStudiesCount: number;
  score: number;
}

async function checkClinicExperience(baseUrl: string): Promise<ClinicExperienceCheck> {
  const aboutUrl = await findAboutPage(baseUrl);
  const html = await fetch(aboutUrl).then(r => r.text());
  const $ = load(html);
  const text = $('main').text();
  
  // Роки роботи
  const yearsMatch = text.match(/(\d+)\s*(років|рік|years)/i);
  const yearsValue = yearsMatch ? parseInt(yearsMatch[1]) : null;
  
  // Кількість пацієнтів
  const patientsMatch = text.match(/(\d+[\s,\d]*)\s*(пацієнт|patient|операц|процедур)/i);
  const patientCountValue = patientsMatch 
    ? parseInt(patientsMatch[1].replace(/\s|,/g, '')) 
    : null;
  
  // Кейси
  const casesUrl = await findCasesPage(baseUrl);
  const caseStudiesCount = casesUrl ? await countCaseStudies(casesUrl) : 0;
  
  return {
    hasYearsInBusiness: yearsValue !== null,
    yearsValue,
    hasPatientCount: patientCountValue !== null,
    patientCountValue,
    hasCaseStudies: caseStudiesCount > 0,
    caseStudiesCount,
    score: calculateExperienceScore(yearsValue, patientCountValue, caseStudiesCount)
  };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Вказані роки роботи | +25 |
| Вказана кількість пацієнтів | +25 |
| Є кейси (>5) | +25 |
| Кейси з деталями (етапи лікування) | +25 |

---

## 5.4 Репутація

### Опис

Публічні оцінки на зовнішніх платформах.

### Алгоритм

```typescript
interface ReputationCheck {
  googleMaps: { rating: number; reviewCount: number } | null;
  docUa: { rating: number; reviewCount: number } | null;
  likarni: { rating: number; reviewCount: number } | null;
  avgRating: number;
  totalReviews: number;
  score: number;
}

async function checkReputation(clinicName: string, city: string): Promise<ReputationCheck> {
  // Google Maps API / Scraping
  const googleMaps = await getGoogleMapsRating(clinicName, city);
  
  // Doc.ua API / Scraping
  const docUa = await getDocUaRating(clinicName);
  
  // Likarni.com API / Scraping
  const likarni = await getLikarniRating(clinicName);
  
  // Агрегація (ігноруємо платформи де клініки немає)
  const ratings = [googleMaps, docUa, likarni].filter(r => r !== null);
  const avgRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0;
  const totalReviews = ratings.reduce((sum, r) => sum + r.reviewCount, 0);
  
  return {
    googleMaps,
    docUa,
    likarni,
    avgRating,
    totalReviews,
    score: calculateReputationScore(avgRating, totalReviews)
  };
}
```

### Формула

```
Reputation Score = (avgRating / 5) × 60 + min(totalReviews / 200, 1) × 40
```

### Критерії оцінки

| Рейтинг | Бали |
|---------|------|
| 4.7+ з 200+ відгуків | 100 |
| 4.5+ з 100+ відгуків | 80 |
| 4.0+ з 50+ відгуків | 60 |
| <4.0 або мало відгуків | 20-40 |

---

## 5.5 Історії пацієнтів (Case Studies)

### Опис

Наявність структурованих кейсів лікування.

### Алгоритм

```typescript
interface CaseStudiesCheck {
  hasCasesSection: boolean;
  totalCases: number;
  structuredCases: number;  // Скарга → Діагностика → Лікування → Результат
  casesPerSpecialty: Record<string, number>;
  score: number;
}

async function checkCaseStudies(casesUrl: string): Promise<CaseStudiesCheck> {
  const html = await fetch(casesUrl).then(r => r.text());
  const $ = load(html);
  
  const caseItems = $('.case, .case-study, article');
  const totalCases = caseItems.length;
  
  let structuredCases = 0;
  
  caseItems.each((_, el) => {
    const text = $(el).text().toLowerCase();
    const hasComplaint = text.includes('скарга') || text.includes('проблема');
    const hasDiagnosis = text.includes('діагноз') || text.includes('обстеження');
    const hasTreatment = text.includes('лікування') || text.includes('терапія');
    const hasResult = text.includes('результат') || text.includes('після');
    
    if (hasComplaint && hasDiagnosis && hasTreatment && hasResult) {
      structuredCases++;
    }
  });
  
  return {
    hasCasesSection: totalCases > 0,
    totalCases,
    structuredCases,
    casesPerSpecialty: groupCasesBySpecialty(caseItems),
    score: calculateCaseStudiesScore(totalCases, structuredCases)
  };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Є розділ кейсів | +20 |
| 10+ кейсів | +30 |
| Структуровані кейси (4 етапи) | +30 |
| Кейси по різних напрямках | +20 |

---

## 5.6 GEO + NAP Консистентність

### Опис

Однакові NAP (Name, Address, Phone) дані на сайті та в каталогах.

### Алгоритм

```typescript
interface NAPConsistencyCheck {
  siteNAP: { name: string; address: string; phone: string };
  googleNAP: { name: string; address: string; phone: string } | null;
  catalogNAPs: Array<{ source: string; name: string; address: string; phone: string }>;
  matchPercentage: number;
  score: number;
}

async function checkNAPConsistency(siteUrl: string, clinicName: string): Promise<NAPConsistencyCheck> {
  // Отримуємо NAP з сайту
  const siteNAP = await extractNAPFromSite(siteUrl);
  
  // Отримуємо NAP з Google Business Profile
  const googleNAP = await getGoogleBusinessNAP(clinicName);
  
  // Отримуємо NAP з медичних каталогів
  const catalogNAPs = await getCatalogNAPs(clinicName, [
    'doc.ua',
    'likarni.com',
    'helsi.me'
  ]);
  
  // Порівнюємо
  const allNAPs = [googleNAP, ...catalogNAPs].filter(n => n !== null);
  const matches = allNAPs.filter(n => 
    normalizeNAP(n).equals(normalizeNAP(siteNAP))
  );
  
  return {
    siteNAP,
    googleNAP,
    catalogNAPs,
    matchPercentage: (matches.length / allNAPs.length) * 100,
    score: calculateNAPScore(matches.length, allNAPs.length)
  };
}
```

### Формула

```
NAP Score = (matchingProfiles / totalProfiles) × 100
```

---

## 5.7 Прозорість контактів і власності

### Опис

Наявність повної інформації про юрособу, контакти, підрозділи.

### Алгоритм

```typescript
interface TransparencyCheck {
  hasLegalEntity: boolean;      // Юридична назва
  hasFullAddress: boolean;      // Повна адреса
  hasPhoneNumbers: boolean;     // Телефони
  hasEmail: boolean;            // Email
  hasContactForm: boolean;      // Форма зворотного зв'язку
  hasMap: boolean;              // Карта розташування
  hasWorkingHours: boolean;     // Години роботи
  score: number;
}

async function checkTransparency(contactUrl: string): Promise<TransparencyCheck> {
  const html = await fetch(contactUrl).then(r => r.text());
  const $ = load(html);
  const text = $('main').text().toLowerCase();
  
  return {
    hasLegalEntity: text.includes('тов') || text.includes('фоп') || text.includes('пп'),
    hasFullAddress: /вул\.\s*.+,\s*\d+/.test(text),
    hasPhoneNumbers: /\+?\d{2,3}[\s-]?\(?\d{2,3}\)?/.test(text),
    hasEmail: $('a[href^="mailto:"]').length > 0,
    hasContactForm: $('form').length > 0,
    hasMap: $('iframe[src*="google.com/maps"], .map, #map').length > 0,
    hasWorkingHours: text.includes('години роботи') || text.includes('графік'),
    score: calculateTransparencyScore(checks)
  };
}
```

### Критерії оцінки

| Критерій | Бали |
|----------|------|
| Юрособа | +15 |
| Повна адреса | +15 |
| Телефони | +15 |
| Email | +10 |
| Форма зв'язку | +15 |
| Карта | +15 |
| Години роботи | +15 |

---

## 5.8 Ліцензії та акредитації

### Опис

Відображення медичних ліцензій та акредитацій.

### Алгоритм

```typescript
interface LicensesCheck {
  hasLicenseSection: boolean;
  licenseCount: number;
  hasLicenseImages: boolean;  // Скани ліцензій
  hasAccreditations: boolean;
  score: number;
}

async function checkLicenses(baseUrl: string): Promise<LicensesCheck> {
  // Шукаємо сторінку ліцензій
  const licenseUrls = ['/licenses', '/ліцензії', '/documents', '/about'];
  
  for (const path of licenseUrls) {
    const html = await fetch(`${baseUrl}${path}`).then(r => r.text());
    const $ = load(html);
    const text = $('main').text().toLowerCase();
    
    if (text.includes('ліцензі') || text.includes('license')) {
      return {
        hasLicenseSection: true,
        licenseCount: (text.match(/ліцензі/g) || []).length,
        hasLicenseImages: $('img[alt*="ліцензі"], img[src*="license"]').length > 0,
        hasAccreditations: text.includes('акредитац') || text.includes('iso'),
        score: calculateLicensesScore(...)
      };
    }
  }
  
  return { hasLicenseSection: false, score: 0 };
}
```

---

## 5.9 Наукові джерела

### Опис

Посилання на наукові дослідження у медичних статтях.

### Алгоритм

```typescript
interface ScientificSourcesCheck {
  totalMedicalArticles: number;
  articlesWithSources: number;
  percentage: number;
  sourceTypes: {
    pubmed: number;
    journals: number;
    guidelines: number;
  };
  score: number;
}

const SCIENTIFIC_DOMAINS = [
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'doi.org',
  'sciencedirect.com',
  'nature.com',
  'thelancet.com',
  'nejm.org',
  'bmj.com',
  'jamanetwork.com'
];

async function checkScientificSources(blogUrls: string[]): Promise<ScientificSourcesCheck> {
  const results = await Promise.all(
    blogUrls.map(async url => {
      const html = await fetch(url).then(r => r.text());
      const $ = load(html);
      const links = $('a[href]').map((_, el) => $(el).attr('href')).get();
      
      const scientificLinks = links.filter(link => 
        SCIENTIFIC_DOMAINS.some(domain => link?.includes(domain))
      );
      
      return scientificLinks.length > 0;
    })
  );
  
  return {
    totalMedicalArticles: blogUrls.length,
    articlesWithSources: results.filter(r => r).length,
    percentage: (results.filter(r => r).length / blogUrls.length) * 100,
    score: calculateScientificScore(results)
  };
}
```

### Формула

```
Scientific Score = (articlesWithSources / totalMedicalArticles) × 100
```

---

## 5.10 Приватність

### Опис

Наявність Privacy Policy та Terms of Service.

### Алгоритм

```typescript
interface PrivacyCheck {
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;
  hasGDPRCompliance: boolean;
  hasCookiePolicy: boolean;
  score: number;
}

async function checkPrivacy(baseUrl: string): Promise<PrivacyCheck> {
  const privacyUrls = ['/privacy', '/privacy-policy', '/політика-конфіденційності'];
  const termsUrls = ['/terms', '/terms-of-service', '/умови-використання'];
  
  const hasPrivacy = await checkUrlsExist(baseUrl, privacyUrls);
  const hasTerms = await checkUrlsExist(baseUrl, termsUrls);
  
  // Перевіряємо GDPR compliance
  const homeHtml = await fetch(baseUrl).then(r => r.text());
  const $ = load(homeHtml);
  const hasCookieBanner = $('.cookie, [data-cookie], #cookie').length > 0;
  
  return {
    hasPrivacyPolicy: hasPrivacy,
    hasTermsOfService: hasTerms,
    hasGDPRCompliance: hasCookieBanner,
    hasCookiePolicy: hasCookieBanner,
    score: calculatePrivacyScore(hasPrivacy, hasTerms, hasCookieBanner)
  };
}
```

---

## 5.11 Взаємодія зі спільнотою

### Опис

Участь у конференціях, публікації в журналах, згадки в ЗМІ.

### Алгоритм

```typescript
interface CommunityCheck {
  hasConferenceMentions: boolean;
  hasPublications: boolean;
  hasProfessionalMemberships: boolean;
  hasMediaMentions: boolean;
  score: number;
}

async function checkCommunityEngagement(aboutUrl: string): Promise<CommunityCheck> {
  const html = await fetch(aboutUrl).then(r => r.text());
  const $ = load(html);
  const text = $('main').text().toLowerCase();
  
  return {
    hasConferenceMentions: 
      text.includes('конференц') || 
      text.includes('доповід') ||
      text.includes('виступ'),
    hasPublications: 
      text.includes('публікац') || 
      text.includes('стаття') ||
      text.includes('journal'),
    hasProfessionalMemberships: 
      text.includes('член') || 
      text.includes('асоціац') ||
      text.includes('товариств'),
    hasMediaMentions: 
      text.includes('згад') || 
      text.includes('інтерв\'ю') ||
      text.includes('пресс'),
    score: calculateCommunityScore(checks)
  };
}
```

---

## Агрегований E-E-A-T Score

### Формула

```typescript
function calculateEEATScore(checks: EEATChecks): number {
  const weights = {
    authors: 0.10,
    doctorExpertise: 0.15,
    clinicExperience: 0.15,
    reputation: 0.15,
    caseStudies: 0.10,
    napConsistency: 0.10,
    transparency: 0.10,
    licenses: 0.05,
    scientificSources: 0.05,
    privacy: 0.025,
    community: 0.025
  };
  
  return (
    checks.authors.score * weights.authors +
    checks.doctorExpertise.score * weights.doctorExpertise +
    checks.clinicExperience.score * weights.clinicExperience +
    checks.reputation.score * weights.reputation +
    checks.caseStudies.score * weights.caseStudies +
    checks.napConsistency.score * weights.napConsistency +
    checks.transparency.score * weights.transparency +
    checks.licenses.score * weights.licenses +
    checks.scientificSources.score * weights.scientificSources +
    checks.privacy.score * weights.privacy +
    checks.community.score * weights.community
  );
}
```

---

## Edge Cases

### 1. Клініка без блогу

```typescript
if (blogUrls.length === 0) {
  return {
    authorsScore: 50,  // Нейтральна оцінка, не штрафуємо
    scientificSourcesScore: 50
  };
}
```

### 2. Клініка без профілів лікарів

```typescript
if (doctorUrls.length === 0) {
  return {
    score: 20,
    warning: 'No doctor profiles found - critical for E-E-A-T'
  };
}
```

### 3. Відсутність на зовнішніх платформах

```typescript
if (!googleNAP && catalogNAPs.length === 0) {
  return {
    napScore: 30,
    warning: 'Clinic not found on external platforms'
  };
}
```

---

## Залежності

### Зовнішні API

- **Google Places API** — рейтинг та відгуки
- **Scraping** — doc.ua, likarni.com (якщо немає API)

### Внутрішні модулі

- `engine/html-parser.ts` — парсинг сторінок
- `engine/url-finder.ts` — пошук специфічних сторінок

---

## Нотатки з міграції

### Поточний стан

Модуль E-E-A-T **частково реалізований** в коді:
- Trust Score та Local Score обчислюються в `ai/scanner.ts`
- Інші метрики потребують окремої імплементації

### Код для міграції

```typescript
// З apps/web/lib/modules/ai/scanner.ts
trustScore: number; // 1-10, E-E-A-T trust score
localScore: number; // 1-10, Local score
```

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова специфікація на основі Functionality.md |
