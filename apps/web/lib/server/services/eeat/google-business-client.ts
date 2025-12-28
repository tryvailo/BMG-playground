/**
 * Google Business Profile API Client
 *
 * Fetches NAP (Name, Address, Phone) data from Google Business Profile
 * for comparison with website data.
 */

import type { NAPData } from './types';

/**
 * Fetch NAP data from Google Business Profile using Place ID
 */
export async function fetchGoogleBusinessNAP(
  placeId: string,
  apiKey: string,
): Promise<NAPData | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number&key=${apiKey}`,
      {
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return {
        name: data.result.name || undefined,
        address: data.result.formatted_address || undefined,
        phone:
          data.result.formatted_phone_number ||
          data.result.international_phone_number ||
          undefined,
      };
    }

    return null;
  } catch (_error) {
    console.warn('[GoogleBusinessClient] Failed to fetch NAP:', error);
    return null;
  }
}

/**
 * Find Place ID using Google Places API Text Search
 */
export async function findPlaceIdByNAP(
  name: string,
  address: string | undefined,
  apiKey: string,
): Promise<string | null> {
  try {
    // Build search query
    const query = address ? `${name}, ${address}` : name;

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
      // Return the first result's place_id
      return data.results[0].place_id;
    }

    return null;
  } catch (_error) {
    console.warn('[GoogleBusinessClient] Failed to find place ID:', error);
    return null;
  }
}

/**
 * Fetch Google Business NAP from website NAP data
 */
export async function fetchGoogleBusinessNAPFromWebsite(
  websiteNAP: NAPData,
  apiKey: string | undefined,
): Promise<NAPData | null> {
  if (!apiKey || !websiteNAP.name) {
    return null;
  }

  // Try to find Place ID using name and address
  const placeId = await findPlaceIdByNAP(
    websiteNAP.name,
    websiteNAP.address,
    apiKey,
  );

  if (!placeId) {
    return null;
  }

  // Fetch NAP data using Place ID
  return fetchGoogleBusinessNAP(placeId, apiKey);
}

