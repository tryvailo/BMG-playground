'use server';

import { load } from 'cheerio';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import type { Project } from '~/lib/types/domain';

/*
 * -------------------------------------------------------
 * Type Definitions
 * Based on the tech_audits and pages_audit database schema
 * -------------------------------------------------------
 */

/**
 * TechAudit - High-level audit record
 */
export interface TechAudit {
  id: string;
  project_id: string;
  created_at: string;
  status: 'running' | 'completed' | 'failed';
  // File Checks
  llms_txt_present: boolean | null;
  llms_txt_score: number | null;
  llms_txt_data: Record<string, unknown>;
  robots_txt_present: boolean | null;
  robots_txt_valid: boolean | null;
  sitemap_present: boolean | null;
  // Security & Tech
  https_enabled: boolean | null;
  mobile_friendly: boolean | null;
  // Speed
  desktop_speed_score: number | null;
  mobile_speed_score: number | null;
  speed_metrics: Record<string, unknown>;
  // Schema Overview
  schema_summary: Record<string, unknown>;
}

/**
 * PageAudit - Individual page audit record
 */
export interface PageAudit {
  id: string;
  audit_id: string;
  url: string;
  status_code: number | null;
  // Meta Tags
  title: string | null;
  title_length: number | null;
  description: string | null;
  description_length: number | null;
  canonical_url: string | null;
  is_canonical_match: boolean | null;
  h1: string | null;
  // Indexing
  meta_robots: string | null;
  is_indexed: boolean | null;
  // Content
  word_count: number | null;
  lang_attribute: string | null;
  // Issues
  is_duplicate: boolean | null;
  issues: string[];
}

/**
 * Google PageSpeed API Response Types
 */
interface _PageSpeedMetrics {
  lcp?: number;
  cls?: number;
  fid?: number;
  fcp?: number;
  ttfb?: number;
  [key: string]: unknown;
}

interface PageSpeedResponse {
  lighthouseResult: {
    categories: {
      performance: {
        score: number | null;
      };
    };
    audits: {
      'largest-contentful-paint': { numericValue: number };
      'cumulative-layout-shift': { numericValue: number };
      'first-contentful-paint': { numericValue: number };
      'total-blocking-time': { numericValue: number };
      'speed-index': { numericValue: number };
      [key: string]: { numericValue: number } | unknown;
    };
  };
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
 * Fetch Google PageSpeed Insights data
 * @param url - The URL to test
 * @param strategy - 'mobile' or 'desktop'
 * @returns PageSpeed score (0-100) and metrics
 */
async function fetchPageSpeed(
  url: string,
  strategy: 'mobile' | 'desktop',
): Promise<{ score: number | null; metrics: { lcp?: number; cls?: number; fcp?: number; tbt?: number; ttfb?: number } }> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

  if (!apiKey) {
    console.warn('[TechAudit] GOOGLE_PAGESPEED_API_KEY not set, skipping PageSpeed check');
    return { score: null, metrics: {} };
  }

  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.error(`[TechAudit] PageSpeed API error: ${response.status} ${response.statusText}`);
      return { score: null, metrics: {} };
    }

    const data = (await response.json()) as PageSpeedResponse;
    const score = data.lighthouseResult?.categories?.performance?.score;
    const numericScore = score !== null && score !== undefined ? Math.round(score * 100) : null;

    // Extract Core Web Vitals and other metrics
    const audits = data.lighthouseResult?.audits || {};
    const metrics: { lcp?: number; cls?: number; fcp?: number; tbt?: number; ttfb?: number } = {
      lcp: audits['largest-contentful-paint']?.numericValue || undefined,
      cls: audits['cumulative-layout-shift']?.numericValue || undefined,
      fcp: audits['first-contentful-paint']?.numericValue || undefined,
      ttfb: (audits['server-response-time'] && typeof audits['server-response-time'] === 'object' && 'numericValue' in audits['server-response-time']) 
        ? (audits['server-response-time'] as { numericValue: number }).numericValue 
        : undefined,
      tbt: audits['total-blocking-time']?.numericValue || undefined,
    };

    return {
      score: numericScore,
      metrics,
    };
    } catch (error) {
      console.error('[TechAudit] Error fetching PageSpeed data:', error);
    return { score: null, metrics: {} };
  }
}

