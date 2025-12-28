import { load } from 'cheerio';

/**
 * Result of llms.txt check
 */
export interface LlmsTxtCheck {
  exists: boolean;
  size: number;
  contentPreview: string;
}

/**
 * Result of performance (TTFB) check
 */
export interface PerformanceCheck {
  ttfbMs: number;
  rating: 'Good' | 'Poor';
}

/**
 * Result of metadata and security checks
 */
export interface MetadataSecurityCheck {
  hasRobotsTxt: boolean;
  hasSsl: boolean;
  hasMetaDescription: boolean;
}

/**
 * Combined result of live tech audit
 */
export interface TechAuditResult {
  llmsTxt: LlmsTxtCheck;
  performance: PerformanceCheck;
  metadata: MetadataSecurityCheck;
  url: string;
}

/**
 * Normalize URL to ensure it has protocol
 */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  // Default to https
  return `https://${trimmed}`;
}

/**
 * Check if llms.txt exists at the given URL
 */
async function checkLlmsTxt(baseUrl: string): Promise<LlmsTxtCheck> {
  try {
    const llmsTxtUrl = `${baseUrl.replace(/\/$/, '')}/llms.txt`;
    const response = await fetch(llmsTxtUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const content = await response.text();
      const size = new Blob([content]).size;
      const contentPreview = content.substring(0, 200).replace(/\n/g, ' ').trim();
      
      return {
        exists: true,
        size,
        contentPreview,
      };
    }
  } catch (error) {
    // llms.txt doesn't exist or failed to fetch
    // This is not necessarily an error - many sites don't have it
  }

  return {
    exists: false,
    size: 0,
    contentPreview: '',
  };
}

/**
 * Measure Time To First Byte (TTFB) for the homepage
 */
async function measureTTFB(url: string): Promise<PerformanceCheck> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    // Wait for the first byte (response headers)
    await response.arrayBuffer(); // This ensures we've received the response
    
    const endTime = Date.now();
    const ttfbMs = endTime - startTime;

    return {
      ttfbMs,
      rating: ttfbMs < 600 ? 'Good' : 'Poor',
    };
  } catch (error) {
    // If fetch fails, return poor rating with high TTFB
    return {
      ttfbMs: 9999,
      rating: 'Poor',
    };
  }
}

/**
 * Check metadata and security features
 */
async function checkMetadataAndSecurity(url: string): Promise<MetadataSecurityCheck> {
  const result: MetadataSecurityCheck = {
    hasRobotsTxt: false,
    hasSsl: url.startsWith('https://'),
    hasMetaDescription: false,
  };

  try {
    // Fetch homepage HTML
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return result;
    }

    const html = await response.text();
    const $ = load(html);

    // Check for meta description
    const metaDescription = $('meta[name="description"]').attr('content');
    result.hasMetaDescription = !!metaDescription && metaDescription.trim().length > 0;

    // Check for robots.txt
    try {
      const robotsTxtUrl = new URL('/robots.txt', url).toString();
      const robotsResponse = await fetch(robotsTxtUrl, {
        method: 'HEAD', // Use HEAD to avoid downloading the full file
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      result.hasRobotsTxt = robotsResponse.ok;
    } catch (error) {
      // robots.txt doesn't exist or failed to fetch
      result.hasRobotsTxt = false;
    }
  } catch (error) {
    // Failed to fetch or parse HTML
    console.error('Error checking metadata and security:', error);
  }

  return result;
}

/**
 * Perform live tech audit on a given URL
 * 
 * Executes multiple checks in parallel:
 * 1. llms.txt check - verifies if llms.txt file exists
 * 2. Performance (TTFB) - measures Time To First Byte
 * 3. Metadata & Security - checks for robots.txt, SSL, and meta description
 * 
 * @param url - The URL to audit (with or without protocol)
 * @returns Combined TechAuditResult with all check results
 */
export async function performLiveTechAudit(url: string): Promise<TechAuditResult> {
  const normalizedUrl = normalizeUrl(url);

  // Run all checks in parallel for better performance
  const [llmsTxt, performance, metadata] = await Promise.all([
    checkLlmsTxt(normalizedUrl),
    measureTTFB(normalizedUrl),
    checkMetadataAndSecurity(normalizedUrl),
  ]);

  return {
    llmsTxt,
    performance,
    metadata,
    url: normalizedUrl,
  };
}

