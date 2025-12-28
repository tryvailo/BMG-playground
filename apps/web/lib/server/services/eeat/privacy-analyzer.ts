/**
 * Privacy Policy Analyzer
 *
 * Analyzes privacy policy content and GDPR compliance.
 */

import { load, type CheerioAPI } from 'cheerio';

import type { PrivacyPolicyContent, GDPRComplianceInfo } from './types';

/**
 * Analyze privacy policy content
 */
export async function analyzePrivacyPolicyContent(
  privacyUrl: string,
): Promise<PrivacyPolicyContent | null> {
  try {
    const response = await fetch(privacyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EEATAuditBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = load(html);
    const textContent = $('body').text().toLowerCase();

    // Check for medical data processing description
    const medicalDataPatterns = [
      'медичні дані',
      'medical data',
      'обробка медичних даних',
      'processing of medical data',
      'здоров\'я',
      'health data',
      'персональні дані про здоров\'я',
      'personal health data',
    ];
    const hasMedicalDataProcessing = medicalDataPatterns.some((pattern) =>
      textContent.includes(pattern),
    );

    // Check for GDPR consent
    const gdprPatterns = [
      'gdpr',
      'згода на обробку',
      'consent',
      'згода',
      'согласие',
      'rgpd',
    ];
    const hasGDPRConsent = gdprPatterns.some((pattern) => textContent.includes(pattern));

    // Check for user rights
    const userRightsPatterns = [
      'права користувача',
      'user rights',
      'права суб\'єкта даних',
      'data subject rights',
      'право на доступ',
      'right to access',
      'право на видалення',
      'right to deletion',
    ];
    const hasUserRights = userRightsPatterns.some((pattern) => textContent.includes(pattern));

    // Check for contact info for questions
    const contactPatterns = [
      'контакт',
      'contact',
      'питання',
      'questions',
      'звернутись',
      'reach out',
      'email',
      'телефон',
    ];
    const hasContactInfo = contactPatterns.some((pattern) => textContent.includes(pattern));

    return {
      has_medical_data_processing: hasMedicalDataProcessing,
      has_gdpr_consent: hasGDPRConsent,
      has_user_rights: hasUserRights,
      has_contact_info: hasContactInfo,
    };
  } catch (_error) {
    console.warn('[PrivacyAnalyzer] Failed to analyze privacy policy:', error);
    return null;
  }
}

/**
 * Check GDPR compliance on page
 */
export function checkGDPRCompliance($: CheerioAPI): GDPRComplianceInfo {
  let hasCookieBanner = false;
  let hasConsentForm = false;
  let hasPrivacyLinkInForm = false;

  // Check for cookie banner
  const cookieBannerSelectors = [
    '.cookie-banner',
    '.cookie-consent',
    '[class*="cookie"]',
    '[id*="cookie"]',
    '.gdpr-banner',
    '.consent-banner',
  ];

  for (const selector of cookieBannerSelectors) {
    if ($(selector).length > 0) {
      hasCookieBanner = true;
      break;
    }
  }

  // Also check for cookie-related text
  if (!hasCookieBanner) {
    const textContent = $('body').text().toLowerCase();
    if (
      textContent.includes('cookie') &&
      (textContent.includes('accept') || textContent.includes('згода'))
    ) {
      hasCookieBanner = true;
    }
  }

  // Check for consent form
  const consentFormSelectors = [
    'form[class*="consent"]',
    'form[class*="gdpr"]',
    'form[class*="cookie"]',
    '.consent-form',
    '.gdpr-form',
  ];

  for (const selector of consentFormSelectors) {
    if ($(selector).length > 0) {
      hasConsentForm = true;

      // Check if form has privacy policy link
      const form = $(selector).first();
      const formLinks = form.find('a[href*="privacy"], a[href*="policy"]');
      if (formLinks.length > 0) {
        hasPrivacyLinkInForm = true;
      }
      break;
    }
  }

  // Also check for consent checkboxes
  $('input[type="checkbox"]').each((_, element) => {
    const label = $(element).closest('label, .label').text().toLowerCase();
    if (
      label.includes('consent') ||
      label.includes('згода') ||
      label.includes('privacy') ||
      label.includes('політика')
    ) {
      hasConsentForm = true;

      // Check for privacy link near checkbox
      const container = $(element).closest('div, form, .form-group');
      if (container.find('a[href*="privacy"], a[href*="policy"]').length > 0) {
        hasPrivacyLinkInForm = true;
      }
    }
  });

  return {
    has_cookie_banner: hasCookieBanner,
    has_consent_form: hasConsentForm,
    has_privacy_link_in_form: hasPrivacyLinkInForm,
  };
}

