/**
 * Shared types for audit modules
 * This file is intentionally NOT a 'use server' file to allow
 * type imports in both server and client contexts
 */

/**
 * Firecrawl Document (scraped page content)
 */
export interface FirecrawlDocument {
  content?: string; // HTML content
  markdown?: string; // Markdown content
  metadata: {
    url: string;
    title?: string;
    description?: string;
    language?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Firecrawl API Crawl Status Response
 */
export interface CrawlStatusResponse {
  success: boolean;
  status: 'active' | 'scraping' | 'completed' | 'failed';
  id: string;
  data?: FirecrawlDocument[];
  error?: string;
  message?: string;
}

