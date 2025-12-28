'use server';

import { parseHtml } from './utils/html-parser';
import { analyzeLlmsTxt } from './utils/llms-analyzer';
import { analyzeTechAudit } from './utils/tech-audit-analyzer';
import type { TechAuditAnalysis } from './utils/tech-audit-analyzer';

/*
 * -------------------------------------------------------
 * Type Definitions
 * -------------------------------------------------------
 */

/**
 * PageSpeed API Response Types
 */
interface PageSpeedMetrics {
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
    llmsTxt: {
      present: boolean;
      score: number;
      recommendations: string[];
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
    description: string;
    descriptionLength: number | null;
    h1: string | null;
    canonical: string | null;
    robots: string | null;
    lang: string | null;
    hreflangs: Array<{ lang: string; url: string }>;
    noindexPages?: string[];
  };
  images: {
    total: number;
    missingAlt: number;
  };
  externalLinks: {
    total: number;
    broken: number;
    trusted: number;
    list: Array<{ url: string; status: number; isTrusted: boolean }>;
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
async function checkFileExists(fileUrl: string): Promise<boolean> {
  try {
    const response = await fetch(fileUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
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
      };
    }

    const content = await response.text();
    console.log(`[EphemeralAudit] llms.txt fetched successfully, size: ${content.length} characters`);

    if (!content || content.trim().length === 0) {
      console.warn('[EphemeralAudit] llms.txt file is empty');
      return {
        present: false,
        score: 0,
        recommendations: ['llms.txt file exists but is empty. Add content to help AI systems understand your content structure.'],
      };
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
        };
      } catch (aiError) {
        console.error('[EphemeralAudit] Error during AI analysis of llms.txt:', aiError);
        // File exists but analysis failed - still mark as present
        return {
          present: true,
          score: 0,
          recommendations: ['llms.txt file exists but AI analysis failed. Check OpenAI API key.'],
        };
      }
    } else {
      console.warn('[EphemeralAudit] No OpenAI key provided, skipping AI analysis of llms.txt');
      // File exists but no AI analysis
      return {
        present: true,
        score: 0,
        recommendations: ['llms.txt file exists. Provide OpenAI API key for quality analysis.'],
      };
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
    };
  }
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
    robotsTxtResult,
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
      .then((html) => parseHtml(html, normalizedUrl)),

    // robots.txt check
    checkFileExists(new URL('/robots.txt', normalizedUrl).toString()),

    // sitemap.xml check
    checkFileExists(new URL('/sitemap.xml', normalizedUrl).toString()),

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
  let htmlData = null;
  if (htmlFetchResult.status === 'fulfilled') {
    htmlData = htmlFetchResult.value;
    console.log('[EphemeralAudit] HTML parsed successfully');
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
  } else {
    console.error('[EphemeralAudit] Error fetching HTML:', htmlFetchResult.reason);
    console.warn('[EphemeralAudit] Schema analysis will be skipped due to HTML fetch failure');
    if (htmlFetchResult.reason instanceof Error) {
      console.error('[EphemeralAudit] Error details:', htmlFetchResult.reason.message);
      console.error('[EphemeralAudit] Error stack:', htmlFetchResult.reason.stack);
    }
  }

  // Extract file check results
  const robotsPresent = robotsTxtResult.status === 'fulfilled'
    ? robotsTxtResult.value
    : false;

  const sitemapPresent = sitemapResult.status === 'fulfilled'
    ? sitemapResult.value
    : false;

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
  const mobileFriendly = htmlData?.meta.viewport ?? false;

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
  const title = htmlData?.meta.title || '';
  const description = htmlData?.meta.description || '';
  const h1 = htmlData?.meta.h1 || null;
  const canonical = htmlData?.meta.canonical || null;
  const robots = htmlData?.meta.robots || null;
  const lang = htmlData?.meta.lang || null;

  // Extract images data
  const images = htmlData?.images || {
    total: 0,
    missingAlt: 0,
  };

  // Extract external links data
  const externalLinks = htmlData?.externalLinks || {
    total: 0,
    broken: 0,
    list: [],
  };
  const trustedLinks = externalLinks.list.filter((link) => link.isTrusted).length;

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
      llmsTxt: {
        present: llmsTxtData.present,
        score: llmsTxtData.score,
        recommendations: llmsTxtData.recommendations,
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
      titleLength: htmlData?.meta.titleLength ?? null,
      description,
      descriptionLength: htmlData?.meta.descriptionLength ?? null,
      h1,
      canonical,
      robots,
      lang,
      hreflangs: htmlData?.meta.hreflangs ?? [],
    },
    images: {
      total: images.total,
      missingAlt: images.missingAlt,
    },
    externalLinks: {
      total: externalLinks.total,
      broken: externalLinks.broken,
      trusted: trustedLinks,
      list: externalLinks.list,
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

  return auditResult;

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

  return auditResult;
}

