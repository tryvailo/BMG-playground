/**
 * Review Parsers for DOC.ua and Helsi
 * 
 * Parses review pages from DOC.ua and Helsi using Firecrawl
 * to extract review data and business responses.
 */

'use server';

import { crawlSiteContent } from '~/lib/modules/audit/firecrawl-service';
import { load, type CheerioAPI } from 'cheerio';

export interface ParsedReview {
  text: string;
  rating: number;
  author: string;
  date: string;
  has_response: boolean;
  response_text?: string;
  response_date?: string;
  response_time_hours?: number;
}

export interface ReviewPlatformResult {
  total_reviews: number;
  reviews: ParsedReview[];
  responded_reviews: number;
  responded_within_24h: number;
  negative_reviews_count: number;
  negative_reviews_responded: number;
}

/**
 * Find clinic page URL on DOC.ua using search
 */
async function findDocUaClinicUrl(
  clinicName: string,
  city: string,
  firecrawlApiKey?: string,
): Promise<string | null> {
  try {
    // Try to construct URL directly
    // DOC.ua structure: https://doc.ua/clinic/[slug]
    // Or search: https://doc.ua/search?q=clinic+name+city
    
    const searchQuery = `${clinicName} ${city}`.toLowerCase().replace(/\s+/g, '-');
    const searchUrl = `https://doc.ua/search?q=${encodeURIComponent(clinicName + ' ' + city)}`;
    
    // Use Firecrawl to get search results
    const pages = await crawlSiteContent(searchUrl, 1, firecrawlApiKey);
    
    if (pages.length === 0 || !pages[0]) {
      return null;
    }
    
    const firstPage = pages[0];
    const pageContent = firstPage.content || firstPage.markdown || '';
    if (!pageContent) {
      return null;
    }
    
    const $ = load(pageContent);
    
    // Look for clinic links in search results
    let clinicUrl: string | null = null;
    
    $('a[href*="/clinic/"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !clinicUrl) {
        clinicUrl = href.startsWith('http') ? href : `https://doc.ua${href}`;
        return false; // Break
      }
    });
    
    return clinicUrl;
  } catch {
    console.warn('[ReviewParser] Failed to find DOC.ua clinic URL:', error);
    return null;
  }
}

/**
 * Parse reviews from DOC.ua clinic page
 */
async function parseDocUaReviews(
  clinicUrl: string,
  firecrawlApiKey?: string,
): Promise<ReviewPlatformResult> {
  const defaultResult: ReviewPlatformResult = {
    total_reviews: 0,
    reviews: [],
    responded_reviews: 0,
    responded_within_24h: 0,
    negative_reviews_count: 0,
    negative_reviews_responded: 0,
  };

  try {
    // Get page content using Firecrawl
    const pages = await crawlSiteContent(clinicUrl, 1, firecrawlApiKey);
    
    if (pages.length === 0 || !pages[0]) {
      return defaultResult;
    }
    
    const firstPage = pages[0];
    const pageContent = firstPage.content || firstPage.markdown || '';
    if (!pageContent) {
      return defaultResult;
    }
    
    const $ = load(pageContent);
    const reviews: ParsedReview[] = [];
    
    // DOC.ua review structure (may vary, need to adapt)
    // Look for review containers
    $('.review, .comment, [class*="review"], [class*="comment"]').each((_, element) => {
      try {
        const reviewText = $(element).find('.review-text, .comment-text, p').first().text().trim();
        if (!reviewText) return;
        
        // Extract rating (usually in stars or number)
        let rating = 0;
        const ratingElement = $(element).find('.rating, .stars, [class*="rating"], [class*="star"]').first();
        const ratingText = ratingElement.text() || ratingElement.attr('data-rating') || '';
        const ratingMatch = ratingText.match(/(\d+)/);
        if (ratingMatch && ratingMatch[1]) {
          const parsedRating = parseInt(ratingMatch[1], 10);
          if (!isNaN(parsedRating)) {
            rating = parsedRating;
            if (rating > 5) rating = rating / 2; // Convert 10-point to 5-point
          }
        }
        
        // Extract author
        const author = $(element).find('.author, .user-name, [class*="author"]').first().text().trim() || 'Anonymous';
        
        // Extract date
        const dateText = $(element).find('.date, .review-date, [class*="date"]').first().text().trim();
        const reviewDate = parseDate(dateText) || new Date().toISOString();
        
        // Check for response
        const responseElement = $(element).find('.response, .clinic-response, [class*="response"]').first();
        const hasResponse = responseElement.length > 0;
        const responseText = hasResponse ? responseElement.text().trim() : undefined;
        const responseDateText = hasResponse 
          ? responseElement.find('.date, [class*="date"]').first().text().trim() 
          : undefined;
        const responseDate = responseDateText ? (parseDate(responseDateText) ?? undefined) : undefined;
        
        // Calculate response time
        let responseTimeHours: number | undefined;
        if (hasResponse && responseDate) {
          const reviewDateObj = new Date(reviewDate);
          const responseDateObj = new Date(responseDate);
          responseTimeHours = (responseDateObj.getTime() - reviewDateObj.getTime()) / (1000 * 60 * 60);
        }
        
        reviews.push({
          text: reviewText,
          rating: rating || 0,
          author,
          date: reviewDate,
          has_response: hasResponse,
          response_text: responseText,
          response_date: responseDate,
          response_time_hours: responseTimeHours,
        });
      } catch {
        console.warn('[ReviewParser] Error parsing DOC.ua review:', error);
      }
    });
    
    // Calculate metrics
    const respondedReviews = reviews.filter((r) => r.has_response).length;
    const respondedWithin24h = reviews.filter((r) => r.has_response && (r.response_time_hours || 0) <= 24).length;
    const negativeReviews = reviews.filter((r) => r.rating < 3);
    const negativeReviewsResponded = negativeReviews.filter((r) => r.has_response).length;
    
    return {
      total_reviews: reviews.length,
      reviews,
      responded_reviews: respondedReviews,
      responded_within_24h: respondedWithin24h,
      negative_reviews_count: negativeReviews.length,
      negative_reviews_responded: negativeReviewsResponded,
    };
  } catch {
    console.warn('[ReviewParser] Failed to parse DOC.ua reviews:', error);
    return defaultResult;
  }
}

