'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import {
  analyzeEEAT,
  analyzeEEATWithDiscovery,
} from '~/lib/server/services/eeat/eeat-analyzer';
import type { EEATAuditResult } from '~/lib/server/services/eeat/types';

/**
 * E-E-A-T Audit Input Schema
 */
const EEATAuditInputSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  /** Enable multi-page analysis with automatic page discovery */
  multiPage: z.boolean().optional(),
  /** Filter type for page discovery */
  filterType: z.enum(['blog', 'doctors', 'articles', 'all']).optional().default('all'),
  /** Maximum number of pages to analyze */
  maxPages: z.number().int().positive().max(100).optional().default(50),
  /** Google Maps API key (optional, for fetching ratings) */
  googleMapsApiKey: z.string().optional(),
  /** Google Business API key (optional, for NAP comparison) */
  googleBusinessApiKey: z.string().optional(),
});

type EEATAuditInput = z.infer<typeof EEATAuditInputSchema>;

/**
 * Perform E-E-A-T audit for a given URL
 *
 * Fetches the HTML content from the URL and analyzes it for:
 * - Authorship (author blocks, credentials)
 * - Trust (privacy policy, licenses, contact info)
 * - Reputation (external platform links, social media)
 * - Experience (case studies, portfolio)
 *
 * @param input - E-E-A-T audit input with URL
 * @returns EEATAuditResult with all analysis data and recommendations
 */
export const runEEATAudit = enhanceAction(
  async (input: EEATAuditInput): Promise<EEATAuditResult> => {
    const {
      url,
      multiPage = false,
      filterType = 'all',
      maxPages = 50,
      googleMapsApiKey,
      googleBusinessApiKey,
    } = input;

    // Get API keys from environment if not provided
    const mapsApiKey =
      googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;
    const businessApiKey =
      googleBusinessApiKey ||
      process.env.GOOGLE_BUSINESS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_PAGESPEED_API_KEY;

    console.log('[EEATAudit] Starting audit for:', url);
    console.log('[EEATAudit] Multi-page mode:', multiPage);

    // Normalize URL (ensure it has protocol)
    let normalizedUrl = url.trim();
    if (
      !normalizedUrl.startsWith('http://') &&
      !normalizedUrl.startsWith('https://')
    ) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      let result: EEATAuditResult;

      if (multiPage) {
        // Multi-page analysis with automatic page discovery
        console.log(
          `[EEATAudit] Starting multi-page analysis (filter: ${filterType}, max: ${maxPages})...`,
        );
        result = await analyzeEEATWithDiscovery(normalizedUrl, {
          useSitemap: true,
          useRobots: true,
          crawlInternalLinks: false,
          maxPages,
          filterType,
          maxConcurrent: 5,
          googleMapsApiKey: mapsApiKey,
          googleBusinessApiKey: businessApiKey,
        });
        console.log('[EEATAudit] Multi-page analysis completed');
      } else {
        // Single page analysis
        const response = await fetch(normalizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EEATAuditBot/1.0)',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch URL: ${response.status} ${response.statusText}`,
          );
        }

        const html = await response.text();

        if (!html || html.trim().length === 0) {
          throw new Error('No HTML content received from URL');
        }

        console.log('[EEATAudit] HTML fetched, length:', html.length);

        // Analyze E-E-A-T signals
        result = await analyzeEEAT(html, normalizedUrl, {
          googleMapsApiKey: mapsApiKey,
          googleBusinessApiKey: businessApiKey,
        });
        console.log('[EEATAudit] Single-page analysis completed');
      }

      // Log results
      console.log(
        '[EEATAudit] Platforms found:',
        result.reputation.linked_platforms,
      );
      console.log('[EEATAudit] Social links:', result.reputation.social_links);
      console.log(
        '[EEATAudit] Privacy policy:',
        result.trust.has_privacy_policy,
      );

      // Log metrics if available
      if (result.authorship.metrics) {
        console.log(
          '[EEATAudit] Author metrics:',
          `${result.authorship.metrics.blog_pages_with_author_percent}% of articles have authors`,
        );
      }

      if (result.authority.scientific_metrics) {
        console.log(
          '[EEATAudit] Scientific sources metrics:',
          `${result.authority.scientific_metrics.articles_with_sources_percent}% of articles have sources`,
        );
      }

      // Log Google Maps rating if available
      if (result.reputation.google_maps_rating?.fetched) {
        console.log(
          '[EEATAudit] Google Maps rating:',
          `${result.reputation.google_maps_rating.rating} stars (${result.reputation.google_maps_rating.review_count} reviews)`,
        );
      }

      // Log NAP comparison if available
      if (result.trust.nap_comparison?.match_percent !== undefined) {
        console.log(
          '[EEATAudit] NAP match:',
          `${result.trust.nap_comparison.match_percent}% match with Google Business`,
        );
      }

      console.log(
        '[EEATAudit] Recommendations count:',
        result.recommendations.length,
      );

      // Save audit result to database
      try {
        const supabase = getSupabaseServerAdminClient();
        
        const insertData = {
          url: normalizedUrl,
          audit_result: result,
          multi_page: multiPage,
          filter_type: filterType,
          max_pages: maxPages,
        };
        
        console.log('[EEATAudit] Inserting audit data:', {
          url: insertData.url,
          hasResult: !!insertData.audit_result,
          multiPage: insertData.multi_page,
          filterType: insertData.filter_type,
        });
        
        const { data: savedData, error: saveError } = await (supabase as any)
          .from('eeat_audits')
          .insert(insertData)
          .select()
          .single();

        if (saveError) {
          console.error('[EEATAudit] Failed to save audit to database:', {
            error: saveError,
            message: saveError.message,
            details: saveError.details,
            hint: saveError.hint,
          });
          // Don't throw - saving is optional, audit result is still returned
        } else {
          console.log('[EEATAudit] Audit result saved to database successfully:', {
            id: savedData?.id,
            url: savedData?.url,
            createdAt: savedData?.created_at,
          });
        }
      } catch (saveError) {
        console.error('[EEATAudit] Error saving audit to database:', saveError);
        // Don't throw - saving is optional
      }

      return result;
    } catch (error) {
      console.error('[EEATAudit] Error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Re-throw with more context
      throw new Error(`E-E-A-T audit failed: ${errorMessage}`);
    }
  },
  {
    auth: false, // Playground actions don't require authentication
    schema: EEATAuditInputSchema as any,
  },
);

