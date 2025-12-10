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
  }>;
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
  | { '@type'?: string | string[]; '@graph'?: JsonLdSchema[]; type?: string | string[]; [key: string]: unknown }
  | JsonLdSchema[];

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Safely parse JSON-LD content
 */
function parseJsonLd(content: string): JsonLdSchema | null {
  try {
    const parsed = JSON.parse(content);
    return parsed as JsonLdSchema;
  } catch (error) {
    // Malformed JSON - return null instead of throwing
    console.warn('[HTMLParser] Failed to parse JSON-LD:', error);
    return null;
  }
}

/**
 * Extract schema types from a JSON-LD object
 * Handles various formats: @type, type, arrays, @graph
 */
function extractSchemaTypes(schema: JsonLdSchema): string[] {
  const types: string[] = [];

  // Handle arrays
  if (Array.isArray(schema)) {
    for (const item of schema) {
      types.push(...extractSchemaTypes(item));
    }
    return types;
  }

  // Handle @graph
  if (typeof schema === 'object' && schema !== null) {
    if ('@graph' in schema && Array.isArray(schema['@graph'])) {
      for (const item of schema['@graph']) {
        types.push(...extractSchemaTypes(item));
      }
    }

    // Extract @type or type field
    const typeValue = schema['@type'] || schema['type'];
    
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

/**
 * Check if schema types match any of the target types
 */
function hasSchemaType(types: string[], targetTypes: string[]): boolean {
  const normalizedTypes = types.map((t) => t.toLowerCase().trim());
  const normalizedTargets = targetTypes.map((t) => t.toLowerCase().trim());
  
  return normalizedTypes.some((type) => 
    normalizedTargets.some((target) => 
      type === target || type.endsWith(`/${target}`) || type.includes(target)
    )
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
    return result;
  }

  // Collect all schema types from all JSON-LD blocks
  const allTypes: string[] = [];

  jsonLdScripts.each((_, element) => {
    const content = $(element).html();
    if (!content) return;

    const parsed = parseJsonLd(content);
    if (!parsed) return;

    const types = extractSchemaTypes(parsed);
    allTypes.push(...types);
  });

  // Check for specific schema types
  // MedicalOrganization
  result.hasMedicalOrganization = hasSchemaType(allTypes, [
    'MedicalOrganization',
    'Organization',
  ]);

  // LocalBusiness (often used by medical clinics)
  result.hasLocalBusiness = hasSchemaType(allTypes, [
    'LocalBusiness',
    'MedicalBusiness',
    'Dentist',
    'Physician',
    'Hospital',
    'Clinic',
  ]);

  // Physician
  result.hasPhysician = hasSchemaType(allTypes, [
    'Physician',
    'Doctor',
    'MedicalPerson',
  ]);

  // MedicalSpecialty
  result.hasMedicalSpecialty = hasSchemaType(allTypes, [
    'MedicalSpecialty',
    'Specialty',
  ]);

  // MedicalProcedure
  result.hasMedicalProcedure = hasSchemaType(allTypes, [
    'MedicalProcedure',
    'Procedure',
  ]);

  // FAQPage
  result.hasFAQPage = hasSchemaType(allTypes, [
    'FAQPage',
  ]);

  // Review
  result.hasReview = hasSchemaType(allTypes, [
    'Review',
    'AggregateRating',
    'Rating',
  ]);

  // BreadcrumbList
  result.hasBreadcrumbList = hasSchemaType(allTypes, [
    'BreadcrumbList',
  ]);

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
 * Check status of external links
 * Limits to max 15 links to avoid timeouts
 */
async function checkLinksStatus(
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

  // Analyze images
  const images = analyzeImages($);

  // Analyze schema markup
  const schema = analyzeSchemaMarkup($);

  // Analyze external links (async)
  const externalLinks = await checkLinksStatus(links, url);

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
    },
    links,
    images,
    schema,
    externalLinks,
  };
}

