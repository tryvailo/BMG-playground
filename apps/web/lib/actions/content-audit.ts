'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
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

