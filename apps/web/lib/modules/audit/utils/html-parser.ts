import { load, type CheerioAPI } from 'cheerio';

/*
 * -------------------------------------------------------
 * Type Definitions
 * -------------------------------------------------------
 */

/**
 * Schema analysis result
 */
interface SchemaAnalysis {
  hasMedicalOrganization: boolean;
  hasLocalBusiness: boolean;
  hasPhysician: boolean;
  hasMedicalSpecialty: boolean;
  hasMedicalProcedure: boolean;
  hasFAQPage: boolean;
  hasReview: boolean;
  hasBreadcrumbList: boolean;
}

/**
 * Image analysis result
 */
interface ImageAnalysis {
  total: number;
  missingAlt: number;
}

/**
 * External link analysis result
 */
interface ExternalLinkAnalysis {
  total: number;
  broken: number;
  list: Array<{
    url: string;
    status: number;
    isTrusted: boolean;
    rel?: string;
  }>;
}

/**
 * Hreflang entry
 */
interface HreflangEntry {
  lang: string;
  url: string;
}

/**
 * Complete page parse result
 */
export interface PageParseResult {
  // Meta Tags
  meta: {
    title: string | null;
    titleLength: number | null;
    description: string | null;
    descriptionLength: number | null;
    h1: string | null;
    canonical: string | null;
    robots: string | null;
    viewport: boolean;
    lang: string | null;
    hreflangs: HreflangEntry[];
  };
  // Links
  links: string[];
  // Images
  images: ImageAnalysis;
  // Schema Markup
  schema: SchemaAnalysis;
  // External Links
  externalLinks: ExternalLinkAnalysis;
}

/**
 * JSON-LD schema object (can be in various formats)
 */
type JsonLdSchema =
  | { '@type'?: string | string[]; '@graph'?: JsonLdSchema[]; type?: string | string[];[key: string]: unknown }
  | JsonLdSchema[];

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Safely parse JSON-LD content
 * Handles various formats including escaped HTML entities
 */
function parseJsonLd(content: string): JsonLdSchema | null {
  try {
    // Clean up content - remove HTML entities and whitespace
    let cleanedContent = content.trim();
    
    // Remove HTML comments if present
    cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, '');
    
    // Try to parse directly
    try {
      const parsed = JSON.parse(cleanedContent);
      return parsed as JsonLdSchema;
    } catch (directParseError) {
      // If direct parse fails, try to unescape HTML entities
      // Some sites embed JSON-LD with HTML entities
      const unescaped = cleanedContent
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      
      try {
        const parsed = JSON.parse(unescaped);
        return parsed as JsonLdSchema;
      } catch (unescapedParseError) {
        console.warn('[HTMLParser] Failed to parse JSON-LD after unescaping:', unescapedParseError);
        console.warn('[HTMLParser] Original content preview:', content.substring(0, 200));
        return null;
      }
    }
  } catch (error) {
    // Malformed JSON - return null instead of throwing
    console.warn('[HTMLParser] Failed to parse JSON-LD:', error);
    return null;
  }
}

/**
 * Extract schema types from a JSON-LD object
 * Handles various formats: @type, type, arrays, @graph, nested objects
 */
function extractSchemaTypes(schema: JsonLdSchema, visited = new Set<unknown>()): string[] {
  const types: string[] = [];

  // Prevent infinite recursion
  if (visited.has(schema)) {
    return types;
  }
  visited.add(schema);

  // Handle arrays
  if (Array.isArray(schema)) {
    for (const item of schema) {
      types.push(...extractSchemaTypes(item, visited));
    }
    return types;
  }

  // Handle objects
  if (typeof schema === 'object' && schema !== null) {
    // Handle @graph (array of schema objects)
    if ('@graph' in schema && Array.isArray(schema['@graph'])) {
      for (const item of schema['@graph']) {
        types.push(...extractSchemaTypes(item, visited));
      }
    }

    // Extract @type or type field (primary type)
    const typeValue = schema['@type'] || schema['type'];

    if (typeValue) {
      if (Array.isArray(typeValue)) {
        types.push(...typeValue.map((t) => String(t)));
      } else {
        types.push(String(typeValue));
      }
    }

    // Also check nested objects that might have types
    // This handles cases like: { "@type": "Organization", "member": { "@type": "Physician" } }
    for (const key in schema) {
      if (key === '@type' || key === 'type' || key === '@graph' || key === '@context') {
        continue; // Skip already processed fields
      }
      
      const value = schema[key];
      if (typeof value === 'object' && value !== null) {
        // Recursively extract types from nested objects
        types.push(...extractSchemaTypes(value, visited));
      } else if (Array.isArray(value)) {
        // Check if array contains objects with types
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            types.push(...extractSchemaTypes(item, visited));
          }
        }
      }
    }
  }

  return types;
}

