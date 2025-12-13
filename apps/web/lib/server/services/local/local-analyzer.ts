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
  } catch {
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
  } catch {
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
 * Note: This is a placeholder implementation. In production, this would
 * use Google My Business API or Places API to fetch real data.
 * 
 * @param placeId - Google Place ID (optional)
 * @param apiKey - Google API key (optional)
 * @returns Google Business Profile metrics
 */
async function analyzeGoogleBusinessProfile(
  placeId?: string,
  apiKey?: string,
): Promise<GoogleBusinessProfile> {
  // TODO: Implement real Google My Business API integration
  // For now, return default values indicating no data available
  
  if (!placeId || !apiKey) {
    return {
      completeness_percent: 0,
      filled_fields_count: 0,
      total_fields_count: 20, // Typical number of fields
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
  }

  try {
    // TODO: Fetch from Google My Business API
    // const response = await fetch(`https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}`, ...);
    
    // Placeholder: Return default structure
    return {
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
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to analyze Google Business Profile:', error);
    return {
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
 * Note: This is a placeholder implementation. In production, this would
 * use Google My Business API, DOC.ua API, and Helsi API to fetch real data.
 * 
 * @param placeId - Google Place ID (optional)
 * @param apiKey - Google API key (optional)
 * @returns Review response metrics
 */
async function analyzeReviewResponse(
  placeId?: string,
  apiKey?: string,
): Promise<ReviewResponse> {
  // TODO: Implement real API integrations
  // For now, return default values
  
  if (!placeId || !apiKey) {
    return {
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
  }

  try {
    // TODO: Fetch reviews from Google My Business API
    // TODO: Fetch reviews from DOC.ua API (if available)
    // TODO: Fetch reviews from Helsi API (if available)
    
    return {
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
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to analyze review response:', error);
    return {
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
 * Note: This is a placeholder implementation. In production, this would
 * use Google My Business Insights API to fetch real data.
 * 
 * @param placeId - Google Place ID (optional)
 * @param apiKey - Google API key (optional)
 * @returns GBP engagement metrics
 */
async function analyzeGBPEngagement(
  placeId?: string,
  apiKey?: string,
): Promise<GBPEngagement> {
  // TODO: Implement real Google My Business Insights API integration
  
  if (!placeId || !apiKey) {
    return {
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
  }

  try {
    // TODO: Fetch from Google My Business Insights API
    // const response = await fetch(`https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reportInsights`, ...);
    
    return {
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
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to analyze GBP engagement:', error);
    return {
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
 * Note: This is a placeholder implementation. In production, this would
 * use SEO APIs (Ahrefs, SEMrush) or crawl backlinks.
 * 
 * @param domain - Domain to analyze
 * @param city - City name for filtering local links
 * @returns Local backlinks metrics
 */
async function analyzeLocalBacklinks(
  domain: string,
  city?: string,
): Promise<LocalBacklinks> {
  // TODO: Implement real backlink analysis
  // Options:
  // 1. Use Ahrefs API
  // 2. Use SEMrush API
  // 3. Use Google Search Console API
  // 4. Crawl and analyze manually
  
  try {
    // Placeholder: Return empty structure
    return {
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
  } catch (error) {
    console.warn('[LocalAnalyzer] Failed to analyze local backlinks:', error);
    return {
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
function checkSocialNAP(profileUrl: string | null, businessName?: string, address?: string, phone?: string): boolean {
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
  url: string,
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
  
  // Run all analyses in parallel where possible
  const [
    googleBusinessProfile,
    reviewResponse,
    gbpEngagement,
    localBacklinks,
    localBusinessSchema,
  ] = await Promise.all([
    analyzeGoogleBusinessProfile(placeId, googleApiKey),
    analyzeReviewResponse(placeId, googleApiKey),
    analyzeGBPEngagement(placeId, googleApiKey),
    analyzeLocalBacklinks(getDomain(url) || '', city),
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



