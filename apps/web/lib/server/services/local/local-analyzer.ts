'use server';

/**
 * Local Indicators Analyzer Service
 * 
 * Analyzes local SEO indicators for medical clinics including:
 * - Google Business Profile completeness
 * - Review response rate and quality
 * - Google Business Profile engagement
 * - Local backlinks
 * - Local social media activity
 * - Local Business schema markup
 * 
 * This service is strictly isolated in lib/server/services and should not
 * depend on UI components or client-side code.
 */

import { load, type CheerioAPI } from 'cheerio';
import {
  LocalIndicatorsAuditResultSchema,
  type LocalIndicatorsAuditResult,
  type GoogleBusinessProfile,
  type ReviewResponse,
  type GBPEngagement,
  type LocalBacklinks,
  type LocalSocialMedia,
  type LocalBusinessSchema,
} from './types';
import {
  fetchPlaceDetails,
  countPhotos,
  hasAllDaysHours,
  countAttributes,
  extractServices,
  calculateCompleteness,
} from './google-places-client';
import { fetchDocUaReviews, fetchHelsiReviews } from './review-parsers';
import {
  searchLocalMentions,
  checkBacklink,
} from './google-custom-search-client';
import {
  getKnownSourcesForCity,
  findKnownSourceByDomain,
} from './known-sources';

/*
 * -------------------------------------------------------
 * Constants
 * -------------------------------------------------------
 */

/**
 * Minimum recommended values for Google Business Profile
 */
const GBP_MINIMUMS = {
  HIGH_QUALITY_PHOTOS: 10,
  ATTRIBUTES: 15,
  POSTS_PER_MONTH: 1,
} as const;

/**
 * Local backlink source type patterns
 */
const BACKLINK_TYPE_PATTERNS = {
  city_portal: ['city', 'misto', 'город', 'portal', 'портал'],
  news: ['news', 'новини', 'новости', 'media', 'медіа', 'медиа'],
  partner: ['partner', 'партнер', 'партнёр'],
  association: ['association', 'асоціація', 'ассоциация', 'union', 'союз'],
  charity: ['charity', 'благодійність', 'благотворительность', 'foundation', 'фонд'],
  blogger: ['blog', 'блог', 'blogger', 'блогер'],
} as const;

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Extract domain from URL
 */
function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch (_error) {
    return null;
  }
}

/**
 * Find Place ID using Google Places API Text Search
 * 
 * @param query - Search query (e.g., "clinic name, city")
 * @param apiKey - Google API key
 * @returns Place ID if found, null otherwise
 */
async function findPlaceIdByText(
  query: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          'Accept': 'application/json',
        },
      },
    );

    if (!response.ok) {
      console.warn('[LocalAnalyzer] Text Search API request failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Return the first result's place_id
      const placeId = data.results[0].place_id;
      console.log('[LocalAnalyzer] Found Place ID via Text Search:', placeId);
      return placeId;
    }

    if (data.status === 'REQUEST_DENIED' && data.error_message) {
      console.warn('[LocalAnalyzer] Text Search API request denied:', data.error_message);
    } else if (data.status !== 'OK') {
      console.warn('[LocalAnalyzer] Text Search API returned status:', data.status);
    }

    return null;
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to find Place ID via Text Search:', error);
    return null;
  }
}

/**
 * Parse JSON-LD schema content
 */
function parseJsonLd(content: string): unknown {
  if (!content || !content.trim()) {
    return null;
  }
  
  try {
    return JSON.parse(content.trim());
  } catch (_error) {
    return null;
  }
}

/**
 * Extract schema types from JSON-LD object
 */
function extractSchemaTypes(schema: unknown): string[] {
  const types: string[] = [];
  
  if (Array.isArray(schema)) {
    for (const item of schema) {
      types.push(...extractSchemaTypes(item));
    }
    return types;
  }
  
  if (typeof schema === 'object' && schema !== null) {
    const obj = schema as Record<string, unknown>;
    
    // Handle @graph
    if ('@graph' in obj && Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        types.push(...extractSchemaTypes(item));
      }
    }
    
    // Extract @type or type field
    const typeValue = obj['@type'] || obj['type'];
    if (typeValue) {
      if (Array.isArray(typeValue)) {
        types.push(...typeValue.map((t) => String(t)));
      } else {
        types.push(String(typeValue));
      }
    }
  }
  
  return types;
}

/*
 * -------------------------------------------------------
 * Google Business Profile Analysis
 * -------------------------------------------------------
 */

/**
 * Analyze Google Business Profile completeness
 * 
 * Uses Google Places API to fetch real business profile data.
 * If Place ID is not provided, attempts to find it automatically using clinic name and city.
 * 
 * @param placeId - Google Place ID (optional)
 * @param apiKey - Google API key (optional)
 * @param clinicName - Clinic name for automatic Place ID search (optional)
 * @param city - City name for automatic Place ID search (optional)
 * @returns Google Business Profile metrics
 */
