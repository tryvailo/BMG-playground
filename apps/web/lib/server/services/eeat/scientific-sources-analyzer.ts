/**
 * Scientific Sources Analyzer
 *
 * Analyzes scientific sources and calculates metrics for articles.
 */

import type { CheerioAPI } from 'cheerio';

import type { ScientificSourcesMetrics } from './types';

/**
 * Check if page is an article with medical content
 */
export function isMedicalArticle($: CheerioAPI): boolean {
  const textContent = $('body').text().toLowerCase();

  // Medical content indicators
  const medicalKeywords = [
    'лікування',
    'treatment',
    'діагноз',
    'diagnosis',
    'хвороба',
    'disease',
    'симптом',
    'symptom',
    'пацієнт',
    'patient',
    'медицина',
    'medicine',
    'лікар',
    'doctor',
  ];

  return medicalKeywords.some((keyword) => textContent.includes(keyword));
}

/**
 * Count scientific sources on a page
 */
export function countScientificSourcesOnPage($: CheerioAPI): number {
  const foundDomains = new Set<string>();

  const scientificDomains = [
    'ncbi.nlm.nih.gov',
    'pubmed.gov',
    'pubmed.ncbi.nlm.nih.gov',
    'cochrane.org',
    'who.int',
    'moz.gov.ua',
  ];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';

    for (const domain of scientificDomains) {
      if (href.includes(domain)) {
        foundDomains.add(domain);
      }
    }
  });

  return foundDomains.size;
}

/**
 * Calculate scientific sources metrics for multiple articles
 */
export function calculateScientificSourcesMetrics(
  articles: Array<{ url: string; hasSources: boolean }>,
): ScientificSourcesMetrics {
  const totalArticles = articles.length;
  const articlesWithSources = articles.filter((a) => a.hasSources).length;

  const articlesWithSourcesPercent =
    totalArticles > 0 ? Math.round((articlesWithSources / totalArticles) * 100) : 0;

  return {
    total_articles: totalArticles,
    articles_with_sources: articlesWithSources,
    articles_with_sources_percent: articlesWithSourcesPercent,
  };
}

/**
 * Check for national protocols
 */
export function checkNationalProtocols($: CheerioAPI): string[] {
  const protocols: string[] = [];
  const textContent = $('body').text().toLowerCase();

  // Check for links to moz.gov.ua (already in scientific domains)
  $('a[href*="moz.gov.ua"]').each((_, element) => {
    const href = $(element).attr('href') || '';
    if (!protocols.includes(href)) {
      protocols.push(href);
    }
  });

  // Check for protocol mentions in text
  const protocolPatterns = [
    /протокол\s+[А-ЯІЇЄҐа-яіїєґ]+/i,
    /protocol\s+[A-Za-z]+/i,
    /наказ\s+моз/i,
    /order\s+of\s+ministry/i,
  ];

  for (const pattern of protocolPatterns) {
    const matches = textContent.match(pattern);
    if (matches) {
      protocols.push(matches[0]);
    }
  }

  return protocols;
}

/**
 * Check for international protocols
 */
export function checkInternationalProtocols($: CheerioAPI): string[] {
  const protocols: string[] = [];

  // Check for links to WHO (already in scientific domains)
  $('a[href*="who.int"]').each((_, element) => {
    const href = $(element).attr('href') || '';
    if (!protocols.includes(href)) {
      protocols.push(href);
    }
  });

  // Check for other international organizations
  const internationalDomains = [
    'cochrane.org',
    'nih.gov',
    'cdc.gov',
    'ema.europa.eu',
  ];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    for (const domain of internationalDomains) {
      if (href.includes(domain) && !protocols.includes(href)) {
        protocols.push(href);
      }
    }
  });

  return protocols;
}

