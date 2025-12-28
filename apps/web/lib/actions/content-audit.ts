'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { analyzeContent } from '~/lib/server/services/content/content-analyzer';
import type { ContentAuditResult } from '~/lib/server/services/content/types';

/**
 * Content Audit Input Schema
 */
const ContentAuditInputSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
});

type ContentAuditInput = z.infer<typeof ContentAuditInputSchema>;

/**
 * Perform content audit for a given URL
 * 
 * Fetches the HTML content from the URL and analyzes it for:
 * - Structure (pages, architecture)
 * - Text quality (wateriness, uniqueness)
 * - Authority (E-E-A-T signals)
 * 
 * @param input - Content audit input with URL
 * @returns ContentAuditResult with all analysis data
 */
export const performContentAudit = enhanceAction(
  async (input: ContentAuditInput): Promise<ContentAuditResult> => {
    const { url } = input;

    console.log('[ContentAudit] Starting audit for:', url);

    // Normalize URL (ensure it has protocol)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      // Fetch HTML content
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ContentAuditBot/1.0)',
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();

      if (!html || html.trim().length === 0) {
        throw new Error('No HTML content received from URL');
      }

      console.log('[ContentAudit] HTML fetched, length:', html.length);

      // Analyze content
      const result = await analyzeContent(html, normalizedUrl);

      console.log('[ContentAudit] Analysis completed');
      console.log('[ContentAudit] Wateriness:', result.text_quality.wateriness_score);
      console.log('[ContentAudit] Uniqueness:', result.text_quality.uniqueness_score);
      console.log('[ContentAudit] Authority links:', result.authority.authority_links_count);

      // Save audit result to database
      try {
        const supabase = getSupabaseServerAdminClient();
        
        const insertData = {
          url: normalizedUrl,
          audit_result: result,
        };
        
        console.log('[ContentAudit] Inserting audit data:', {
          url: insertData.url,
          hasResult: !!insertData.audit_result,
        });
        
        const { data: savedData, error: saveError } = await (supabase as any)
          .from('content_audits')
          .insert(insertData)
          .select()
          .single();

        if (saveError) {
          console.error('[ContentAudit] Failed to save audit to database:', {
            error: saveError,
            message: saveError.message,
            details: saveError.details,
            hint: saveError.hint,
          });
          // Don't throw - saving is optional, audit result is still returned
        } else {
          console.log('[ContentAudit] Audit result saved to database successfully:', {
            id: savedData?.id,
            url: savedData?.url,
            createdAt: savedData?.created_at,
          });
        }
      } catch (saveError) {
        console.error('[ContentAudit] Error saving audit to database:', saveError);
        // Don't throw - saving is optional
      }

      return result;
    } catch (error) {
      console.error('[ContentAudit] Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Re-throw with more context
      throw new Error(`Content audit failed: ${errorMessage}`);
    }
  },
  {
    auth: false, // Playground actions don't require authentication
    schema: ContentAuditInputSchema,
  },
);

/**
 * Get the most recent Content Optimization audit for a URL
 * 
 * @param url - URL to get the latest audit for
 * @returns The latest audit with result and metadata, or null if none exists
 */
export const getLatestContentAudit = enhanceAction(
  async (params: { url: string }): Promise<{ result: ContentAuditResult; createdAt: string } | null> => {
    const { url } = params;
    
    // Normalize URL (ensure it has protocol)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      const supabase = getSupabaseServerAdminClient();
      
      console.log('[ContentAudit] Fetching latest audit from database:', { url: normalizedUrl });
      
      // Try exact match first
      let { data, error } = await (supabase as any)
        .from('content_audits')
        .select('audit_result, created_at, id, url')
        .eq('url', normalizedUrl)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // If no exact match, try without protocol (for flexibility)
      if (!data && !error) {
        const urlWithoutProtocol = normalizedUrl.replace(/^https?:\/\//, '');
        const { data: dataAlt, error: errorAlt } = await (supabase as any)
          .from('content_audits')
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
        console.error('[ContentAudit] Failed to fetch latest audit:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }

      if (!data || !data.audit_result) {
        console.log('[ContentAudit] No audit found in database for URL:', normalizedUrl);
        return null;
      }

      console.log('[ContentAudit] Found audit in database:', {
        id: data.id,
        url: data.url,
        createdAt: data.created_at,
      });

      return {
        result: data.audit_result as ContentAuditResult,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('[ContentAudit] Error fetching latest audit:', error);
      return null;
    }
  },
  {
    auth: false, // Playground actions don't require authentication
  },
);