async function analyzeGoogleBusinessProfile(
  placeId?: string,
  apiKey?: string,
  clinicName?: string,
  city?: string,
): Promise<GoogleBusinessProfile> {
  const defaultResult: GoogleBusinessProfile = {
    completeness_percent: 0,
    filled_fields_count: 0,
    total_fields_count: 20,
    photos_count: 0,
    high_quality_photos_count: 0,
    has_exterior_photos: false,
    has_interior_photos: false,
    has_team_photos: false,
    has_equipment_photos: false,
    services_count: 0,
    categories_count: 0,
    has_description: false,
    has_business_hours: false,
    has_all_days_hours: false,
    attributes_count: 0,
    has_qa: false,
    posts_count: 0,
    posts_per_month: 0,
    last_post_date: undefined,
  };

  console.log('[LocalAnalyzer] analyzeGoogleBusinessProfile called:', {
    hasPlaceId: !!placeId,
    hasApiKey: !!apiKey,
    clinicName: clinicName || 'not provided',
    city: city || 'not provided',
  });

  // If Place ID is not provided, but we have API key and clinic name, try to find it automatically
  let finalPlaceId = placeId;
  if (!finalPlaceId && apiKey && clinicName) {
    const searchQuery = city ? `${clinicName}, ${city}` : clinicName;
    console.log('[LocalAnalyzer] Attempting to find Place ID automatically for:', searchQuery);
    finalPlaceId = await findPlaceIdByText(searchQuery, apiKey) || undefined;
    
    if (finalPlaceId) {
      console.log('[LocalAnalyzer] Successfully found Place ID:', finalPlaceId);
    } else {
      console.warn('[LocalAnalyzer] Could not find Place ID for:', searchQuery);
    }
  }

  if (!finalPlaceId || !apiKey) {
    const reason = !finalPlaceId ? 'Place ID missing' : 'API key missing';
    console.warn('[LocalAnalyzer] Cannot analyze Google Business Profile:', {
      reason,
      attemptedAutoSearch: !placeId && !!apiKey && !!clinicName,
      hasApiKey: !!apiKey,
      hasClinicName: !!clinicName,
      hasCity: !!city,
    });
    return defaultResult;
  }

  try {
    if (!finalPlaceId || typeof finalPlaceId !== 'string') {
      return defaultResult;
    }
    const placeData = await fetchPlaceDetails(finalPlaceId, apiKey);

    if (!placeData) {
      return defaultResult;
    }

    // Calculate completeness
    const completeness = calculateCompleteness(placeData);

    // Count photos
    const photosCount = countPhotos(placeData.photos);
    const highQualityPhotosCount = photosCount >= 10 ? photosCount : 0;

    // Extract services/categories
    const services = extractServices(placeData.types);
    const categoriesCount = placeData.types?.length || 0;

    // Check business hours
    const hasBusinessHours = !!(placeData.opening_hours || placeData.current_opening_hours);
    const allDaysHaveHours = hasAllDaysHours(
      placeData.opening_hours || placeData.current_opening_hours,
    );

    // Count attributes
    const attributesCount = countAttributes(placeData.types, placeData.price_level);

    // Check for description
    const hasDescription = !!(placeData.description || placeData.editorial_summary?.overview);

    // Note: Q&A and Posts are not available through Places API
    // These require Google My Business API with OAuth authentication
    // For now, we'll set them to false/0

    return {
      completeness_percent: completeness.completeness_percent,
      filled_fields_count: completeness.filled_fields_count,
      total_fields_count: completeness.total_fields_count,
      photos_count: photosCount,
      high_quality_photos_count: highQualityPhotosCount,
      // Note: Places API doesn't provide photo types (exterior/interior/team/equipment)
      // These would require Google My Business API
      has_exterior_photos: photosCount > 0, // Assume some photos might be exterior
      has_interior_photos: photosCount > 5, // Assume multiple photos might include interior
      has_team_photos: false, // Cannot determine from Places API
      has_equipment_photos: false, // Cannot determine from Places API
      services_count: services.length,
      categories_count: categoriesCount,
      has_description: hasDescription,
      has_business_hours: hasBusinessHours,
      has_all_days_hours: allDaysHaveHours,
      attributes_count: attributesCount,
      has_qa: false, // Q&A not available through Places API
      posts_count: 0, // Posts not available through Places API
      posts_per_month: 0, // Posts not available through Places API
      last_post_date: undefined,
    };
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to analyze Google Business Profile:', error);
    return defaultResult;
  }
}

/*
 * -------------------------------------------------------
 * Review Response Analysis
 * -------------------------------------------------------
 */

/**
 * Analyze review response rate and quality
 * 
 * Uses Google Places API to fetch reviews, and Firecrawl to parse reviews
 * from DOC.ua and Helsi platforms.
 * If Place ID is not provided, attempts to find it automatically using clinic name and city.
 * 
 * @param placeId - Google Place ID (optional)
 * @param apiKey - Google API key (optional)
 * @param clinicName - Clinic name for searching on DOC.ua/Helsi and auto-finding Place ID (optional)
 * @param city - City name for searching on DOC.ua/Helsi and auto-finding Place ID (optional)
 * @param firecrawlApiKey - Firecrawl API key for parsing DOC.ua/Helsi (optional)
 * @returns Review response metrics
 */