/**
 * Check if schema types match any of the target types
 * Handles various formats:
 * - "MedicalOrganization"
 * - "https://schema.org/MedicalOrganization"
 * - "http://schema.org/MedicalOrganization"
 * - "schema.org/MedicalOrganization"
 */
function hasSchemaType(types: string[], targetTypes: string[]): boolean {
  const normalizedTypes = types.map((t) => {
    const trimmed = t.toLowerCase().trim();
    // Remove schema.org URL prefix if present
    return trimmed.replace(/^https?:\/\/schema\.org\//, '').replace(/^schema\.org\//, '');
  });
  
  const normalizedTargets = targetTypes.map((t) => t.toLowerCase().trim());

  return normalizedTypes.some((type) =>
    normalizedTargets.some((target) => {
      // Exact match
      if (type === target) return true;
      // Ends with /target (e.g., "schema.org/MedicalOrganization")
      if (type.endsWith(`/${target}`)) return true;
      // Contains target (e.g., "MedicalOrganizationType")
      if (type.includes(target)) return true;
      // Handle namespace prefixes (e.g., "schema:MedicalOrganization")
      if (type.includes(`:${target}`)) return true;
      return false;
    })
  );
}

/**
 * Analyze all JSON-LD blocks for schema types
 */
function analyzeSchemaMarkup($: CheerioAPI): SchemaAnalysis {
  const result: SchemaAnalysis = {
    hasMedicalOrganization: false,
    hasLocalBusiness: false,
    hasPhysician: false,
    hasMedicalSpecialty: false,
    hasMedicalProcedure: false,
    hasFAQPage: false,
    hasReview: false,
    hasBreadcrumbList: false,
  };

  // Find all JSON-LD script tags
  const jsonLdScripts = $('script[type="application/ld+json"]');

  if (jsonLdScripts.length === 0) {
    console.debug('[SchemaAnalysis] No JSON-LD script tags found');
    return result;
  }

  console.debug(`[SchemaAnalysis] Found ${jsonLdScripts.length} JSON-LD script tag(s)`);

  // Collect all schema types from all JSON-LD blocks
  const allTypes: string[] = [];

  jsonLdScripts.each((_, element) => {
    const content = $(element).html();
    if (!content) {
      console.debug('[SchemaAnalysis] Empty JSON-LD script tag content');
      return;
    }

    const parsed = parseJsonLd(content);
    if (!parsed) {
      console.debug('[SchemaAnalysis] Failed to parse JSON-LD content');
      return;
    }

    const types = extractSchemaTypes(parsed);
    console.debug(`[SchemaAnalysis] Extracted types from JSON-LD:`, types);
    allTypes.push(...types);
  });

  console.debug(`[SchemaAnalysis] All extracted types:`, allTypes);

  // Check for specific schema types
  // MedicalOrganization
  result.hasMedicalOrganization = hasSchemaType(allTypes, [
    'MedicalOrganization',
    'Organization',
  ]);
  console.debug(`[SchemaAnalysis] hasMedicalOrganization: ${result.hasMedicalOrganization}`);

  // LocalBusiness (often used by medical clinics)
  result.hasLocalBusiness = hasSchemaType(allTypes, [
    'LocalBusiness',
    'MedicalBusiness',
    'Dentist',
    'Physician',
    'Hospital',
    'Clinic',
  ]);
  console.debug(`[SchemaAnalysis] hasLocalBusiness: ${result.hasLocalBusiness}`);

  // Physician
  result.hasPhysician = hasSchemaType(allTypes, [
    'Physician',
    'Doctor',
    'MedicalPerson',
  ]);
  console.debug(`[SchemaAnalysis] hasPhysician: ${result.hasPhysician}`);

  // MedicalSpecialty
  result.hasMedicalSpecialty = hasSchemaType(allTypes, [
    'MedicalSpecialty',
    'Specialty',
  ]);
  console.debug(`[SchemaAnalysis] hasMedicalSpecialty: ${result.hasMedicalSpecialty}`);

  // MedicalProcedure
  result.hasMedicalProcedure = hasSchemaType(allTypes, [
    'MedicalProcedure',
    'Procedure',
  ]);
  console.debug(`[SchemaAnalysis] hasMedicalProcedure: ${result.hasMedicalProcedure}`);

  // FAQPage
  result.hasFAQPage = hasSchemaType(allTypes, [
    'FAQPage',
  ]);
  console.debug(`[SchemaAnalysis] hasFAQPage: ${result.hasFAQPage}`);

  // Review
  result.hasReview = hasSchemaType(allTypes, [
    'Review',
    'AggregateRating',
    'Rating',
  ]);
  console.debug(`[SchemaAnalysis] hasReview: ${result.hasReview}`);

  // BreadcrumbList
  result.hasBreadcrumbList = hasSchemaType(allTypes, [
    'BreadcrumbList',
  ]);
  console.debug(`[SchemaAnalysis] hasBreadcrumbList: ${result.hasBreadcrumbList}`);

  return result;
}

/**
 * Extract all links from the page
 */
function extractLinks($: CheerioAPI, baseUrl: string): string[] {
  const links: string[] = [];
  const seen = new Set<string>();

  // Extract from <a> tags
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    try {
      // Resolve relative URLs
      const absoluteUrl = new URL(href, baseUrl).toString();
      if (!seen.has(absoluteUrl)) {
        seen.add(absoluteUrl);
        links.push(absoluteUrl);
      }
    } catch {
      // Invalid URL - skip
    }
  });

  // Extract from <link> tags (canonical, alternate, etc.)
  $('link[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    try {
      const absoluteUrl = new URL(href, baseUrl).toString();
      if (!seen.has(absoluteUrl)) {
        seen.add(absoluteUrl);
        links.push(absoluteUrl);
      }
    } catch {
      // Invalid URL - skip
    }
  });

  return links;
}