/**
 * Check if llms.txt exists and analyze it
 */
async function checkLlmsTxt(baseUrl: string): Promise<{
  present: boolean;
  score: number | null;
  data: Record<string, unknown>;
}> {
  try {
    const llmsTxtUrl = `${baseUrl.replace(/\/$/, '')}/llms.txt`;
    const response = await fetch(llmsTxtUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const content = await response.text();
      const size = new Blob([content]).size;
      
      // Basic scoring: file exists = 50, has content = +30, reasonable size = +20
      let score = 50;
      if (content.trim().length > 0) score += 30;
      if (size > 0 && size < 100000) score += 20; // Reasonable size

      return {
        present: true,
        score: Math.min(score, 100),
        data: {
          size,
          contentPreview: content.substring(0, 200).replace(/\n/g, ' ').trim(),
          recommendations: size === 0 
            ? ['llms.txt file is empty. Add content to help AI understand your site.']
            : [],
        },
      };
    }
    } catch (_error) {
    // llms.txt doesn't exist - this is not necessarily an error
  }

  return {
    present: false,
    score: 0,
    data: {
      recommendations: ['Add an llms.txt file to help AI systems understand your content structure.'],
    },
  };
}

/**
 * Check robots.txt
 */
async function checkRobotsTxt(baseUrl: string): Promise<{
  present: boolean;
  valid: boolean;
}> {
  try {
    const robotsTxtUrl = new URL('/robots.txt', baseUrl).toString();
    const response = await fetch(robotsTxtUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const content = await response.text();
      // Basic validation: check if it has at least some structure
      const hasUserAgent = content.toLowerCase().includes('user-agent');
      return {
        present: true,
        valid: hasUserAgent,
      };
    }
    } catch (_error) {
    // robots.txt doesn't exist
  }

  return {
    present: false,
    valid: false,
  };
}

/**
 * Check if sitemap exists
 */