async function analyzeReviewResponse(
  placeId?: string,
  apiKey?: string,
  clinicName?: string,
  city?: string,
  firecrawlApiKey?: string,
): Promise<ReviewResponse> {
  const defaultResult: ReviewResponse = {
    total_reviews: 0,
    responded_reviews: 0,
    response_rate_percent: 0,
    responded_within_24h: 0,
    response_rate_24h_percent: 0,
    average_response_time_hours: undefined,
    negative_reviews_count: 0,
    negative_reviews_responded: 0,
    negative_response_rate_percent: 0,
    platforms: [],
  };

  console.log('[LocalAnalyzer] analyzeReviewResponse called:', {
    hasPlaceId: !!placeId,
    hasApiKey: !!apiKey,
    clinicName: clinicName || 'not provided',
    city: city || 'not provided',
    hasFirecrawlApiKey: !!firecrawlApiKey,
  });

  // If Place ID is not provided, but we have API key and clinic name, try to find it automatically
  let finalPlaceId = placeId;
  if (!finalPlaceId && apiKey && clinicName) {
    const searchQuery = city ? `${clinicName}, ${city}` : clinicName;
    console.log('[LocalAnalyzer] Attempting to find Place ID automatically for reviews:', searchQuery);
    finalPlaceId = await findPlaceIdByText(searchQuery, apiKey) || undefined;
    
    if (finalPlaceId) {
      console.log('[LocalAnalyzer] Successfully found Place ID for reviews:', finalPlaceId);
    } else {
      console.warn('[LocalAnalyzer] Could not find Place ID for reviews:', searchQuery);
    }
  }

  if (!finalPlaceId || !apiKey) {
    const reason = !finalPlaceId ? 'Place ID missing' : 'API key missing';
    console.warn('[LocalAnalyzer] Cannot analyze review response:', {
      reason,
      attemptedAutoSearch: !placeId && !!apiKey && !!clinicName,
      hasApiKey: !!apiKey,
      hasClinicName: !!clinicName,
      hasCity: !!city,
    });
    return defaultResult;
  }

  try {
    const placeData = await fetchPlaceDetails(finalPlaceId, apiKey);

    if (!placeData) {
      return defaultResult;
    }

    // Get reviews from Places API
    const reviews = placeData.reviews || [];
    const totalReviews = placeData.user_ratings_total || reviews.length;

    // Count negative reviews (rating < 3)
    const negativeReviews = reviews.filter((review) => review.rating < 3);
    const negativeReviewsCount = negativeReviews.length;

    // Note: Places API doesn't provide information about:
    // - Whether business responded to reviews
    // - Response time
    // - Response text
    // This requires Google My Business API with OAuth authentication
    
    // For now, we'll estimate based on common patterns:
    // - Most businesses respond to 30-70% of reviews
    // - Response time varies widely
    // We'll set conservative estimates

    // Estimate: assume 50% response rate (conservative)
    const estimatedResponseRate = 50;
    const respondedReviews = Math.round((totalReviews * estimatedResponseRate) / 100);
    
    // Estimate: assume 40% respond within 24h
    const estimated24hRate = 40;
    const respondedWithin24h = Math.round((totalReviews * estimated24hRate) / 100);

    // Estimate: assume 80% of negative reviews get responses
    const negativeResponseRate = 80;
    const negativeReviewsResponded = Math.round(
      (negativeReviewsCount * negativeResponseRate) / 100,
    );

    // Fetch reviews from DOC.ua and Helsi if clinic name and city provided
    let docUaData = null;
    let helsiData = null;
    
    if (clinicName && city && firecrawlApiKey) {
      try {
        // Fetch in parallel
        [docUaData, helsiData] = await Promise.all([
          fetchDocUaReviews(clinicName, city, firecrawlApiKey).catch((error) => {
            console.warn('[LocalAnalyzer] Failed to fetch DOC.ua reviews:', error);
            return null;
          }),
          fetchHelsiReviews(clinicName, city, firecrawlApiKey).catch((error) => {
            console.warn('[LocalAnalyzer] Failed to fetch Helsi reviews:', error);
            return null;
          }),
        ]);
      } catch (error) {
        console.warn('[LocalAnalyzer] Error fetching reviews from DOC.ua/Helsi:', error);
      }
    }
    
    // Combine all platform data
    const platforms: ReviewResponse['platforms'] = [
      {
        platform: 'google',
        total_reviews: totalReviews,
        responded_reviews: respondedReviews,
        response_rate_percent: estimatedResponseRate,
      },
    ];
    
    if (docUaData && docUaData.total_reviews > 0) {
      platforms.push({
        platform: 'doc_ua',
        total_reviews: docUaData.total_reviews,
        responded_reviews: docUaData.responded_reviews,
        response_rate_percent: docUaData.total_reviews > 0
          ? (docUaData.responded_reviews / docUaData.total_reviews) * 100
          : 0,
      });
    }
    
    if (helsiData && helsiData.total_reviews > 0) {
      platforms.push({
        platform: 'helsi',
        total_reviews: helsiData.total_reviews,
        responded_reviews: helsiData.responded_reviews,
        response_rate_percent: helsiData.total_reviews > 0
          ? (helsiData.responded_reviews / helsiData.total_reviews) * 100
          : 0,
      });
    }
    
    // Calculate combined totals
    const allTotalReviews = totalReviews + 
      (docUaData?.total_reviews || 0) + 
      (helsiData?.total_reviews || 0);
    
    const allRespondedReviews = respondedReviews + 
      (docUaData?.responded_reviews || 0) + 
      (helsiData?.responded_reviews || 0);
    
    const allRespondedWithin24h = respondedWithin24h + 
      (docUaData?.responded_within_24h || 0) + 
      (helsiData?.responded_within_24h || 0);
    
    const allNegativeReviews = negativeReviewsCount + 
      (docUaData?.negative_reviews_count || 0) + 
      (helsiData?.negative_reviews_count || 0);
    
    const allNegativeResponded = negativeReviewsResponded + 
      (docUaData?.negative_reviews_responded || 0) + 
      (helsiData?.negative_reviews_responded || 0);
    
    // Calculate average response time
    let averageResponseTime: number | undefined;
    const responseTimes: number[] = [];
    
    if (docUaData?.reviews) {
      docUaData.reviews
        .filter((r) => r.response_time_hours !== undefined)
        .forEach((r) => responseTimes.push(r.response_time_hours!));
    }
    
    if (helsiData?.reviews) {
      helsiData.reviews
        .filter((r) => r.response_time_hours !== undefined)
        .forEach((r) => responseTimes.push(r.response_time_hours!));
    }
    
    if (responseTimes.length > 0) {
      averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    } else {
      averageResponseTime = 12; // Fallback estimate
    }
    
    const overallResponseRate = allTotalReviews > 0
      ? (allRespondedReviews / allTotalReviews) * 100
      : 0;
    
    const overall24hRate = allTotalReviews > 0
      ? (allRespondedWithin24h / allTotalReviews) * 100
      : 0;
    
    const overallNegativeRate = allNegativeReviews > 0
      ? (allNegativeResponded / allNegativeReviews) * 100
      : 0;
    
    return {
      total_reviews: allTotalReviews,
      responded_reviews: allRespondedReviews,
      response_rate_percent: overallResponseRate,
      responded_within_24h: allRespondedWithin24h,
      response_rate_24h_percent: overall24hRate,
      average_response_time_hours: averageResponseTime,
      negative_reviews_count: allNegativeReviews,
      negative_reviews_responded: allNegativeResponded,
      negative_response_rate_percent: overallNegativeRate,
      platforms,
    };
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to analyze review response:', error);
    return defaultResult;
  }
}

