/**
 * Google Custom Search API Client
 * 
 * Searches for mentions of the clinic and finds local backlinks
 * using Google Custom Search API.
 */

'use server';

interface GoogleCustomSearchResponse {
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
    displayLink: string;
  }>;
  searchInformation?: {
    totalResults: string;
  };
}

interface SearchResult {
  url: string;
  domain: string;
  title: string;
  snippet: string;
}

/**
 * Search for clinic mentions using Google Custom Search
 */
export async function searchClinicMentions(
  clinicName: string,
  city: string,
  apiKey: string,
  searchEngineId: string,
  maxResults: number = 10,
): Promise<SearchResult[]> {
  try {
    const query = `"${clinicName}" ${city}`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${Math.min(maxResults, 10)}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn('[GoogleCustomSearch] API request failed:', response.status, response.statusText);
      return [];
    }
    
    const data: GoogleCustomSearchResponse = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    return data.items.map((item) => {
      const urlObj = new URL(item.link);
      const domain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
      
      return {
        url: item.link,
        domain,
        title: item.title,
        snippet: item.snippet,
      };
    });
  } catch (error) {
    console.warn('[GoogleCustomSearch] Failed to search:', error);
    return [];
  }
}

/**
 * Search for clinic mentions with local domain filter
 */
export async function searchLocalMentions(
  clinicName: string,
  city: string,
  apiKey: string,
  searchEngineId: string,
  maxResults: number = 10,
): Promise<SearchResult[]> {
  try {
    // Search for mentions
    const results = await searchClinicMentions(clinicName, city, apiKey, searchEngineId, maxResults);
    
    // Filter by local domains (containing city name)
    const cityLower = city.toLowerCase();
    const localResults = results.filter((result) => {
      const domainLower = result.domain.toLowerCase();
      return domainLower.includes(cityLower);
    });
    
    return localResults;
  } catch (error) {
    console.warn('[GoogleCustomSearch] Failed to search local mentions:', error);
    return [];
  }
}

/**
 * Check if URL contains a link to the clinic website
 */
export async function checkBacklink(
  url: string,
  clinicUrl: string,
  firecrawlApiKey?: string,
): Promise<{
  has_backlink: boolean;
  anchor_text?: string;
  link_type?: 'dofollow' | 'nofollow';
}> {
  try {
    // Import Firecrawl dynamically to avoid circular dependencies
    const { crawlSiteContent } = await import('~/lib/modules/audit/firecrawl-service');
    const { load } = await import('cheerio');
    
    // Get page content
    const pages = await crawlSiteContent(url, 1, firecrawlApiKey);
    
    if (pages.length === 0) {
      return { has_backlink: false };
    }
    
    const $ = load(pages[0].html || pages[0].markdown || '');
    const clinicDomain = new URL(clinicUrl).hostname.replace(/^www\./, '');
    
    // Look for links to clinic website
    let foundLink: { anchor_text?: string; link_type?: 'dofollow' | 'nofollow' } | null = null;
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      try {
        const linkUrl = href.startsWith('http') 
          ? new URL(href)
          : new URL(href, url);
        
        const linkDomain = linkUrl.hostname.replace(/^www\./, '');
        
        if (linkDomain === clinicDomain) {
          const anchorText = $(element).text().trim();
          const rel = $(element).attr('rel') || '';
          const linkType = rel.includes('nofollow') ? 'nofollow' : 'dofollow';
          
          foundLink = {
            anchor_text: anchorText || undefined,
            link_type: linkType,
          };
          
          return false; // Break
        }
      } catch {
        // Invalid URL, skip
      }
    });
    
    return {
      has_backlink: foundLink !== null,
      anchor_text: foundLink?.anchor_text,
      link_type: foundLink?.link_type,
    };
  } catch (error) {
    console.warn('[GoogleCustomSearch] Failed to check backlink:', error);
    return { has_backlink: false };
  }
}


