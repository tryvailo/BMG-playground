'use server';

import { load, type CheerioAPI } from 'cheerio';
import { ContentAuditResultSchema, type ContentAuditResult } from './types';

/*
 * -------------------------------------------------------
 * Constants
 * -------------------------------------------------------
 */

/**
 * Ukrainian and Russian stop words for wateriness calculation
 */
const STOP_WORDS = new Set([
  // Ukrainian
  'дуже', 'що', 'це', 'який', 'яка', 'яке', 'які', 'для', 'про', 'від', 'до',
  'на', 'в', 'з', 'і', 'або', 'та', 'але', 'так', 'ні', 'не', 'було', 'була',
  'були', 'буде', 'будуть', 'є', 'єсть', 'був', 'була', 'були', 'може', 'можна',
  'можуть', 'треба', 'потрібно', 'варто', 'слід', 'як', 'також', 'ще', 'вже',
  'тут', 'там', 'де', 'куди', 'звідки', 'коли', 'чому', 'якщо', 'хоча', 'поки',
  'після', 'перед', 'під', 'над', 'біля', 'коло', 'між', 'серед', 'через',
  'без', 'проти', 'за', 'при', 'про', 'про', 'відповідно', 'згідно', 'зокрема',
  // Russian
  'очень', 'что', 'это', 'какой', 'какая', 'какое', 'какие', 'для', 'про', 'от', 'до',
  'на', 'в', 'с', 'и', 'или', 'а', 'но', 'да', 'нет', 'не', 'было', 'была',
  'были', 'будет', 'будут', 'есть', 'был', 'была', 'были', 'может', 'можно',
  'могут', 'нужно', 'надо', 'стоит', 'следует', 'как', 'также', 'еще', 'уже',
  'здесь', 'там', 'где', 'куда', 'откуда', 'когда', 'почему', 'если', 'хотя', 'пока',
  'после', 'перед', 'под', 'над', 'около', 'между', 'среди', 'через',
  'без', 'против', 'за', 'при', 'про', 'соответственно', 'согласно', 'в частности',
  // Common words in both languages
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may',
  'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
  'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
]);

/**
 * Medical department keywords (Ukrainian and Russian)
 */
const MEDICAL_DEPARTMENTS = [
  'кардіологія', 'cardiology', 'кардиология',
  'гінекологія', 'gynecology', 'гинекология',
  'неврологія', 'neurology', 'неврология',
  'онкологія', 'oncology', 'онкология',
  'ортопедія', 'orthopedics', 'ортопедия',
  'дерматологія', 'dermatology', 'дерматология',
  'стоматологія', 'dentistry', 'стоматология',
  'педіатрія', 'pediatrics', 'педиатрия',
  'хірургія', 'surgery', 'хирургия',
  'офтальмологія', 'ophthalmology', 'офтальмология',
  'отоларингологія', 'otolaryngology', 'отоларингология',
  'урологія', 'urology', 'урология',
];

/**
 * Doctor-related keywords (Ukrainian, Russian, English)
 */
const _DOCTOR_KEYWORDS = [
  'education', 'освіта', 'образование',
  'experience', 'досвід', 'опыт',
  'certificate', 'сертифікат', 'сертификат',
  'certification', 'сертифікація', 'сертификация',
  'qualification', 'кваліфікація', 'квалификация',
  'specialization', 'спеціалізація', 'специализация',
  'doctor', 'лікар', 'врач',
  'physician', 'медик', 'медик',
  'specialist', 'спеціаліст', 'специалист',
];

/**
 * Trusted authority domains for E-E-A-T validation
 * Organizations, Evidence Base, Associations, and Education domains
 */
const TRUSTED_DOMAINS = [
  // Organizations
  'who.int',
  'nih.gov',
  'cdc.gov',
  'ecdc.europa.eu',
  'un.org',
  'moz.gov.ua',
  'phc.org.ua',
  // Evidence Base
  'pubmed.ncbi.nlm.nih.gov',
  'medlineplus.gov',
  'cochrane.org',
  'cebm.org.ua',
  'ncbi.nlm.nih.gov',
  // Associations
  'ufmo.org.ua',
  'amzu.info',
  'cardiology.org',
  // Education (.edu.ua and .gov.ua domains - pattern matching)
  // These will be checked with pattern matching
];

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Extract text content from HTML (removing scripts, styles, etc.)
 */