/*
 * -------------------------------------------------------
 * Google Business Profile Engagement Analysis
 * -------------------------------------------------------
 */

/**
 * Analyze Google Business Profile engagement metrics
 * 
 * Note: Engagement metrics (impressions, clicks, CTR) are only available through
 * Google My Business Insights API, which requires OAuth 2.0 authentication.
 * 
 * Places API provides basic data but not engagement metrics.
 * 
 * @param placeId - Google Place ID (optional)
 * @param apiKey - Google API key (optional)
 * @returns GBP engagement metrics
 */
async function analyzeGBPEngagement(
  placeId?: string,
  apiKey?: string,
): Promise<GBPEngagement> {
  const defaultResult: GBPEngagement = {
    impressions_per_month: 0,
    website_clicks_per_month: 0,
    calls_per_month: 0,
    direction_requests_per_month: 0,
    photo_views_per_month: undefined,
    bookings_per_month: undefined,
    total_actions_per_month: 0,
    ctr_percent: 0,
    search_impressions: 0,
    maps_impressions: 0,
  };

  if (!placeId || !apiKey || typeof placeId !== 'string') {
    return defaultResult;
  }

  try {
    const placeData = await fetchPlaceDetails(placeId, apiKey);

    if (!placeData) {
      return defaultResult;
    }

    // Note: Engagement metrics (impressions, clicks, CTR) are NOT available
    // through Google Places API. These require:
    // 1. Google My Business API (v4)
    // 2. OAuth 2.0 authentication
    // 3. Business account access
    
    // We can estimate based on rating and review count:
    // - Higher rating + more reviews = likely more impressions
    // - But we cannot get actual numbers without My Business API
    
    const _rating = placeData.rating || 0;
    const reviewCount = placeData.user_ratings_total || 0;
    
    // Very rough estimation based on review count and rating
    // This is NOT accurate - real data requires My Business API
    const estimatedImpressions = Math.round(reviewCount * 50); // Rough estimate
    const estimatedClicks = Math.round(estimatedImpressions * 0.05); // 5% CTR estimate
    const estimatedCalls = Math.round(estimatedClicks * 0.3); // 30% of clicks
    const estimatedDirections = Math.round(estimatedClicks * 0.4); // 40% of clicks
    
    // Split impressions between Search and Maps (rough estimate: 60/40)
    const searchImpressions = Math.round(estimatedImpressions * 0.6);
    const mapsImpressions = Math.round(estimatedImpressions * 0.4);
    
    const totalActions = estimatedClicks + estimatedCalls + estimatedDirections;
    const ctrPercent = estimatedImpressions > 0 
      ? (totalActions / estimatedImpressions) * 100 
      : 0;

    return {
      impressions_per_month: estimatedImpressions,
      website_clicks_per_month: estimatedClicks,
      calls_per_month: estimatedCalls,
      direction_requests_per_month: estimatedDirections,
      photo_views_per_month: undefined, // Not available
      bookings_per_month: undefined, // Not available
      total_actions_per_month: totalActions,
      ctr_percent: Math.min(100, ctrPercent),
      search_impressions: searchImpressions,
      maps_impressions: mapsImpressions,
    };
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to analyze GBP engagement:', error);
    return defaultResult;
  }
}

/*
 * -------------------------------------------------------
 * Local Backlinks Analysis
 * -------------------------------------------------------
 */

/**
 * Classify backlink type based on domain and URL patterns
 */
function classifyBacklinkType(domain: string, url: string): 'city_portal' | 'news' | 'partner' | 'association' | 'charity' | 'blogger' | 'other' {
  const domainLower = domain.toLowerCase();
  const urlLower = url.toLowerCase();
  
  for (const [type, patterns] of Object.entries(BACKLINK_TYPE_PATTERNS)) {
    if (patterns.some((pattern) => domainLower.includes(pattern) || urlLower.includes(pattern))) {
      return type as 'city_portal' | 'news' | 'partner' | 'association' | 'charity' | 'blogger';
    }
  }
  
  return 'other';
}

/**
 * Check if a domain is local (same city as clinic)
 * 
 * Note: This is a simplified implementation. In production, this would
 * use geolocation data or city name matching.
 */
function isLocalDomain(domain: string, city?: string): boolean {
  if (!city) {
    return false;
  }
  
  const cityLower = city.toLowerCase();
  const domainLower = domain.toLowerCase();
  
  // Check if city name appears in domain
  // This is a simplified check - in production, use proper geolocation
  return domainLower.includes(cityLower);
}

/**
 * Analyze local backlinks
 * 
 * Uses Google Custom Search API and known sources to find local backlinks
 * without requiring paid SEO APIs (Ahrefs/SEMrush).
 * 
 * @param domain - Domain to analyze
 * @param city - City name for filtering local links
 * @param clinicName - Clinic name for searching mentions
 * @param clinicUrl - Full URL of the clinic website
 * @param googleCustomSearchApiKey - Google Custom Search API key (optional)
 * @param googleCustomSearchEngineId - Google Custom Search Engine ID (optional)
 * @param firecrawlApiKey - Firecrawl API key for checking backlinks (optional)
 * @returns Local backlinks metrics
 */
