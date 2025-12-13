/**
 * Transparency Analyzer
 *
 * Analyzes transparency of contacts, legal entity, and ownership information.
 */

import { load, type CheerioAPI } from 'cheerio';

import type {
  LegalEntityInfo,
  AboutUsInfo,
  ContactBlockInfo,
  DepartmentInfo,
} from './types';

/**
 * Check for legal entity information
 */
export function checkLegalEntity($: CheerioAPI): LegalEntityInfo {
  const textContent = $('body').text();
  const textLower = textContent.toLowerCase();

  // Check for legal entity indicators
  const legalEntityPatterns = [
    'тов',
    'llc',
    'пп',
    'фоп',
    'ltd',
    'limited',
    'юридична особа',
    'legal entity',
    'компанія',
    'company',
  ];

  let hasLegalEntityName = false;
  let legalEntityName: string | undefined;

  // Check for legal entity name in text
  for (const pattern of legalEntityPatterns) {
    if (textLower.includes(pattern)) {
      hasLegalEntityName = true;

      // Try to extract entity name
      const regex = new RegExp(`(${pattern}[^\\s]{0,50})`, 'i');
      const match = textContent.match(regex);
      if (match && match[1]) {
        legalEntityName = match[1].trim();
        break;
      }
    }
  }

  // Also check structured data
  const structuredName = $('[itemprop="name"]').text().trim() || $('h1').first().text().trim();
  if (structuredName && legalEntityPatterns.some((p) => structuredName.toLowerCase().includes(p))) {
    hasLegalEntityName = true;
    if (!legalEntityName) {
      legalEntityName = structuredName;
    }
  }

  // Check for registration number (ЕДРПОУ, tax ID)
  const registrationPatterns = [
    /єдрпоу[:\s]*(\d+)/i,
    /edrpou[:\s]*(\d+)/i,
    /tax\s*id[:\s]*(\d+)/i,
    /податковий\s*номер[:\s]*(\d+)/i,
    /ідентифікаційний\s*номер[:\s]*(\d+)/i,
  ];

  let hasRegistrationNumber = false;
  for (const pattern of registrationPatterns) {
    if (pattern.test(textContent)) {
      hasRegistrationNumber = true;
      break;
    }
  }

  return {
    has_legal_entity_name: hasLegalEntityName,
    legal_entity_name: legalEntityName,
    has_registration_number: hasRegistrationNumber,
  };
}

/**
 * Check for About Us page
 */
export function checkAboutUsPage($: CheerioAPI, baseUrl: string): AboutUsInfo {
  let hasAboutUsLink = false;
  let aboutUsUrl: string | undefined;
  let hasClinicHistory = false;
  let hasMissionValues = false;
  let hasTeamInfo = false;

  // Check for About Us links
  const aboutUsPatterns = [
    '/about',
    '/about-us',
    '/про-нас',
    '/про нас',
    '/about-clinic',
    '/о-клинике',
  ];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    const text = $(element).text().toLowerCase();

    for (const pattern of aboutUsPatterns) {
      if (href.includes(pattern) || text.includes('про нас') || text.includes('about us')) {
        hasAboutUsLink = true;
        const fullUrl = $(element).attr('href');
        if (fullUrl && !aboutUsUrl) {
          aboutUsUrl = fullUrl.startsWith('http') ? fullUrl : new URL(fullUrl, baseUrl).toString();
        }
        return false; // Break
      }
    }
  });

  // If we're on the About Us page, check content
  const currentUrl = baseUrl.toLowerCase();
  const isAboutUsPage = aboutUsPatterns.some((pattern) => currentUrl.includes(pattern));

  if (isAboutUsPage) {
    const textContent = $('body').text().toLowerCase();

    // Check for clinic history
    const historyPatterns = [
      'історія',
      'history',
      'заснування',
      'foundation',
      'розвиток',
      'development',
    ];
    hasClinicHistory = historyPatterns.some((pattern) => textContent.includes(pattern));

    // Check for mission/values
    const missionPatterns = [
      'місія',
      'mission',
      'цінності',
      'values',
      'філософія',
      'philosophy',
      'мета',
      'goal',
    ];
    hasMissionValues = missionPatterns.some((pattern) => textContent.includes(pattern));

    // Check for team information
    const teamPatterns = [
      'команда',
      'team',
      'колектив',
      'staff',
      'лікарі',
      'doctors',
    ];
    hasTeamInfo = teamPatterns.some((pattern) => textContent.includes(pattern));
  }

  return {
    has_about_us_link: hasAboutUsLink,
    about_us_url: aboutUsUrl,
    has_clinic_history: hasClinicHistory,
    has_mission_values: hasMissionValues,
    has_team_info: hasTeamInfo,
  };
}

