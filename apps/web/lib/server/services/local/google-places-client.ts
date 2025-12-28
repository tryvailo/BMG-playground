/**
 * Google Places API Client
 * 
 * Fetches data from Google Places API (New) for Local Indicators analysis.
 * Uses Place Details API to get comprehensive business information.
 * 
 * Note: This file does not use 'use server' as it contains utility functions
 * that are used server-side but are not Server Actions.
 */

interface PlaceDetailsResponse {
  result?: {
    name?: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    business_status?: string;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    types?: string[];
    opening_hours?: {
      open_now?: boolean;
      weekday_text?: string[];
      periods?: Array<{
        open: { day: number; time: string };
        close?: { day: number; time: string };
      }>;
    };
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
      html_attributions?: string[];
    }>;
    reviews?: Array<{
      author_name: string;
      author_url?: string;
      language?: string;
      profile_photo_url?: string;
      rating: number;
      relative_time_description: string;
      text: string;
      time: number;
    }>;
    editorial_summary?: {
      overview?: string;
    };
    description?: string;
    current_opening_hours?: {
      open_now?: boolean;
      weekday_text?: string[];
      periods?: Array<{
        open: { day: number; time: string };
        close?: { day: number; time: string };
      }>;
    };
    secondary_opening_hours?: Array<{
      open_day: number;
      open_time: string;
      close_day?: number;
      close_time?: string;
    }>;
    plus_code?: {
      compound_code?: string;
      global_code?: string;
    };
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  };
  status: string;
  error_message?: string;
}

interface PlacePhotoResponse {
  data: ArrayBuffer;
  contentType?: string;
}

/**
 * Fetch comprehensive place details from Google Places API
 */
export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<PlaceDetailsResponse['result'] | null> {
  try {
    // Request all available fields for comprehensive data
    const fields = [
      'name',
      'formatted_address',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'business_status',
      'rating',
      'user_ratings_total',
      'price_level',
      'types',
      'opening_hours',
      'current_opening_hours',
      'secondary_opening_hours',
      'photos',
      'reviews',
      'editorial_summary',
      'description',
      'plus_code',
      'geometry',
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[GooglePlacesClient] API request failed:', response.status, response.statusText);
      return null;
    }

    const data: PlaceDetailsResponse = await response.json();

    if (data.status === 'OK' && data.result) {
      return data.result;
    }

    if (data.status === 'REQUEST_DENIED' && data.error_message) {
      console.warn('[GooglePlacesClient] API request denied:', data.error_message);
    } else if (data.status !== 'OK') {
      console.warn('[GooglePlacesClient] API returned status:', data.status);
    }

    return null;
  } catch (error) {
    console.warn('[GooglePlacesClient] Failed to fetch place details:', error);
    return null;
  }
}

/**
 * Get photo URL from photo reference
 * Note: This returns a URL that can be used to fetch the photo
 */
export function getPlacePhotoUrl(
  photoReference: string,
  apiKey: string,
  maxWidth: number = 400,
): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}

/**
 * Count photos by analyzing photo references
 * Note: We can't determine photo types (exterior/interior/team/equipment) from Places API alone
 */
export function countPhotos(photos?: Array<{ photo_reference: string }>): number {
  return photos?.length || 0;
}

/**
 * Type for opening hours periods
 */
type OpeningHoursPeriod = {
  open: { day: number; time: string };
  close?: { day: number; time: string };
};

/**
 * Type for opening hours
 */
type OpeningHours = {
  open_now?: boolean;
  weekday_text?: string[];
  periods?: OpeningHoursPeriod[];
};

/**
 * Check if business hours are set for all days
 */
export function hasAllDaysHours(
  openingHours?: OpeningHours,
): boolean {
  if (!openingHours?.periods || openingHours.periods.length === 0) {
    return false;
  }

  // Check if we have periods for all 7 days (0-6)
  const daysWithHours = new Set<number>(
    openingHours.periods.map((period: OpeningHoursPeriod) => period.open.day),
  );
  
  // If we have 7 unique days, all days have hours
  return daysWithHours.size >= 7;
}

/**
 * Count business attributes/types
 */
export function countAttributes(
  types?: string[],
  priceLevel?: number,
): number {
  let count = 0;
  
  // Count types (excluding generic ones)
  if (types) {
    const genericTypes = ['establishment', 'point_of_interest'];
    count += types.filter((type) => !genericTypes.includes(type)).length;
  }
  
  // Add price level if available
  if (priceLevel !== undefined) {
    count += 1;
  }
  
  return count;
}

/**
 * Extract services/categories from types
 */
export function extractServices(types?: string[]): string[] {
  if (!types) {
    return [];
  }
  
  // Filter out generic types and return business-specific ones
  const genericTypes = ['establishment', 'point_of_interest', 'health'];
  return types.filter((type) => !genericTypes.includes(type));
}

/**
 * Calculate completeness percentage based on available fields
 */
export function calculateCompleteness(
  placeData: PlaceDetailsResponse['result'],
): {
  completeness_percent: number;
  filled_fields_count: number;
  total_fields_count: number;
} {
  const totalFields = 20; // Typical number of fields in GBP
  let filledFields = 0;

  if (!placeData) {
    return {
      completeness_percent: 0,
      filled_fields_count: 0,
      total_fields_count: totalFields,
    };
  }

  // Check each field
  if (placeData.name) filledFields++;
  if (placeData.formatted_address) filledFields++;
  if (placeData.formatted_phone_number || placeData.international_phone_number) filledFields++;
  if (placeData.website) filledFields++;
  if (placeData.description || placeData.editorial_summary?.overview) filledFields++;
  if (placeData.opening_hours || placeData.current_opening_hours) filledFields++;
  if (placeData.photos && placeData.photos.length > 0) filledFields++;
  if (placeData.types && placeData.types.length > 0) filledFields++;
  if (placeData.rating !== undefined) filledFields++;
  if (placeData.user_ratings_total !== undefined) filledFields++;
  if (placeData.price_level !== undefined) filledFields++;
  if (placeData.reviews && placeData.reviews.length > 0) filledFields++;
  if (placeData.business_status) filledFields++;
  if (placeData.geometry?.location) filledFields++;
  if (placeData.plus_code) filledFields++;
  // Additional fields that might be available
  if (placeData.secondary_opening_hours && placeData.secondary_opening_hours.length > 0) filledFields++;
  // Photos count as multiple fields (exterior, interior, etc.)
  if (placeData.photos && placeData.photos.length >= 10) filledFields += 2; // Bonus for many photos
  if (placeData.photos && placeData.photos.length >= 20) filledFields += 1; // Extra bonus

  const completeness_percent = Math.round((filledFields / totalFields) * 100);

  return {
    completeness_percent: Math.min(100, completeness_percent),
    filled_fields_count: filledFields,
    total_fields_count: totalFields,
  };
}