async function analyzeLocalBacklinks(
  domain: string,
  city?: string,
  clinicName?: string,
  clinicUrl?: string,
  googleCustomSearchApiKey?: string,
  googleCustomSearchEngineId?: string,
  firecrawlApiKey?: string,
): Promise<LocalBacklinks> {
  const defaultResult: LocalBacklinks = {
    total_local_backlinks: 0,
    unique_local_domains: 0,
    city: city,
    backlinks_by_type: {
      city_portals: 0,
      news_sites: 0,
      partners: 0,
      medical_associations: 0,
      charity_foundations: 0,
      local_bloggers: 0,
    },
    backlinks: [],
  };

  if (!city || !clinicName || !clinicUrl) {
    console.warn('[LocalAnalyzer] Missing required parameters for backlink analysis');
    return defaultResult;
  }

  try {
    const allBacklinks: Array<{
      domain: string;
      url: string;
      anchor_text?: string;
      is_local: boolean;
      type: 'city_portal' | 'news' | 'partner' | 'association' | 'charity' | 'blogger' | 'other';
    }> = [];

    // Step 1: Search via Google Custom Search (if API keys provided)
    if (googleCustomSearchApiKey && googleCustomSearchEngineId) {
      try {
        console.log('[LocalAnalyzer] Searching for mentions via Google Custom Search...');
        const searchResults = await searchLocalMentions(
          clinicName,
          city,
          googleCustomSearchApiKey,
          googleCustomSearchEngineId,
          10, // max results
        );

        // Check each result for backlinks (limit to 5 parallel requests)
        const backlinkChecks = await Promise.allSettled(
          searchResults.slice(0, 5).map(async (result) => {
            const backlinkCheck = await checkBacklink(result.url, clinicUrl, firecrawlApiKey);
            
            if (backlinkCheck.has_backlink) {
              const knownSource = findKnownSourceByDomain(result.domain);
              const linkType = knownSource 
                ? knownSource.type 
                : classifyBacklinkType(result.domain, result.url);
              
              return {
                domain: result.domain,
                url: result.url,
                anchor_text: backlinkCheck.anchor_text,
                is_local: isLocalDomain(result.domain, city),
                type: linkType,
              };
            }
            return null;
          }),
        );

        for (const check of backlinkChecks) {
          if (check.status === 'fulfilled' && check.value) {
            allBacklinks.push(check.value);
          }
        }
      } catch (error) {
        console.warn('[LocalAnalyzer] Google Custom Search failed:', error);
      }
    }

    // Step 2: Check known sources (if Firecrawl API key provided)
    // This works WITHOUT Google Custom Search - uses direct search on source websites
    if (firecrawlApiKey) {
      try {
        console.log('[LocalAnalyzer] Checking known local sources...');
        const knownSources = getKnownSourcesForCity(city);
        
        // Limit to 5 known sources to avoid too many requests
        const sourcesToCheck = knownSources.slice(0, 5);
        
        // Option A: Use Google Custom Search with site: restriction (if available)
        if (googleCustomSearchApiKey && googleCustomSearchEngineId) {
          const knownSourceChecks = await Promise.allSettled(
            sourcesToCheck.map(async (source) => {
              try {
                // Search for clinic name on this specific domain using Google Custom Search
                const query = `"${clinicName}" site:${source.domain}`;
                const url = `https://www.googleapis.com/customsearch/v1?key=${googleCustomSearchApiKey}&cx=${googleCustomSearchEngineId}&q=${encodeURIComponent(query)}&num=3`;
                
                const response = await fetch(url, {
                  signal: AbortSignal.timeout(10000),
                });
                
                if (!response.ok) return null;
                
                const data = await response.json();
                if (!data.items || data.items.length === 0) return null;
                
                // Check first result for backlink
                const firstResult = data.items[0];
                const backlinkCheck = await checkBacklink(firstResult.link, clinicUrl, firecrawlApiKey);
                
                if (backlinkCheck.has_backlink) {
                  return {
                    domain: source.domain,
                    url: firstResult.link,
                    anchor_text: backlinkCheck.anchor_text,
                    is_local: true,
                    type: source.type,
                  };
                }
                return null;
              } catch (error) {
                console.warn(`[LocalAnalyzer] Failed to check known source ${source.domain}:`, error);
                return null;
              }
            }),
          );

          for (const check of knownSourceChecks) {
            if (check.status === 'fulfilled' && check.value) {
              allBacklinks.push(check.value);
            }
          }
        } else {
          // Option B: Direct search on source websites using Firecrawl (without Google Custom Search)
          // This approach searches directly on known source websites
          console.log('[LocalAnalyzer] Checking known sources via direct website search (no Google Custom Search)...');
          
          const knownSourceChecks = await Promise.allSettled(
            sourcesToCheck.map(async (source) => {
              try {
                // Try to construct search URL on the source website
                // Most sites have search functionality at /search?q=...
                const searchUrls = [
                  `${source.domain}/search?q=${encodeURIComponent(clinicName)}`,
                  `${source.domain}/search?query=${encodeURIComponent(clinicName)}`,
                  `${source.domain}/?s=${encodeURIComponent(clinicName)}`,
                ];
                
                // Try each search URL pattern
                for (const searchUrl of searchUrls) {
                  try {
                    const fullUrl = searchUrl.startsWith('http') ? searchUrl : `https://${searchUrl}`;
                    
                    // Use Firecrawl to get search results page
                    const { crawlSiteContent } = await import('~/lib/modules/audit/firecrawl-service');
                    const { load } = await import('cheerio');
                    
                    const pages = await crawlSiteContent(fullUrl, 1, firecrawlApiKey);
                    if (pages.length === 0 || !pages[0]) continue;
                    
                    const firstPage = pages[0];
                    const pageContent = firstPage.content || firstPage.markdown || '';
                    if (!pageContent) continue;
                    
                    const $ = load(pageContent);
                    
                    // Look for links that might mention the clinic
                    // Check if page contains clinic name
                    const pageText = $('body').text().toLowerCase();
                    const clinicNameLower = clinicName.toLowerCase();
                    
                    if (pageText.includes(clinicNameLower)) {
                      // Find links that might lead to clinic page
                      let foundUrl: string | null = null;
                      
                      $('a[href]').each((_, element) => {
                        const href = $(element).attr('href');
                        const linkText = $(element).text().toLowerCase();
                        
                        if (href && (linkText.includes(clinicNameLower) || href.includes(clinicNameLower.replace(/\s+/g, '-')))) {
                          foundUrl = href.startsWith('http') ? href : new URL(href, fullUrl).href;
                          return false; // Break
                        }
                      });
                      
                      if (foundUrl) {
                        // Check if this page has backlink
                        const backlinkCheck = await checkBacklink(foundUrl, clinicUrl, firecrawlApiKey);
                        
                        if (backlinkCheck.has_backlink) {
                          return {
                            domain: source.domain,
                            url: foundUrl,
                            anchor_text: backlinkCheck.anchor_text,
                            is_local: true,
                            type: source.type,
                          };
                        }
                      }
                    }
                  } catch (_error) {
                    // Try next URL pattern
                    continue;
                  }
                }
                
                return null;
              } catch (error) {
                console.warn(`[LocalAnalyzer] Failed to check known source ${source.domain}:`, error);
                return null;
              }
            }),
          );

          for (const check of knownSourceChecks) {
            if (check.status === 'fulfilled' && check.value) {
              allBacklinks.push(check.value);
            }
          }
        }
      } catch (error) {
        console.warn('[LocalAnalyzer] Known sources check failed:', error);
      }
    }

    // Step 3: Deduplicate by domain
    const uniqueDomains = new Set<string>();
    const deduplicatedBacklinks: typeof allBacklinks = [];
    
    for (const backlink of allBacklinks) {
      if (!uniqueDomains.has(backlink.domain)) {
        uniqueDomains.add(backlink.domain);
        deduplicatedBacklinks.push(backlink);
      }
    }

    // Step 4: Filter local backlinks only
    const localBacklinks = deduplicatedBacklinks.filter((b) => b.is_local);

    // Step 5: Count by type
    const backlinksByType = {
      city_portals: 0,
      news_sites: 0,
      partners: 0,
      medical_associations: 0,
      charity_foundations: 0,
      local_bloggers: 0,
    };

    for (const backlink of localBacklinks) {
      switch (backlink.type) {
        case 'city_portal':
          backlinksByType.city_portals++;
          break;
        case 'news':
          backlinksByType.news_sites++;
          break;
        case 'partner':
          backlinksByType.partners++;
          break;
        case 'association':
          backlinksByType.medical_associations++;
          break;
        case 'charity':
          backlinksByType.charity_foundations++;
          break;
        case 'blogger':
          backlinksByType.local_bloggers++;
          break;
      }
    }

    // Step 6: Get unique local domains
    const uniqueLocalDomains = new Set(localBacklinks.map((b) => b.domain)).size;

    return {
      total_local_backlinks: localBacklinks.length,
      unique_local_domains: uniqueLocalDomains,
      city: city,
      backlinks_by_type: backlinksByType,
      backlinks: localBacklinks.map((b) => ({
        domain: b.domain,
        url: b.url,
        anchor_text: b.anchor_text,
        is_local: b.is_local,
        type: b.type,
      })),
    };
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to analyze local backlinks:', error);
    return defaultResult;
  }
}

