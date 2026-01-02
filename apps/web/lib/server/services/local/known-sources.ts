/**
 * Known Local Sources Database
 * 
 * Database of known local sources (portals, news sites, etc.)
 * organized by city for efficient backlink checking.
 */

export interface KnownSource {
  domain: string;
  city: string;
  type: 'city_portal' | 'news' | 'partner' | 'association' | 'charity' | 'blogger';
  search_url_pattern?: string; // Pattern for search URL on the site
  name?: string; // Display name
}

/**
 * Known local sources by city
 * This can be expanded with more sources
 */
export const KNOWN_SOURCES: KnownSource[] = [
  // Kyiv sources
  { domain: 'kyiv.ua', city: 'Киев', type: 'city_portal', name: 'Киевский портал' },
  { domain: 'kyiv24.ua', city: 'Киев', type: 'news', name: 'Киев 24' },
  { domain: 'kyiv.com.ua', city: 'Киев', type: 'city_portal' },
  
  // Lviv sources
  { domain: 'lviv.ua', city: 'Львов', type: 'city_portal', name: 'Львовский портал' },
  { domain: '0322.ua', city: 'Львов', type: 'news', name: '0322 Львов' },
  
  // Kharkiv sources
  { domain: 'kharkiv.ua', city: 'Харьков', type: 'city_portal', name: 'Харьковский портал' },
  { domain: 'kh.vgorode.ua', city: 'Харьков', type: 'city_portal' },
  
  // Odesa sources
  { domain: 'odessa.ua', city: 'Одесса', type: 'city_portal', name: 'Одесский портал' },
  { domain: 'od.vgorode.ua', city: 'Одесса', type: 'city_portal' },
  
  // Dnipro sources
  { domain: 'dnipro.ua', city: 'Днепр', type: 'city_portal' },
  { domain: 'dp.vgorode.ua', city: 'Днепр', type: 'city_portal' },
  
  // General Ukrainian sources
  { domain: 'vgorode.ua', city: 'Украина', type: 'city_portal', name: 'В городе' },
  { domain: 'ukr.net', city: 'Украина', type: 'news', name: 'Укрнет' },
  { domain: 'tsn.ua', city: 'Украина', type: 'news', name: 'ТСН' },
  { domain: 'unian.ua', city: 'Украина', type: 'news', name: 'УНИАН' },
  
  // Medical associations (examples)
  { domain: 'amu.org.ua', city: 'Украина', type: 'association', name: 'Ассоциация медиков Украины' },
  
  // Add more sources as needed
];

/**
 * Get known sources for a specific city
 */
export function getKnownSourcesForCity(city: string): KnownSource[] {
  const cityLower = city.toLowerCase();
  
  return KNOWN_SOURCES.filter((source) => {
    const sourceCityLower = source.city.toLowerCase();
    return sourceCityLower === cityLower || 
           sourceCityLower === 'украина' || // Include general Ukrainian sources
           sourceCityLower.includes(cityLower) ||
           cityLower.includes(sourceCityLower);
  });
}

/**
 * Get known sources by type
 */
export function getKnownSourcesByType(
  type: KnownSource['type'],
  city?: string,
): KnownSource[] {
  const sources = city 
    ? getKnownSourcesForCity(city)
    : KNOWN_SOURCES;
  
  return sources.filter((source) => source.type === type);
}

/**
 * Find known source by domain
 */
export function findKnownSourceByDomain(domain: string): KnownSource | undefined {
  const domainLower = domain.replace(/^www\./, '').toLowerCase();
  
  return KNOWN_SOURCES.find((source) => {
    const sourceDomain = source.domain.replace(/^www\./, '').toLowerCase();
    return sourceDomain === domainLower || domainLower.includes(sourceDomain);
  });
}

/**
 * Check if domain is a known local source
 */
export function isKnownLocalSource(domain: string, city: string): boolean {
  const sources = getKnownSourcesForCity(city);
  const domainLower = domain.replace(/^www\./, '').toLowerCase();
  
  return sources.some((source) => {
    const sourceDomain = source.domain.replace(/^www\./, '').toLowerCase();
    return sourceDomain === domainLower || domainLower.includes(sourceDomain);
  });
}