/**
 * Get Latest E-E-A-T Audit Input Schema
 */
const GetLatestEEATAuditSchema = z.object({
  url: z.string().min(1, 'URL is required'),
});

/**
 * Get the most recent E-E-A-T Assessment audit for a URL
 * 
 * @param url - URL to get the latest audit for
 * @returns The latest audit with result and metadata, or null if none exists
 */
export const getLatestEEATAudit = enhanceAction(
  async (params: { url: string }): Promise<{ result: EEATAuditResult; createdAt: string } | null> => {
    const { url } = params;
    
    // Normalize URL (ensure it has protocol)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      const supabase = getSupabaseServerAdminClient();
      
      console.log('[EEATAudit] Fetching latest audit from database:', { url: normalizedUrl });
      
      // Try exact match first
      let { data, error } = await (supabase as any)
        .from('eeat_audits')
        .select('audit_result, created_at, id, url')
        .eq('url', normalizedUrl)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // If no exact match, try without protocol (for flexibility)
      if (!data && !error) {
        const urlWithoutProtocol = normalizedUrl.replace(/^https?:\/\//, '');
        const { data: dataAlt, error: errorAlt } = await (supabase as any)
          .from('eeat_audits')
          .select('audit_result, created_at, id, url')
          .or(`url.eq.${normalizedUrl},url.ilike.%${urlWithoutProtocol}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (dataAlt && !errorAlt) {
          data = dataAlt;
        }
        if (errorAlt && !error) {
          error = errorAlt;
        }
      }

      if (error) {
        console.error('[EEATAudit] Failed to fetch latest audit:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }

      if (!data || !data.audit_result) {
        console.log('[EEATAudit] No audit found in database for URL:', normalizedUrl);
        return null;
      }

      console.log('[EEATAudit] Found audit in database:', {
        id: data.id,
        url: data.url,
        createdAt: data.created_at,
      });

      return {
        result: data.audit_result as EEATAuditResult,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('[EEATAudit] Error fetching latest audit:', error);
      return null;
    }
  },
  {
    auth: false, // Playground actions don't require authentication
    schema: GetLatestEEATAuditSchema,
  },
);