/**
 * Find clinic page URL on Helsi using search
 */
async function findHelsiClinicUrl(
  clinicName: string,
  city: string,
  firecrawlApiKey?: string,
): Promise<string | null> {
  try {
    const searchUrl = `https://helsi.me/search?q=${encodeURIComponent(clinicName + ' ' + city)}`;
    
    // Use Firecrawl to get search results
    const pages = await crawlSiteContent(searchUrl, 1, firecrawlApiKey);
    
    if (pages.length === 0 || !pages[0]) {
      return null;
    }
    
    const firstPage = pages[0];
    const pageContent = firstPage.content || firstPage.markdown || '';
    if (!pageContent) {
      return null;
    }
    
    const $ = load(pageContent);
    
    // Look for clinic links in search results
    let clinicUrl: string | null = null;
    
    $('a[href*="/clinic/"], a[href*="/doctor/"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !clinicUrl) {
        clinicUrl = href.startsWith('http') ? href : `https://helsi.me${href}`;
        return false; // Break
      }
    });
    
    return clinicUrl;
  } catch {
    console.warn('[ReviewParser] Failed to find Helsi clinic URL:', error);
    return null;
  }
}

/**
 * Parse reviews from Helsi clinic page
 */
async function parseHelsiReviews(
  clinicUrl: string,
  firecrawlApiKey?: string,
): Promise<ReviewPlatformResult> {
  const defaultResult: ReviewPlatformResult = {
    total_reviews: 0,
    reviews: [],
    responded_reviews: 0,
    responded_within_24h: 0,
    negative_reviews_count: 0,
    negative_reviews_responded: 0,
  };

  try {
    // Get page content using Firecrawl
    const pages = await crawlSiteContent(clinicUrl, 1, firecrawlApiKey);
    
    if (pages.length === 0 || !pages[0]) {
      return defaultResult;
    }
    
    const firstPage = pages[0];
    const pageContent = firstPage.content || firstPage.markdown || '';
    if (!pageContent) {
      return defaultResult;
    }
    
    const $ = load(pageContent);
    const reviews: ParsedReview[] = [];
    
    // Helsi review structure (may vary, need to adapt)
    $('.review, .comment, [class*="review"], [class*="comment"]').each((_, element) => {
      try {
        const reviewText = $(element).find('.review-text, .comment-text, p').first().text().trim();
        if (!reviewText) return;
        
        // Extract rating
        let rating = 0;
        const ratingElement = $(element).find('.rating, .stars, [class*="rating"]').first();
        const ratingText = ratingElement.text() || ratingElement.attr('data-rating') || '';
        const ratingMatch = ratingText.match(/(\d+)/);
        if (ratingMatch && ratingMatch[1]) {
          const parsedRating = parseInt(ratingMatch[1], 10);
          if (!isNaN(parsedRating)) {
            rating = parsedRating;
            if (rating > 5) rating = rating / 2;
          }
        }
        
        // Extract author
        const author = $(element).find('.author, .user-name').first().text().trim() || 'Anonymous';
        
        // Extract date
        const dateText = $(element).find('.date, .review-date').first().text().trim();
        const reviewDate = parseDate(dateText) || new Date().toISOString();
        
        // Check for response
        const responseElement = $(element).find('.response, .clinic-response').first();
        const hasResponse = responseElement.length > 0;
        const responseText = hasResponse ? responseElement.text().trim() : undefined;
        const responseDateText = hasResponse 
          ? responseElement.find('.date').first().text().trim() 
          : undefined;
        const responseDate = responseDateText ? (parseDate(responseDateText) ?? undefined) : undefined;
        
        // Calculate response time
        let responseTimeHours: number | undefined;
        if (hasResponse && responseDate) {
          const reviewDateObj = new Date(reviewDate);
          const responseDateObj = new Date(responseDate);
          responseTimeHours = (responseDateObj.getTime() - reviewDateObj.getTime()) / (1000 * 60 * 60);
        }
        
        reviews.push({
          text: reviewText,
          rating: rating || 0,
          author,
          date: reviewDate,
          has_response: hasResponse,
          response_text: responseText,
          response_date: responseDate,
          response_time_hours: responseTimeHours,
        });
      } catch {
        console.warn('[ReviewParser] Error parsing Helsi review:', error);
      }
    });
    
    // Calculate metrics
    const respondedReviews = reviews.filter((r) => r.has_response).length;
    const respondedWithin24h = reviews.filter((r) => r.has_response && (r.response_time_hours || 0) <= 24).length;
    const negativeReviews = reviews.filter((r) => r.rating < 3);
    const negativeReviewsResponded = negativeReviews.filter((r) => r.has_response).length;
    
    return {
      total_reviews: reviews.length,
      reviews,
      responded_reviews: respondedReviews,
      responded_within_24h: respondedWithin24h,
      negative_reviews_count: negativeReviews.length,
      negative_reviews_responded: negativeReviewsResponded,
    };
  } catch {
    console.warn('[ReviewParser] Failed to parse Helsi reviews:', error);
    return defaultResult;
  }
}