function extractTextContent($: CheerioAPI): string {
  // Remove script and style elements
  $('script, style, noscript').remove();

  // Get text content
  const text = $('body').text() || $('html').text();

  // Clean up whitespace
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate text wateriness score
 * Formula: (Stop words count / Total words count) * 100
 */
function calculateWateriness(text: string): number {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return 0;
  }

  const stopWordsCount = words.filter((word) => {
    // Remove punctuation for comparison
    const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '');
    return STOP_WORDS.has(cleanWord);
  }).length;

  const wateriness = (stopWordsCount / words.length) * 100;
  return Math.round(wateriness * 100) / 100; // Round to 2 decimal places
}

/**
 * Detect doctor pages based on links and content
 * Checks for /doctors/, /team/ links or text "Our Doctors/Наші лікарі"
 */
function detectDoctorPages($: CheerioAPI): boolean {
  // Check for links to doctor pages
  let hasDoctorLink = false;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    // Look for patterns like /doctors/id, /team/member, /vrachi/name
    if (/[/.](doctors|team|vrachi|likari|specialists)[/.]/i.test(href) ||
      /[/.](doctor|likar|vrach)[/.]/i.test(href)) {
      hasDoctorLink = true;
      return false; // Break loop
    }
  });

  if (hasDoctorLink) {
    return true;
  }

  // Check for doctor-related text in content
  const bodyText = extractTextContent($).toLowerCase();
  const doctorTextPatterns = [
    'our doctors',
    'наші лікарі',
    'наши врачи',
    'команда лікарів',
    'команда врачей',
  ];

  const hasDoctorText = doctorTextPatterns.some((pattern) =>
    bodyText.includes(pattern.toLowerCase())
  );

  return hasDoctorText;
}

/**
 * Detect service/department pages based on links and content
 * Checks for /services/, /napryamki/ links
 */
function detectServicePages($: CheerioAPI): boolean {
  const uniqueServiceUrls = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    // Look for service-like URL patterns
    if (/[/.](services|poslugi|uslugi)[/.]/i.test(href)) {
      uniqueServiceUrls.add(href);
    }
  });

  return uniqueServiceUrls.size > 0;
}

/**
 * Detect direction pages count
 * Directions = medical specialties/departments like cardiology, neurology etc.
 */
function detectDirectionPagesCount($: CheerioAPI): number {
  const uniqueDirectionUrls = new Set<string>();

  // Pattern matches URLs containing direction-related segments
  // Matches: /directions/, /directions, /napryamki/cardiology, etc.
  const directionPattern = /[/.](?:napryamki|directions|departments|specialties|specialty|specializations|otdeleniya|viddilennya|відділення|напрямки|категорії)(?:[/.]|$|\?)/i;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    if (directionPattern.test(href)) {
      uniqueDirectionUrls.add(href);
    }
  });

  return uniqueDirectionUrls.size;
}

/**
 * Count unique service pages
 */
function countServicePages($: CheerioAPI): number {
  const uniqueServiceUrls = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    if (/[/.](services|poslugi|uslugi)[/.]/i.test(href)) {
      uniqueServiceUrls.add(href);
    }
  });

  return uniqueServiceUrls.size;
}

/**
 * Detect doctor details (photos, bio, etc.)
 */
function detectDoctorDetails($: CheerioAPI): {
  has_photos: boolean;
  has_bio: boolean;
  has_experience: boolean;
  has_certificates: boolean;
} {
  const content = extractTextContent($).toLowerCase();

  const has_photos = $('img[alt*="лікар" i], img[alt*="врач" i], img[alt*="doctor" i], img[src*="doctor" i]').length > 0;

  const has_bio = content.includes('біографія') || content.includes('биография') ||
    content.includes('про лікаря') || content.includes('о враче') ||
    content.includes('освіта') || content.includes('образование');

  const has_experience = content.includes('досвід') || content.includes('опыт') ||
    content.includes('стаж') || /\d+\s*(років|року|літ|лет|years)/i.test(content);

  const has_certificates = content.includes('сертифікат') || content.includes('сертификат') ||
    content.includes('диплом') || content.includes('грамота') ||
    content.includes('award') || content.includes('certificate');

  return { has_photos, has_bio, has_experience, has_certificates };
}

