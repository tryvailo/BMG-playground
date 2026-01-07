/**
 * Ukraine clinics data from medical_centers_ukraine.tsv
 * Used to find clinic name by URL for Ukrainian region
 */

export interface UkraineClinic {
  name: string;
  url: string;
  city: string;
  servicesCount: number;
  size?: string; // Малі, Середні, Великі
}

let clinicsCache: UkraineClinic[] | null = null;

/**
 * Normalize URL for comparison
 * Removes protocol, www, trailing slashes, and converts to lowercase
 */
function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim();
}

/**
 * Load and parse Ukraine clinics from TSV file
 * This is a client-side function that reads the TSV file
 */
async function loadUkraineClinics(): Promise<UkraineClinic[]> {
  if (clinicsCache) {
    return clinicsCache;
  }

  try {
    // Fetch TSV file from public directory or use static data
    // For now, we'll use a static import approach
    // In production, you might want to fetch from /api/clinics or similar
    console.log('[UkraineClinics] Loading clinics data...');
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('/api/ukraine-clinics', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to load clinics data: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.warn('[UkraineClinics] No data lines found');
      return [];
    }

    // Skip header row
    const dataLines = lines.slice(1);
    const clinics: UkraineClinic[] = [];

    for (const line of dataLines) {
      const columns = line.split('\t');
      if (columns.length >= 4) {
        const name = columns[0]?.trim();
        const url = columns[1]?.trim();
        const city = columns[2]?.trim();
        const servicesCount = parseInt(columns[3]?.trim() || '0', 10);
        const size = columns[4]?.trim() || ''; // Размер: Малі, Середні, Великі

        if (name && url && city) {
          clinics.push({
            name,
            url,
            city,
            servicesCount,
            size,
          });
        }
      }
    }

    console.log('[UkraineClinics] Loaded', clinics.length, 'clinics');
    clinicsCache = clinics;
    return clinics;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[UkraineClinics] Request timeout, returning empty array');
    } else {
      console.error('[UkraineClinics] Error loading Ukraine clinics:', error);
    }
    return [];
  }
}

/**
 * Find clinic by URL in Ukraine clinics database
 * Returns clinic name if found, null otherwise
 */
export async function findClinicByUrl(url: string): Promise<string | null> {
  const normalizedInput = normalizeUrl(url);
  
  if (!normalizedInput) {
    return null;
  }

  const clinics = await loadUkraineClinics();
  
  // Try exact match first
  for (const clinic of clinics) {
    const normalizedClinicUrl = normalizeUrl(clinic.url);
    if (normalizedClinicUrl === normalizedInput) {
      return clinic.name;
    }
  }

  // Try partial match (domain match)
  const inputDomain = normalizedInput.split('/')[0];
  for (const clinic of clinics) {
    const normalizedClinicUrl = normalizeUrl(clinic.url);
    const clinicDomain = normalizedClinicUrl.split('/')[0];
    
    if (clinicDomain === inputDomain) {
      return clinic.name;
    }
  }

  // Try contains match
  for (const clinic of clinics) {
    const normalizedClinicUrl = normalizeUrl(clinic.url);
    if (normalizedClinicUrl.includes(normalizedInput) || normalizedInput.includes(normalizedClinicUrl)) {
      return clinic.name;
    }
  }

  return null;
}

/**
 * Count total clinics in a city
 * Returns total count of all clinics in the specified city
 */
export async function countClinicsInCity(city: string): Promise<number> {
  if (!city) {
    return 0;
  }
  
  const clinics = await loadUkraineClinics();
  return clinics.filter(clinic => clinic.city === city).length;
}

/**
 * Find competitors for a clinic in Ukraine
 * Returns up to 4 competitors from the same city:
 * - First priority: "Великі" size clinics
 * - Second priority: "Середні" size clinics (if not enough "Великі")
 * - Excludes the current clinic
 */
export async function findCompetitors(
  city: string,
  excludeUrl?: string
): Promise<UkraineClinic[]> {
  if (!city) {
    return [];
  }

  const clinics = await loadUkraineClinics();
  const normalizedExcludeUrl = excludeUrl ? normalizeUrl(excludeUrl) : null;

  // Filter clinics from the same city, excluding current clinic
  const cityClinics = clinics.filter((clinic) => {
    if (clinic.city !== city) {
      return false;
    }
    if (normalizedExcludeUrl) {
      const normalizedClinicUrl = normalizeUrl(clinic.url);
      // Exclude if URLs match
      if (
        normalizedClinicUrl === normalizedExcludeUrl ||
        normalizedClinicUrl.includes(normalizedExcludeUrl) ||
        normalizedExcludeUrl.includes(normalizedClinicUrl)
      ) {
        return false;
      }
    }
    return true;
  });

  // Separate by size
  const largeClinics = cityClinics.filter((c) => c.size === 'Великі');
  const mediumClinics = cityClinics.filter((c) => c.size === 'Середні');
  const smallClinics = cityClinics.filter((c) => c.size !== 'Великі' && c.size !== 'Середні');

  // Build result: first "Великі", then "Середні", then all others if needed
  const competitors: UkraineClinic[] = [];

  // Add "Великі" clinics first (up to 4)
  const largeToAdd = Math.min(4, largeClinics.length);
  competitors.push(...largeClinics.slice(0, largeToAdd));

  // If we need more, add "Середні" clinics
  if (competitors.length < 4) {
    const needed = 4 - competitors.length;
    const mediumToAdd = Math.min(needed, mediumClinics.length);
    competitors.push(...mediumClinics.slice(0, mediumToAdd));
  }

  // If still not enough, add small/other clinics from the city
  if (competitors.length < 4) {
    const needed = 4 - competitors.length;
    const smallToAdd = Math.min(needed, smallClinics.length);
    competitors.push(...smallClinics.slice(0, smallToAdd));
  }

  return competitors.slice(0, 4);
}

