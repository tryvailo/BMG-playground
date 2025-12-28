'use server';

/**
 * NOTE: maxDuration is configured in the route segment config
 * See: app/[locale]/dashboard/playground/page.tsx
 * This allows 5-minute execution time for Vercel Pro
 */

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
import { crawlSiteContent } from '~/lib/modules/audit/firecrawl-service';
import { analyzeContentDuplicates } from '~/lib/utils/duplicate-analyzer';
import type { DuplicateAnalysisResult } from '~/lib/utils/duplicate-analyzer';

/**
 * Duplicate Check Input Schema
 */
const DuplicateCheckInputSchema = z.object({
  url: z.string().url('Invalid URL format').min(1, 'URL is required'),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

type DuplicateCheckInput = z.infer<typeof DuplicateCheckInputSchema>;

/**
 * Success response type
 */
interface DuplicateCheckSuccessResponse {
  success: true;
  data: DuplicateAnalysisResult;
  crawledPages: number;
  executionTime: number;
}

/**
 * Error response type
 */
interface DuplicateCheckErrorResponse {
  success: false;
  error: string;
  code?: string;
}

type DuplicateCheckResponse = DuplicateCheckSuccessResponse | DuplicateCheckErrorResponse;

/**
 * Run duplicate content check for a website
 * 
 * This action:
 * 1. Validates the URL
 * 2. Crawls the website using Firecrawl (up to 20 pages by default)
 * 3. Analyzes content duplicates using Jaccard similarity
 * 4. Returns a detailed report
 * 
 * @param input - Input with URL and optional page limit
 * @returns DuplicateCheckResponse with analysis results or error
 * 
 * @example
 * ```typescript
 * const result = await runDuplicateCheckAction({ url: 'https://example.com' });
 * if (result.success) {
 *   console.log(`Found ${result.data.duplicatesFound} duplicates`);
 * }
 * ```
 */
export const runDuplicateCheckAction = enhanceAction(
  async (input: DuplicateCheckInput): Promise<DuplicateCheckResponse> => {
    const startTime = Date.now();
    
    try {
      const { url, limit } = input;

      console.log(`[DuplicateChecker] Starting duplicate check for: ${url} (limit: ${limit})`);

      // Step 1: Validate URL (already validated by Zod schema, but double-check)
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return {
          success: false,
          error: 'URL must start with http:// or https://',
          code: 'INVALID_URL',
        };
      }

      // Step 2: Crawl website content
      let crawledPages;
      try {
        console.log(`[DuplicateChecker] Starting crawl with Firecrawl...`);
        crawledPages = await crawlSiteContent(url, limit);
        console.log(`[DuplicateChecker] Crawl completed. Found ${crawledPages.length} pages`);
      } catch {
        console.error('[DuplicateChecker] Crawl failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown crawl error';
        return {
          success: false,
          error: `Failed to crawl website: ${errorMessage}`,
          code: 'CRAWL_ERROR',
        };
      }

      // Check if we got any pages
      if (crawledPages.length === 0) {
        return {
          success: false,
          error: 'No pages were crawled. The website may be inaccessible or have no crawlable content.',
          code: 'NO_PAGES',
        };
      }

      // Step 3: Analyze content duplicates
      let duplicateAnalysis: DuplicateAnalysisResult;
      try {
        console.log(`[DuplicateChecker] Analyzing ${crawledPages.length} pages for duplicates...`);
        duplicateAnalysis = analyzeContentDuplicates(crawledPages);
        console.log(`[DuplicateChecker] Analysis complete. Found ${duplicateAnalysis.duplicatesFound} duplicates`);
      } catch {
        console.error('[DuplicateChecker] Analysis failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
        return {
          success: false,
          error: `Failed to analyze duplicates: ${errorMessage}`,
          code: 'ANALYSIS_ERROR',
        };
      }

      const executionTime = Math.round((Date.now() - startTime) / 1000); // in seconds

      // Step 4: Return success response
      return {
        success: true,
        data: duplicateAnalysis,
        crawledPages: crawledPages.length,
        executionTime,
      };
    } catch {
      // Catch-all for unexpected errors
      console.error('[DuplicateChecker] Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      return {
        success: false,
        error: errorMessage,
        code: 'UNEXPECTED_ERROR',
      };
    }
  },
  {
    auth: false, // Allow unauthenticated access (for playground)
    schema: DuplicateCheckInputSchema as any,
  },
);

