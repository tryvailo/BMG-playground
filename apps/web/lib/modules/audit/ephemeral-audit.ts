'use server';

import { extractCanonical } from './utils/html-parser';
import { analyzeLlmsTxt } from './utils/llms-analyzer';
import { heuristicLlmsAnalysis } from './utils/llms-heuristic';
import { analyzeTechAudit } from './utils/tech-audit-analyzer';
import type { TechAuditAnalysis } from './utils/tech-audit-analyzer';
import { fetchAndAnalyzeRobotsTxt, type RobotsTxtAnalysis } from './utils/robots-parser';
import { analyzeSitemap, type SitemapAnalysis } from './utils/sitemap-analyzer';
import { analyzeTitle, analyzeDescription, analyzeCanonical, type TitleAnalysis, type DescriptionAnalysis, type CanonicalAnalysis } from './utils/meta-analyzer';

/*
 * -------------------------------------------------------
 * Type Definitions
 * -------------------------------------------------------
 */

/**
 * PageSpeed API Response Types
 */
interface _PageSpeedMetrics {
  lcp?: number; // Largest Contentful Paint
  fcp?: number; // First Contentful Paint
  cls?: number; // Cumulative Layout Shift
  tbt?: number; // Total Blocking Time
  si?: number; // Speed Index
  tti?: number; // Time to Interactive
  ttfb?: number; // Time to First Byte
  [key: string]: unknown;
}

interface PageSpeedAudit {
  id: string;
  title: string;
  description?: string;
  score: number | null;
  numericValue?: number;
  numericUnit?: string;
  displayValue?: string;
  details?: {
    type: string;
    headings?: Array<{ key: string; label: string }>;
    items?: Array<Record<string, unknown>>;
  };
}

interface PageSpeedResponse {
  lighthouseResult: {
    categories: {
      performance?: { score: number | null };
      accessibility?: { score: number | null };
      'best-practices'?: { score: number | null };
      seo?: { score: number | null };
      [key: string]: { score: number | null } | undefined;
    };
    audits: {
      [key: string]: PageSpeedAudit | unknown;
    };
  };
  loadingExperience?: {
    metrics?: {
      FIRST_CONTENTFUL_PAINT_MS?: { percentile: number };
      LARGEST_CONTENTFUL_PAINT_MS?: { percentile: number };
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: { percentile: number };
      FIRST_INPUT_DELAY_MS?: { percentile: number };
    };
  };
}

/**
 * PageSpeed Detailed Metrics
 */
export interface PageSpeedDetailedMetrics {
  score: number | null;
  lcp: number | null; // Largest Contentful Paint (ms)
  fcp: number | null; // First Contentful Paint (ms)
  cls: number | null; // Cumulative Layout Shift
  tbt: number | null; // Total Blocking Time (ms)
  si: number | null; // Speed Index (ms)
  tti: number | null; // Time to Interactive (ms)
  ttfb: number | null; // Time to First Byte (ms)
  opportunities: Array<{
    id: string;
    title: string;
    score: number;
    savings?: number;
    savingsUnit?: string;
  }>;
  categories: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
}

/**
 * Ephemeral Audit Result
 */
export interface EphemeralAuditResult {
  speed: {
    desktop: number | null;
    mobile: number | null;
    desktopDetails?: PageSpeedDetailedMetrics;
    mobileDetails?: PageSpeedDetailedMetrics;
  };
  security: {
    https: boolean;
    mobileFriendly: boolean;
  };
  files: {
    robots: boolean;
    sitemap: boolean;
    robotsTxt: RobotsTxtAnalysis; // Detailed robots.txt analysis
    sitemapAnalysis: SitemapAnalysis; // Detailed sitemap analysis
    llmsTxt: {
      present: boolean;
      score: number;
      recommendations: string[];
      missingSections: string[];
    };
  };
  schema: {
    hasMedicalOrg: boolean;
    hasLocalBusiness: boolean;
    hasPhysician: boolean;
    hasMedicalProcedure: boolean;
    hasMedicalSpecialty: boolean;
    hasFAQPage: boolean;
    hasReview: boolean;
    hasBreadcrumbList: boolean;
  };
  meta: {
    title: string;
    titleLength: number | null;
    titleAnalysis: TitleAnalysis; // Detailed title quality analysis
    description: string;
    descriptionLength: number | null;
    descriptionAnalysis: DescriptionAnalysis; // Detailed description quality analysis
    h1: string | null;
    canonical: string | null;
    canonicalAnalysis: CanonicalAnalysis; // Detailed canonical URL analysis
    robots: string | null;
    lang: string | null;
    hreflangs: Array<{ lang: string; url: string }>;
    noindexPages?: string[];
    hasNoindex: boolean;
  };
  images: {
    total: number;
    missingAlt: number;
  };
  externalLinks: {
    total: number;
    broken: number;
    trusted: number;
    dofollow: number;
    nofollow: number;
    dofollowPercent: number; // Target: 70-80%
    list: Array<{ url: string; status: number; isTrusted: boolean; isNofollow: boolean }>;
  };
  duplicates: {
    wwwRedirect: 'ok' | 'duplicate' | 'error'; // 'ok' = redirects properly, 'duplicate' = both work, 'error' = check failed
    trailingSlash: 'ok' | 'duplicate' | 'error';
    httpRedirect: 'ok' | 'duplicate' | 'error';
  };
  aiAnalysis?: TechAuditAnalysis; // AI-powered analysis of the entire audit
}

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

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
 * Parse HTML and extract meta, schema, and image data for audit
 */
