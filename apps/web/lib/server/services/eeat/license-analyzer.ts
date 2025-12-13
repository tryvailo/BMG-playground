/**
 * License and Accreditation Analyzer
 *
 * Analyzes licenses, accreditations, and related documents.
 */

import { load, type CheerioAPI } from 'cheerio';

import type {
  LicenseImageInfo,
  LicenseSectionInfo,
  AccreditationInfo,
} from './types';

/**
 * Check for license images and documents
 */
export function checkLicenseImages($: CheerioAPI, baseUrl: string): LicenseImageInfo[] {
  const licenses: LicenseImageInfo[] = [];

  // Check images with license-related alt/title
  $('img[alt], img[title]').each((_, element) => {
    const alt = $(element).attr('alt')?.toLowerCase() || '';
    const title = $(element).attr('title')?.toLowerCase() || '';
    const src = $(element).attr('src') || '';

    const licenseKeywords = [
      'ліцензія',
      'license',
      'наказ моз',
      'сертификат',
      'certificate',
    ];

    if (
      licenseKeywords.some((keyword) => alt.includes(keyword) || title.includes(keyword))
    ) {
      const fullUrl = src.startsWith('http') ? src : new URL(src, baseUrl).toString();
      licenses.push({
        url: fullUrl,
        description: alt || title || 'License document',
      });
    }
  });

  // Check links to license documents
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    const text = $(element).text().toLowerCase();

    const licensePatterns = [
      '/license',
      '/ліцензія',
      '/licenses',
      '/ліцензії',
      'license.pdf',
      'ліцензія.pdf',
    ];

    if (
      licensePatterns.some((pattern) => href.includes(pattern)) ||
      (text.includes('ліцензія') || text.includes('license')) &&
        (href.endsWith('.pdf') || href.endsWith('.jpg') || href.endsWith('.png'))
    ) {
      const fullHref = $(element).attr('href') || '';
      const fullUrl = fullHref.startsWith('http')
        ? fullHref
        : new URL(fullHref, baseUrl).toString();

      // Avoid duplicates
      if (!licenses.some((l) => l.url === fullUrl)) {
        licenses.push({
          url: fullUrl,
          description: $(element).text().trim() || 'License document',
        });
      }
    }
  });

  return licenses;
}

/**
 * Check for license section
 */
export function checkLicenseSection($: CheerioAPI, baseUrl: string): LicenseSectionInfo {
  let hasLicenseSection = false;
  let licenseSectionUrl: string | undefined;
  let hasStructuredList = false;

  // Check for license section links
  const licenseSectionPatterns = [
    '/licenses',
    '/ліцензії',
    '/license',
    '/ліцензія',
    '/accreditations',
    '/акредитації',
  ];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    const text = $(element).text().toLowerCase();

    for (const pattern of licenseSectionPatterns) {
      if (href.includes(pattern) || (text.includes('ліцензія') && href.includes('/'))) {
        hasLicenseSection = true;
        const fullHref = $(element).attr('href') || '';
        if (!licenseSectionUrl) {
          licenseSectionUrl = fullHref.startsWith('http')
            ? fullHref
            : new URL(fullHref, baseUrl).toString();
        }
        return false; // Break
      }
    }
  });

  // Check if current page is license section
  const currentUrl = baseUrl.toLowerCase();
  const isLicensePage = licenseSectionPatterns.some((pattern) => currentUrl.includes(pattern));

  if (isLicensePage || hasLicenseSection) {
    // Check for structured list (ul/ol with license items)
    const listSelectors = [
      'ul li',
      'ol li',
      '.license-list li',
      '.licenses li',
    ];

    for (const selector of listSelectors) {
      const items = $(selector);
      if (items.length > 0) {
        // Check if items contain license-related text
        let licenseItemsCount = 0;
        items.each((_, item) => {
          const itemText = $(item).text().toLowerCase();
          if (
            itemText.includes('ліцензія') ||
            itemText.includes('license') ||
            itemText.includes('наказ')
          ) {
            licenseItemsCount++;
          }
        });

        if (licenseItemsCount >= 2) {
          hasStructuredList = true;
          break;
        }
      }
    }

    // Also check for table with licenses
    if ($('table').length > 0) {
      const tableText = $('table').text().toLowerCase();
      if (
        tableText.includes('ліцензія') ||
        tableText.includes('license') ||
        tableText.includes('дата') ||
        tableText.includes('date')
      ) {
        hasStructuredList = true;
      }
    }
  }

  return {
    has_license_section: hasLicenseSection || isLicensePage,
    license_section_url: licenseSectionUrl,
    has_structured_list: hasStructuredList,
  };
}

/**
 * Check for accreditations
 */
export function checkAccreditations($: CheerioAPI, baseUrl: string): AccreditationInfo[] {
  const accreditations: AccreditationInfo[] = [];
  const textContent = $('body').text().toLowerCase();

  // Check for accreditation mentions
  const accreditationPatterns = [
    'акредитація',
    'accreditation',
    'акредитовано',
    'accredited',
    'сертифікація',
    'certification',
  ];

  const hasAccreditationMention = accreditationPatterns.some((pattern) =>
    textContent.includes(pattern),
  );

  if (hasAccreditationMention) {
    // Try to extract accreditation names
    const accreditationRegex = /(?:акредитація|accreditation)[:\s]+([А-ЯІЇЄҐа-яіїєґA-Za-z\s]+)/i;
    const matches = textContent.match(accreditationRegex);
    if (matches && matches[1]) {
      accreditations.push({
        name: matches[1].trim(),
      });
    }

    // Check for accreditation links
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')?.toLowerCase() || '';
      const text = $(element).text().toLowerCase();

      if (
        text.includes('акредитація') ||
        text.includes('accreditation') ||
        href.includes('accreditation')
      ) {
        const fullHref = $(element).attr('href') || '';
        const fullUrl = fullHref.startsWith('http')
          ? fullHref
          : new URL(fullHref, baseUrl).toString();

        // Check if we already have this accreditation
        const existing = accreditations.find((a) => a.url === fullUrl);
        if (!existing) {
          accreditations.push({
            name: $(element).text().trim() || 'Accreditation',
            url: fullUrl,
          });
        }
      }
    });

    // Check for accreditation documents (PDFs)
    $('a[href$=".pdf"]').each((_, element) => {
      const href = $(element).attr('href')?.toLowerCase() || '';
      const text = $(element).text().toLowerCase();

      if (
        href.includes('accreditation') ||
        href.includes('акредитація') ||
        text.includes('accreditation') ||
        text.includes('акредитація')
      ) {
        const fullHref = $(element).attr('href') || '';
        const fullUrl = fullHref.startsWith('http')
          ? fullHref
          : new URL(fullHref, baseUrl).toString();

        const existing = accreditations.find((a) => a.url === fullUrl);
        if (!existing) {
          accreditations.push({
            name: $(element).text().trim() || 'Accreditation document',
            url: fullUrl,
          });
        }
      }
    });
  }

  // If no specific accreditations found but mention exists, add generic
  if (hasAccreditationMention && accreditations.length === 0) {
    accreditations.push({
      name: 'Accreditation mentioned',
    });
  }

  return accreditations;
}

