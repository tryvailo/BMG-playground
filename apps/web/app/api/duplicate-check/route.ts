import { NextRequest, NextResponse } from 'next/server';
import { crawlSiteContent, batchScrapeUrls } from '~/lib/modules/audit/firecrawl-service';
import { analyzeContentDuplicates } from '~/lib/utils/duplicate-analyzer';
import { parseSitemap } from '~/lib/utils/sitemap-parser';
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
  useSitemap?: boolean; // New: prefer sitemap over crawl
}

interface DuplicateCheckSuccessResponse {
  success: true;
  data: DuplicateAnalysisResult;
  crawledPages: number;
  executionTime: number;
  source: 'sitemap' | 'crawl' | 'sitemap+crawl';
  sitemapUrl?: string;
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
 * 
 * Strategy:
 * 1. Try to find sitemap.xml and extract URLs
 * 2. If sitemap found with enough URLs, use batch scrape
 * 3. If no sitemap or few URLs, fallback to crawl
 * 4. Optionally combine both approaches
 */
export async function POST(request: NextRequest): Promise<NextResponse<DuplicateCheckResponse>> {
  const startTime = Date.now();

  try {
    const body: DuplicateCheckRequest = await request.json();
    const { url, limit = 50, apiKeyFirecrawl, useSitemap = true } = body;

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
    if (limit && (limit < 1 || limit > 200)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be between 1 and 200',
          code: 'INVALID_LIMIT',
        },
        { status: 400 },
      );
    }

    console.log(`[DuplicateChecker] Starting duplicate check for: ${url} (limit: ${limit}, useSitemap: ${useSitemap})`);

    let crawledPages: Awaited<ReturnType<typeof crawlSiteContent>> = [];
    let source: 'sitemap' | 'crawl' | 'sitemap+crawl' = 'crawl';
    let sitemapUrl: string | undefined;

    // Step 1: Try sitemap first if enabled
    if (useSitemap) {
      console.log(`[DuplicateChecker] Attempting to find and parse sitemap...`);
      
      const sitemapResult = await parseSitemap(url, limit);
      
      if (sitemapResult.success && sitemapResult.urls.length > 0) {
        console.log(`[DuplicateChecker] Found sitemap with ${sitemapResult.urls.length} URLs (total: ${sitemapResult.totalFound})`);
        sitemapUrl = sitemapResult.sitemapUrl;
        
        const urlsToScrape = sitemapResult.urls.map(u => u.loc).slice(0, limit);
        
        // Use batch scrape for sitemap URLs
        try {
          console.log(`[DuplicateChecker] Starting batch scrape for ${urlsToScrape.length} sitemap URLs...`);
          crawledPages = await batchScrapeUrls(urlsToScrape, apiKeyFirecrawl);
          source = 'sitemap';
          console.log(`[DuplicateChecker] Batch scrape completed. Got ${crawledPages.length} pages`);
        } catch (error) {
          console.warn('[DuplicateChecker] Batch scrape failed, will fallback to crawl:', error);
          // Reset to try crawl
          crawledPages = [];
        }
        
        // If sitemap gave us few pages, supplement with crawl
        if (crawledPages.length < 10 && crawledPages.length < limit) {
          console.log(`[DuplicateChecker] Sitemap gave only ${crawledPages.length} pages, supplementing with crawl...`);
          try {
            const crawlLimit = Math.min(limit - crawledPages.length, 30);
            const additionalPages = await crawlSiteContent(url, crawlLimit, apiKeyFirecrawl);
            
            // Merge, avoiding duplicates
            const existingUrls = new Set(crawledPages.map(p => p.metadata?.url));
            const newPages = additionalPages.filter(p => !existingUrls.has(p.metadata?.url));
            
            if (newPages.length > 0) {
              crawledPages = [...crawledPages, ...newPages];
              source = 'sitemap+crawl';
              console.log(`[DuplicateChecker] Added ${newPages.length} pages from crawl, total: ${crawledPages.length}`);
            }
          } catch (crawlError) {
            console.warn('[DuplicateChecker] Supplementary crawl failed:', crawlError);
            // Continue with what we have from sitemap
          }
        }
      } else {
        console.log(`[DuplicateChecker] No sitemap found or empty: ${sitemapResult.error || 'unknown reason'}`);
      }
    }

    // Step 2: Fallback to crawl if sitemap didn't work
    if (crawledPages.length === 0) {
      console.log(`[DuplicateChecker] Using crawl approach...`);
      try {
        crawledPages = await crawlSiteContent(url, limit, apiKeyFirecrawl);
        source = 'crawl';
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
            { status: 402 },
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
    }

    // Check if we got any pages
    if (crawledPages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No pages were found. The website may be inaccessible, have no crawlable content, or no sitemap.',
          code: 'NO_PAGES',
        },
        { status: 400 },
      );
    }

    // Step 3: Analyze content duplicates
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

    // Step 4: Return success response
    return NextResponse.json({
      success: true,
      data: duplicateAnalysis,
      crawledPages: crawledPages.length,
      executionTime,
      source,
      sitemapUrl,
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