/**
 * Check contact block completeness
 */
export function checkContactBlock($: CheerioAPI): ContactBlockInfo {
  let hasEmail = false;
  let email: string | undefined;
  let hasBookingForm = false;
  let hasMap = false;

  // Check for email
  $('a[href^="mailto:"]').each((_, element) => {
    hasEmail = true;
    const mailto = $(element).attr('href');
    if (mailto) {
      email = mailto.replace('mailto:', '').trim();
    }
    return false; // Break
  });

  // Also check for email in text (simple pattern)
  if (!hasEmail) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const textContent = $('body').text();
    if (emailPattern.test(textContent)) {
      hasEmail = true;
      const match = textContent.match(emailPattern);
      if (match) {
        email = match[0];
      }
    }
  }

  // Check for booking form
  const formSelectors = [
    'form[action*="book"]',
    'form[action*="appointment"]',
    'form[action*="записатись"]',
    'form[action*="запис"]',
    'form .booking',
    'form .appointment',
  ];

  for (const selector of formSelectors) {
    if ($(selector).length > 0) {
      hasBookingForm = true;
      break;
    }
  }

  // Also check for form with booking-related fields
  $('form').each((_, element) => {
    const formText = $(element).text().toLowerCase();
    const formHtml = $(element).html()?.toLowerCase() || '';

    if (
      formText.includes('записатись') ||
      formText.includes('appointment') ||
      formText.includes('book') ||
      formHtml.includes('name="date"') ||
      formHtml.includes('name="time"') ||
      formHtml.includes('type="datetime"')
    ) {
      hasBookingForm = true;
      return false; // Break
    }
  });

  // Check for map (Google Maps embed)
  const mapSelectors = [
    'iframe[src*="google.com/maps"]',
    'iframe[src*="maps.google"]',
    '.map',
    '[class*="map"]',
    '[id*="map"]',
  ];

  for (const selector of mapSelectors) {
    if ($(selector).length > 0) {
      hasMap = true;
      break;
    }
  }

  // Also check for map links
  $('a[href*="google.com/maps"], a[href*="maps.google"]').each((_, element) => {
    hasMap = true;
    return false; // Break
  });

  return {
    has_email: hasEmail,
    email,
    has_booking_form: hasBookingForm,
    has_map: hasMap,
  };
}

/**
 * Extract departments from navigation
 */
export function extractDepartments($: CheerioAPI, baseUrl: string): DepartmentInfo[] {
  const departments: DepartmentInfo[] = [];
  const departmentNames = new Set<string>();

  // Common department/service patterns
  const departmentPatterns = [
    '/services',
    '/послуги',
    '/departments',
    '/відділення',
    '/спеціалізації',
    '/specialties',
  ];

  // Check navigation links
  $('nav a[href], .menu a[href], .navigation a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    const text = $(element).text().trim();

    for (const pattern of departmentPatterns) {
      if (href.includes(pattern) && text) {
        if (!departmentNames.has(text)) {
          departmentNames.add(text);
          const fullUrl = $(element).attr('href');
          departments.push({
            name: text,
            url: fullUrl
              ? fullUrl.startsWith('http')
                ? fullUrl
                : new URL(fullUrl, baseUrl).toString()
              : undefined,
          });
        }
      }
    }
  });

  // Also check for department links in main content
  $('a[href*="/service"], a[href*="/department"], a[href*="/послуга"]').each((_, element) => {
    const text = $(element).text().trim();
    const href = $(element).attr('href');

    if (text && !departmentNames.has(text)) {
      departmentNames.add(text);
      departments.push({
        name: text,
        url: href
          ? href.startsWith('http')
            ? href
            : new URL(href, baseUrl).toString()
          : undefined,
      });
    }
  });

  return departments;
}