/**
 * Extract hreflang tags from the page
 */
function extractHreflangs($: CheerioAPI, baseUrl: string): HreflangEntry[] {
  const hreflangs: HreflangEntry[] = [];

  $('link[rel="alternate"][hreflang]').each((_, element) => {
    const lang = $(element).attr('hreflang');
    const href = $(element).attr('href');

    if (lang && href) {
      try {
        const absoluteUrl = new URL(href, baseUrl).toString();
        hreflangs.push({ lang, url: absoluteUrl });
      } catch {
        // Skip invalid URLs
      }
    }
  });

  return hreflangs;
}

/**
 * Analyze images on the page
 */
function analyzeImages($: CheerioAPI): ImageAnalysis {
  let total = 0;
  let missingAlt = 0;

  $('img').each((_, element) => {
    total++;
    const alt = $(element).attr('alt');
    if (!alt || alt.trim() === '') {
      missingAlt++;
    }
  });

  return {
    total,
    missingAlt,
  };
}

/**
 * Extract domain from URL
 */
function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Remove www. prefix for comparison
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Check if a domain is in the trusted/authoritative list
 */
function isTrustedDomain(domain: string | null): boolean {
  if (!domain) return false;

  const trustedDomains = [
    'who.int',
    'nih.gov',
    'cdc.gov',
    'wikipedia.org',
    'google.com',
    'mayo.edu',
    'clevelandclinic.org',
    'hopkinsmedicine.org',
    'webmd.com',
    'healthline.com',
    'medlineplus.gov',
    'pubmed.ncbi.nlm.nih.gov',
    'ncbi.nlm.nih.gov',
  ];

  const normalizedDomain = domain.toLowerCase();
  return trustedDomains.some((trusted) =>
    normalizedDomain === trusted || normalizedDomain.endsWith(`.${trusted}`)
  );
}

