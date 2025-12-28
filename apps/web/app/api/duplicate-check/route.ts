import { NextRequest, NextResponse } from 'next/server';
import { crawlSiteContent } from '~/lib/modules/audit/firecrawl-service';
import { analyzeContentDuplicates } from '~/lib/utils/duplicate-analyzer';
import type { DuplicateAnalysisResult } from '~/lib/utils/duplicate-analyzer';

/**
 * CRITICAL: Enable 5-minute execution time for Vercel Pro
 * This allows long-running operations like website crawling
 */
export const maxDuration = 300; // 5 minutes in seconds

export const dynamic = 'force-dynamic';

interface DuplicateCheckRequest {
  url: string;
  limit?: number;
  apiKeyFirecrawl?: string;
}

interface DuplicateCheckSuccessResponse {
  success: true;
  data: DuplicateAnalysisResult;
  crawledPages: number;
  executionTime: number;
}

interface DuplicateCheckErrorResponse {
  success: false;
  error: string;
  code?: string;
}

type DuplicateCheckResponse = DuplicateCheckSuccessResponse | DuplicateCheckErrorResponse;

/**
 * POST /api/duplicate-check
 * 
 * Run duplicate content check for a website
 */
export async function POST(request: NextRequest): Promise<NextResponse<DuplicateCheckResponse>> {
  const startTime = Date.now();

  try {
    const body: DuplicateCheckRequest = await request.json();
    const { url, limit = 50, apiKeyFirecrawl } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'URL is required',
          code: 'MISSING_URL',
        },
        { status: 400 },
      );
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL must start with http:// or https://',
          code: 'INVALID_URL',
        },
        { status: 400 },
      );
    }

    // Validate limit
    if (limit && (limit < 1 || limit > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be between 1 and 100',
          code: 'INVALID_LIMIT',
        },
        { status: 400 },
      );
    }

    console.log(`[DuplicateChecker] Starting duplicate check for: ${url} (limit: ${limit})`);

    // Step 1: Crawl website content
    let crawledPages;
    try {
      console.log(`[DuplicateChecker] Starting crawl with Firecrawl...`);
      crawledPages = await crawlSiteContent(url, limit, apiKeyFirecrawl);
      console.log(`[DuplicateChecker] Crawl completed. Found ${crawledPages.length} pages`);
    } catch (error) {
      console.error('[DuplicateChecker] Crawl failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown crawl error';
      
      // Check for specific Firecrawl API errors
      if (errorMessage.includes('Payment required') || errorMessage.includes('subscription')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Firecrawl API: Payment required - Check your subscription. Please provide a valid API key or check your Firecrawl account.',
            code: 'FIRECRAWL_PAYMENT_REQUIRED',
          },
          { status: 402 }, // 402 Payment Required
        );
      }
      
      if (errorMessage.includes('API key') || errorMessage.includes('FIRECRAWL_API_KEY')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Firecrawl API key is required. Please provide it in the request or set FIRECRAWL_API_KEY in environment variables.',
            code: 'MISSING_API_KEY',
          },
          { status: 400 },
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: `Failed to crawl website: ${errorMessage}`,
          code: 'CRAWL_ERROR',
        },
        { status: 500 },
      );
    }

    // Check if we got any pages
    if (crawledPages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No pages were crawled. The website may be inaccessible or have no crawlable content.',
          code: 'NO_PAGES',
        },
        { status: 400 },
      );
    }

    // Step 2: Analyze content duplicates
    let duplicateAnalysis: DuplicateAnalysisResult;
    try {
      console.log(`[DuplicateChecker] Analyzing ${crawledPages.length} pages for duplicates...`);
      duplicateAnalysis = analyzeContentDuplicates(crawledPages);
      console.log(`[DuplicateChecker] Analysis complete. Found ${duplicateAnalysis.duplicatesFound} duplicates`);
    } catch (error) {
      console.error('[DuplicateChecker] Analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
      return NextResponse.json(
        {
          success: false,
          error: `Failed to analyze duplicates: ${errorMessage}`,
          code: 'ANALYSIS_ERROR',
        },
        { status: 500 },
      );
    }

    const executionTime = Math.round((Date.now() - startTime) / 1000); // in seconds

    // Step 3: Return success response
    return NextResponse.json({
      success: true,
      data: duplicateAnalysis,
      crawledPages: crawledPages.length,
      executionTime,
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error('[DuplicateChecker] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'UNEXPECTED_ERROR',
      },
      { status: 500 },
    );
  }
}