/**
 * Detect blog metrics
 */
function detectBlogMetrics($: CheerioAPI): {
  posts_count: number;
  is_regularly_updated: boolean;
  avg_article_length: number;
} {
  const posts = $('article, [class*="post"], [class*="article"]').length;

  // Try to find dates of posts to estimate update frequency
  const dates: Date[] = [];
  $('time, [class*="date"], [class*="time"]').each((_, el) => {
    const dateStr = $(el).attr('datetime') || $(el).text();
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      dates.push(date);
    }
  });

  let is_regularly_updated = false;
  if (dates.length > 1) {
    const sortedDates = dates.sort((a, b) => b.getTime() - a.getTime());
    const mostRecent = sortedDates[0]!;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    is_regularly_updated = mostRecent > oneMonthAgo;
  }

  // Estimate average article length if multiple articles are present
  const bodyText = extractTextContent($);
  const wordCount = bodyText.split(/\s+/).length;
  const avg_article_length = posts > 0 ? Math.round(wordCount / posts) : wordCount;

  return {
    posts_count: posts || (detectBlogPresence($) ? 5 : 0), // Use heuristic if elements not clear
    is_regularly_updated,
    avg_article_length
  };
}

/**
 * Detect circular linking
 * Doctor -> Service -> Branch cycle
 */
function detectCircularLinking($: CheerioAPI): boolean {
  // Check if we have links to both doctor AND service on the same page
  // This is a proxy for "circularity" in a single-page analysis context
  const hasDoctorLink = detectDoctorPages($);
  const hasServiceLink = detectServicePages($);
  const hasBranchLink = $('[class*="location"], [class*="branch"], a[href*="філія"], a[href*="филиал"]').length > 0;

  return hasDoctorLink && hasServiceLink && hasBranchLink;
}

/**
 * Detect department pages based on links and content
 */
function detectDepartmentPages($: CheerioAPI): boolean {
  // Check for links to department pages
  let hasDepartmentLink = false;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    if (href.includes('/departments/') || href.includes('/відділення/') ||
      href.includes('/отделения/')) {
      hasDepartmentLink = true;
      return false; // Break loop
    }
  });

  if (hasDepartmentLink) {
    return true;
  }

  // Check for department keywords in content
  const bodyText = extractTextContent($).toLowerCase();
  const hasDepartmentKeywords = MEDICAL_DEPARTMENTS.some((dept) =>
    bodyText.includes(dept.toLowerCase())
  );

  return hasDepartmentKeywords;
}

/**
 * Check if blog is present
 */
function detectBlogPresence($: CheerioAPI): boolean {
  // Check for links to blog pages
  let hasBlogLink = false;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    if (href.includes('/blog/') || href.includes('/news/') ||
      href.includes('/articles/') || href.includes('/новини/') ||
      href.includes('/новости/') || href.includes('/статті/') ||
      href.includes('/статьи/')) {
      hasBlogLink = true;
      return false; // Break loop
    }
  });

  return hasBlogLink;
}

/**
 * Calculate architecture score based on link depth
 * Simulates site architecture by analyzing navigation structure
 */
