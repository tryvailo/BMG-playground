/**
 * Meta Tags Analyzer
 * 
 * Analyzes Title and Description meta tags for GEO optimization quality.
 */

/*
 * -------------------------------------------------------
 * Type Definitions
 * -------------------------------------------------------
 */

export interface TitleAnalysis {
  title: string;
  length: number;
  isOptimalLength: boolean; // 50-60 characters
  isTooShort: boolean; // < 30 characters
  isTooLong: boolean; // > 70 characters
  hasLocalKeyword: boolean; // Contains city name
  detectedCity: string | null;
  isGeneric: boolean; // "Головна", "Home", etc.
  startsWithKeyword: boolean; // Keyword at the beginning
  hasBrandSeparator: boolean; // Contains | or - for brand
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

export interface DescriptionAnalysis {
  description: string;
  length: number;
  isOptimalLength: boolean; // 150-160 characters
  isTooShort: boolean; // < 100 characters
  isTooLong: boolean; // > 200 characters
  hasCallToAction: boolean; // "Записатися", "Дізнатися", etc.
  hasBenefits: boolean; // Contains numbers or benefit words
  isDifferentFromTitle: boolean;
  isGeneric: boolean; // Very short or generic text
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

export interface CanonicalAnalysis {
  canonical: string | null;
  hasCanonical: boolean;
  isSelfReferencing: boolean; // Points to itself (good)
  isAbsoluteUrl: boolean; // Uses absolute URL (good)
  matchesCurrentUrl: boolean; // Matches the page URL
  hasDifferentProtocol: boolean; // HTTP vs HTTPS mismatch
  hasDifferentDomain: boolean; // Points to different domain
  hasTrailingSlashIssue: boolean; // Inconsistent trailing slash
  hasQueryParams: boolean; // Contains query parameters
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

/*
 * -------------------------------------------------------
 * Constants
 * -------------------------------------------------------
 */

/**
 * Ukrainian cities for local keyword detection
 */
const UKRAINIAN_CITIES = [
  'київ', 'kyiv', 'kiev',
  'львів', 'lviv',
  'харків', 'kharkiv',
  'одеса', 'odesa', 'odessa',
  'дніпро', 'dnipro',
  'запоріжжя', 'zaporizhzhia',
  'вінниця', 'vinnytsia',
  'полтава', 'poltava',
  'чернігів', 'chernihiv',
  'черкаси', 'cherkasy',
  'суми', 'sumy',
  'житомир', 'zhytomyr',
  'миколаїв', 'mykolaiv',
  'херсон', 'kherson',
  'рівне', 'rivne',
  'тернопіль', 'ternopil',
  'івано-франківськ', 'ivano-frankivsk',
  'луцьк', 'lutsk',
  'ужгород', 'uzhhorod',
  'хмельницький', 'khmelnytskyi',
  'кропивницький', 'kropyvnytskyi',
];

/**
 * Generic/bad title patterns
 */
const GENERIC_TITLE_PATTERNS = [
  /^головна$/i,
  /^home$/i,
  /^main$/i,
  /^index$/i,
  /^untitled$/i,
  /^без назви$/i,
  /^новий документ$/i,
  /^сайт$/i,
  /^website$/i,
];

/**
 * Call-to-action patterns for descriptions
 */
const CTA_PATTERNS = [
  /записатис[яь]/i,
  /запис на/i,
  /дізнатис[яь]/i,
  /дізнайтес[яь]/i,
  /звернітьс[яь]/i,
  /зверніться/i,
  /телефонуйте/i,
  /зателефонуйте/i,
  /замовити/i,
  /замовляйте/i,
  /консультаці[яюї]/i,
  /безкоштовн/i,
  /отримайте/i,
  /отримати/i,
  /читайте/i,
  /дізнайтеся більше/i,
  /докладніше/i,
  /детальніше/i,
  /call now/i,
  /book now/i,
  /schedule/i,
  /contact us/i,
  /learn more/i,
  /get started/i,
];

/**
 * Benefit/value patterns (numbers, percentages, etc.)
 */
const BENEFIT_PATTERNS = [
  /\d+\s*рок/i, // X років досвіду
  /\d+\s*year/i,
  /\d+\s*пацієнт/i, // X пацієнтів
  /\d+\s*patient/i,
  /\d+\s*операц/i, // X операцій
  /\d+\s*лікар/i, // X лікарів
  /\d+\s*doctor/i,
  /\d+%/,
  /знижк[аи]/i, // Знижка
  /акці[яї]/i, // Акція
  /безкоштовн/i, // Безкоштовно
  /free/i,
  /сучасн/i, // Сучасне обладнання
  /modern/i,
  /professional/i,
  /експерт/i,
  /кваліфікован/i,
  /certified/i,
  /licensed/i,
  /досвід/i,
  /experience/i,
];

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Detect city in text
 */
function detectCity(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  for (const city of UKRAINIAN_CITIES) {
    if (lowerText.includes(city)) {
      // Return properly capitalized city name
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  
  return null;
}

/**
 * Check if title is generic
 */
function isGenericTitle(title: string): boolean {
  const trimmed = title.trim();
  
  for (const pattern of GENERIC_TITLE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }
  
  // Also check if too short (likely generic)
  if (trimmed.length < 10) {
    return true;
  }
  
  return false;
}

/**
 * Check if text has call-to-action
 */
function hasCallToAction(text: string): boolean {
  for (const pattern of CTA_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if text has benefits/value propositions
 */
function hasBenefits(text: string): boolean {
  for (const pattern of BENEFIT_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if title starts with a keyword (not a brand)
 * A good title should start with the main keyword, not the brand
 */
function startsWithKeyword(title: string): boolean {
  const trimmed = title.trim();
  
  // If it starts with common brand patterns, it doesn't start with keyword
  const brandFirstPatterns = [
    /^[A-ZА-ЯІЇЄ][a-zа-яіїє]+\s*[-|–—]/i, // "Клініка - ..." or "Клініка | ..."
    /^(ТОВ|ПП|ФОП|LLC|Inc)/i,
  ];
  
  for (const pattern of brandFirstPatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }
  
  // If it contains a separator and brand is first, it's not keyword-first
  if (/^[^|–—-]+\s*[-|–—]\s*/.test(trimmed)) {
    // Check if the first part looks like a service/keyword
    const firstPart = trimmed.split(/[-|–—]/)[0]?.trim() || '';
    // If first part is short (< 20 chars), might be a brand
    if (firstPart.length < 20 && !/послуг|лікуван|консультац|прийом|діагностик/i.test(firstPart)) {
      return false;
    }
  }
  
  return true;
}

/*
 * -------------------------------------------------------
 * Main Analysis Functions
 * -------------------------------------------------------
 */

/**
 * Analyze title tag quality
 */
export function analyzeTitle(title: string | null): TitleAnalysis {
  const cleanTitle = (title || '').trim();
  const length = cleanTitle.length;
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  
  // Empty title check
  if (!cleanTitle) {
    return {
      title: '',
      length: 0,
      isOptimalLength: false,
      isTooShort: true,
      isTooLong: false,
      hasLocalKeyword: false,
      detectedCity: null,
      isGeneric: true,
      startsWithKeyword: false,
      hasBrandSeparator: false,
      issues: ['Title відсутній'],
      recommendations: ['Додайте унікальний заголовок сторінки'],
      score: 0,
    };
  }
  
  // Length analysis
  const isOptimalLength = length >= 50 && length <= 60;
  const isTooShort = length < 30;
  const isTooLong = length > 70;
  
  if (isOptimalLength) {
    score += 30;
  } else if (isTooShort) {
    issues.push(`Title занадто короткий (${length} симв., потрібно 50-60)`);
    recommendations.push('Розширте заголовок, додайте ключові слова та локацію');
    score += 10;
  } else if (isTooLong) {
    issues.push(`Title занадто довгий (${length} симв., оптимально 50-60)`);
    recommendations.push('Скоротіть заголовок до 60 символів');
    score += 15;
  } else {
    score += 20; // Acceptable but not optimal
  }
  
  // Local keyword check
  const detectedCity = detectCity(cleanTitle);
  const hasLocalKeyword = detectedCity !== null;
  
  if (hasLocalKeyword) {
    score += 20;
  } else {
    issues.push('Немає локального ключового слова (назва міста)');
    recommendations.push('Додайте назву міста для покращення локального SEO');
  }
  
  // Generic title check
  const isGeneric = isGenericTitle(cleanTitle);
  
  if (isGeneric) {
    issues.push('Заголовок занадто загальний');
    recommendations.push('Замініть на описовий заголовок з назвою послуги');
    score -= 20;
  } else {
    score += 20;
  }
  
  // Keyword-first check
  const keywordFirst = startsWithKeyword(cleanTitle);
  
  if (keywordFirst) {
    score += 15;
  } else {
    issues.push('Ключове слово не на початку заголовка');
    recommendations.push('Розмістіть основне ключове слово на початку title');
  }
  
  // Brand separator check
  const hasBrandSeparator = /[-|–—]/.test(cleanTitle);
  
  if (hasBrandSeparator) {
    score += 15;
  }
  
  // Normalize score
  score = Math.max(0, Math.min(100, score));
  
  return {
    title: cleanTitle,
    length,
    isOptimalLength,
    isTooShort,
    isTooLong,
    hasLocalKeyword,
    detectedCity,
    isGeneric,
    startsWithKeyword: keywordFirst,
    hasBrandSeparator,
    issues,
    recommendations,
    score,
  };
}

/**
 * Analyze description meta tag quality
 */
export function analyzeDescription(
  description: string | null,
  title: string | null,
): DescriptionAnalysis {
  const cleanDescription = (description || '').trim();
  const cleanTitle = (title || '').trim();
  const length = cleanDescription.length;
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  
  // Empty description check
  if (!cleanDescription) {
    return {
      description: '',
      length: 0,
      isOptimalLength: false,
      isTooShort: true,
      isTooLong: false,
      hasCallToAction: false,
      hasBenefits: false,
      isDifferentFromTitle: true,
      isGeneric: true,
      issues: ['Meta description відсутній'],
      recommendations: ['Додайте унікальний опис сторінки'],
      score: 0,
    };
  }
  
  // Length analysis
  const isOptimalLength = length >= 150 && length <= 160;
  const isTooShort = length < 100;
  const isTooLong = length > 200;
  
  if (isOptimalLength) {
    score += 30;
  } else if (isTooShort) {
    issues.push(`Description занадто короткий (${length} симв., потрібно 150-160)`);
    recommendations.push('Розширте опис, додайте деталі про послуги та переваги');
    score += 10;
  } else if (isTooLong) {
    issues.push(`Description занадто довгий (${length} симв., оптимально 150-160)`);
    recommendations.push('Скоротіть опис до 160 символів щоб уникнути обрізання');
    score += 15;
  } else {
    score += 20;
  }
  
  // CTA check
  const hasCTA = hasCallToAction(cleanDescription);
  
  if (hasCTA) {
    score += 20;
  } else {
    issues.push('Немає заклику до дії');
    recommendations.push('Додайте CTA: "Записатися", "Дізнатися більше", "Безкоштовна консультація"');
  }
  
  // Benefits check
  const hasBenefitsFlag = hasBenefits(cleanDescription);
  
  if (hasBenefitsFlag) {
    score += 20;
  } else {
    issues.push('Немає переваг або цифр');
    recommendations.push('Додайте конкретні переваги: досвід, кількість пацієнтів, рейтинг');
  }
  
  // Different from title check
  const isDifferent = cleanDescription.toLowerCase() !== cleanTitle.toLowerCase() &&
    !cleanDescription.toLowerCase().startsWith(cleanTitle.toLowerCase());
  
  if (isDifferent) {
    score += 15;
  } else {
    issues.push('Description повторює Title');
    recommendations.push('Опис має доповнювати заголовок, а не дублювати його');
  }
  
  // Generic check
  const isGeneric = length < 50 || /^(опис|description|about|про нас|головна)$/i.test(cleanDescription);
  
  if (isGeneric) {
    issues.push('Description занадто загальний');
    score -= 15;
  } else {
    score += 15;
  }
  
  // Normalize score
  score = Math.max(0, Math.min(100, score));
  
  return {
    description: cleanDescription,
    length,
    isOptimalLength,
    isTooShort,
    isTooLong,
    hasCallToAction: hasCTA,
    hasBenefits: hasBenefitsFlag,
    isDifferentFromTitle: isDifferent,
    isGeneric,
    issues,
    recommendations,
    score,
  };
}

/**
 * Analyze canonical URL quality
 * 
 * @param canonical - The canonical URL from the page
 * @param pageUrl - The current page URL
 * @returns CanonicalAnalysis with score and recommendations
 */
export function analyzeCanonical(canonical: string | null, pageUrl: string): CanonicalAnalysis {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  
  if (!canonical) {
    issues.push('Canonical URL відсутній');
    recommendations.push('Додайте <link rel="canonical"> для вказівки основної версії сторінки');
    
    return {
      canonical: null,
      hasCanonical: false,
      isSelfReferencing: false,
      isAbsoluteUrl: false,
      matchesCurrentUrl: false,
      hasDifferentProtocol: false,
      hasDifferentDomain: false,
      hasTrailingSlashIssue: false,
      hasQueryParams: false,
      issues,
      recommendations,
      score: 0,
    };
  }
  
  const cleanCanonical = canonical.trim();
  
  let canonicalUrl: URL;
  let currentUrl: URL;
  
  try {
    canonicalUrl = new URL(cleanCanonical);
  } catch {
    issues.push('Canonical URL має невалідний формат');
    recommendations.push('Виправте формат canonical URL на валідний абсолютний URL');
    
    return {
      canonical: cleanCanonical,
      hasCanonical: true,
      isSelfReferencing: false,
      isAbsoluteUrl: false,
      matchesCurrentUrl: false,
      hasDifferentProtocol: false,
      hasDifferentDomain: false,
      hasTrailingSlashIssue: false,
      hasQueryParams: false,
      issues,
      recommendations,
      score: 10,
    };
  }
  
  try {
    currentUrl = new URL(pageUrl);
  } catch {
    currentUrl = canonicalUrl;
  }
  
  const isAbsoluteUrl = cleanCanonical.startsWith('http://') || cleanCanonical.startsWith('https://');
  const hasQueryParams = canonicalUrl.search.length > 0;
  const hasDifferentProtocol = canonicalUrl.protocol !== currentUrl.protocol;
  const hasDifferentDomain = canonicalUrl.hostname.replace('www.', '') !== currentUrl.hostname.replace('www.', '');
  
  const canonicalPath = canonicalUrl.pathname.replace(/\/$/, '');
  const currentPath = currentUrl.pathname.replace(/\/$/, '');
  const hasTrailingSlashIssue = (canonicalUrl.pathname.endsWith('/') !== currentUrl.pathname.endsWith('/')) 
    && canonicalPath === currentPath;
  
  const matchesCurrentUrl = canonicalUrl.hostname.replace('www.', '') === currentUrl.hostname.replace('www.', '')
    && canonicalPath === currentPath;
  
  const isSelfReferencing = matchesCurrentUrl && !hasQueryParams;
  
  // Score calculation
  score += 30; // Has canonical
  
  if (isAbsoluteUrl) {
    score += 15;
  } else {
    issues.push('Canonical URL використовує відносний шлях');
    recommendations.push('Використовуйте абсолютний URL для canonical (https://...)');
  }
  
  if (isSelfReferencing) {
    score += 25;
  } else if (matchesCurrentUrl && hasQueryParams) {
    score += 15;
    issues.push('Canonical URL містить query параметри');
    recommendations.push('Видаліть query параметри з canonical URL');
  }
  
  if (!hasDifferentProtocol) {
    score += 10;
  } else {
    issues.push('Canonical URL використовує інший протокол (HTTP/HTTPS)');
    recommendations.push('Використовуйте HTTPS для canonical URL');
  }
  
  if (!hasDifferentDomain) {
    score += 10;
  } else {
    issues.push('Canonical URL вказує на інший домен');
    recommendations.push('Переконайтесь, що canonical вказує на правильний домен');
  }
  
  if (!hasTrailingSlashIssue) {
    score += 10;
  } else {
    issues.push('Невідповідність trailing slash між canonical і поточним URL');
    recommendations.push('Узгодьте використання trailing slash');
  }
  
  if (issues.length === 0) {
    score = 100;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    canonical: cleanCanonical,
    hasCanonical: true,
    isSelfReferencing,
    isAbsoluteUrl,
    matchesCurrentUrl,
    hasDifferentProtocol,
    hasDifferentDomain,
    hasTrailingSlashIssue,
    hasQueryParams,
    issues,
    recommendations,
    score,
  };
}