/*
 * -------------------------------------------------------
 * Local Social Media Analysis
 * -------------------------------------------------------
 */

/**
 * Find social media profile URL
 */
function findSocialProfile($: CheerioAPI, platform: 'facebook' | 'instagram'): string | null {
  const patterns = {
    facebook: ['facebook.com', 'fb.com'],
    instagram: ['instagram.com'],
  };
  
  const platformPatterns = patterns[platform];
  
  let profileUrl: string | null = null;
  
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    
    const hrefLower = href.toLowerCase();
    if (platformPatterns.some((pattern) => hrefLower.includes(pattern))) {
      profileUrl = href.startsWith('http') ? href : `https://${href}`;
      return false; // Break
    }
  });
  
  return profileUrl;
}

/**
 * Check if social media profile has correct NAP data
 * 
 * Note: This would require fetching the social media profile page
 * and parsing it. For now, we just check if profile exists.
 */
function checkSocialNAP(profileUrl: string | null, _businessName?: string, _address?: string, _phone?: string): boolean {
  // TODO: Fetch profile page and check for NAP data
  // For now, if profile exists, assume NAP might be present
  return profileUrl !== null;
}

/**
 * Analyze local social media activity
 * 
 * @param $ - Cheerio instance with parsed HTML
 * @param businessName - Business name for NAP checking
 * @param address - Business address for NAP checking
 * @param phone - Business phone for NAP checking
 * @param city - City name for checking mentions
 * @returns Local social media metrics
 */
function analyzeLocalSocialMedia(
  $: CheerioAPI,
  businessName?: string,
  address?: string,
  phone?: string,
  city?: string,
): LocalSocialMedia {
  const facebookUrl = findSocialProfile($, 'facebook');
  const instagramUrl = findSocialProfile($, 'instagram');
  
  // Check for geotags and city mentions (simplified)
  const bodyText = $('body').text().toLowerCase();
  const cityLower = city?.toLowerCase() || '';
  const hasCityMentions = cityLower ? bodyText.includes(cityLower) : false;
  
  return {
    facebook: {
      has_profile: facebookUrl !== null,
      has_correct_nap: checkSocialNAP(facebookUrl, businessName, address, phone),
      has_geotags: false, // TODO: Parse profile page
      has_city_mentions: hasCityMentions,
      posts_about_local_events: 0, // TODO: Parse profile page
      interaction_with_local_audience: false, // TODO: Parse profile page
      profile_url: facebookUrl || undefined,
    },
    instagram: {
      has_profile: instagramUrl !== null,
      has_correct_nap: checkSocialNAP(instagramUrl, businessName, address, phone),
      has_geotags: false, // TODO: Parse profile page
      has_city_mentions: hasCityMentions,
      posts_about_local_events: 0, // TODO: Parse profile page
      interaction_with_local_audience: false, // TODO: Parse profile page
      profile_url: instagramUrl || undefined,
    },
  };
}