function calculateArchitectureScore($: CheerioAPI, url: string): number {
  try {
    const baseUrl = new URL(url);
    const baseDomain = baseUrl.hostname;

    // Find navigation and footer links
    const navLinks = $('nav a[href], header a[href], footer a[href]').toArray();
    const linkDepths: number[] = [];

    navLinks.forEach((element) => {
      const href = $(element).attr('href');
      if (!href) return;

      try {
        const linkUrl = new URL(href, url);

        // Only count internal links
        if (linkUrl.hostname === baseDomain || !linkUrl.hostname) {
          const pathParts = linkUrl.pathname.split('/').filter((part) => part.length > 0);
          linkDepths.push(pathParts.length);
        }
      } catch (_error) {
        // Invalid URL, skip
      }
    });

    if (linkDepths.length === 0) {
      return 50; // Default score if no links found
    }

    // Calculate average depth
    const avgDepth = linkDepths.reduce((sum, depth) => sum + depth, 0) / linkDepths.length;
    const maxDepth = Math.max(...linkDepths);

    // Score based on depth: 2-3 levels is optimal (80-100), 
    // 1 level is too flat (60), 4+ is too deep (40-60)
    let score = 70;

    if (avgDepth >= 2 && avgDepth <= 3 && maxDepth <= 4) {
      score = 85 + Math.min(15, (3 - avgDepth) * 5); // 85-100 for optimal depth
    } else if (avgDepth < 2) {
      score = 50 + avgDepth * 10; // 50-70 for too flat
    } else if (avgDepth > 3) {
      score = Math.max(40, 80 - (avgDepth - 3) * 10); // 40-80 for too deep
    }

    // Bonus for having many internal links (good structure)
    if (linkDepths.length > 10) {
      score = Math.min(100, score + 5);
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  } catch (_error) {
    return 50; // Default score on error
  }
}

/**
 * Extract domain from URL
 */
function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch (_error) {
    return null;
  }
}

/**
 * Check if a domain is in the trusted authority list
 */
function isTrustedAuthorityDomain(domain: string | null): boolean {
  if (!domain) return false;

  const normalizedDomain = domain.toLowerCase();

  // Check exact matches
  if (TRUSTED_DOMAINS.some((trusted) => normalizedDomain === trusted)) {
    return true;
  }

  // Check subdomain matches (e.g., www.pubmed.ncbi.nlm.nih.gov matches pubmed.ncbi.nlm.nih.gov)
  if (TRUSTED_DOMAINS.some((trusted) => normalizedDomain.endsWith(`.${trusted}`))) {
    return true;
  }

  // Check .edu.ua and .gov.ua domains (Education and Government)
  if (normalizedDomain.endsWith('.edu.ua') || normalizedDomain.endsWith('.gov.ua')) {
    return true;
  }

  return false;
}

/**
 * Count authority links (external links to trusted domains)
 */
function countAuthorityLinks($: CheerioAPI, baseUrl: string): number {
  let count = 0;
  const seenDomains = new Set<string>();

  try {
    const baseDomain = getDomain(baseUrl);

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      try {
        const linkUrl = new URL(href, baseUrl);
        const linkDomain = getDomain(linkUrl.toString());

        // Only count external links (different domain)
        if (linkDomain && linkDomain !== baseDomain) {
          // Check if it's a trusted domain and we haven't counted it yet
          if (isTrustedAuthorityDomain(linkDomain) && !seenDomains.has(linkDomain)) {
            seenDomains.add(linkDomain);
            count++;
          }
        }
      } catch (_error) {
        // Invalid URL, skip
      }
    });
  } catch (_error) {
    // Error parsing base URL, return 0
  }

  return count;
}

/**
 * Check if phone number is present (tel: links)
 */
function hasValidPhone($: CheerioAPI): boolean {
  // Check for tel: links
  const telLinks = $('a[href^="tel:"]');
  if (telLinks.length > 0) {
    return true;
  }

  // Also check for phone patterns in text content
  const textContent = extractTextContent($);
  // Ukrainian phone patterns: +380, 0XX, (0XX)
  // Russian phone patterns: +7, 8XXX
  // International: +XXX
  const phonePatterns = [
    /\+380\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/, // +380 XX XXX XX XX
    /0\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/, // 0XX XXX XX XX
    /(\d{3})\s?\d{3}-\d{2}-\d{2}/, // (XXX) XXX-XX-XX
    /\+7\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}/, // +7 XXX XXX XX XX
    /8\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}/, // 8 XXX XXX XX XX
  ];

  return phonePatterns.some((pattern) => pattern.test(textContent));
}

/**
 * Check if valid address is present
 * Looks for Ukrainian/Russian address patterns
 */
