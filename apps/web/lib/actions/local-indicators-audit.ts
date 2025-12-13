'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
import { analyzeLocalIndicators } from '~/lib/server/services/local/local-analyzer';
import type { LocalIndicatorsAuditResult } from '~/lib/server/services/local/types';

/**
 * Local Indicators Audit Input Schema
 */
const LocalIndicatorsInputSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  /** Google Place ID (optional, for fetching Google Business Profile data) */
  placeId: z.string().optional(),
  /** Google API key (optional, for Google Places/My Business API) */
  googleApiKey: z.string().optional(),
  /** City name (optional, for filtering local backlinks) */
  city: z.string().optional(),
});

type LocalIndicatorsInput = z.infer<typeof LocalIndicatorsInputSchema>;

/**
 * Perform local indicators audit for a given URL
 * 
 * Analyzes local SEO indicators including:
 * - Google Business Profile completeness
 * - Review response rate and quality
 * - Google Business Profile engagement
 * - Local backlinks
 * - Local social media activity
 * - Local Business schema markup
 * 
 * @param input - Local indicators audit input with URL and optional parameters
 * @returns LocalIndicatorsAuditResult with all analysis data and recommendations
 */
export const performLocalIndicatorsAudit = enhanceAction(
  async (input: LocalIndicatorsInput): Promise<LocalIndicatorsAuditResult> => {
    const { url, placeId, googleApiKey, city } = input;

    console.log('[LocalIndicators] Starting audit for:', url);
    console.log('[LocalIndicators] Place ID provided:', !!placeId);
    console.log('[LocalIndicators] Google API key provided:', !!googleApiKey);
    console.log('[LocalIndicators] City:', city || 'not specified');

    // Get API key from input or environment
    const apiKey =
      googleApiKey ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_BUSINESS_API_KEY ||
      process.env.GOOGLE_PAGESPEED_API_KEY;

    // Normalize URL (ensure it has protocol)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      // Analyze local indicators
      const result = await analyzeLocalIndicators(
        normalizedUrl,
        placeId,
        apiKey,
        city,
      );

      console.log('[LocalIndicators] Analysis completed');

      // Log Google Business Profile metrics
      console.log(
        '[LocalIndicators] GBP Completeness:',
        `${result.google_business_profile.completeness_percent}%`,
      );
      console.log(
        '[LocalIndicators] GBP Photos:',
        `${result.google_business_profile.photos_count} total, ${result.google_business_profile.high_quality_photos_count} high-quality`,
      );
      console.log(
        '[LocalIndicators] GBP Posts:',
        `${result.google_business_profile.posts_count} total, ${result.google_business_profile.posts_per_month.toFixed(1)}/month`,
      );

      // Log review response metrics
      console.log(
        '[LocalIndicators] Review Response Rate:',
        `${result.review_response.response_rate_percent}% (${result.review_response.responded_reviews}/${result.review_response.total_reviews})`,
      );
      console.log(
        '[LocalIndicators] 24h Response Rate:',
        `${result.review_response.response_rate_24h_percent}%`,
      );

      // Log engagement metrics
      console.log(
        '[LocalIndicators] GBP Engagement:',
        `${result.gbp_engagement.impressions_per_month} impressions/month, CTR: ${result.gbp_engagement.ctr_percent}%`,
      );
      console.log(
        '[LocalIndicators] Actions:',
        `${result.gbp_engagement.website_clicks_per_month} clicks, ${result.gbp_engagement.calls_per_month} calls, ${result.gbp_engagement.direction_requests_per_month} directions`,
      );

      // Log local backlinks
      console.log(
        '[LocalIndicators] Local Backlinks:',
        `${result.local_backlinks.total_local_backlinks} total from ${result.local_backlinks.unique_local_domains} unique domains`,
      );

      // Log social media
      console.log(
        '[LocalIndicators] Social Media:',
        `Facebook: ${result.local_social_media.facebook.has_profile ? 'Yes' : 'No'}, Instagram: ${result.local_social_media.instagram.has_profile ? 'Yes' : 'No'}`,
      );

      // Log schema
      console.log(
        '[LocalIndicators] Local Business Schema:',
        result.local_business_schema.is_implemented
          ? `Yes (${result.local_business_schema.schema_type || 'Unknown'}) - ${result.local_business_schema.is_functioning_correctly ? 'Valid' : 'Invalid'}`
          : 'No',
      );

      // Log recommendations
      console.log(
        '[LocalIndicators] Recommendations count:',
        result.recommendations.length,
      );

      return result;
    } catch (error) {
      console.error('[LocalIndicators] Error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Re-throw with more context
      throw new Error(`Local indicators audit failed: ${errorMessage}`);
    }
  },
  {
    auth: false, // Playground actions don't require authentication
    schema: LocalIndicatorsInputSchema,
  },
);