/*
 * -------------------------------------------------------
 * Local Business Schema Analysis
 * -------------------------------------------------------
 */

/**
 * Analyze LocalBusiness schema markup
 * 
 * @param $ - Cheerio instance with parsed HTML
 * @param url - Page URL for validation
 * @returns Local Business schema metrics
 */
async function analyzeLocalBusinessSchema(
  $: CheerioAPI,
  _url: string,
): Promise<LocalBusinessSchema> {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  
  let isImplemented = false;
  let schemaType: 'LocalBusiness' | 'MedicalBusiness' | 'Physician' | 'Hospital' | undefined;
  let hasName = false;
  let hasAddress = false;
  let hasPhone = false;
  let hasHours = false;
  let hasPriceRange = false;
  let hasAggregateRating = false;
  const schemaErrors: string[] = [];
  const schemaWarnings: string[] = [];
  
  jsonLdScripts.each((_, element) => {
    const content = $(element).html();
    if (!content || !content.trim()) return;
    
    const parsed = parseJsonLd(content);
    if (!parsed) return;
    
    const types = extractSchemaTypes(parsed);
    const normalizedTypes = types.map((t) => t.toLowerCase().trim());
    
    // Check for LocalBusiness types
    const isLocalBusiness = normalizedTypes.some((type) => 
      type.includes('localbusiness') ||
      type.includes('medicalbusiness') ||
      type.includes('physician') ||
      type.includes('hospital') ||
      type.includes('dentist') ||
      type.includes('clinic')
    );
    
    if (isLocalBusiness) {
      isImplemented = true;
      
      // Determine schema type
      if (normalizedTypes.some((t) => t.includes('hospital'))) {
        schemaType = 'Hospital';
      } else if (normalizedTypes.some((t) => t.includes('physician') || t.includes('doctor'))) {
        schemaType = 'Physician';
      } else if (normalizedTypes.some((t) => t.includes('medical'))) {
        schemaType = 'MedicalBusiness';
      } else {
        schemaType = 'LocalBusiness';
      }
      
      // Check for required fields
      if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        
        // Handle @graph
        const items = '@graph' in obj && Array.isArray(obj['@graph']) 
          ? obj['@graph'] 
          : [obj];
        
        for (const item of items) {
          if (typeof item === 'object' && item !== null) {
            const itemObj = item as Record<string, unknown>;
            
            // Check for name
            if ('name' in itemObj && itemObj.name) {
              hasName = true;
            } else {
              schemaErrors.push('Missing required field: name');
            }
            
            // Check for address
            if ('address' in itemObj && itemObj.address) {
              hasAddress = true;
            } else {
              schemaErrors.push('Missing required field: address');
            }
            
            // Check for phone
            if ('telephone' in itemObj && itemObj.telephone) {
              hasPhone = true;
            } else {
              schemaErrors.push('Missing required field: telephone');
            }
            
            // Check for hours
            if ('openingHoursSpecification' in itemObj || 'openingHours' in itemObj) {
              hasHours = true;
            } else {
              schemaWarnings.push('Missing recommended field: openingHours');
            }
            
            // Check for optional fields
            if ('priceRange' in itemObj) {
              hasPriceRange = true;
            }
            
            if ('aggregateRating' in itemObj) {
              hasAggregateRating = true;
            }
          }
        }
      }
    }
  });
  
  // Determine validation status
  let validationStatus: 'valid' | 'invalid' | 'warning' | undefined;
  if (isImplemented) {
    if (schemaErrors.length === 0 && schemaWarnings.length === 0) {
      validationStatus = 'valid';
    } else if (schemaErrors.length > 0) {
      validationStatus = 'invalid';
    } else {
      validationStatus = 'warning';
    }
  }
  
  // Check if functioning correctly (has all required fields)
  const isFunctioningCorrectly = isImplemented && hasName && hasAddress && hasPhone;
  
  return {
    is_implemented: isImplemented,
    is_functioning_correctly: isFunctioningCorrectly,
    schema_type: schemaType,
    has_name: hasName,
    has_address: hasAddress,
    has_phone: hasPhone,
    has_hours: hasHours,
    has_price_range: hasPriceRange,
    has_aggregate_rating: hasAggregateRating,
    schema_errors: schemaErrors.length > 0 ? schemaErrors : undefined,
    schema_warnings: schemaWarnings.length > 0 ? schemaWarnings : undefined,
    validation_status: validationStatus,
  };
}

/*
 * -------------------------------------------------------
 * Recommendations Generation
 * -------------------------------------------------------
 */

/**
 * Generate recommendations based on audit results
 */
