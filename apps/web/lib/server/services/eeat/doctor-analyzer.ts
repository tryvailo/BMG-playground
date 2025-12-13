/**
 * Doctor Expertise Analyzer
 *
 * Analyzes doctor pages for credentials, diplomas, certificates, and associations.
 */

import { load, type CheerioAPI } from 'cheerio';

import type {
  DoctorCredentialsInfo,
  AssociationMembershipInfo,
} from './types';

/**
 * Check for doctor credentials (diplomas, certificates)
 */
export function checkDoctorCredentials($: CheerioAPI): DoctorCredentialsInfo {
  const credentialLinks: string[] = [];
  let hasDiplomas = false;
  let hasCertificates = false;

  // Check links to documents
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    const text = $(element).text().toLowerCase();

    // Check for diploma links
    if (
      href.includes('diploma') ||
      href.includes('диплом') ||
      text.includes('diploma') ||
      text.includes('диплом')
    ) {
      hasDiplomas = true;
      if (href && !credentialLinks.includes(href)) {
        credentialLinks.push(href);
      }
    }

    // Check for certificate links
    if (
      href.includes('certificate') ||
      href.includes('сертификат') ||
      href.includes('сертифікат') ||
      text.includes('certificate') ||
      text.includes('сертификат')
    ) {
      hasCertificates = true;
      if (href && !credentialLinks.includes(href)) {
        credentialLinks.push(href);
      }
    }

    // Check for license links
    if (
      href.includes('license') ||
      href.includes('ліцензія') ||
      text.includes('license') ||
      text.includes('ліцензія')
    ) {
      if (href && !credentialLinks.includes(href)) {
        credentialLinks.push(href);
      }
    }
  });

  // Check images with alt/text containing credentials
  $('img[alt], img[title]').each((_, element) => {
    const alt = $(element).attr('alt')?.toLowerCase() || '';
    const title = $(element).attr('title')?.toLowerCase() || '';
    const src = $(element).attr('src') || '';

    if (
      alt.includes('diploma') ||
      alt.includes('диплом') ||
      title.includes('diploma') ||
      title.includes('диплом')
    ) {
      hasDiplomas = true;
      if (src && !credentialLinks.includes(src)) {
        credentialLinks.push(src);
      }
    }

    if (
      alt.includes('certificate') ||
      alt.includes('сертификат') ||
      alt.includes('сертифікат') ||
      title.includes('certificate') ||
      title.includes('сертификат')
    ) {
      hasCertificates = true;
      if (src && !credentialLinks.includes(src)) {
        credentialLinks.push(src);
      }
    }
  });

  // Check for PDF files
  $('a[href$=".pdf"]').each((_, element) => {
    const href = $(element).attr('href') || '';
    const text = $(element).text().toLowerCase();
    const hrefLower = href.toLowerCase();

    if (
      hrefLower.includes('diploma') ||
      hrefLower.includes('certificate') ||
      hrefLower.includes('диплом') ||
      hrefLower.includes('сертификат') ||
      text.includes('diploma') ||
      text.includes('certificate')
    ) {
      if (hrefLower.includes('diploma') || hrefLower.includes('диплом')) {
        hasDiplomas = true;
      }
      if (hrefLower.includes('certificate') || hrefLower.includes('сертификат')) {
        hasCertificates = true;
      }
      if (!credentialLinks.includes(href)) {
        credentialLinks.push(href);
      }
    }
  });

  // Check for association memberships
  const hasAssociationMemberships = checkAssociationMembership($).length > 0;

  // Check for continuing education
  const textContent = $('body').text().toLowerCase();
  const educationPatterns = [
    'курс',
    'course',
    'навчання',
    'training',
    'сертифікація',
    'certification',
    'підвищення кваліфікації',
    'continuing education',
  ];
  const hasContinuingEducation = educationPatterns.some((pattern) =>
    textContent.includes(pattern),
  );

  return {
    has_diplomas: hasDiplomas,
    has_certificates: hasCertificates,
    has_association_memberships: hasAssociationMemberships,
    has_continuing_education: hasContinuingEducation,
    credential_links: credentialLinks.length > 0 ? credentialLinks : undefined,
  };
}

/**
 * Check for association memberships
 */
export function checkAssociationMembership($: CheerioAPI): AssociationMembershipInfo[] {
  const associations: AssociationMembershipInfo[] = [];
  const textContent = $('body').text().toLowerCase();

  // Known medical associations (Ukrainian and international)
  const knownAssociations = [
    { name: 'Асоціація кардіологів України', keywords: ['асоціація кардіологів'] },
    { name: 'Асоціація стоматологів України', keywords: ['асоціація стоматологів'] },
    { name: 'American Medical Association', keywords: ['ama', 'american medical association'] },
    { name: 'European Society', keywords: ['european society'] },
    { name: 'World Medical Association', keywords: ['world medical association', 'wma'] },
  ];

  // Check for mentions of associations
  for (const association of knownAssociations) {
    const isMentioned = association.keywords.some((keyword) =>
      textContent.includes(keyword.toLowerCase()),
    );

    if (isMentioned) {
      // Check for links to association
      let url: string | undefined;
      let isVerified = false;

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href')?.toLowerCase() || '';
        const text = $(element).text().toLowerCase();

        if (
          href.includes(association.name.toLowerCase()) ||
          text.includes(association.name.toLowerCase()) ||
          association.keywords.some((keyword) => href.includes(keyword) || text.includes(keyword))
        ) {
          isVerified = true;
          url = $(element).attr('href');
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
      if (!associations.some((a) => a.name.toLowerCase().includes(associationName.toLowerCase()))) {
        associations.push({
          name: associationName,
          is_verified: false,
        });
      }
    }
  }

  return associations;
}