interface ParsedHTMLForAudit {
  rawHtml?: string; // Store raw HTML for further analysis
  meta: {
    title: string;
    titleLength: number;
    description: string;
    descriptionLength: number;
    h1: string | null;
    canonical: string | null;
    robots: string | null;
    lang: string | null;
    viewport: boolean;
    hreflangs: Array<{ lang: string; url: string }>;
  };
  schema: {
    hasMedicalOrganization: boolean;
    hasPhysician: boolean;
    hasMedicalProcedure: boolean;
    hasLocalBusiness: boolean;
    hasFAQPage: boolean;
    hasReview: boolean;
    hasMedicalSpecialty: boolean;
    hasBreadcrumbList: boolean;
  };
  images: {
    total: number;
    missingAlt: number;
  };
}

/**
 * Scan all heading tags (H1, H2, H3) to find service titles
 */
function extractAllHeadings(html: string): Array<{ level: number; text: string }> {
  const headings: Array<{ level: number; text: string }> = [];
  
  // Find all h1, h2, h3 tags
  for (let level = 1; level <= 3; level++) {
    const regex = new RegExp(`<h${level}[^>]*>([^<]+)</h${level}>`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = match[1]?.trim();
      if (text && text.length > 0) {
        headings.push({ level, text });
      }
    }
  }
  
  return headings;
}

/**
 * Extract descriptions that follow service headings (H2/H3)
 * Looks for text in <p> tags immediately after headings
 */
function extractServiceDescriptions(html: string): Array<{ heading: string; description: string }> {
  const descriptions: Array<{ heading: string; description: string }> = [];
  
  // Match H2/H3 followed by paragraph tag
  const regex = /<h[23][^>]*>([^<]+)<\/h[23]>[\s\n]*<p[^>]*>([^<]+)<\/p>/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const heading = match[1]?.trim();
    const description = match[2]?.trim();
    
    if (heading && description && heading.length > 0 && description.length > 0) {
      descriptions.push({ heading, description });
    }
  }
  
  return descriptions;
}

