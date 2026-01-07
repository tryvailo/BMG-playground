/**
 * Noindex Page Crawler
 * 
 * Finds pages with noindex meta tags or X-Robots-Tag headers.
 * Uses sitemap.xml as the source of pages to check.
 */

import { load } from 'cheerio';

export interface NoindexPage {
  url: string;
  source: 'meta' | 'header' | 'both';
  metaRobots?: string;
  xRobotsTag?: string;
}

export interface NoindexAnalysisResult {
  totalPagesChecked: number;
  noindexPages: NoindexPage[];
  noindexCount: number;
  noindexPercent: number;
  issues: string[];
  score: number;
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

/**
 * Parse sitemap.xml and extract all URLs
 */
async function parseSitemap(sitemapUrl: string, visited: Set<string> = new Set()): Promise<SitemapUrl[]> {
  if (visited.has(sitemapUrl)) {
    return [];
  }
  visited.add(sitemapUrl);

  const urls: SitemapUrl[] = [];

  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NoindexCrawlerBot/1.0)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[NoindexCrawler] Failed to fetch sitemap ${sitemapUrl}: ${response.status}`);
      return urls;
    }

    const xml = await response.text();
    const $ = load(xml, { xmlMode: true });

    $('url').each((_, element) => {
      const loc = $(element).find('loc').text().trim();
      if (loc) {
        urls.push({
          loc,
          lastmod: $(element).find('lastmod').text().trim() || undefined,
          changefreq: $(element).find('changefreq').text().trim() || undefined,
          priority: $(element).find('priority').text().trim() || undefined,
        });
      }
    });

    const nestedSitemaps: string[] = [];
    $('sitemap loc').each((_, element) => {
      const nestedUrl = $(element).text().trim();
      if (nestedUrl) {
        nestedSitemaps.push(nestedUrl);
      }
    });

    for (const nestedUrl of nestedSitemaps) {
      const nestedUrls = await parseSitemap(nestedUrl, visited);
      urls.push(...nestedUrls);
    }

  } catch (error) {
    console.warn(`[NoindexCrawler] Error parsing sitemap ${sitemapUrl}:`, error);
  }

  return urls;
}

/**
 * Check a single page for noindex directives
 */
async function checkPageNoindex(url: string): Promise<NoindexPage | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NoindexCrawlerBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });

    if (!response.ok) {
      return null;
    }

    const xRobotsTag = response.headers.get('x-robots-tag')?.toLowerCase();
    const hasHeaderNoindex = xRobotsTag?.includes('noindex') ?? false;

    const html = await response.text();
    const $ = load(html);

    const metaRobots = $('meta[name="robots"]').attr('content')?.toLowerCase();
    const hasMetaNoindex = metaRobots?.includes('noindex') ?? false;

    const googlebot = $('meta[name="googlebot"]').attr('content')?.toLowerCase();
    const hasGooglebotNoindex = googlebot?.includes('noindex') ?? false;

    if (hasHeaderNoindex || hasMetaNoindex || hasGooglebotNoindex) {
      let source: 'meta' | 'header' | 'both';
      if (hasHeaderNoindex && (hasMetaNoindex || hasGooglebotNoindex)) {
        source = 'both';
      } else if (hasHeaderNoindex) {
        source = 'header';
      } else {
        source = 'meta';
      }

      return {
        url,
        source,
        metaRobots: metaRobots || googlebot || undefined,
        xRobotsTag: xRobotsTag || undefined,
      };
    }

    return null;
  } catch (error) {
    console.warn(`[NoindexCrawler] Error checking page ${url}:`, error);
    return null;
  }
}

/**
 * Analyze pages from sitemap for noindex directives
 * 
 * @param baseUrl - The base URL of the website
 * @param maxPages - Maximum number of pages to check (default: 50)
 * @returns NoindexAnalysisResult with found noindex pages
 */
export async function analyzeNoindexPages(
  baseUrl: string,
  maxPages: number = 50,
): Promise<NoindexAnalysisResult> {
  const issues: string[] = [];

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const sitemapUrl = `${normalizedBaseUrl}/sitemap.xml`;

  console.log(`[NoindexCrawler] Starting noindex analysis for ${baseUrl}`);
  console.log(`[NoindexCrawler] Fetching sitemap from ${sitemapUrl}`);

  const sitemapUrls = await parseSitemap(sitemapUrl);

  if (sitemapUrls.length === 0) {
    console.log('[NoindexCrawler] No URLs found in sitemap, trying sitemap_index.xml');
    const indexUrls = await parseSitemap(`${normalizedBaseUrl}/sitemap_index.xml`);
    sitemapUrls.push(...indexUrls);
  }

  if (sitemapUrls.length === 0) {
    issues.push('Sitemap.xml не знайдено або пустий');
    return {
      totalPagesChecked: 0,
      noindexPages: [],
      noindexCount: 0,
      noindexPercent: 0,
      issues,
      score: 0,
    };
  }

  console.log(`[NoindexCrawler] Found ${sitemapUrls.length} URLs in sitemap`);

  const urlsToCheck = sitemapUrls.slice(0, maxPages);
  const noindexPages: NoindexPage[] = [];

  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 500;

  for (let i = 0; i < urlsToCheck.length; i += BATCH_SIZE) {
    const batch = urlsToCheck.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(item => checkPageNoindex(item.loc))
    );

    for (const result of results) {
      if (result) {
        noindexPages.push(result);
      }
    }

    if (i + BATCH_SIZE < urlsToCheck.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const noindexCount = noindexPages.length;
  const noindexPercent = urlsToCheck.length > 0
    ? Math.round((noindexCount / urlsToCheck.length) * 100)
    : 0;

  if (noindexCount > 0) {
    issues.push(`Знайдено ${noindexCount} сторінок з noindex у sitemap.xml`);
    issues.push('Сторінки з noindex не повинні бути в sitemap.xml');
  }

  let score = 100;
  if (noindexPercent > 20) {
    score = 0;
    issues.push('Критично: більше 20% сторінок мають noindex');
  } else if (noindexPercent > 10) {
    score = 30;
    issues.push('Увага: більше 10% сторінок мають noindex');
  } else if (noindexPercent > 5) {
    score = 60;
  } else if (noindexCount > 0) {
    score = 80;
  }

  console.log(`[NoindexCrawler] Analysis complete: ${noindexCount} noindex pages found out of ${urlsToCheck.length}`);

  return {
    totalPagesChecked: urlsToCheck.length,
    noindexPages,
    noindexCount,
    noindexPercent,
    issues,
    score,
  };
}

/**
 * Quick check for noindex pages (uses HEAD requests first)
 * Faster but may miss some noindex pages that only have meta tags
 */
export async function quickNoindexCheck(
  urls: string[],
): Promise<NoindexPage[]> {
  const noindexPages: NoindexPage[] = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NoindexCrawlerBot/1.0)',
        },
        signal: AbortSignal.timeout(5000),
      });

      const xRobotsTag = response.headers.get('x-robots-tag')?.toLowerCase();
      if (xRobotsTag?.includes('noindex')) {
        noindexPages.push({
          url,
          source: 'header',
          xRobotsTag,
        });
      }
    } catch (_error) {
      // Ignore errors for quick check
    }
  }

  return noindexPages;
}
