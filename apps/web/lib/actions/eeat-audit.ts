'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';

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
    schema: EEATAuditInputSchema,
  },
);