function parseHTMLForAudit(html: string, _pageUrl: string): ParsedHTMLForAudit {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : '';

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                   html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const description = descMatch && descMatch[1] ? descMatch[1].trim() : '';

  // Extract H1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const h1 = h1Match && h1Match[1] ? h1Match[1].trim() : null;

  // Extract canonical
  const canonical = extractCanonical(html) || null;

  // Extract robots meta
  const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']robots["']/i);
  const robots = robotsMatch && robotsMatch[1] ? robotsMatch[1].trim() : null;

  // Extract lang
  const langMatch = html.match(/<html[^>]*\s+lang=["']([^"']+)["']/i);
  const lang = langMatch && langMatch[1] ? langMatch[1].trim() : null;

  // Extract viewport
  const viewportMatch = html.match(/<meta\s+name=["']viewport["']/i);
  const viewport = !!viewportMatch;

  // Extract hreflangs
  const hreflangs: Array<{ lang: string; url: string }> = [];
  const hreflangRegex = /<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["']/gi;
  let hreflangMatch;
  while ((hreflangMatch = hreflangRegex.exec(html)) !== null) {
    const lang = hreflangMatch[1];
    const url = hreflangMatch[2];
    if (lang && url) {
      hreflangs.push({ lang, url });
    }
  }

  // Extract JSON-LD schemas
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const schemas: string[] = [];
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    const content = jsonLdMatch[1];
    if (content) {
      schemas.push(content);
    }
  }

  // Parse schemas to detect types
  const schemaTypes = new Set<string>();
  schemas.forEach(jsonStr => {
    try {
      const parsed = JSON.parse(jsonStr);
      const extractTypes = (obj: unknown) => {
        if (Array.isArray(obj)) {
          obj.forEach(extractTypes);
        } else if (obj && typeof obj === 'object') {
          const record = obj as Record<string, unknown>;
          if (record['@type']) {
            const types = Array.isArray(record['@type']) ? record['@type'] : [record['@type']];
            types.forEach(t => schemaTypes.add(String(t).toLowerCase()));
          }
          if (record['@graph'] && Array.isArray(record['@graph'])) {
            record['@graph'].forEach(extractTypes);
          }
        }
      };
      extractTypes(parsed);
    } catch {
      // Ignore parse errors
    }
  });

  const hasSchemaType = (types: string[]) => types.some(t => schemaTypes.has(t.toLowerCase()));

  const schema = {
    hasMedicalOrganization: hasSchemaType(['medicalorganization', 'hospital', 'medicalclinic', 'dentist']),
    hasPhysician: hasSchemaType(['physician', 'doctor']),
    hasMedicalProcedure: hasSchemaType(['medicalprocedure', 'therapeuticprocedure', 'diagnosticprocedure']),
    hasLocalBusiness: hasSchemaType(['localbusiness', 'medicalbusiness', 'healthandbeautybusiness']),
    hasFAQPage: hasSchemaType(['faqpage']),
    hasReview: hasSchemaType(['review', 'aggregaterating']),
    hasMedicalSpecialty: hasSchemaType(['medicalspecialty']),
    hasBreadcrumbList: hasSchemaType(['breadcrumblist']),
  };

  // Count images
  const imgRegex = /<img[^>]*>/gi;
  const imgMatches = html.match(imgRegex) || [];
  const total = imgMatches.length;
  const missingAlt = imgMatches.filter(img => !img.match(/alt=["'][^"']+["']/i)).length;

  return {
    rawHtml: html,
    meta: {
      title,
      titleLength: title.length,
      description,
      descriptionLength: description.length,
      h1,
      canonical,
      robots,
      lang,
      viewport,
      hreflangs,
    },
    schema,
    images: {
      total,
      missingAlt,
    },
  };
}

/**
 * Fetch Google PageSpeed Insights data with full details
 * @param url - The URL to test
 * @param strategy - 'mobile' or 'desktop'
 * @param apiKey - API key (optional, falls back to env var)
 * @returns PageSpeed score and detailed metrics
 */
async function fetchPageSpeedScore(
  url: string,
  strategy: 'mobile' | 'desktop',
  apiKey?: string,
): Promise<{ score: number | null; details: PageSpeedDetailedMetrics | null }> {
  const key = apiKey || process.env.GOOGLE_PAGESPEED_API_KEY;

  if (!key) {
    console.warn('[EphemeralAudit] GOOGLE_PAGESPEED_API_KEY not set, skipping PageSpeed check');
    return { score: null, details: null };
  }

  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${key}&strategy=${strategy}`;

    console.log(`[EphemeralAudit] Fetching PageSpeed ${strategy} for ${url}...`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[EphemeralAudit] PageSpeed API error (${strategy}): ${response.status} ${response.statusText}`);
      console.error(`[EphemeralAudit] Response body: ${errorText.substring(0, 200)}`);
      return { score: null, details: null };
    }

    const data = (await response.json()) as PageSpeedResponse;
    const lighthouse = data.lighthouseResult;

    // Extract performance score
    const performanceScore = lighthouse?.categories?.performance?.score;
    const score = performanceScore !== null && performanceScore !== undefined
      ? Math.round(performanceScore * 100)
      : null;

    if (score === null) {
      console.warn(`[EphemeralAudit] PageSpeed ${strategy} returned no score in response`);
      return { score: null, details: null };
    }

    // Extract Core Web Vitals and other metrics
    const audits = lighthouse?.audits || {};
    const getAuditValue = (id: string): number | null => {
      const audit = audits[id] as PageSpeedAudit | undefined;
      return audit?.numericValue !== undefined ? audit.numericValue : null;
    };

    // Extract opportunities (recommendations with score < 1)
    const opportunities: PageSpeedDetailedMetrics['opportunities'] = [];
    Object.keys(audits).forEach((id) => {
      const audit = audits[id] as PageSpeedAudit | undefined;
      if (audit && audit.score !== null && audit.score !== undefined && audit.score < 1) {
        // Extract savings if available
        const savings = audit.details?.items?.[0] as { wastedBytes?: number; wastedMs?: number } | undefined;
        opportunities.push({
          id,
          title: audit.title || id,
          score: Math.round(audit.score * 100),
          savings: savings?.wastedBytes || savings?.wastedMs || undefined,
          savingsUnit: savings?.wastedBytes ? 'bytes' : savings?.wastedMs ? 'ms' : undefined,
        });
      }
    });

    // Sort opportunities by score (worst first) and take top 10
    opportunities.sort((a, b) => a.score - b.score);
    const topOpportunities = opportunities.slice(0, 10);

    // Extract category scores
    const categories = lighthouse?.categories || {};
    const categoryScores = {
      performance: categories.performance?.score !== null && categories.performance?.score !== undefined
        ? Math.round(categories.performance.score * 100)
        : null,
      accessibility: categories.accessibility?.score !== null && categories.accessibility?.score !== undefined
        ? Math.round(categories.accessibility.score * 100)
        : null,
      bestPractices: categories['best-practices']?.score !== null && categories['best-practices']?.score !== undefined
        ? Math.round(categories['best-practices'].score * 100)
        : null,
      seo: categories.seo?.score !== null && categories.seo?.score !== undefined
        ? Math.round(categories.seo.score * 100)
        : null,
    };

    const details: PageSpeedDetailedMetrics = {
      score,
      lcp: getAuditValue('largest-contentful-paint'),
      fcp: getAuditValue('first-contentful-paint'),
      cls: getAuditValue('cumulative-layout-shift'),
      tbt: getAuditValue('total-blocking-time'),
      si: getAuditValue('speed-index'),
      tti: getAuditValue('interactive'),
      ttfb: getAuditValue('server-response-time') || getAuditValue('time-to-first-byte'),
      opportunities: topOpportunities,
      categories: categoryScores,
    };

    console.log(`[EphemeralAudit] PageSpeed ${strategy} score: ${score}/100`);
    console.log(`[EphemeralAudit] LCP: ${details.lcp}ms, FCP: ${details.fcp}ms, CLS: ${details.cls}, TBT: ${details.tbt}ms`);

    return { score, details };
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(`[EphemeralAudit] PageSpeed ${strategy} request timed out after 60 seconds`);
    } else {
      console.error(`[EphemeralAudit] Error fetching PageSpeed ${strategy} data:`, error);
    }
    return { score: null, details: null };
  }
}