async function checkSitemap(baseUrl: string): Promise<boolean> {
  try {
    // Check common sitemap locations
    const sitemapUrls = [
      `${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
      `${baseUrl.replace(/\/$/, '')}/sitemap_index.xml`,
    ];

    for (const sitemapUrl of sitemapUrls) {
      const response = await fetch(sitemapUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return true;
      }
    }
    } catch (_error) {
    // Sitemap doesn't exist
  }

  return false;
}

/**
 * Parse homepage HTML and extract metadata
 */
async function parseHomepage(url: string): Promise<{
  title: string | null;
  titleLength: number | null;
  description: string | null;
  descriptionLength: number | null;
  canonicalUrl: string | null;
  isCanonicalMatch: boolean;
  h1: string | null;
  metaRobots: string | null;
  isIndexed: boolean;
  wordCount: number | null;
  langAttribute: string | null;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      issues.push(`HTTP ${response.status}: ${response.statusText}`);
      return {
        title: null,
        titleLength: null,
        description: null,
        descriptionLength: null,
        canonicalUrl: null,
        isCanonicalMatch: false,
        h1: null,
        metaRobots: null,
        isIndexed: true,
        wordCount: null,
        langAttribute: null,
        issues,
      };
    }

    const html = await response.text();
    const $ = load(html);

    // Extract title
    const title = $('title').text().trim() || null;
    const titleLength = title ? title.length : null;
    if (!title) {
      issues.push('Missing title tag');
    } else if (titleLength && (titleLength < 30 || titleLength > 60)) {
      issues.push(`Title length is ${titleLength} characters (recommended: 30-60)`);
    }

    // Extract meta description
    const description = $('meta[name="description"]').attr('content')?.trim() || null;
    const descriptionLength = description ? description.length : null;
    if (!description) {
      issues.push('Missing meta description');
    } else if (descriptionLength && (descriptionLength < 120 || descriptionLength > 160)) {
      issues.push(`Description length is ${descriptionLength} characters (recommended: 120-160)`);
    }

    // Extract canonical URL
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
    const isCanonicalMatch = canonicalUrl ? canonicalUrl === url : false;
    if (!canonicalUrl) {
      issues.push('Missing canonical URL');
    } else if (!isCanonicalMatch) {
      issues.push('Canonical URL does not match current URL');
    }

    // Extract H1
    const h1 = $('h1').first().text().trim() || null;
    if (!h1) {
      issues.push('Missing H1 tag');
    }

    // Extract meta robots
    const metaRobots = $('meta[name="robots"]').attr('content') || null;
    const isIndexed = !metaRobots || !metaRobots.toLowerCase().includes('noindex');

    // Extract lang attribute
    const langAttribute = $('html').attr('lang') || null;
    if (!langAttribute) {
      issues.push('Missing lang attribute on html tag');
    }

    // Count words in body
    const bodyText = $('body').text();
    const wordCount = bodyText
      ? bodyText.split(/\s+/).filter((word) => word.length > 0).length
      : null;

    return {
      title,
      titleLength,
      description,
      descriptionLength,
      canonicalUrl,
      isCanonicalMatch,
      h1,
      metaRobots,
      isIndexed,
      wordCount,
      langAttribute,
      issues,
    };
    } catch (error) {
      console.error('[TechAudit] Error parsing homepage:', error);
    issues.push(`Error parsing page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      title: null,
      titleLength: null,
      description: null,
      descriptionLength: null,
      canonicalUrl: null,
      isCanonicalMatch: false,
      h1: null,
      metaRobots: null,
      isIndexed: true,
      wordCount: null,
      langAttribute: null,
      issues,
    };
  }
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Run a full technical audit for a project
 * 
 * This function:
 * 1. Creates a new tech_audits record with status 'running'
 * 2. Performs various checks (llms.txt, robots.txt, HTTPS, PageSpeed)
 * 3. Crawls and audits the homepage
 * 4. Updates the audit record with results and status 'completed'
 * 
 * @param projectId - UUID of the project to audit
 * @returns The created TechAudit record ID
 */
/**
 * Get the latest tech audit for a project
 */
export async function getTechAuditByProjectId(projectId: string): Promise<TechAudit | null> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await (supabase as unknown as { 
      from: (table: string) => { 
        select: (cols: string) => { 
          eq: (col: string, val: string) => { 
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => {
                single: () => Promise<{ data: TechAudit | null; error: { message: string; code?: string } | null }>
              }
            }
          } 
        } 
      } 
    })
      .from('tech_audits')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      console.error('[TechAudit] Error fetching tech audit:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[TechAudit] Exception in getTechAuditByProjectId:', error);
    return null;
  }
}

/**
 * Run a full technical audit for a project
 * 
 * This function:
 * 1. Creates a new tech_audits record with status 'running'
 * 2. Performs various checks (llms.txt, robots.txt, HTTPS, PageSpeed)
 * 3. Crawls and audits the homepage
 * 4. Updates the audit record with results and status 'completed'
 * 
 * @param projectId - UUID of the project to audit
 * @returns The created TechAudit record ID
 */
