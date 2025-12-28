/**
 * Page Discovery Service
 *
 * Discovers pages for multi-page E-E-A-T analysis.
 * Supports sitemap.xml, robots.txt, and internal link crawling.
 */

import { load, type CheerioAPI } from 'cheerio';

/**
 * Discover pages from sitemap.xml
 */
export async function discoverPagesFromSitemap(
  baseUrl: string,
): Promise<string[]> {
  const urls: string[] = [];
  const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();

  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EEATAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return urls;
    }

    const xml = await response.text();
    const $ = load(xml, { xmlMode: true });

    // Extract URLs from sitemap
    $('url loc').each((_, element) => {
      const url = $(element).text().trim();
      if (url) {
        urls.push(url);
      }
    });

    // Also check for sitemap index
    $('sitemap loc').each((_, element) => {
      const sitemapUrl = $(element).text().trim();
      if (sitemapUrl) {
        // Recursively fetch nested sitemaps (limit depth to avoid infinite loops)
        // For now, we'll skip nested sitemaps to keep it simple
      }
    });
  } catch (error) {
    console.warn('[PageDiscovery] Failed to fetch sitemap:', error);
  }

  return urls;
}

/**
 * Discover pages from robots.txt
 */
export async function discoverPagesFromRobots(
  baseUrl: string,
): Promise<string[]> {
  const urls: string[] = [];
  const robotsUrl = new URL('/robots.txt', baseUrl).toString();

  try {
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EEATAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return urls;
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Sitemap:')) {
        const sitemapUrl = trimmed.substring(8).trim();
        if (sitemapUrl) {
          // Fetch sitemap from robots.txt
          const sitemapUrls = await discoverPagesFromSitemap(sitemapUrl);
          urls.push(...sitemapUrls);
        }
      }
    }
  } catch (error) {
    console.warn('[PageDiscovery] Failed to fetch robots.txt:', error);
  }

  return urls;
}

/**
 * Discover internal links from a page
 */
export function discoverInternalLinks(
  $: CheerioAPI,
  baseUrl: string,
  maxLinks = 50,
): string[] {
  const urls = new Set<string>();
  const baseUrlObj = new URL(baseUrl);

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    try {
      const url = new URL(href, baseUrl);
      // Only include same-domain links
      if (url.hostname === baseUrlObj.hostname) {
        urls.add(url.toString());
        if (urls.size >= maxLinks) {
          return false; // Break loop
        }
      }
    } catch (error) {
      // Invalid URL, skip
    }
  });

  return Array.from(urls);
}

/**
 * Filter URLs by type (blog, doctors, etc.)
 */
export function filterUrlsByType(
  urls: string[],
  type: 'blog' | 'doctors' | 'articles' | 'all',
): string[] {
  if (type === 'all') {
    return urls;
  }

  return urls.filter((url) => {
    const lowerUrl = url.toLowerCase();
    switch (type) {
      case 'blog':
        return (
          lowerUrl.includes('/blog') ||
          lowerUrl.includes('/news') ||
          lowerUrl.includes('/articles') ||
          lowerUrl.includes('/статті')
        );
      case 'doctors':
        return (
          lowerUrl.includes('/doctors') ||
          lowerUrl.includes('/team') ||
          lowerUrl.includes('/врачи') ||
          lowerUrl.includes('/лікарі')
        );
      case 'articles':
        return (
          lowerUrl.includes('/article') ||
          lowerUrl.includes('/post') ||
          lowerUrl.includes('/стаття')
        );
      default:
        return true;
    }
  });
}

/**
 * Main function to discover pages for analysis
 */
export async function discoverPages(
  baseUrl: string,
  options: {
    useSitemap?: boolean;
    useRobots?: boolean;
    crawlInternalLinks?: boolean;
    maxPages?: number;
    filterType?: 'blog' | 'doctors' | 'articles' | 'all';
  } = {},
): Promise<string[]> {
  const {
    useSitemap = true,
    useRobots = true,
    crawlInternalLinks = false,
    maxPages = 100,
    filterType = 'all',
  } = options;

  const urls = new Set<string>();

  // Add base URL
  urls.add(baseUrl);

  // Try sitemap
  if (useSitemap) {
    const sitemapUrls = await discoverPagesFromSitemap(baseUrl);
    sitemapUrls.forEach((url) => urls.add(url));
  }

  // Try robots.txt
  if (useRobots) {
    const robotsUrls = await discoverPagesFromRobots(baseUrl);
    robotsUrls.forEach((url) => urls.add(url));
  }

  // Crawl internal links from base page
  if (crawlInternalLinks && urls.size < maxPages) {
    try {
      const response = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EEATAuditBot/1.0)',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const html = await response.text();
        const $ = load(html);
        const internalLinks = discoverInternalLinks($, baseUrl, maxPages);
        internalLinks.forEach((url) => urls.add(url));
      }
    } catch (error) {
      console.warn('[PageDiscovery] Failed to crawl internal links:', error);
    }
  }

  // Filter and limit
  let result = Array.from(urls);
  result = filterUrlsByType(result, filterType);
  result = result.slice(0, maxPages);

  return result;
}