function hasValidAddress($: CheerioAPI): boolean {
  const textContent = extractTextContent($);

  // Ukrainian address patterns
  const addressPatterns = [
    // "вул. [Street Name], [Number], м. [City]"
    /вул\.\s+[А-ЯІЇЄҐа-яіїєґ\w\s]+,\s*\d+[а-яіїєґ]?,\s*м\.\s+[А-ЯІЇЄҐа-яіїєґ\w\s]+/i,
    // "м. [City], вул. [Street Name]"
    /м\.\s+[А-ЯІЇЄҐа-яіїєґ\w\s]+,\s*вул\.\s+[А-ЯІЇЄҐа-яіїєґ\w\s]+/i,
    // "Kyiv, [Street Name] Street"
    /Kyiv|Київ|Киев.*(?:Street|St|вул\.|ул\.)/i,
    // Russian patterns: "г. [City], ул. [Street Name]"
    /г\.\s+[А-Яа-я\w\s]+,\s*ул\.\s+[А-Яа-я\w\s]+/i,
    // "ул. [Street Name], д. [Number], г. [City]"
    /ул\.\s+[А-Яа-я\w\s]+,\s*д\.\s+\d+,\s*г\.\s+[А-Яа-я\w\s]+/i,
    // Common city names with street indicators
    /(?:Kyiv|Київ|Киев|Lviv|Львів|Львов|Kharkiv|Харків|Харьков|Odesa|Одеса|Одесса).*(?:вул\.|ул\.|Street|St|проспект|пр\.)/i,
  ];

  return addressPatterns.some((pattern) => pattern.test(textContent));
}

/**
 * Parse JSON-LD schema content
 */
function parseJsonLd(content: string): unknown {
  // Check if content is empty or only whitespace
  if (!content || !content.trim()) {
    return null;
  }

  try {
    return JSON.parse(content.trim());
  } catch (_error) {
    return null;
  }
}

/**
 * Extract schema types from JSON-LD object
 */
function extractSchemaTypes(schema: unknown): string[] {
  const types: string[] = [];

  if (Array.isArray(schema)) {
    for (const item of schema) {
      types.push(...extractSchemaTypes(item));
    }
    return types;
  }

  if (typeof schema === 'object' && schema !== null) {
    const obj = schema as Record<string, unknown>;

    // Handle @graph
    if ('@graph' in obj && Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        types.push(...extractSchemaTypes(item));
      }
    }

    // Extract @type or type field
    const typeValue = obj['@type'] || obj['type'];
    if (typeValue) {
      if (Array.isArray(typeValue)) {
        types.push(...typeValue.map((t) => String(t)));
      } else {
        types.push(String(typeValue));
      }
    }
  }

  return types;
}

/**
 * Check if FAQPage schema is present
 */
function hasFAQPageSchema($: CheerioAPI): boolean {
  const jsonLdScripts = $('script[type="application/ld+json"]');

  let hasFAQ = false;

  jsonLdScripts.each((_, element) => {
    const content = $(element).html();
    if (!content || !content.trim()) return;

    const parsed = parseJsonLd(content);
    if (!parsed) return;

    const types = extractSchemaTypes(parsed);
    const normalizedTypes = types.map((t) => t.toLowerCase().trim());

    if (normalizedTypes.some((type) =>
      type === 'faqpage' ||
      type.includes('faqpage') ||
      type.endsWith('/faqpage')
    )) {
      hasFAQ = true;
      return false; // Break loop
    }
  });

  return hasFAQ;
}

/**
 * Count FAQ items in HTML structure
 * Looks for FAQ/accordion patterns with at least 3 items
 */
