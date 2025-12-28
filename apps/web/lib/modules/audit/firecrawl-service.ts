'use server';

import type { FirecrawlDocument, CrawlStatusResponse } from './types';

/*
 * -------------------------------------------------------
 * Type Definitions
 * -------------------------------------------------------
 */

// All types moved to types.ts to avoid 'use server' conflicts
// Cannot export types/interfaces from 'use server' files in Next.js 15

/**
 * Firecrawl Start Crawl Request Body
 */
interface StartCrawlRequest {
  url: string;
  limit?: number;
  scrapeOptions?: {
    formats?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Get Firecrawl API key from parameter or environment
 */
function getApiKey(apiKey?: string): string {
  // Use provided API key if available
  if (apiKey && apiKey.trim()) {
    return apiKey.trim();
  }
  
  // Fallback to environment variable
  const envKey = process.env.FIRECRAWL_API_KEY;
  if (!envKey) {
    throw new Error('FIRECRAWL_API_KEY is not set in environment variables');
  }
  return envKey;
}

/**
 * Make authenticated request to Firecrawl API
 */
async function firecrawlRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  apiKey?: string,
): Promise<T> {
  const key = getApiKey(apiKey);
  const baseUrl = 'https://api.firecrawl.dev/v1';
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      ...options.headers,
    },
  });

  // Handle HTTP errors
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    
    // Try to parse JSON error response
    let errorDetails: { success?: boolean; code?: string; error?: string; message?: string } = {};
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      // Not JSON, use raw text
    }
    
    // Extract exception ID from error message if present
    const exceptionIdMatch = errorText.match(/exception ID is ([a-f0-9]+)/i);
    const exceptionId = exceptionIdMatch ? exceptionIdMatch[1] : null;
    
    if (response.status === 401) {
      throw new Error('Firecrawl API: Unauthorized - Invalid API key');
    }
    
    if (response.status === 402) {
      throw new Error('Firecrawl API: Payment required - Check your subscription');
    }
    
    if (response.status === 429) {
      throw new Error('Firecrawl API: Rate limit exceeded - Please try again later');
    }
    
    if (response.status >= 500) {
      // Build detailed error message for server errors
      const errorMessage = errorDetails.error || errorDetails.message || 'An unexpected server error occurred';
      const errorCode = errorDetails.code || 'UNKNOWN_ERROR';
      let fullMessage = `Firecrawl API: Server error (${response.status}) - ${errorMessage}`;
      
      if (exceptionId) {
        fullMessage += ` [Exception ID: ${exceptionId}]`;
      } else if (errorCode) {
        fullMessage += ` [Error Code: ${errorCode}]`;
      }
      
      fullMessage += '. Please contact help@firecrawl.com for assistance.';
      
      throw new Error(fullMessage);
    }
    
    // For other client errors (4xx), provide detailed message
    const errorMessage = errorDetails.error || errorDetails.message || errorText.substring(0, 200);
    const errorCode = errorDetails.code ? ` [Code: ${errorDetails.code}]` : '';
    throw new Error(`Firecrawl API error (${response.status}): ${errorMessage}${errorCode}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Start a crawl job
 */
async function startCrawl(url: string, limit: number, apiKey?: string): Promise<string> {
  const body: StartCrawlRequest = {
    url,
    limit,
    scrapeOptions: {
      formats: ['markdown'],
    },
  };

  const response = await firecrawlRequest<{ success: boolean; id?: string; error?: string }>(
    '/crawl',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    apiKey,
  );

  if (!response.success || !response.id) {
    throw new Error(response.error || 'Failed to start crawl job');
  }

  return response.id;
}

/**
 * Check crawl status
 */
async function checkCrawlStatus(jobId: string, apiKey?: string): Promise<CrawlStatusResponse> {
  return firecrawlRequest<CrawlStatusResponse>(`/crawl/${jobId}`, {
    method: 'GET',
  }, apiKey);
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Crawl website content using Firecrawl API
 * 
 * This function:
 * 1. Starts a crawl job for the given URL
 * 2. Polls the API until the crawl is completed
 * 3. Returns an array of scraped documents
 * 
 * @param url - The URL to crawl (must be a valid URL)
 * @param limit - Maximum number of pages to crawl (default: 50, max: 100)
 * @returns Array of FirecrawlDocument with content and metadata
 * @throws Error if crawl fails, times out, or API key is invalid
 * 
 * @example
 * ```typescript
 * const documents = await crawlSiteContent('https://example.com', 10);
 * documents.forEach(doc => {
 *   console.log(doc.metadata.url);
 *   console.log(doc.markdown);
 * });
 * ```
 */
export async function crawlSiteContent(
  url: string,
  limit: number = 50,
  apiKey?: string,
): Promise<FirecrawlDocument[]> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  // Validate limit
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }

  console.log(`[Firecrawl] Starting crawl for ${url} (limit: ${limit})`);

  // Step 1: Start crawl job
  let jobId: string;
  try {
    jobId = await startCrawl(url, limit, apiKey);
    console.log(`[Firecrawl] Crawl job started with ID: ${jobId}`);
  } catch (_error) {
    console.error('[Firecrawl] Failed to start crawl:', error);
    throw error instanceof Error ? error : new Error('Failed to start crawl job');
  }

  // Step 2: Poll for completion
  const startTime = Date.now();
  const timeoutMs = 120 * 1000; // 120 seconds
  let pollCount = 0;

  while (true) {
    // Check timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > timeoutMs) {
      throw new Error(`Crawl timeout after ${timeoutMs / 1000} seconds. Job ID: ${jobId}`);
    }

    // Wait 2 seconds before next poll (except first iteration)
    if (pollCount > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    pollCount++;

    try {
      const statusResponse = await checkCrawlStatus(jobId, apiKey);
      
      console.log(`[Firecrawl] Poll #${pollCount}: Status = ${statusResponse.status}`);

      // Handle different statuses
      if (statusResponse.status === 'completed') {
        if (!statusResponse.data || statusResponse.data.length === 0) {
          console.warn('[Firecrawl] Crawl completed but no data returned');
          return [];
        }
        
        console.log(`[Firecrawl] Crawl completed successfully. Found ${statusResponse.data.length} pages`);
        return statusResponse.data;
      }

      if (statusResponse.status === 'failed') {
        const errorMessage = statusResponse.error || statusResponse.message || 'Crawl failed';
        throw new Error(`Firecrawl crawl failed: ${errorMessage}`);
      }

      // Status is 'active' or 'scraping' - continue polling
      if (statusResponse.status === 'active' || statusResponse.status === 'scraping') {
        // Continue loop
        continue;
      }

      // Unknown status - log warning and continue
      console.warn(`[Firecrawl] Unknown status: ${statusResponse.status}. Continuing to poll...`);
      
    } catch (_error) {
      // If it's an error we threw (failed status), re-throw it
      if (error instanceof Error && error.message.includes('Firecrawl crawl failed')) {
        throw error;
      }
      
      // For other errors (network, API errors), log and continue polling
      // But only for a limited number of consecutive errors
      if (pollCount > 10) {
        console.error('[Firecrawl] Too many polling errors, giving up');
        throw error instanceof Error 
          ? error 
          : new Error('Failed to check crawl status after multiple attempts');
      }
      
      console.warn(`[Firecrawl] Error checking status (attempt ${pollCount}):`, error);
      // Wait a bit longer before retrying on error
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

