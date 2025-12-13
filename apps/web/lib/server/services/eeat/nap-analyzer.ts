/**
 * NAP (Name, Address, Phone) Analyzer
 *
 * Extracts and compares NAP data from website and external sources.
 */

import { load, type CheerioAPI } from 'cheerio';

import type { NAPData, NAPComparison } from './types';

/**
 * Extract NAP data from website
 */
export function extractNAPFromWebsite($: CheerioAPI): NAPData {
  let name: string | undefined;
  let address: string | undefined;
  let phone: string | undefined;

  // Extract name from various sources
  const nameSelectors = [
    '[itemprop="name"]',
    'h1',
    '.clinic-name',
    '.company-name',
    '[class*="name"]',
    'title',
  ];

  for (const selector of nameSelectors) {
    const nameElement = $(selector).first();
    if (nameElement.length > 0) {
      const nameText = nameElement.text().trim();
      if (nameText && nameText.length < 200) {
        // Avoid very long text (likely not a name)
        name = nameText;
        break;
      }
    }
  }

  // Extract address
  const addressSelectors = [
    '[itemprop="address"]',
    '.address',
    '[class*="address"]',
    '[id*="address"]',
  ];

  for (const selector of addressSelectors) {
    const addressElement = $(selector).first();
    if (addressElement.length > 0) {
      address = addressElement.text().trim();
      if (address) {
        break;
      }
    }
  }

  // If no structured address, try to find in text
  if (!address) {
    const textContent = $('body').text();
    const addressPatterns = [
      /м\.\s*[А-ЯІЇЄҐа-яіїєґ\w]+,?\s*вул\.\s*[А-ЯІЇЄҐа-яіїєґ\w\s]+,?\s*\d+/i,
      /вул\.\s*[А-ЯІЇЄҐа-яіїєґ\w\s]+,?\s*\d+/i,
      /\d+\s*[А-ЯІЇЄҐа-яіїєґ\w\s]+(?:вул|street)/i,
    ];

    for (const pattern of addressPatterns) {
      const match = textContent.match(pattern);
      if (match) {
        address = match[0].trim();
        break;
      }
    }
  }

  // Extract phone from tel: links
  $('a[href^="tel:"]').each((_, element) => {
    const telHref = $(element).attr('href');
    if (telHref) {
      phone = telHref.replace('tel:', '').trim();
      return false; // Break
    }
  });

  // Also check structured data
  if (!phone) {
    const phoneElement = $('[itemprop="telephone"]').first();
    if (phoneElement.length > 0) {
      phone = phoneElement.text().trim();
    }
  }

  // If no structured phone, try to find in text
  if (!phone) {
    const textContent = $('body').text();
    const phonePatterns = [
      /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    ];

    for (const pattern of phonePatterns) {
      const matches = textContent.match(pattern);
      if (matches && matches.length > 0) {
        // Take the first phone number that looks like a clinic phone
        phone = matches[0].trim();
        break;
      }
    }
  }

  return {
    name: name || undefined,
    address: address || undefined,
    phone: phone || undefined,
  };
}

/**
 * Normalize phone number for comparison
 */
function normalizePhone(phone: string | undefined): string {
  if (!phone) return '';
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
}

/**
 * Normalize address for comparison
 */
function normalizeAddress(address: string | undefined): string {
  if (!address) return '';
  // Convert to lowercase, remove extra spaces, normalize common abbreviations
  return address
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/м\./g, 'м')
    .replace(/вул\./g, 'вул')
    .replace(/пр\./g, 'пр')
    .trim();
}

/**
 * Normalize name for comparison
 */
function normalizeName(name: string | undefined): string {
  if (!name) return '';
  // Convert to lowercase, remove extra spaces, remove common legal suffixes
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b(тов|llc|ltd|limited)\b/gi, '')
    .trim();
}

/**
 * Compare NAP data
 */
export function compareNAP(
  websiteNAP: NAPData,
  googleBusinessNAP?: NAPData,
): NAPComparison {
  const comparison: NAPComparison = {
    website: websiteNAP,
    google_business: googleBusinessNAP,
  };

  if (!googleBusinessNAP) {
    return comparison;
  }

  // Compare name
  const websiteName = normalizeName(websiteNAP.name);
  const googleName = normalizeName(googleBusinessNAP.name);
  const nameMatches = websiteName === googleName || websiteName.includes(googleName) || googleName.includes(websiteName);
  comparison.name_matches = nameMatches;

  // Compare address
  const websiteAddress = normalizeAddress(websiteNAP.address);
  const googleAddress = normalizeAddress(googleBusinessNAP.address);
  const addressMatches = websiteAddress === googleAddress || websiteAddress.includes(googleAddress) || googleAddress.includes(websiteAddress);
  comparison.address_matches = addressMatches;

  // Compare phone
  const websitePhone = normalizePhone(websiteNAP.phone);
  const googlePhone = normalizePhone(googleBusinessNAP.phone);
  const phoneMatches = websitePhone === googlePhone;
  comparison.phone_matches = phoneMatches;

  // Calculate match percentage
  const matches = [nameMatches, addressMatches, phoneMatches].filter(Boolean).length;
  comparison.match_percent = Math.round((matches / 3) * 100);

  return comparison;
}

