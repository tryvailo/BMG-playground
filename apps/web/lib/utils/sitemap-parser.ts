/**
 * Sitemap Parser - Extracts URLs from sitemap.xml for comprehensive page coverage
 * 
 * Supports:
 * - Standard sitemap.xml
 * - Sitemap index files (multiple sitemaps)
 * - Nested sitemap structures
 * - Common sitemap locations (/sitemap.xml, /sitemap_index.xml, etc.)
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface SitemapParseResult {
  success: boolean;
  urls: SitemapUrl[];
  sitemapUrl: string;
  totalFound: number;
  error?: string;
}

/**
 * Common sitemap locations to check
 */
const SITEMAP_LOCATIONS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap-index.xml',
  '/sitemaps.xml',
  '/sitemap1.xml',
  '/sitemap/sitemap.xml',
  '/wp-sitemap.xml', // WordPress
  '/yoast-sitemap.xml', // Yoast SEO
  '/news-sitemap.xml',
  '/page-sitemap.xml',
];

/**
 * Fetch sitemap content with timeout and error handling
 */
async function fetchSitemap(url: string, timeoutMs: number = 10000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)',
        'Accept': 'application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('xml') && !contentType.includes('text')) {
      return null;
    }

    return await response.text();
  } catch (error) {
    console.warn(`[SitemapParser] Failed to fetch ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Parse XML sitemap content and extract URLs
 */
function parseXmlSitemap(xmlContent: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];

  // Extract <loc> tags with their optional metadata
  // Handle both <url> entries and <sitemap> entries
  const urlMatches = xmlContent.matchAll(/<url[^>]*>([\s\S]*?)<\/url>/gi);
  
  for (const match of urlMatches) {
    const urlBlock = match[1];
    if (!urlBlock) continue;
    
    const locMatch = urlBlock.match(/<loc[^>]*>([^<]+)<\/loc>/i);
    if (locMatch && locMatch[1]) {
      const url: SitemapUrl = {
        loc: locMatch[1].trim(),
      };

      const lastmodMatch = urlBlock.match(/<lastmod[^>]*>([^<]+)<\/lastmod>/i);
      if (lastmodMatch && lastmodMatch[1]) {
        url.lastmod = lastmodMatch[1].trim();
      }

      const changefreqMatch = urlBlock.match(/<changefreq[^>]*>([^<]+)<\/changefreq>/i);
      if (changefreqMatch && changefreqMatch[1]) {
        url.changefreq = changefreqMatch[1].trim();
      }

      const priorityMatch = urlBlock.match(/<priority[^>]*>([^<]+)<\/priority>/i);
      if (priorityMatch && priorityMatch[1]) {
        url.priority = priorityMatch[1].trim();
      }

      urls.push(url);
    }
  }

  return urls;
}

/**
 * Extract child sitemap URLs from sitemap index
 */
function extractChildSitemaps(xmlContent: string): string[] {
  const sitemaps: string[] = [];
  
  // Match <sitemap> entries in sitemap index
  const sitemapMatches = xmlContent.matchAll(/<sitemap[^>]*>([\s\S]*?)<\/sitemap>/gi);
  
  for (const match of sitemapMatches) {
    const sitemapBlock = match[1];
    if (!sitemapBlock) continue;
    
    const locMatch = sitemapBlock.match(/<loc[^>]*>([^<]+)<\/loc>/i);
    if (locMatch && locMatch[1]) {
      sitemaps.push(locMatch[1].trim());
    }
  }

  return sitemaps;
}

/**
 * Check if XML content is a sitemap index
 */
function isSitemapIndex(xmlContent: string): boolean {
  return xmlContent.includes('<sitemapindex') || 
         (xmlContent.includes('<sitemap>') && !xmlContent.includes('<url>'));
}

/**
 * Try to find sitemap URL from robots.txt
 */
async function findSitemapFromRobots(baseUrl: string): Promise<string | null> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const robotsContent = await response.text();
    
    // Look for Sitemap: directive (case-insensitive)
    const sitemapMatch = robotsContent.match(/^Sitemap:\s*(.+)$/im);
    if (sitemapMatch && sitemapMatch[1]) {
      return sitemapMatch[1].trim();
    }

    return null;
  } catch (error) {
    console.warn('[SitemapParser] Failed to fetch robots.txt:', error);
    return null;
  }
}

/**
 * Main function: Parse sitemap from a website URL
 * 
 * Strategy:
 * 1. Check robots.txt for sitemap location
 * 2. Try common sitemap locations
 * 3. If sitemap index found, recursively fetch child sitemaps
 * 4. Return all unique URLs
 * 
 * @param websiteUrl - Base URL of the website (e.g., https://example.com)
 * @param maxUrls - Maximum number of URLs to return (default: 200)
 * @param maxChildSitemaps - Maximum child sitemaps to process (default: 10)
 */
export async function parseSitemap(
  websiteUrl: string,
  maxUrls: number = 200,
  maxChildSitemaps: number = 10,
): Promise<SitemapParseResult> {
  console.log(`[SitemapParser] Starting sitemap discovery for: ${websiteUrl}`);
  
  let baseUrl: URL;
  try {
    baseUrl = new URL(websiteUrl);
  } catch {
    return {
      success: false,
      urls: [],
      sitemapUrl: '',
      totalFound: 0,
      error: 'Invalid URL format',
    };
  }

  const origin = baseUrl.origin;
  let foundSitemapUrl = '';
  let sitemapContent: string | null = null;

  // Step 1: Check robots.txt for sitemap
  const robotsSitemap = await findSitemapFromRobots(origin);
  if (robotsSitemap) {
    console.log(`[SitemapParser] Found sitemap in robots.txt: ${robotsSitemap}`);
    sitemapContent = await fetchSitemap(robotsSitemap);
    if (sitemapContent) {
      foundSitemapUrl = robotsSitemap;
    }
  }

  // Step 2: Try common sitemap locations
  if (!sitemapContent) {
    for (const location of SITEMAP_LOCATIONS) {
      const sitemapUrl = new URL(location, origin).href;
      console.log(`[SitemapParser] Trying: ${sitemapUrl}`);
      
      sitemapContent = await fetchSitemap(sitemapUrl);
      if (sitemapContent) {
        foundSitemapUrl = sitemapUrl;
        console.log(`[SitemapParser] Found sitemap at: ${sitemapUrl}`);
        break;
      }
    }
  }

  // No sitemap found
  if (!sitemapContent) {
    console.log('[SitemapParser] No sitemap found');
    return {
      success: false,
      urls: [],
      sitemapUrl: '',
      totalFound: 0,
      error: 'No sitemap found at common locations',
    };
  }

  // Step 3: Parse sitemap content
  const allUrls: SitemapUrl[] = [];

  // Check if this is a sitemap index
  if (isSitemapIndex(sitemapContent)) {
    console.log('[SitemapParser] Found sitemap index, fetching child sitemaps...');
    
    const childSitemapUrls = extractChildSitemaps(sitemapContent);
    console.log(`[SitemapParser] Found ${childSitemapUrls.length} child sitemaps`);
    
    // Process child sitemaps (limited to maxChildSitemaps)
    const sitemapsToProcess = childSitemapUrls.slice(0, maxChildSitemaps);
    
    for (const childUrl of sitemapsToProcess) {
      if (allUrls.length >= maxUrls) break;
      
      const childContent = await fetchSitemap(childUrl);
      if (childContent) {
        const childUrls = parseXmlSitemap(childContent);
        console.log(`[SitemapParser] Parsed ${childUrls.length} URLs from ${childUrl}`);
        allUrls.push(...childUrls);
      }
    }
  } else {
    // Regular sitemap
    const urls = parseXmlSitemap(sitemapContent);
    console.log(`[SitemapParser] Parsed ${urls.length} URLs from sitemap`);
    allUrls.push(...urls);
  }

  // Deduplicate and limit URLs
  const uniqueUrls = Array.from(
    new Map(allUrls.map(u => [u.loc, u])).values()
  );
  
  // Filter to same domain only
  const sameDomainUrls = uniqueUrls.filter(u => {
    try {
      const urlObj = new URL(u.loc);
      return urlObj.hostname === baseUrl.hostname;
    } catch {
      return false;
    }
  });

  const limitedUrls = sameDomainUrls.slice(0, maxUrls);

  console.log(`[SitemapParser] Total unique URLs: ${sameDomainUrls.length}, returning: ${limitedUrls.length}`);

  return {
    success: true,
    urls: limitedUrls,
    sitemapUrl: foundSitemapUrl,
    totalFound: sameDomainUrls.length,
  };
}

/**
 * Get just the URL strings from sitemap (convenience function)
 */
export async function getSitemapUrls(
  websiteUrl: string,
  maxUrls: number = 200,
): Promise<string[]> {
  const result = await parseSitemap(websiteUrl, maxUrls);
  return result.urls.map(u => u.loc);
}