/**
 * Parse date from various formats
 */
function parseDate(dateText: string): string | null {
  if (!dateText) return null;
  
  try {
    // Try to parse common date formats
    const date = new Date(dateText);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Try Ukrainian date formats
    const ukrainianMonths: Record<string, number> = {
      'січня': 0, 'лютого': 1, 'березня': 2, 'квітня': 3,
      'травня': 4, 'червня': 5, 'липня': 6, 'серпня': 7,
      'вересня': 8, 'жовтня': 9, 'листопада': 10, 'грудня': 11,
    };
    
    for (const [month, monthNum] of Object.entries(ukrainianMonths)) {
      const match = dateText.match(new RegExp(`(\\d+)\\s+${month}\\s+(\\d+)`));
      if (match && match[1] && match[2]) {
        const day = parseInt(match[1], 10);
        const year = parseInt(match[2], 10);
        if (!isNaN(day) && !isNaN(year)) {
          const date = new Date(year, monthNum, day);
          return date.toISOString();
        }
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch reviews from DOC.ua
 */
export async function fetchDocUaReviews(
  clinicName: string,
  city: string,
  firecrawlApiKey?: string,
): Promise<ReviewPlatformResult> {
  try {
    const clinicUrl = await findDocUaClinicUrl(clinicName, city, firecrawlApiKey);
    
    if (!clinicUrl) {
      console.warn('[ReviewParser] DOC.ua clinic URL not found');
      return {
        total_reviews: 0,
        reviews: [],
        responded_reviews: 0,
        responded_within_24h: 0,
        negative_reviews_count: 0,
        negative_reviews_responded: 0,
      };
    }
    
    return await parseDocUaReviews(clinicUrl, firecrawlApiKey);
  } catch {
    console.warn('[ReviewParser] Failed to fetch DOC.ua reviews:', error);
    return {
      total_reviews: 0,
      reviews: [],
      responded_reviews: 0,
      responded_within_24h: 0,
      negative_reviews_count: 0,
      negative_reviews_responded: 0,
    };
  }
}

/**
 * Fetch reviews from Helsi
 */
export async function fetchHelsiReviews(
  clinicName: string,
  city: string,
  firecrawlApiKey?: string,
): Promise<ReviewPlatformResult> {
  try {
    const clinicUrl = await findHelsiClinicUrl(clinicName, city, firecrawlApiKey);
    
    if (!clinicUrl) {
      console.warn('[ReviewParser] Helsi clinic URL not found');
      return {
        total_reviews: 0,
        reviews: [],
        responded_reviews: 0,
        responded_within_24h: 0,
        negative_reviews_count: 0,
        negative_reviews_responded: 0,
      };
    }
    
    return await parseHelsiReviews(clinicUrl, firecrawlApiKey);
  } catch {
    console.warn('[ReviewParser] Failed to fetch Helsi reviews:', error);
    return {
      total_reviews: 0,
      reviews: [],
      responded_reviews: 0,
      responded_within_24h: 0,
      negative_reviews_count: 0,
      negative_reviews_responded: 0,
    };
  }
}


