/**
 * Google Maps API Client
 *
 * Fetches rating and review data from Google Maps/Places API.
 */

import type { GoogleMapsRating } from './types';

/**
 * Extract Place ID from Google Maps URL
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  try {
    // Try to extract from URL patterns
    // Pattern 1: https://www.google.com/maps/place/.../@lat,lng,zoom/data=...
    const placeMatch = url.match(/\/place\/([^/@]+)/);
    if (placeMatch && placeMatch[1]) {
      return placeMatch[1];
    }

    // Pattern 2: https://maps.google.com/?cid=...
    const cidMatch = url.match(/[?&]cid=([^&]+)/);
    if (cidMatch && cidMatch[1]) {
      return cidMatch[1];
    }

    // Pattern 3: https://www.google.com/maps/search/?api=1&query=...
    // For this case, we'd need to use Geocoding API to find place_id
    return null;
  } catch (_error) {
    return null;
  }
}

/**
 * Find Place ID using Google Places API Text Search
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
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].place_id;
    }

    return null;
  } catch (error) {
    console.warn('[GoogleMapsClient] Failed to find place ID:', error);
    return null;
  }
}

/**
 * Fetch Google Maps rating using Place ID
 */
export async function fetchGoogleMapsRating(
  placeId: string,
  apiKey: string,
): Promise<GoogleMapsRating> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,place_id&key=${apiKey}`,
      {
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      return {
        fetched: false,
      };
    }

    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return {
        rating: data.result.rating,
        review_count: data.result.user_ratings_total,
        place_id: data.result.place_id,
        fetched: true,
      };
    }

    return {
      fetched: false,
    };
  } catch (error) {
    console.warn('[GoogleMapsClient] Failed to fetch rating:', error);
    return {
      fetched: false,
    };
  }
}

/**
 * Fetch Google Maps rating from URL or search query
 */
export async function fetchGoogleMapsRatingFromUrl(
  url: string | null,
  searchQuery: string | null,
  apiKey: string | undefined,
): Promise<GoogleMapsRating> {
  if (!apiKey) {
    return {
      fetched: false,
    };
  }

  // Try to extract Place ID from URL
  let placeId: string | null = null;

  if (url) {
    placeId = extractPlaceIdFromUrl(url);
  }

  // If no Place ID from URL, try to find it using search query
  if (!placeId && searchQuery) {
    placeId = await findPlaceIdByText(searchQuery, apiKey);
  }

  if (!placeId) {
    return {
      fetched: false,
    };
  }

  return fetchGoogleMapsRating(placeId, apiKey);
}