/**
 * Check if a file exists at a given URL
 */
async function _checkFileExists(fileUrl: string): Promise<boolean> {
  try {
    const response = await fetch(fileUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (_error) {
    return false;
  }
}

/**
 * Check technical duplicates (WWW, trailing slash, HTTP redirects)
 */
async function checkTechnicalDuplicates(
  url: string,
): Promise<{
  wwwRedirect: 'ok' | 'duplicate' | 'error';
  trailingSlash: 'ok' | 'duplicate' | 'error';
  httpRedirect: 'ok' | 'duplicate' | 'error';
}> {
  const result: {
    wwwRedirect: 'ok' | 'duplicate' | 'error';
    trailingSlash: 'ok' | 'duplicate' | 'error';
    httpRedirect: 'ok' | 'duplicate' | 'error';
  } = {
    wwwRedirect: 'error',
    trailingSlash: 'error',
    httpRedirect: 'error',
  };

  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol;
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    const search = urlObj.search;

    // Check WWW vs non-WWW
    try {
      const wwwUrl = `${protocol}//www.${hostname}${pathname}${search}`;
      const nonWwwUrl = `${protocol}//${hostname.replace(/^www\./, '')}${pathname}${search}`;

      const [wwwResponse, nonWwwResponse] = await Promise.allSettled([
        fetch(wwwUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)' },
          signal: AbortSignal.timeout(5000),
          redirect: 'manual', // Don't follow redirects automatically
        }),
        fetch(nonWwwUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)' },
          signal: AbortSignal.timeout(5000),
          redirect: 'manual',
        }),
      ]);

      if (wwwResponse.status === 'fulfilled' && nonWwwResponse.status === 'fulfilled') {
        const wwwStatus = wwwResponse.value.status;
        const nonWwwStatus = nonWwwResponse.value.status;

        // If both return 200 without redirect (status 301/302), it's a duplicate
        if (wwwStatus === 200 && nonWwwStatus === 200) {
          result.wwwRedirect = 'duplicate';
        } else if (wwwStatus >= 301 && wwwStatus <= 308) {
          // Redirects properly
          result.wwwRedirect = 'ok';
        } else if (nonWwwStatus >= 301 && nonWwwStatus <= 308) {
          // Redirects properly
          result.wwwRedirect = 'ok';
        } else {
          result.wwwRedirect = 'ok'; // At least one works, assume redirect is configured
        }
      }
    } catch (error) {
      console.warn('[EphemeralAudit] Error checking WWW redirect:', error);
    }

    // Check trailing slash
    try {
      // Only check if pathname is not empty (root path doesn't need this check)
      if (pathname && pathname !== '/') {
        const urlWithSlash = `${protocol}//${hostname}${pathname.endsWith('/') ? pathname : pathname + '/'}${search}`;
        const urlWithoutSlash = `${protocol}//${hostname}${pathname.endsWith('/') ? pathname.slice(0, -1) : pathname}${search}`;

        const [slashResponse, noSlashResponse] = await Promise.allSettled([
          fetch(urlWithSlash, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)' },
            signal: AbortSignal.timeout(5000),
            redirect: 'manual',
          }),
          fetch(urlWithoutSlash, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)' },
            signal: AbortSignal.timeout(5000),
            redirect: 'manual',
          }),
        ]);

        if (slashResponse.status === 'fulfilled' && noSlashResponse.status === 'fulfilled') {
          const slashStatus = slashResponse.value.status;
          const noSlashStatus = noSlashResponse.value.status;

          // If both return 200 without redirect, it's a duplicate
          if (slashStatus === 200 && noSlashStatus === 200) {
            result.trailingSlash = 'duplicate';
          } else if (slashStatus >= 301 && slashStatus <= 308) {
            result.trailingSlash = 'ok';
          } else if (noSlashStatus >= 301 && noSlashStatus <= 308) {
            result.trailingSlash = 'ok';
          } else {
            result.trailingSlash = 'ok';
          }
        }
      } else {
        // Root path - no trailing slash check needed
        result.trailingSlash = 'ok';
      }
    } catch (error) {
      console.warn('[EphemeralAudit] Error checking trailing slash:', error);
    }

    // Check HTTP to HTTPS redirect
    try {
      if (protocol === 'https:') {
        const httpUrl = `http://${hostname}${pathname}${search}`;
        const httpResponse = await fetch(httpUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)' },
          signal: AbortSignal.timeout(5000),
          redirect: 'manual',
        });

        if (httpResponse.status >= 301 && httpResponse.status <= 308) {
          // Redirects to HTTPS - good
          result.httpRedirect = 'ok';
        } else if (httpResponse.status === 200) {
          // HTTP also works - duplicate issue
          result.httpRedirect = 'duplicate';
        } else {
          result.httpRedirect = 'ok'; // HTTP doesn't work, assume HTTPS only
        }
      } else {
        result.httpRedirect = 'ok'; // Already HTTP, no redirect needed
      }
    } catch (error) {
      console.warn('[EphemeralAudit] Error checking HTTP redirect:', error);
      // If HTTP doesn't respond, assume HTTPS only (ok)
      result.httpRedirect = 'ok';
    }
  } catch (error) {
    console.error('[EphemeralAudit] Error in technical duplicate check:', error);
  }

  return result;
}

