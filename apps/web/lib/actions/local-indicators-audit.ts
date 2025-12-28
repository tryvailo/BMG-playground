'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
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
  /** Clinic name (optional, for searching reviews on DOC.ua and Helsi) */
  clinicName: z.string().optional(),
  /** Firecrawl API key (optional, for parsing DOC.ua, Helsi, and checking backlinks) */
  firecrawlApiKey: z.string().optional(),
  /** Google Custom Search API key (optional, for finding local backlinks) */
  googleCustomSearchApiKey: z.string().optional(),
  /** Google Custom Search Engine ID (optional, for finding local backlinks) */
  googleCustomSearchEngineId: z.string().optional(),
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
    const { 
      url, 
      placeId, 
      googleApiKey, 
      city,
      clinicName,
      firecrawlApiKey,
      googleCustomSearchApiKey,
      googleCustomSearchEngineId,
    } = input;

    console.log('[LocalIndicators] Starting audit for:', url);
    console.log('[LocalIndicators] Place ID provided:', !!placeId);
    console.log('[LocalIndicators] Google API key provided:', !!googleApiKey);
    console.log('[LocalIndicators] City:', city || 'not specified');

    // Get API keys from input or environment
    const apiKey =
      googleApiKey ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_BUSINESS_API_KEY ||
      process.env.GOOGLE_PAGESPEED_API_KEY;
    
    const finalFirecrawlApiKey = firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
    const finalGoogleCustomSearchApiKey = googleCustomSearchApiKey || process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const finalGoogleCustomSearchEngineId = googleCustomSearchEngineId || process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

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
        clinicName,
        finalFirecrawlApiKey,
        finalGoogleCustomSearchApiKey,
        finalGoogleCustomSearchEngineId,
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

      // Save audit result to database
      try {
        const supabase = getSupabaseServerAdminClient();
        console.log('[LocalIndicators] Attempting to save audit to database:', {
          url: normalizedUrl,
          hasResult: !!result,
          clinicName,
          city,
        });
        
        const insertData = {
          url: normalizedUrl,
          audit_result: result,
          clinic_name: clinicName || null,
          city: city || null,
          place_id: placeId || null,
        };
        
        console.log('[LocalIndicators] Inserting audit data:', {
          url: insertData.url,
          hasResult: !!insertData.audit_result,
          clinicName: insertData.clinic_name,
          city: insertData.city,
        });
        
        const { data: savedData, error: saveError } = await (supabase as any)
          .from('local_indicators_audits')
          .insert(insertData)
          .select()
          .single();

        if (saveError) {
          console.error('[LocalIndicators] Failed to save audit to database:', {
            error: saveError,
            message: saveError.message,
            details: saveError.details,
            hint: saveError.hint,
          });
          // Don't throw - saving is optional, audit result is still returned
        } else {
          console.log('[LocalIndicators] Audit result saved to database successfully:', {
            id: savedData?.id,
            url: savedData?.url,
            createdAt: savedData?.created_at,
          });
        }
      } catch (saveError) {
        console.error('[LocalIndicators] Error saving audit to database:', saveError);
        // Don't throw - saving is optional
      }

      return result;
    } catch {
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

/**
 * Get the most recent Local Indicators audit for a URL
 * 
 * @param url - URL to get the latest audit for
 * @returns The latest audit with result and metadata, or null if none exists
 */
export const getLatestLocalIndicatorsAudit = enhanceAction(
  async (params: { url: string }): Promise<{ result: LocalIndicatorsAuditResult; createdAt: string } | null> => {
    const { url } = params;
    
    // Normalize URL (ensure it has protocol)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      const supabase = getSupabaseServerAdminClient();
      
      console.log('[LocalIndicators] Fetching latest audit from database:', { url: normalizedUrl });
      
      // Note: Using 'as any' because local_indicators_audits table is not in the generated Supabase types yet
      // Try exact match first
      let { data, error } = await (supabase as any)
        .from('local_indicators_audits')
        .select('audit_result, created_at, id, url')
        .eq('url', normalizedUrl)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // If no exact match, try without protocol (for flexibility)
      if (!data && !error) {
        const urlWithoutProtocol = normalizedUrl.replace(/^https?:\/\//, '');
        const { data: dataAlt, error: errorAlt } = await (supabase as any)
          .from('local_indicators_audits')
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
        console.error('[LocalIndicators] Failed to fetch latest audit:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }

      if (!data || !data.audit_result) {
        console.log('[LocalIndicators] No audit found in database for URL:', normalizedUrl);
        // Debug: Check what URLs exist in database
        const { data: allUrls } = await (supabase as any)
          .from('local_indicators_audits')
          .select('url, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        console.log('[LocalIndicators] Available URLs in database:', allUrls?.map((r: any) => r.url) || []);
        return null;
      }

      console.log('[LocalIndicators] Successfully fetched latest audit:', {
        id: data.id,
        url: data.url,
        createdAt: data.created_at,
        hasResult: !!data.audit_result,
      });

      // Return audit result with metadata
      return {
        result: data.audit_result as LocalIndicatorsAuditResult,
        createdAt: data.created_at as string,
      };
    } catch {
      console.error('[LocalIndicators] Error fetching latest audit:', error);
      return null;
    }
  },
  {
    auth: false, // Playground actions don't require authentication
    schema: z.object({
      url: z.string().url('Please provide a valid URL'),
    }),
  },
);