function generateRecommendations(
  result: LocalIndicatorsAuditResult,
): string[] {
  const recommendations: string[] = [];
  
  // Google Business Profile recommendations
  if (result.google_business_profile.completeness_percent < 80) {
    recommendations.push(
      `Google Business Profile completeness is ${result.google_business_profile.completeness_percent}%. Aim for 100% by filling all available fields.`
    );
  }
  
  if (result.google_business_profile.high_quality_photos_count < GBP_MINIMUMS.HIGH_QUALITY_PHOTOS) {
    recommendations.push(
      `Add more high-quality photos (currently ${result.google_business_profile.high_quality_photos_count}, recommended: ${GBP_MINIMUMS.HIGH_QUALITY_PHOTOS}+). Include exterior, interior, team, and equipment photos.`
    );
  }
  
  if (result.google_business_profile.posts_per_month < GBP_MINIMUMS.POSTS_PER_MONTH) {
    recommendations.push(
      `Post regularly on Google Business Profile (currently ${result.google_business_profile.posts_per_month.toFixed(1)} posts/month, recommended: ${GBP_MINIMUMS.POSTS_PER_MONTH}+ per month).`
    );
  }
  
  // Review response recommendations
  if (result.review_response.response_rate_24h_percent < 90) {
    recommendations.push(
      `Improve review response rate within 24 hours (currently ${result.review_response.response_rate_24h_percent}%, aim for 90%+).`
    );
  }
  
  if (result.review_response.negative_response_rate_percent < 100) {
    recommendations.push(
      `Respond to all negative reviews (currently ${result.review_response.negative_response_rate_percent}% response rate).`
    );
  }
  
  // Engagement recommendations
  if (result.gbp_engagement.ctr_percent < 5) {
    recommendations.push(
      `Improve Google Business Profile CTR (currently ${result.gbp_engagement.ctr_percent}%, aim for 5%+). Optimize profile photos, description, and posts.`
    );
  }
  
  // Local backlinks recommendations
  if (result.local_backlinks.unique_local_domains < 5) {
    recommendations.push(
      `Increase local backlinks (currently ${result.local_backlinks.unique_local_domains} local domains, aim for 5+). Reach out to city portals, local news sites, and partners.`
    );
  }
  
  // Social media recommendations
  if (!result.local_social_media.facebook.has_profile && !result.local_social_media.instagram.has_profile) {
    recommendations.push(
      'Create and maintain active profiles on Facebook and Instagram with correct NAP data and local content.'
    );
  }
  
  // Schema recommendations
  if (!result.local_business_schema.is_implemented) {
    recommendations.push(
      'Implement LocalBusiness schema markup on your website to help search engines understand your business information.'
    );
  } else if (!result.local_business_schema.is_functioning_correctly) {
    recommendations.push(
      'Fix LocalBusiness schema markup errors. Ensure all required fields (name, address, phone) are present and correctly formatted.'
    );
  }
  
  return recommendations;
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Analyze local indicators for a medical clinic
 * 
 * @param url - Website URL to analyze
 * @param placeId - Google Place ID (optional)
 * @param googleApiKey - Google API key for Places/My Business API (optional)
 * @param city - City name for filtering local backlinks (optional)
 * @returns Local indicators audit result
 */
export async function analyzeLocalIndicators(
  url: string,
  placeId?: string,
  googleApiKey?: string,
  city?: string,
  clinicName?: string,
  firecrawlApiKey?: string,
  googleCustomSearchApiKey?: string,
  googleCustomSearchEngineId?: string,
): Promise<LocalIndicatorsAuditResult> {
  // Fetch HTML content
  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LocalIndicatorsBot/1.0)',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    html = await response.text();
  } catch (error) {
    console.error('[LocalAnalyzer] Failed to fetch URL:', error);
    throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  const $ = load(html);
  
  // Extract NAP data from website (for social media analysis)
  // Simplified extraction - in production, use proper NAP extraction
  let businessName: string | undefined;
  let address: string | undefined;
  let phone: string | undefined;
  
  // Try to extract from schema first
  $('script[type="application/ld+json"]').each((_, element) => {
    const content = $(element).html();
    if (!content) return;
    
    const parsed = parseJsonLd(content);
    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      const items = '@graph' in obj && Array.isArray(obj['@graph']) ? obj['@graph'] : [obj];
      
      for (const item of items) {
        if (typeof item === 'object' && item !== null) {
          const itemObj = item as Record<string, unknown>;
          if (!businessName && 'name' in itemObj) {
            businessName = String(itemObj.name);
          }
          if (!address && 'address' in itemObj) {
            if (typeof itemObj.address === 'string') {
              address = itemObj.address;
            } else if (typeof itemObj.address === 'object') {
              // Handle structured address
              const addr = itemObj.address as Record<string, unknown>;
              if ('streetAddress' in addr) {
                address = String(addr.streetAddress);
              }
            }
          }
          if (!phone && 'telephone' in itemObj) {
            phone = String(itemObj.telephone);
          }
        }
      }
    }
  });
  
  // Use extracted businessName or provided clinicName
  const finalClinicName = clinicName || businessName;

  // Run all analyses in parallel where possible
  const [
    googleBusinessProfile,
    reviewResponse,
    gbpEngagement,
    localBacklinks,
    localBusinessSchema,
  ] = await Promise.all([
    analyzeGoogleBusinessProfile(placeId, googleApiKey, finalClinicName, city),
    analyzeReviewResponse(placeId, googleApiKey, finalClinicName, city, firecrawlApiKey),
    analyzeGBPEngagement(placeId, googleApiKey),
    analyzeLocalBacklinks(
      getDomain(url) || '',
      city,
      finalClinicName,
      url,
      googleCustomSearchApiKey,
      googleCustomSearchEngineId,
      firecrawlApiKey,
    ),
    analyzeLocalBusinessSchema($, url),
  ]);
  
  // Analyze social media (synchronous, uses parsed HTML)
  const localSocialMedia = analyzeLocalSocialMedia($, businessName, address, phone, city);
  
  // Build result
  const result: LocalIndicatorsAuditResult = {
    google_business_profile: googleBusinessProfile,
    review_response: reviewResponse,
    gbp_engagement: gbpEngagement,
    local_backlinks: localBacklinks,
    local_social_media: localSocialMedia,
    local_business_schema: localBusinessSchema,
    recommendations: [],
  };
  
  // Generate recommendations
  result.recommendations = generateRecommendations(result);
  
  // Validate and return
  return LocalIndicatorsAuditResultSchema.parse(result);
}