function countFAQItems($: CheerioAPI): number {
  let count = 0;

  // Check for elements with FAQ-related class names
  const faqSelectors = [
    '[class*="faq"]',
    '[class*="FAQ"]',
    '[class*="accordion"]',
    '[class*="Accordion"]',
    '[id*="faq"]',
    '[id*="FAQ"]',
  ];

  // Try to find FAQ containers
  for (const selector of faqSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      // Look for question/answer pairs
      // Common patterns: dt/dd, h3/p, div.question/div.answer, etc.
      const questions = elements.find('dt, h3, h4, [class*="question"], [class*="Question"]');
      const answers = elements.find('dd, p, [class*="answer"], [class*="Answer"]');

      // Count pairs or individual items
      const itemCount = Math.max(questions.length, answers.length);
      if (itemCount >= 3) {
        count = itemCount;
        break; // Found valid FAQ structure
      }
    }
  }

  // Alternative: Check for structured FAQ patterns
  if (count === 0) {
    // Look for definition lists (dt/dd) which are commonly used for FAQs
    const dlElements = $('dl');
    dlElements.each((_, element) => {
      const dtCount = $(element).find('dt').length;
      if (dtCount >= 3) {
        count = dtCount;
        return false; // Break
      }
    });
  }

  return count;
}

/**
 * Count total FAQ items (schema + HTML)
 */
function countFAQs($: CheerioAPI): number {
  // Check for FAQPage schema
  if (hasFAQPageSchema($)) {
    // If schema exists, try to count items in it
    const jsonLdScripts = $('script[type="application/ld+json"]');
    let schemaFAQCount = 0;

    jsonLdScripts.each((_, element) => {
      const content = $(element).html();
      if (!content || !content.trim()) return;

      const parsed = parseJsonLd(content);
      if (!parsed || typeof parsed !== 'object') return;

      const obj = parsed as Record<string, unknown>;

      // Check for mainEntity with questions
      if ('mainEntity' in obj && Array.isArray(obj.mainEntity)) {
        schemaFAQCount = obj.mainEntity.length;
      }

      // Check for @graph with FAQPage
      if ('@graph' in obj && Array.isArray(obj['@graph'])) {
        for (const item of obj['@graph']) {
          if (typeof item === 'object' && item !== null) {
            const itemObj = item as Record<string, unknown>;
            const types = extractSchemaTypes(item);
            if (types.some((t) => t.toLowerCase().includes('faqpage'))) {
              if ('mainEntity' in itemObj && Array.isArray(itemObj.mainEntity)) {
                schemaFAQCount = Math.max(schemaFAQCount, itemObj.mainEntity.length);
              }
            }
          }
        }
      }
    });

    if (schemaFAQCount >= 3) {
      return schemaFAQCount;
    }
  }

  // Fall back to HTML structure detection
  return countFAQItems($);
}

/**
 * Generate recommendations based on audit results
 */