/**
 * Extract rel attribute and other link metadata
 */
function getLinkMetadata($: CheerioAPI, url: string): { rel?: string } {
  const link = $(`a[href="${url}"]`).first();
  return {
    rel: link.attr('rel'),
  };
}

/**
 * Check status of external links
 * Limits to max 15 links to avoid timeouts
 */
async function checkLinksStatus(
  $: CheerioAPI,
  links: string[],
  targetDomain: string,
): Promise<ExternalLinkAnalysis> {
  const targetDomainNormalized = getDomain(targetDomain);
  if (!targetDomainNormalized) {
    return {
      total: 0,
      broken: 0,
      list: [],
    };
  }

  // Filter external links (different domain)
  const externalLinks = links
    .map((link) => {
      const linkDomain = getDomain(link);
      return linkDomain && linkDomain !== targetDomainNormalized ? link : null;
    })
    .filter((link): link is string => link !== null);

  // Remove duplicates
  const uniqueExternalLinks = Array.from(new Set(externalLinks));

  // Limit to 15 links to avoid timeouts
  const linksToCheck = uniqueExternalLinks.slice(0, 15);

  const linkResults: Array<{ url: string; status: number; isTrusted: boolean }> = [];

  // Check each link in parallel (with limit)
  const checkPromises = linksToCheck.map(async (url) => {
    const domain = getDomain(url);
    const isTrusted = isTrustedDomain(domain);
    const { rel } = getLinkMetadata($, url);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TechAuditBot/1.0)',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout per link
      });

      return {
        url,
        status: response.status,
        isTrusted,
        rel,
      };
    } catch (error) {
      // If fetch fails, assume it's broken (404 or network error)
      return {
        url,
        status: 404,
        isTrusted,
      };
    }
  });

  // Wait for all checks to complete (or fail)
  const results = await Promise.allSettled(checkPromises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      linkResults.push(result.value);
    } else {
      // If promise rejected, add as broken
      console.warn('[HTMLParser] Link check failed:', result.reason);
    }
  });

  const broken = linkResults.filter((link) => link.status === 404 || link.status >= 500).length;

  return {
    total: uniqueExternalLinks.length,
    broken,
    list: linkResults,
  };
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Parse HTML content and extract structured metadata
 * 
 * @param html - The HTML content to parse
 * @param url - The URL of the page (for resolving relative links)
 * @returns Structured PageParseResult with all extracted data
 */
export async function parseHtml(html: string, url: string): Promise<PageParseResult> {
  const $ = load(html);

  // Extract meta tags
  const title = $('title').text().trim() || null;
  const titleLength = title ? title.length : null;

  const description = $('meta[name="description"]').attr('content')?.trim() || null;
  const descriptionLength = description ? description.length : null;

  const h1 = $('h1').first().text().trim() || null;

  // Canonical URL
  let canonical: string | null = null;
  const canonicalHref = $('link[rel="canonical"]').attr('href');
  if (canonicalHref) {
    try {
      canonical = new URL(canonicalHref, url).toString();
    } catch {
      canonical = canonicalHref; // Fallback to raw value
    }
  }

  // Robots meta tag
  const robots = $('meta[name="robots"]').attr('content') || null;

  // Viewport meta tag (for mobile-friendliness)
  const viewport = $('meta[name="viewport"]').length > 0;

  // Lang attribute on html tag
  const lang = $('html').attr('lang') || null;

  // Extract links
  const links = extractLinks($, url);

  // Extract and analyze hreflangs
  const hreflangs = extractHreflangs($, url);

  // Analyze images
  const images = analyzeImages($);

  // Analyze schema markup
  const schema = analyzeSchemaMarkup($);

  // Analyze external links (async)
  const externalLinks = await checkLinksStatus($, links, url);

  return {
    meta: {
      title,
      titleLength,
      description,
      descriptionLength,
      h1,
      canonical,
      robots,
      viewport,
      lang,
      hreflangs,
    },
    links,
    images,
    schema,
    externalLinks,
  };
}

