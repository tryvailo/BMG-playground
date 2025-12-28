/**
 * Community Interaction Analyzer
 *
 * Analyzes media links, publications, and association memberships.
 */

import { load, type CheerioAPI } from 'cheerio';

import type {
  MediaLinkInfo,
  PublicationInfo,
  AssociationMembershipInfo,
} from './types';

/**
 * Known authoritative medical media domains
 */
const AUTHORITATIVE_MEDIA_DOMAINS = [
  'bbc.com',
  'reuters.com',
  'medscape.com',
  'webmd.com',
  'mayoclinic.org',
  'healthline.com',
  'medicalnewstoday.com',
  'apteka.ua',
  'likar.info',
  'moz.gov.ua',
  'who.int',
];

/**
 * Check for media links
 */
export function checkMediaLinks($: CheerioAPI, baseUrl: string): MediaLinkInfo[] {
  const mediaLinks: MediaLinkInfo[] = [];
  const textContent = $('body').text().toLowerCase();

  // Check for outbound links to media
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href') || '';
    const text = $(element).text().toLowerCase();

    try {
      const url = new URL(href, baseUrl);
      const hostname = url.hostname.toLowerCase();

      // Check if link is to external media (not same domain)
      const baseUrlObj = new URL(baseUrl);
      if (hostname !== baseUrlObj.hostname) {
        // Check if it's a known media domain
        const isAuthoritative = AUTHORITATIVE_MEDIA_DOMAINS.some((domain) =>
          hostname.includes(domain),
        );

        // Also check if link text suggests it's a media/article link
        const isMediaLink =
          text.includes('стаття') ||
          text.includes('article') ||
          text.includes('публікація') ||
          text.includes('publication') ||
          text.includes('інтерв\'ю') ||
          text.includes('interview') ||
          text.includes('змі про нас') ||
          text.includes('media about us');

        if (isAuthoritative || isMediaLink) {
          // Avoid duplicates
          if (!mediaLinks.some((m) => m.url === url.toString())) {
            mediaLinks.push({
              url: url.toString(),
              name: $(element).text().trim() || hostname,
              is_authoritative: isAuthoritative,
            });
          }
        }
      }
    } catch (error) {
      // Invalid URL, skip
    }
  });

  return mediaLinks;
}

/**
 * Check for journal publications
 */
export function checkJournalPublications($: CheerioAPI, baseUrl: string): PublicationInfo[] {
  const publications: PublicationInfo[] = [];
  const textContent = $('body').text().toLowerCase();

  // Known journal domains
  const journalDomains = [
    'pubmed',
    'ncbi',
    'nature.com',
    'science.org',
    'nejm.org',
    'thelancet.com',
    'bmj.com',
    'jama.com',
  ];

  // Check for links to journals
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    const text = $(element).text().toLowerCase();

    const isJournalLink = journalDomains.some((domain) => href.includes(domain));

    if (isJournalLink) {
      const fullUrl = $(element).attr('href') || '';
      const url = fullUrl.startsWith('http') ? fullUrl : new URL(fullUrl, baseUrl).toString();

      publications.push({
        title: $(element).text().trim() || 'Journal publication',
        url,
        has_doi: href.includes('doi') || href.includes('pubmed'),
      });
    }
  });

  // Also check for DOI mentions in text
  const doiPattern = /doi[:\s]+([0-9.]+)\/([a-z0-9-]+)/i;
  const doiMatches = textContent.match(doiPattern);
  if (doiMatches) {
    const doi = `${doiMatches[1]}/${doiMatches[2]}`;
    publications.push({
      title: 'Publication with DOI',
      url: `https://doi.org/${doi}`,
      has_doi: true,
    });
  }

  // Check for publication mentions in text
  const publicationPatterns = [
    /опубліковано\s+в\s+([А-ЯІЇЄҐа-яіїєґ\w\s]+)/i,
    /published\s+in\s+([A-Za-z\w\s]+)/i,
  ];

  for (const pattern of publicationPatterns) {
    const matches = textContent.match(pattern);
    if (matches && matches[1]) {
      const journalName = matches[1].trim();
      // Avoid duplicates
      if (!publications.some((p) => p.title?.toLowerCase().includes(journalName.toLowerCase()))) {
        publications.push({
          title: journalName,
          has_doi: false,
        });
      }
    }
  }

  return publications;
}

/**
 * Check for association memberships (detailed)
 */
export function checkAssociationMembershipDetailed(
  $: CheerioAPI,
  baseUrl: string,
): AssociationMembershipInfo[] {
  const associations: AssociationMembershipInfo[] = [];
  const textContent = $('body').text().toLowerCase();

  // Known medical associations
  const knownAssociations = [
    {
      name: 'Асоціація кардіологів України',
      keywords: ['асоціація кардіологів', 'ukrainian cardiology association'],
      urlPattern: 'cardiology',
    },
    {
      name: 'Асоціація стоматологів України',
      keywords: ['асоціація стоматологів', 'ukrainian dentistry association'],
      urlPattern: 'dentistry',
    },
    {
      name: 'American Medical Association',
      keywords: ['ama', 'american medical association'],
      urlPattern: 'ama',
    },
    {
      name: 'European Society of Cardiology',
      keywords: ['european society of cardiology', 'esc'],
      urlPattern: 'esc',
    },
    {
      name: 'World Medical Association',
      keywords: ['world medical association', 'wma'],
      urlPattern: 'wma',
    },
  ];

  // Check for mentions and links
  for (const association of knownAssociations) {
    const isMentioned = association.keywords.some((keyword) =>
      textContent.includes(keyword.toLowerCase()),
    );

    if (isMentioned) {
      let url: string | undefined;
      let isVerified = false;

      // Check for links to association
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href')?.toLowerCase() || '';
        const text = $(element).text().toLowerCase();

        if (
          href.includes(association.urlPattern) ||
          association.keywords.some((keyword) => href.includes(keyword) || text.includes(keyword))
        ) {
          isVerified = true;
          const fullHref = $(element).attr('href') || '';
          url = fullHref.startsWith('http') ? fullHref : new URL(fullHref, baseUrl).toString();
          return false; // Break
        }
      });

      // Also check for logos/images
      $('img[alt], img[title]').each((_, element) => {
        const alt = $(element).attr('alt')?.toLowerCase() || '';
        const title = $(element).attr('title')?.toLowerCase() || '';

        if (
          association.keywords.some((keyword) => alt.includes(keyword) || title.includes(keyword))
        ) {
          isVerified = true;
          return false; // Break
        }
      });

      associations.push({
        name: association.name,
        url,
        is_verified: isVerified,
      });
    }
  }

  // Also check for generic association mentions
  const genericPatterns = [
    /член\s+(.+?)\s+асоціації/i,
    /member\s+of\s+(.+?)\s+association/i,
    /асоціація\s+(.+?)/i,
  ];

  for (const pattern of genericPatterns) {
    const matches = textContent.match(pattern);
    if (matches && matches[1]) {
      const associationName = matches[1].trim();
      // Avoid duplicates
      if (
        !associations.some((a) =>
          a.name.toLowerCase().includes(associationName.toLowerCase()),
        )
      ) {
        associations.push({
          name: associationName,
          is_verified: false,
        });
      }
    }
  }

  return associations;
}