function generateRecommendations(
  structure: ContentAuditResult['structure'],
  textQuality: ContentAuditResult['text_quality'],
  authority: ContentAuditResult['authority'],
): string[] {
  const recommendations: string[] = [];

  // Wateriness recommendations
  if (textQuality.wateriness_score >= 25) {
    recommendations.push(
      `Wateriness is ${textQuality.wateriness_score.toFixed(1)}%, aim for <25%. Reduce stop words and filler content.`
    );
  } else if (textQuality.wateriness_score >= 20) {
    recommendations.push(
      `Wateriness is ${textQuality.wateriness_score.toFixed(1)}%, consider reducing it further to <20% for optimal content quality.`
    );
  }

  // Architecture recommendations
  if (structure.architecture_score < 60) {
    recommendations.push(
      `Site architecture score is ${structure.architecture_score}. Improve navigation structure with 2-3 levels of depth for better SEO.`
    );
  }

  // Doctor pages recommendations
  if (!structure.has_doctor_pages) {
    recommendations.push(
      'No doctor pages detected. Consider adding doctor profiles with education, experience, and certifications.'
    );
  }

  // Service pages recommendations
  if (!structure.has_service_pages) {
    recommendations.push(
      'No service pages detected. Add dedicated service pages to improve site structure and SEO.'
    );
  }

  // Department pages recommendations
  if (!structure.has_department_pages) {
    recommendations.push(
      'No department pages detected. Consider adding department-specific landing pages to improve site architecture.'
    );
  }

  // Blog recommendations
  if (!structure.has_blog) {
    recommendations.push(
      'No blog section detected. Consider adding a blog with medical articles to improve content marketing and SEO.'
    );
  }

  // Uniqueness recommendations (placeholder for future Copyleaks integration)
  if (textQuality.uniqueness_score < 90) {
    recommendations.push(
      `Content uniqueness is ${textQuality.uniqueness_score}%. Ensure content is original and not duplicated from other sources.`
    );
  }

  // Authority recommendations
  if (authority.authority_links_count === 0) {
    recommendations.push(
      'No authority links detected. Add links to trusted medical sources (WHO, NIH, CDC, PubMed, etc.) to improve E-E-A-T signals.'
    );
  } else if (authority.authority_links_count < 3) {
    recommendations.push(
      `Only ${authority.authority_links_count} authority link(s) found. Consider adding more links to trusted medical organizations and evidence-based sources.`
    );
  }

  // Contact info recommendations
  if (!authority.has_valid_phone) {
    recommendations.push(
      'No valid phone number detected. Add a clickable phone number (tel: link) for better user experience and local SEO.'
    );
  }

  if (!authority.has_valid_address) {
    recommendations.push(
      'No valid physical address detected. Add a complete address with city and street information for local SEO and trust signals.'
    );
  }

  // FAQ recommendations
  if (authority.faq_count === 0) {
    recommendations.push(
      'No FAQ section detected. Add an FAQ section with at least 3 questions to improve user experience and potential for featured snippets.'
    );
  } else if (authority.faq_count < 3) {
    recommendations.push(
      `Only ${authority.faq_count} FAQ item(s) found. Consider expanding to at least 3-5 FAQs for better coverage.`
    );
  }

  return recommendations;
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Content Analyzer Service
 * 
 * Analyzes HTML content and URL to generate content optimization audit results.
 * 
 * This service is strictly isolated in src/server/services and should not
 * depend on UI components or client-side code.
 * 
 * @param html - The HTML content to analyze
 * @param url - The URL of the page being analyzed
 * @returns Content audit result conforming to ContentAuditResultSchema
 */
export async function analyzeContent(
  html: string,
  url: string,
): Promise<ContentAuditResult> {
  const $ = load(html);

  // Extract text content for analysis
  const textContent = extractTextContent($);

  // 1. Entity Detection
  const blogPresence = detectBlogPresence($);

  // 2. Architecture Score
  const architectureScore = calculateArchitectureScore($, url);

  // 3. Text Quality Analysis
  const waterinessScore = calculateWateriness(textContent);

  // 4. Uniqueness (Mock - TODO: Integrate with Copyleaks API)
  // Random value between 70-100%
  const uniquenessScore = Math.round((70 + Math.random() * 30) * 100) / 100;

  // 5. Authority & E-E-A-T Checks
  const authorityLinksCount = countAuthorityLinks($, url);
  const hasValidPhoneValue = hasValidPhone($);
  const hasValidAddressValue = hasValidAddress($);
  const faqCount = countFAQs($);

  // Build structure object
  const structure = {
    has_department_pages: detectDepartmentPages($),
    has_service_pages: detectServicePages($),
    has_doctor_pages: detectDoctorPages($),
    has_blog: blogPresence,
    architecture_score: architectureScore,
    // Detailed structure fields
    direction_pages_count: detectDirectionPagesCount($),
    service_pages_count: countServicePages($),
    doctor_details: detectDoctorDetails($),
    blog_details: detectBlogMetrics($),
    internal_linking_circular: detectCircularLinking($),
  };

  // Build text quality object
  const textQuality = {
    uniqueness_score: uniquenessScore,
    wateriness_score: waterinessScore,
  };

  // Build authority object
  const authority = {
    authority_links_count: authorityLinksCount,
    has_valid_address: hasValidAddressValue,
    has_valid_phone: hasValidPhoneValue,
    is_phone_clickable: $('a[href^="tel:"]').length > 0,
    faq_count: faqCount,
  };

  // Generate recommendations
  const recommendations = generateRecommendations(structure, textQuality, authority);

  // Build result
  const result: ContentAuditResult = {
    structure,
    text_quality: textQuality,
    authority,
    recommendations,
  };

  // Validate and return
  return ContentAuditResultSchema.parse(result);
}