/**
 * Fetch and analyze llms.txt file
 */
async function checkAndAnalyzeLlmsTxt(
  baseUrl: string,
  openaiKey: string,
): Promise<{
  present: boolean;
  score: number;
  recommendations: string[];
}> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  try {
    // Normalize baseUrl - ensure it doesn't have trailing slash
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    const llmsTxtUrl = `${normalizedBaseUrl}/llms.txt`;

    console.log(`[EphemeralAudit] Checking llms.txt at: ${llmsTxtUrl}`);

    const response = await fetch(llmsTxtUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
        'Accept': 'text/plain, text/*, */*',
      },
      signal: AbortSignal.timeout(10000), // Increased timeout to 10 seconds
    });

    console.log(`[EphemeralAudit] llms.txt response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.warn(`[EphemeralAudit] llms.txt not found or error: ${response.status} ${response.statusText}`);
      return {
        present: false,
        score: 0,
        recommendations: ['Add an llms.txt file to help AI systems understand your content structure.'],
        data: {
          score: 0,
          summary: 'llms.txt not found',
          missing_sections: ['llms.txt missing'],
          recommendations: ['Add an llms.txt file to help AI systems understand your content structure.'],
          analysisMethod: 'none',
        },
      } as any;
    }

    const content = await response.text();
    console.log(`[EphemeralAudit] llms.txt fetched successfully, size: ${content.length} characters`);

    if (!content || content.trim().length === 0) {
      console.warn('[EphemeralAudit] llms.txt file is empty');
      return {
        present: false,
        score: 0,
        recommendations: ['llms.txt file exists but is empty. Add content to help AI systems understand your content structure.'],
        data: {
          score: 0,
          summary: 'llms.txt file is empty',
          missing_sections: ['llms.txt is empty'],
          recommendations: ['Add content to llms.txt to improve AI visibility.'],
          analysisMethod: 'none',
        },
      } as any;
    }

    // Analyze with AI if key is provided
    if (openaiKey && openaiKey.trim().length > 0) {
      try {
        console.log('[EphemeralAudit] Starting AI analysis of llms.txt...');
        const analysis = await analyzeLlmsTxt(content, openaiKey);
        console.log(`[EphemeralAudit] llms.txt AI analysis completed, score: ${analysis.score}/100`);

        return {
          present: true,
          score: analysis.score,
          recommendations: analysis.recommendations,
          data: analysis as any,
        } as any;
      } catch (aiError) {
        console.error('[EphemeralAudit] Error during AI analysis of llms.txt:', aiError);
        // If AI analysis throws, attempt a local heuristic fallback so UI gets useful info
        try {
          const fallback = heuristicLlmsAnalysis(content, aiError instanceof Error ? aiError.message : String(aiError));
          console.warn('[EphemeralAudit] Using heuristic fallback for llms.txt analysis');
          return {
            present: true,
            score: fallback.score,
            recommendations: fallback.recommendations,
            data: fallback as any,
          } as any;
        } catch (fallbackError) {
          console.error('[EphemeralAudit] Heuristic fallback failed:', fallbackError);
          return {
            present: true,
            score: 0,
            recommendations: ['llms.txt file exists but AI analysis failed. Check OpenAI API key.'],
            data: {
              score: 0,
              summary: 'AI analysis failed and heuristic fallback unavailable',
              missing_sections: ['Unable to analyze llms.txt'],
              recommendations: ['Ensure OpenAI API key is valid and try again'],
              analysisMethod: 'none',
            },
          } as any;
        }
      }
    } else {
      console.warn('[EphemeralAudit] No OpenAI key provided, skipping AI analysis of llms.txt');
      // File exists but no AI analysis - provide lightweight data object so UI can show messages
      return {
        present: true,
        score: 0,
        recommendations: ['llms.txt file exists. Provide OpenAI API key for quality analysis.'],
        data: {
          score: 0,
          summary: 'No OpenAI key provided - analysis skipped',
          missing_sections: [],
          recommendations: ['Provide OpenAI API key to enable detailed llms.txt analysis.'],
          analysisMethod: 'none',
        },
      } as any;
    }
  } catch (error) {
    console.error('[EphemeralAudit] Error checking llms.txt:', error);
    if (error instanceof Error) {
      console.error('[EphemeralAudit] Error details:', error.message);
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        console.error('[EphemeralAudit] Request timed out - file may be slow to respond');
      }
    }
    return {
      present: false,
      score: 0,
      recommendations: ['Add an llms.txt file to help AI systems understand your content structure.'],
      data: {
        score: 0,
        summary: 'Error checking llms.txt',
        missing_sections: ['Unable to fetch or parse llms.txt'],
        recommendations: ['Add an llms.txt file to help AI systems understand your content structure.'],
        analysisMethod: 'none',
      },
    } as any;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Perform an ephemeral (non-database) technical audit
 * 
 * This function runs all checks in parallel and returns results without
 * persisting anything to the database. Perfect for playground/testing.
 * 
 * @param url - The URL to audit
 * @param openaiKey - OpenAI API key for llms.txt analysis
 * @param pageSpeedKey - Google PageSpeed API key (optional, falls back to env var)
 * @returns EphemeralAuditResult with all audit data
 */
export async function performEphemeralTechAudit(
  url: string,
  openaiKey: string,
  pageSpeedKey?: string,
): Promise<EphemeralAuditResult> {
  const normalizedUrl = normalizeUrl(url);
  const baseUrl = normalizedUrl.replace(/\/$/, '');

  // Use provided OpenAI key, or fallback to environment variable
  // Priority: 1) provided key, 2) OPENAI_API_KEY env var, 3) empty string
  const finalOpenaiKey = openaiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || '';
  const pageSpeedApiKey = pageSpeedKey || process.env.GOOGLE_PAGESPEED_API_KEY;

  // Log key usage for debugging (without exposing the actual key)
  if (finalOpenaiKey) {
    const keySource = openaiKey ? 'provided parameter' : 'environment variable';
    console.log(`[EphemeralAudit] Using OpenAI key from ${keySource} for llms.txt analysis`);
  } else {
    console.warn('[EphemeralAudit] No OpenAI key provided or found in environment. llms.txt analysis will be skipped.');
  }

  // Run all checks in parallel using Promise.allSettled
  const [
    desktopSpeedResult,
    mobileSpeedResult,
    htmlFetchResult,
    robotsTxtAnalysisResult,
    sitemapResult,
    llmsTxtResult,
    duplicatesResult,
  ] = await Promise.allSettled([
    // Google PageSpeed - Desktop (returns both score and details)
    fetchPageSpeedScore(normalizedUrl, 'desktop', pageSpeedApiKey),

    // Google PageSpeed - Mobile (returns both score and details)
    fetchPageSpeedScore(normalizedUrl, 'mobile', pageSpeedApiKey),

    // HTML Crawl
    fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then((html) => parseHTMLForAudit(html, normalizedUrl)),

    // robots.txt detailed analysis (replaces simple checkFileExists)
    fetchAndAnalyzeRobotsTxt(baseUrl),

    // sitemap.xml detailed analysis (replaces simple checkFileExists)
    analyzeSitemap(normalizedUrl),

    // llms.txt check and analysis
    checkAndAnalyzeLlmsTxt(baseUrl, finalOpenaiKey),

    // Technical duplicate check
    checkTechnicalDuplicates(normalizedUrl),
  ]);

  // Extract results with error handling
  const desktopSpeedData = desktopSpeedResult.status === 'fulfilled'
    ? desktopSpeedResult.value
    : { score: null, details: null };

  const mobileSpeedData = mobileSpeedResult.status === 'fulfilled'
    ? mobileSpeedResult.value
    : { score: null, details: null };

  const desktopSpeed = desktopSpeedData.score;
  const mobileSpeed = mobileSpeedData.score;
  const desktopDetails = desktopSpeedData.details;
  const mobileDetails = mobileSpeedData.details;

  // Extract HTML parse results
  let htmlData: ParsedHTMLForAudit | null = null;
  if (htmlFetchResult.status === 'fulfilled') {
    try {
      htmlData = htmlFetchResult.value;
      console.log('[EphemeralAudit] HTML parsed successfully');
      if (htmlData?.schema) {
        console.log('[EphemeralAudit] Schema data:', JSON.stringify(htmlData.schema, null, 2));
        
        // Detailed schema analysis
        const schemaKeys = Object.keys(htmlData.schema || {});
        const schemaValues = Object.values(htmlData.schema || {});
        const trueValues = schemaValues.filter(v => v === true).length;
        console.log(`[EphemeralAudit] Schema keys found: ${schemaKeys.length}, true values: ${trueValues}`);
        
        if (trueValues === 0) {
          console.warn('[EphemeralAudit] ⚠️  WARNING: No schema types detected! This could mean:');
          console.warn('[EphemeralAudit]   1. The website has no JSON-LD markup');
          console.warn('[EphemeralAudit]   2. JSON-LD is malformed');
          console.warn('[EphemeralAudit]   3. Schema types don\'t match expected patterns');
        }
      }
    } catch (error) {
      console.error('[EphemeralAudit] Error processing HTML data:', error);
      htmlData = null;
    }
  } else {
    console.error('[EphemeralAudit] Error fetching HTML:', htmlFetchResult.reason);
    console.warn('[EphemeralAudit] Schema analysis will be skipped due to HTML fetch failure');
    if (htmlFetchResult.reason instanceof Error) {
      console.error('[EphemeralAudit] Error details:', htmlFetchResult.reason.message);
      console.error('[EphemeralAudit] Error stack:', htmlFetchResult.reason.stack);
    }
  }

  // Extract robots.txt analysis results
  const robotsTxtAnalysis: RobotsTxtAnalysis = robotsTxtAnalysisResult.status === 'fulfilled'
    ? robotsTxtAnalysisResult.value
    : {
      present: false,
      content: '',
      hasSitemap: false,
      sitemapUrls: [],
      rules: [],
      disallowAll: false,
      blocksAIBots: false,
      blockedAIBots: [],
      hasWildcardUserAgent: false,
      issues: ['Помилка при аналізі robots.txt'],
      recommendations: [],
      score: 0,
    };

  const robotsPresent = robotsTxtAnalysis.present;

  // Extract sitemap analysis results
  const sitemapAnalysis: SitemapAnalysis = sitemapResult.status === 'fulfilled'
    ? sitemapResult.value
    : {
      present: false,
      valid: false,
      urlCount: 0,
      hasLastMod: 0,
      hasPriority: 0,
      hasChangefreq: 0,
      hasImages: 0,
      issues: ['Помилка при аналізі sitemap'],
      recommendations: [],
      score: 0,
    };

  const sitemapPresent = sitemapAnalysis.present;

  // Extract llms.txt results
  const llmsTxtData = llmsTxtResult.status === 'fulfilled'
    ? llmsTxtResult.value
    : {
      present: false,
      score: 0,
      recommendations: ['Unable to analyze llms.txt file.'],
    };

  // Extract security and meta data from HTML
  const httpsEnabled = normalizedUrl.startsWith('https://');
  const mobileFriendly = htmlData?.meta?.viewport ?? false;

  // Extract schema data
  const schema = htmlData?.schema || {
    hasMedicalOrganization: false,
    hasPhysician: false,
    hasMedicalProcedure: false,
    hasLocalBusiness: false,
    hasFAQPage: false,
    hasReview: false,
    hasMedicalSpecialty: false,
    hasBreadcrumbList: false,
  };
  
  // Log final schema mapping
  console.log('[EphemeralAudit] Final schema mapping:');
  console.log(`[EphemeralAudit]   hasMedicalOrganization: ${schema.hasMedicalOrganization} → hasMedicalOrg: ${schema.hasMedicalOrganization}`);
  console.log(`[EphemeralAudit]   hasLocalBusiness: ${schema.hasLocalBusiness}`);
  console.log(`[EphemeralAudit]   hasPhysician: ${schema.hasPhysician}`);
  console.log(`[EphemeralAudit]   hasMedicalProcedure: ${schema.hasMedicalProcedure}`);
  console.log(`[EphemeralAudit]   hasMedicalSpecialty: ${schema.hasMedicalSpecialty}`);
  console.log(`[EphemeralAudit]   hasFAQPage: ${schema.hasFAQPage}`);
  console.log(`[EphemeralAudit]   hasReview: ${schema.hasReview}`);
  console.log(`[EphemeralAudit]   hasBreadcrumbList: ${schema.hasBreadcrumbList}`);

  // Extract meta data
  const title = htmlData?.meta?.title || '';
  const description = htmlData?.meta?.description || '';
  const h1 = htmlData?.meta?.h1 || null;
  const canonical = htmlData?.meta?.canonical || null;
  const robots = htmlData?.meta?.robots || null;
  const lang = htmlData?.meta?.lang || null;

  // Extract images data
  const images = htmlData?.images || {
    total: 0,
    missingAlt: 0,
  };

  // External links - simplified (not parsed from HTML in this version)
  const externalLinks = {
    total: 0,
    broken: 0,
    dofollow: 0,
    nofollow: 0,
    dofollowPercent: 0,
    list: [] as Array<{ url: string; status: number; isTrusted: boolean; isNofollow: boolean }>,
  };
  const trustedLinks = 0;

  // Extract duplicate check results
  const duplicates = duplicatesResult.status === 'fulfilled'
    ? duplicatesResult.value
    : {
      wwwRedirect: 'error' as const,
      trailingSlash: 'error' as const,
      httpRedirect: 'error' as const,
    };

  // Build the audit result
  const auditResult: EphemeralAuditResult = {
    speed: {
      desktop: desktopSpeed,
      mobile: mobileSpeed,
      desktopDetails: desktopDetails || undefined,
      mobileDetails: mobileDetails || undefined,
    },
    security: {
      https: httpsEnabled,
      mobileFriendly,
    },
    files: {
      robots: robotsPresent,
      sitemap: sitemapPresent,
      robotsTxt: robotsTxtAnalysis,
      sitemapAnalysis: sitemapAnalysis,
      llmsTxt: {
        present: llmsTxtData.present,
        score: llmsTxtData.score,
        recommendations: llmsTxtData.recommendations,
        missingSections: (llmsTxtData as unknown as { data?: { missing_sections?: string[] } }).data?.missing_sections || [],
      },
    },
    schema: {
      hasMedicalOrg: schema.hasMedicalOrganization,
      hasLocalBusiness: schema.hasLocalBusiness,
      hasPhysician: schema.hasPhysician,
      hasMedicalProcedure: schema.hasMedicalProcedure,
      hasMedicalSpecialty: schema.hasMedicalSpecialty,
      hasFAQPage: schema.hasFAQPage,
      hasReview: schema.hasReview,
      hasBreadcrumbList: schema.hasBreadcrumbList,
    },
    meta: {
      title,
      titleLength: htmlData?.meta?.titleLength ?? null,
      titleAnalysis: (() => {
        const mainAnalysis = analyzeTitle(title);
        
        // Analyze service titles from headings if HTML data available
        if (htmlData?.rawHtml) {
          const allHeadings = extractAllHeadings(htmlData.rawHtml);
          
          // Filter for service-related headings (exclude main H1 which is usually the page title)
          // Focus on H2 and H3 as service names/titles, but also include H1 variations
          const serviceHeadings = allHeadings.filter(heading => {
            // Exclude if it's the main page title
            if (heading.text === title) return false;
            // Include all H2 and H3
            if (heading.level >= 2) return true;
            // Include H1 only if different from main title
            return heading.level === 1 && heading.text !== title;
          });
          
          if (serviceHeadings.length > 0) {
            const serviceTitles = serviceHeadings.map(heading => analyzeTitle(heading.text));
            mainAnalysis.serviceTitles = serviceTitles;
          }
        }
        
        return mainAnalysis;
      })(),
      description,
      descriptionLength: htmlData?.meta?.descriptionLength ?? null,
      descriptionAnalysis: (() => {
        const mainAnalysis = analyzeDescription(description, title);
        
        // Analyze service descriptions if HTML data available
        if (htmlData?.rawHtml) {
          const serviceDescs = extractServiceDescriptions(htmlData.rawHtml);
          
          if (serviceDescs.length > 0) {
            const serviceAnalyses = serviceDescs.map(item => 
              analyzeDescription(item.description, item.heading)
            );
            mainAnalysis.serviceDescriptions = serviceAnalyses;
          }
        }
        
        return mainAnalysis;
      })(),
      h1,
      canonical,
      canonicalAnalysis: analyzeCanonical(canonical, normalizedUrl),
      robots,
      lang,
      hreflangs: htmlData?.meta?.hreflangs ?? [],
      hasNoindex: robots?.toLowerCase().includes('noindex') ?? false,
    },
    images: {
      total: images.total,
      missingAlt: images.missingAlt,
    },
    externalLinks: {
      total: externalLinks.total,
      broken: externalLinks.broken,
      trusted: trustedLinks,
      dofollow: externalLinks.dofollow,
      nofollow: externalLinks.nofollow,
      dofollowPercent: externalLinks.dofollowPercent,
      list: externalLinks.list.map((link) => ({
        url: link.url,
        status: link.status,
        isTrusted: link.isTrusted,
        isNofollow: link.isNofollow,
      })),
    },
    duplicates,
  };

  // Perform AI analysis if OpenAI key is available
  if (finalOpenaiKey) {
    try {
      console.log('[EphemeralAudit] Starting AI analysis of technical audit...');
      const aiAnalysis = await analyzeTechAudit(auditResult, finalOpenaiKey);
      auditResult.aiAnalysis = aiAnalysis;
      console.log(`[EphemeralAudit] AI analysis completed. Overall score: ${aiAnalysis.overallScore}/100`);
    } catch (error) {
      console.error('[EphemeralAudit] Error performing AI analysis:', error);
      // Continue without AI analysis - it's optional
    }
  } else {
    console.warn('[EphemeralAudit] No OpenAI key available. Skipping AI analysis.');
  }

  // Ensure all data is serializable before returning
  // This helps catch serialization issues early
  try {
    // Test serialization to catch any issues early
    const testSerialization = JSON.stringify(auditResult);
    if (!testSerialization) {
      throw new Error('Serialization returned empty string');
    }
  } catch (serializationError) {
    console.error('[EphemeralAudit] Serialization error detected:', serializationError);
    console.error('[EphemeralAudit] Attempting to clean data...');
    
    // Create a cleaned version with only serializable data
    const cleanedResult: EphemeralAuditResult = {
      ...auditResult,
      files: {
        ...auditResult.files,
        robotsTxt: {
          ...auditResult.files.robotsTxt,
          rules: auditResult.files.robotsTxt.rules.map(rule => ({
            userAgent: String(rule.userAgent || ''),
            disallow: Array.isArray(rule.disallow) ? rule.disallow.map(String) : [],
            allow: Array.isArray(rule.allow) ? rule.allow.map(String) : [],
          })),
        },
      },
    };
    
    // Test cleaned result
    try {
      JSON.stringify(cleanedResult);
      return cleanedResult;
    } catch (cleanError) {
      console.error('[EphemeralAudit] Even cleaned result failed serialization:', cleanError);
      throw new Error('Failed to serialize audit result. Data may contain non-serializable values.');
    }
  }

  return auditResult;
}