export async function runFullTechAudit(projectId: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  let auditId: string | null = null;

  try {
    // Step 1: Fetch project to get domain
    const { data: project, error: projectError } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: Project | null; error: { message: string } | null }> } } } })
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const projectData = project as Project;
    const baseUrl = normalizeUrl(projectData.domain);

    // Step 2: Create audit record with status 'running'
    const { data: audit, error: auditCreateError } = await (supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } } } })
      .from('tech_audits')
      .insert({
        project_id: projectId,
        status: 'running',
        llms_txt_data: {},
        speed_metrics: {},
        schema_summary: {},
      })
      .select()
      .single();

    if (auditCreateError || !audit) {
      throw new Error(`Failed to create audit record: ${auditCreateError?.message}`);
    }

    auditId = audit.id;

    // Step 3: Perform checks in parallel
    const [
      llmsTxtResult,
      robotsTxtResult,
      sitemapPresent,
      desktopPageSpeed,
      mobilePageSpeed,
    ] = await Promise.all([
      checkLlmsTxt(baseUrl),
      checkRobotsTxt(baseUrl),
      checkSitemap(baseUrl),
      fetchPageSpeed(baseUrl, 'desktop'),
      fetchPageSpeed(baseUrl, 'mobile'),
    ]);

    // Check HTTPS
    const httpsEnabled = baseUrl.startsWith('https://');

    // Step 4: Parse homepage (placeholder crawl - just homepage for now)
    const homepageData = await parseHomepage(baseUrl);

    // Step 5: Create page audit record
    const { error: pageAuditError } = await (supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<{ error: { message: string } | null }> } })
      .from('pages_audit')
      .insert({
        audit_id: auditId,
        url: baseUrl,
        status_code: 200, // Assume 200 if we got HTML
        title: homepageData.title,
        title_length: homepageData.titleLength,
        description: homepageData.description,
        description_length: homepageData.descriptionLength,
        canonical_url: homepageData.canonicalUrl,
        is_canonical_match: homepageData.isCanonicalMatch,
        h1: homepageData.h1,
        meta_robots: homepageData.metaRobots,
        is_indexed: homepageData.isIndexed,
        word_count: homepageData.wordCount,
        lang_attribute: homepageData.langAttribute,
        is_duplicate: false, // Will be determined in full crawl
        issues: homepageData.issues,
      });

    if (pageAuditError) {
      console.error('[TechAudit] Error creating page audit:', pageAuditError);
      // Don't fail the whole audit if page audit fails
    }

    // Step 6: Update audit record with results
    const speedMetrics = {
      desktop: desktopPageSpeed.metrics,
      mobile: mobilePageSpeed.metrics,
    };

    const { error: updateError } = await (supabase as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> } } })
      .from('tech_audits')
      .update({
        status: 'completed',
        // File Checks
        llms_txt_present: llmsTxtResult.present,
        llms_txt_score: llmsTxtResult.score,
        llms_txt_data: llmsTxtResult.data,
        robots_txt_present: robotsTxtResult.present,
        robots_txt_valid: robotsTxtResult.valid,
        sitemap_present: sitemapPresent,
        // Security & Tech
        https_enabled: httpsEnabled,
        mobile_friendly: mobilePageSpeed.score !== null && mobilePageSpeed.score >= 50, // Basic check
        // Speed
        desktop_speed_score: desktopPageSpeed.score,
        mobile_speed_score: mobilePageSpeed.score,
        speed_metrics: speedMetrics,
        // Schema Overview (placeholder - will be populated in future)
        schema_summary: {},
      })
      .eq('id', auditId);

    if (updateError) {
      throw new Error(`Failed to update audit record: ${updateError.message}`);
    }

    if (!auditId) {
      throw new Error('Failed to create audit record: auditId is null');
    }
    return auditId;
  } catch (error) {
    console.error('[TechAudit] Error running full tech audit:', error);

    // Update audit status to 'failed' if we have an auditId
    if (auditId) {
      try {
        await (supabase as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> } } })
          .from('tech_audits')
          .update({
            status: 'failed',
          })
          .eq('id', auditId);
      } catch (updateError) {
        console.error('[TechAudit] Error updating audit status to failed:', updateError);
      }
    }

    throw error;
  }
}

