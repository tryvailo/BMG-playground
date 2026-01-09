'use server';

/**
 * E-E-A-T Analyzer Service
 *
 * Analyzes HTML content and URL to generate E-E-A-T
 * (Experience, Expertise, Authoritativeness, Trustworthiness) audit results.
 *
 * IMPORTANT: "No Mock Data" policy - this service ONLY analyzes real
 * on-page signals (links, text keywords, structured data).
 *
 * This service is strictly isolated in lib/server/services and should not
 * depend on UI components or client-side code.
 */

import { load, type CheerioAPI } from 'cheerio';

import { EEATAuditResultSchema, type EEATAuditResult, type EEATRecommendation } from './types';
import { aggregateMetrics } from './metrics-aggregator';
import { discoverPages } from './page-discovery';
import {
  fetchGoogleMapsRatingFromUrl,
} from './google-maps-client';
import {
  fetchGoogleBusinessNAPFromWebsite,
} from './google-business-client';
import { extractArticleAuthor, analyzeAuthorProfile } from './article-detector';
import { checkDoctorCredentials } from './doctor-analyzer';
import {
  analyzeCaseStudyStructure,
  checkPIICompliance,
} from './case-study-analyzer';
import {
  checkLegalEntity,
  checkAboutUsPage,
  checkContactBlock,
  extractDepartments,
} from './transparency-analyzer';
import { checkLicenseImages, checkLicenseSection, checkAccreditations } from './license-analyzer';
import { extractNAPFromWebsite, compareNAP } from './nap-analyzer';
import { analyzePrivacyPolicyContent, checkGDPRCompliance } from './privacy-analyzer';

import {
  checkMediaLinks,
  checkJournalPublications,
  checkAssociationMembershipDetailed,
} from './community-analyzer';
import { fetchAggregatorRating } from './aggregator-rating-client';

/*
 * -------------------------------------------------------
 * Constants
 * -------------------------------------------------------
 */

/**
 * Platform detection patterns
 * Maps URL substrings to platform labels
 */
const PLATFORM_PATTERNS: Record<string, string> = {
  'google.com/maps': 'Google Maps',
  'doc.ua': 'Doc.ua',
  'likarni.com': 'Likarni',
  'helsi.me': 'Helsi',
};

/**
 * Social media detection patterns
 * Maps URL substrings to social network names
 */
const SOCIAL_PATTERNS: Record<string, string> = {
  'facebook.com': 'Facebook',
  'instagram.com': 'Instagram',
  'youtube.com': 'YouTube',
};

/**
 * High-authority scientific domains for counting
 */
const SCIENTIFIC_DOMAINS = [
  'ncbi.nlm.nih.gov',
  'pubmed.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'cochrane.org',
  'who.int',
  'moz.gov.ua',
];

/**
 * Privacy/policy link patterns
 */
const PRIVACY_LINK_PATTERNS = ['/privacy', '/policy', '/terms'];

/**
 * Privacy anchor text patterns (Ukrainian)
 */
const PRIVACY_TEXT_PATTERNS = ['політика конфіденційності', 'privacy policy'];

/**
 * License text patterns
 */
const LICENSE_PATTERNS = ['ліцензія', 'license', 'наказ моз'];

/**
 * Author/doctor text patterns
 */
const AUTHOR_PATTERNS = ['лікар-', 'dr.', 'doctor', 'к.м.н.', 'md'];

/**
 * Author/team link patterns
 */
const AUTHOR_LINK_PATTERNS = ['/doctors/', '/team/', '/врачи/', '/лікарі/'];

/**
 * Case study link patterns
 */
const CASE_STUDY_PATTERNS = [
  'case',
  'result',
  'portfolio',
  'roboti',
  'до-та-після',
  'keisy',
  'cases',
  'results',
  'before-after',
];

/**
 * Community/media keywords (Ukrainian)
 * Related to conferences, media appearances, associations
 */
const COMMUNITY_KEYWORDS = [
  'конференц',
  'виступ',
  "інтерв'ю",
  'змі про нас',
  'асоціація',
  'конгрес',
  'семінар',
  'спікер',
  'доповід',
];

/**
 * Experience figure patterns (regex)
 * Matches patterns like "10+ років", "5000+ пацієнтів", "20 років досвіду"
 */
const EXPERIENCE_PATTERNS = [
  /\d+\+?\s*років/i, // "10+ років", "20 років"
  /\d+\+?\s*рок[іу]/i, // "5 років", "1 рік"
  /\d+\+?\s*пацієнт/i, // "5000+ пацієнтів"
  /\d+\+?\s*операц/i, // "1000+ операцій"
  /\d+\+?\s*years/i, // "10+ years"
  /\d+\+?\s*patients/i, // "5000+ patients"
  /досвід[у]?\s+\d+/i, // "досвіду 10", "досвід 20"
  /experience\s+\d+/i, // "experience 10"
  /більше\s+\d+/i, // "більше 10"
  /понад\s+\d+/i, // "понад 5000"
  /more\s+than\s+\d+/i, // "more than 10"
];

/**
 * Ukrainian address pattern
 * Matches "м. [City], вул." or similar patterns
 */
const ADDRESS_PATTERNS = [
  /м\.\s*[А-ЯІЇЄҐа-яіїєґ\w]+,?\s*вул\./i, // "м. Київ, вул."
  /м\.\s*[А-ЯІЇЄҐа-яіїєґ\w]+/i, // "м. Київ"
  /вул\.\s*[А-ЯІЇЄҐа-яіїєґ\w\s]+,?\s*\d+/i, // "вул. Хрещатик, 1"
  /ул\.\s*[А-Яа-я\w\s]+,?\s*\d+/i, // "ул. Крещатик, 1" (Russian)
  /г\.\s*[А-Яа-я\w]+/i, // "г. Киев" (Russian)
];

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Extract text content from HTML (removing scripts, styles, etc.)
 */
function extractTextContent($: CheerioAPI): string {
  // Clone to avoid modifying original
  const $clone = $.root().clone();

  // Remove script and style elements
  $clone.find('script, style, noscript').remove();

  // Get text content
  const text = $clone.find('body').text() || $clone.find('html').text();

  // Clean up whitespace
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Detect linked platforms from anchor tags
 * Scans all <a> tags and checks href for platform patterns
 */
function detectLinkedPlatforms($: CheerioAPI): string[] {
  const foundPlatforms = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';

    for (const [pattern, label] of Object.entries(PLATFORM_PATTERNS)) {
      if (href.includes(pattern)) {
        foundPlatforms.add(label);
      }
    }
  });

  return Array.from(foundPlatforms);
}

/**
 * Detect social media links from anchor tags
 */
function detectSocialLinks($: CheerioAPI): string[] {
  const foundSocial = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';

    for (const [pattern, label] of Object.entries(SOCIAL_PATTERNS)) {
      if (href.includes(pattern)) {
        foundSocial.add(label);
      }
    }
  });

  return Array.from(foundSocial);
}

/**
 * Count links to high-authority scientific domains
 */
function countScientificSources($: CheerioAPI): number {
  const foundDomains = new Set<string>();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';

    for (const domain of SCIENTIFIC_DOMAINS) {
      if (href.includes(domain)) {
        foundDomains.add(domain);
      }
    }
  });

  return foundDomains.size;
}

/**
 * Check for community/media mentions in text
 * Searches for conference, interview, media keywords
 */
function hasCommunityMentions($: CheerioAPI): boolean {
  const textContent = extractTextContent($);

  return COMMUNITY_KEYWORDS.some((keyword) =>
    textContent.includes(keyword.toLowerCase()),
  );
}

/**
 * Check for privacy policy link
 * Looks for links containing /privacy, /policy, /terms
 * or anchor text "Політика конфіденційності"
 */
function hasPrivacyPolicy($: CheerioAPI): boolean {
  let found = false;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    const text = $(element).text().toLowerCase().trim();

    // Check href patterns
    for (const pattern of PRIVACY_LINK_PATTERNS) {
      if (href.includes(pattern)) {
        found = true;
        return false; // Break loop
      }
    }

    // Check anchor text patterns
    for (const pattern of PRIVACY_TEXT_PATTERNS) {
      if (text.includes(pattern)) {
        found = true;
        return false; // Break loop
      }
    }
  });

  return found;
}

/**
 * Check for license/certification mentions in text content
 * Searches for "Ліцензія", "License", "Наказ МОЗ"
 */
function hasLicenses($: CheerioAPI): boolean {
  const textContent = extractTextContent($);

  return LICENSE_PATTERNS.some((pattern) =>
    textContent.includes(pattern.toLowerCase()),
  );
}

/**
 * Check for contact page link or tel: links
 */
function hasContactPage($: CheerioAPI): boolean {
  let found = false;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';

    // Check for contact page link
    if (href.includes('/contact') || href.includes('/контакт')) {
      found = true;
      return false; // Break loop
    }

    // Check for tel: link
    if (href.startsWith('tel:')) {
      found = true;
      return false; // Break loop
    }
  });

  return found;
}

/**
 * Extract phone number from tel: links
 */
function extractPhoneFromTel($: CheerioAPI): string | null {
  let phone: string | null = null;

  $('a[href^="tel:"]').each((_, element) => {
    const href = $(element).attr('href') || '';
    const phoneNumber = href.replace('tel:', '').trim();
    if (phoneNumber) {
      phone = phoneNumber;
      return false; // Break loop, take first one
    }
  });

  return phone;
}

/**
 * Check if address is present in text
 */
function hasAddressInText($: CheerioAPI): boolean {
  const textContent = extractTextContent($);

  return ADDRESS_PATTERNS.some((pattern) => pattern.test(textContent));
}

/**
 * Check NAP (Name, Address, Phone) presence
 * Returns true if both phone (from tel:) and address are present
 */
function checkNAPPresence($: CheerioAPI): boolean {
  const hasPhone = extractPhoneFromTel($) !== null;
  const hasAddress = hasAddressInText($);

  return hasPhone && hasAddress;
}

/**
 * Check for author/doctor credentials in text
 * Searches for patterns: "Лікар-", "Dr.", "Doctor", "к.м.н.", "MD"
 */
function hasAuthorCredentials($: CheerioAPI): boolean {
  const textContent = extractTextContent($);

  return AUTHOR_PATTERNS.some((pattern) =>
    textContent.includes(pattern.toLowerCase()),
  );
}

/**
 * Check for author/team page links
 * Looks for links to /doctors/ or /team/
 */
function hasAuthorBlocks($: CheerioAPI): boolean {
  let found = false;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';

    for (const pattern of AUTHOR_LINK_PATTERNS) {
      if (href.includes(pattern)) {
        found = true;
        return false; // Break loop
      }
    }
  });

  return found;
}

/**
 * Check for case study/portfolio links
 * Searches for navigation links containing case study patterns
 */
function hasCaseStudies($: CheerioAPI): boolean {
  let found = false;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href')?.toLowerCase() || '';
    const text = $(element).text().toLowerCase().trim();

    for (const pattern of CASE_STUDY_PATTERNS) {
      if (href.includes(pattern) || text.includes(pattern)) {
        found = true;
        return false; // Break loop
      }
    }
  });

  return found;
}

/**
 * Check for experience figures in text
 * Matches patterns like "10+ років", "5000+ пацієнтів"
 */
function hasExperienceFigures($: CheerioAPI): boolean {
  const textContent = extractTextContent($);

  return EXPERIENCE_PATTERNS.some((pattern) => pattern.test(textContent));
}

/**
 * Generate recommendations based on audit results
 */
function generateRecommendations(result: EEATAuditResult): EEATRecommendation[] {
  const recommendations: EEATRecommendation[] = [];

  // Reputation recommendations
  if (!result.reputation.linked_platforms.includes('Google Maps')) {
    recommendations.push({
      message: 'Add link to Google Maps profile for better local visibility and trust signals.',
      category: 'trust',
      severity: 'warning',
    });
  }

  if (result.reputation.linked_platforms.length === 0) {
    recommendations.push({
      message: 'Add links to external medical platforms (Doc.ua, Likarni, Helsi) to improve reputation signals.',
      category: 'trust',
      severity: 'info',
    });
  }

  // Social recommendations
  if (result.reputation.social_links.length === 0) {
    recommendations.push({
      message: 'Add social media links (Facebook, Instagram, YouTube) to improve online presence and trust.',
      category: 'trust',
      severity: 'info',
    });
  }

  // Trust recommendations
  if (!result.trust.has_privacy_policy) {
    recommendations.push({
      message: 'Add Privacy Policy page and link to it from footer. Required for GDPR compliance and trust.',
      category: 'trust',
      severity: 'critical',
    });
  }

  if (!result.trust.has_licenses) {
    recommendations.push({
      message: 'Display medical licenses and certifications (e.g., "Ліцензія", "Наказ МОЗ") prominently on the site.',
      category: 'trust',
      severity: 'critical',
    });
  }

  if (!result.trust.contact_page_found) {
    recommendations.push({
      message: 'Add a dedicated Contact page with phone number (tel: link) for better accessibility.',
      category: 'trust',
      severity: 'warning',
    });
  }

  if (!result.trust.nap_present) {
    recommendations.push({
      message: 'Ensure NAP (Name, Address, Phone) data is complete: add tel: link and physical address (м. [City], вул.).',
      category: 'trust',
      severity: 'warning',
    });
  }

  // Authority recommendations
  if (result.authority.scientific_sources_count === 0) {
    recommendations.push({
      message: 'Add links to scientific sources (PubMed, WHO, Cochrane) to demonstrate evidence-based practice.',
      category: 'authority',
      severity: 'warning',
    });
  } else if (result.authority.scientific_sources_count < 3) {
    recommendations.push({
      message: `Only ${result.authority.scientific_sources_count} scientific source(s) linked. Consider adding more references to authoritative medical literature.`,
      category: 'authority',
      severity: 'info',
    });
  }

  if (!result.authority.has_community_mentions) {
    recommendations.push({
      message: 'Add mentions of conferences, media appearances, or professional associations to demonstrate community involvement.',
      category: 'authority',
      severity: 'info',
    });
  }

  // Authorship recommendations
  if (!result.authorship.has_author_blocks) {
    recommendations.push({
      message: 'Add links to Doctor/Team pages (/doctors/, /team/) to showcase medical expertise.',
      category: 'expertise',
      severity: 'warning',
    });
  }

  if (!result.authorship.author_credentials_found) {
    recommendations.push({
      message: 'Include author credentials (Dr., MD, к.м.н.) in content to demonstrate expertise.',
      category: 'expertise',
      severity: 'info',
    });
  }

  // Experience recommendations
  if (!result.experience.has_case_studies) {
    recommendations.push({
      message: 'Add Case Studies or Before/After portfolio section to demonstrate real experience and results.',
      category: 'experience',
      severity: 'warning',
    });
  }

  if (!result.experience.experience_figures_found) {
    recommendations.push({
      message: 'Add specific experience metrics (e.g., "10+ років досвіду", "5000+ пацієнтів") to build credibility.',
      category: 'experience',
      severity: 'info',
    });
  }

  // Enhanced recommendations
  if (result.authorship.article_author?.is_article && !result.authorship.article_author.has_author_block) {
    recommendations.push({
      message: 'Add author block to article pages with author name and link to profile.',
      category: 'expertise',
      severity: 'warning',
    });
  }

  if (result.trust.legal_entity && !result.trust.legal_entity.has_registration_number) {
    recommendations.push({
      message: 'Display registration number (ЕДРПОУ) or tax ID for legal transparency.',
      category: 'trust',
      severity: 'info',
    });
  }

  if (!result.trust.about_us?.has_about_us_link) {
    recommendations.push({
      message: 'Add "About Us" page with clinic history, mission, and team information.',
      category: 'trust',
      severity: 'warning',
    });
  }

  if (result.trust.contact_block && !result.trust.contact_block.has_email) {
    recommendations.push({
      message: 'Add email contact information for better accessibility.',
      category: 'trust',
      severity: 'info',
    });
  }

  if (result.trust.contact_block && !result.trust.contact_block.has_booking_form) {
    recommendations.push({
      message: 'Add online booking form for patient convenience.',
      category: 'trust',
      severity: 'info',
    });
  }

  if (result.trust.contact_block && !result.trust.contact_block.has_map) {
    recommendations.push({
      message: 'Add embedded map (Google Maps) to show clinic location.',
      category: 'trust',
      severity: 'info',
    });
  }

  if (result.experience.case_study_structure && result.experience.case_study_structure.completeness_score < 70) {
    recommendations.push({
      message: `Case study structure completeness is ${result.experience.case_study_structure.completeness_score}%. Ensure all sections (complaint, diagnosis, treatment, result, timeline) are present.`,
      category: 'experience',
      severity: 'warning',
    });
  }

  if (result.experience.pii_compliance && !result.experience.pii_compliance.is_compliant) {
    recommendations.push({
      message: 'Ensure patient data is anonymized in case studies. Remove full names, addresses, and phone numbers of patients.',
      category: 'experience',
      severity: 'critical',
    });
  }

  if (result.authority.media_links && result.authority.media_links.length === 0) {
    recommendations.push({
      message: 'Add links to media mentions or articles about the clinic/doctors to demonstrate authority.',
      category: 'authority',
      severity: 'info',
    });
  }

  if (result.authority.publications && result.authority.publications.length === 0) {
    recommendations.push({
      message: 'Add links to journal publications or research papers to demonstrate expertise.',
      category: 'authority',
      severity: 'info',
    });
  }

  return recommendations;
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Analyze E-E-A-T signals from HTML content
 *
 * @param html - The HTML content to analyze
 * @param url - The URL of the page being analyzed
 * @returns E-E-A-T audit result conforming to EEATAuditResultSchema
 *
 * @example
 * ```ts
 * const result = await analyzeEEAT(htmlContent, 'https://clinic.example.com');
 * console.log(result.authorship.has_author_blocks);
 * console.log(result.reputation.linked_platforms); // ['Google Maps', 'Doc.ua']
 * console.log(result.authority.scientific_sources_count); // 3
 * ```
 */
export async function analyzeEEAT(
  html: string,
  url: string,
  options: {
    googleMapsApiKey?: string;
    googleBusinessApiKey?: string;
  } = {},
): Promise<EEATAuditResult> {
  const $ = load(html);

  // Extract NAP data early (needed for Google Maps API)
  const napData = extractNAPFromWebsite($);

  // 1. Reputation: Platform & Social Links
  const linkedPlatforms = detectLinkedPlatforms($);
  const socialLinks = detectSocialLinks($);

  // Fetch Google Maps rating if API key provided
  let googleMapsRating = undefined;
  let googleMapsUrl: string | null = null;
  if (options.googleMapsApiKey) {
    // Find Google Maps link on page
    $('a[href*="google.com/maps"], a[href*="maps.google"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !googleMapsUrl) {
        googleMapsUrl = href.startsWith('http') ? href : new URL(href, url).toString();
        return false; // Break
      }
    });

    if (googleMapsUrl) {
      // Build search query from NAP data or URL
      const searchQuery = napData.name
        ? `${napData.name}${napData.address ? `, ${napData.address}` : ''}`
        : null;

      googleMapsRating = await fetchGoogleMapsRatingFromUrl(
        googleMapsUrl,
        searchQuery,
        options.googleMapsApiKey,
      );
    }
  }

  // Calculate average rating
  let averageRating = undefined;
  const ratings: Array<{ rating: number; review_count: number }> = [];
  if (googleMapsRating?.fetched && googleMapsRating.rating) {
    ratings.push({
      rating: googleMapsRating.rating,
      review_count: googleMapsRating.review_count || 0,
    });
  }

  // Fetch other aggregator ratings
  const aggregatorRatings = [];
  for (const [pattern, label] of Object.entries(PLATFORM_PATTERNS)) {
    if (label !== 'Google Maps') {
      const link = $('a[href*="' + pattern + '"]').first().attr('href');
      if (link) {
        const fullLink = link.startsWith('http') ? link : new URL(link, url).toString();
        const ratingResult = await fetchAggregatorRating(fullLink, label);
        if (ratingResult.fetched) {
          aggregatorRatings.push(ratingResult);
          if (ratingResult.rating) {
            ratings.push({
              rating: ratingResult.rating,
              review_count: ratingResult.review_count || 0,
            });
          }
        }
      }
    }
  }

  if (ratings.length > 0) {
    const totalRatingWeight = ratings.reduce((sum, r) => sum + r.rating * (r.review_count || 1), 0);
    const totalReviews = ratings.reduce((sum, r) => sum + (r.review_count || 1), 0);
    averageRating = {
      average_rating: totalReviews > 0 ? totalRatingWeight / totalReviews : undefined,
      total_reviews: totalReviews,
      platforms_count: ratings.length,
    };
  }

  // 2. Trust & Transparency
  const privacyPolicy = hasPrivacyPolicy($);
  const licenses = hasLicenses($);
  const contactPage = hasContactPage($);
  const napPresent = checkNAPPresence($);

  // Enhanced Trust analysis
  const legalEntity = checkLegalEntity($);
  const aboutUs = checkAboutUsPage($, url);
  const contactBlock = checkContactBlock($);
  const departments = extractDepartments($, url);

  // Compare NAP with Google Business if API key provided
  let napComparison = undefined;
  if (options.googleBusinessApiKey && napData.name) {
    const googleBusinessNAP = await fetchGoogleBusinessNAPFromWebsite(
      napData,
      options.googleBusinessApiKey,
    );

    if (googleBusinessNAP) {
      napComparison = compareNAP(napData, googleBusinessNAP);
    }
  }

  // Privacy Policy content analysis
  let _privacyPolicyContent = null;
  const _gdprCompliance = checkGDPRCompliance($);
  if (privacyPolicy) {
    // Try to find privacy policy URL
    let privacyUrl: string | undefined;
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')?.toLowerCase() || '';
      if (href.includes('/privacy') || href.includes('/policy')) {
        const fullHref = $(element).attr('href') || '';
        privacyUrl = fullHref.startsWith('http') ? fullHref : new URL(fullHref, url).toString();
        return false; // Break
      }
    });
    if (privacyUrl) {
      _privacyPolicyContent = await analyzePrivacyPolicyContent(privacyUrl);
    }
  }

  // License analysis
  const _licenseImages = checkLicenseImages($, url);
  const _licenseSection = checkLicenseSection($, url);
  const _accreditations = checkAccreditations($, url);

  // 3. Authority: Scientific Sources & Community
  const scientificSourcesCount = countScientificSources($);
  const communityMentions = hasCommunityMentions($);

  // Enhanced Authority analysis
  const mediaLinks = checkMediaLinks($, url);
  const publications = checkJournalPublications($, url);
  const associationMemberships = checkAssociationMembershipDetailed($, url);

  // 4. Authorship & Expertise
  const authorBlocks = hasAuthorBlocks($);
  const authorCredentials = hasAuthorCredentials($);

  // Enhanced Authorship analysis
  const articleAuthor = extractArticleAuthor($);
  let authorProfile = undefined;
  // Check if this is an author profile page
  if (url.includes('/doctors/') || url.includes('/team/') || url.includes('/author/')) {
    authorProfile = analyzeAuthorProfile($);
  }

  // If author profile exists, update is_medical_author based on profile qualifications
  if (authorProfile && articleAuthor.is_article && !articleAuthor.is_medical_author) {
    if (authorProfile.has_qualifications) {
      articleAuthor.is_medical_author = true;
    }
  }

  // Doctor expertise analysis
  let _doctorCredentials = undefined;
  if (url.includes('/doctors/') || url.includes('/team/')) {
    _doctorCredentials = checkDoctorCredentials($);
  }

  // 5. Experience: Cases & Figures
  const caseStudies = hasCaseStudies($);
  const experienceFigures = hasExperienceFigures($);

  // Enhanced Experience analysis
  let caseStudyStructure = undefined;
  let piiCompliance = undefined;
  if (caseStudies) {
    // Check if current page is a case study
    const isCaseStudyPage =
      url.toLowerCase().includes('case') ||
      url.toLowerCase().includes('result') ||
      url.toLowerCase().includes('roboti') ||
      url.toLowerCase().includes('до-та-після');
    if (isCaseStudyPage) {
      caseStudyStructure = analyzeCaseStudyStructure($);
      piiCompliance = checkPIICompliance($);
    }
  }

  // Build result object
  const result: EEATAuditResult = {
    authorship: {
      has_author_blocks: authorBlocks,
      author_credentials_found: authorCredentials,
      article_author: articleAuthor.is_article ? articleAuthor : undefined,
      author_profile: authorProfile,
    },
    trust: {
      has_privacy_policy: privacyPolicy,
      has_licenses: licenses,
      contact_page_found: contactPage,
      nap_present: napPresent,
      nap_data: napData.name || napData.address || napData.phone ? napData : undefined,
      nap_comparison: napComparison,
      legal_entity: legalEntity.has_legal_entity_name ? legalEntity : undefined,
      about_us: aboutUs.has_about_us_link ? aboutUs : undefined,
      contact_block: contactBlock.has_email || contactBlock.has_booking_form || contactBlock.has_map
        ? contactBlock
        : undefined,
      departments: departments.length > 0 ? departments : undefined,
    },
    authority: {
      scientific_sources_count: scientificSourcesCount,
      has_community_mentions: communityMentions,
      media_links: mediaLinks.length > 0 ? mediaLinks : undefined,
      publications: publications.length > 0 ? publications : undefined,
      association_memberships: associationMemberships.length > 0 ? associationMemberships : undefined,
    },
    reputation: {
      linked_platforms: linkedPlatforms,
      social_links: socialLinks,
      google_maps_rating: googleMapsRating,
      aggregator_ratings: aggregatorRatings.length > 0 ? aggregatorRatings : undefined,
      average_rating: averageRating,
    },
    experience: {
      has_case_studies: caseStudies,
      experience_figures_found: experienceFigures,
      case_study_structure: caseStudyStructure,
      pii_compliance: piiCompliance,
    },
    recommendations: [],
    analysis_scope: 'single_page',
  };

  // Generate recommendations based on findings
  result.recommendations = generateRecommendations(result);

  // Validate and return
  return EEATAuditResultSchema.parse(result);
}

/**
 * Analyze multiple pages and aggregate results
 *
 * @param urls - Array of URLs to analyze
 * @param options - Options for analysis
 * @returns Aggregated E-E-A-T audit result with metrics
 *
 * @example
 * ```ts
 * const urls = ['https://clinic.com/blog/article1', 'https://clinic.com/blog/article2'];
 * const result = await analyzeMultiplePages(urls);
 * console.log(result.authorship.metrics?.blog_pages_with_author_percent); // 100
 * ```
 */
export async function analyzeMultiplePages(
  urls: string[],
  options: {
    maxConcurrent?: number;
    timeout?: number;
    googleMapsApiKey?: string;
    googleBusinessApiKey?: string;
  } = {},
): Promise<EEATAuditResult> {
  const { maxConcurrent = 5, timeout = 30000 } = options;

  // Analyze pages with concurrency limit
  const results: EEATAuditResult[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (url) => {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EEATAuditBot/1.0)',
          },
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const result = await analyzeEEAT(html, url, {
          googleMapsApiKey: options.googleMapsApiKey,
          googleBusinessApiKey: options.googleBusinessApiKey,
        });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ url, error: errorMessage });
        console.warn(`[EEATAudit] Failed to analyze ${url}:`, errorMessage);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is EEATAuditResult => r !== null));
  }

  if (results.length === 0) {
    throw new Error('No pages could be analyzed. All requests failed.');
  }

  // Aggregate metrics
  const aggregatedMetrics = aggregateMetrics(results);

  // Use the first result as base and merge aggregated metrics
  const baseResult = results[0];

  if (!baseResult) {
    throw new Error('No results available for aggregation');
  }

  // Merge all results to get comprehensive data
  const mergedResult: EEATAuditResult = {
    ...baseResult,
    authorship: {
      ...baseResult.authorship,
      metrics: aggregatedMetrics.authorMetrics,
    },
    authority: {
      ...baseResult.authority,
      scientific_metrics: aggregatedMetrics.scientificMetrics,
    },
    recommendations: [],
    analyzed_pages_count: results.length,
    total_pages_discovered: results.length,
    analysis_scope: 'multi_page',
    multi_page_metrics: {
      doctor_expertise_metrics: aggregatedMetrics.doctorMetrics,
    },
  };

  // Generate recommendations based on aggregated results
  mergedResult.recommendations = generateRecommendations(mergedResult);

  // Add recommendations based on metrics
  if (aggregatedMetrics.authorMetrics.blog_pages_with_author_percent < 80) {
    mergedResult.recommendations.push({
      message: `Only ${aggregatedMetrics.authorMetrics.blog_pages_with_author_percent}% of blog pages have authors. Aim for 100% to meet E-E-A-T requirements.`,
      category: 'expertise',
      severity: 'warning',
    });
  }

  if (aggregatedMetrics.authorMetrics.authors_with_credentials_percent < 80) {
    mergedResult.recommendations.push({
      message: `Only ${aggregatedMetrics.authorMetrics.authors_with_credentials_percent}% of authors have verified credentials. Add qualifications (Dr., MD, к.м.н.) to all author profiles.`,
      category: 'expertise',
      severity: 'warning',
    });
  }

  if (
    aggregatedMetrics.scientificMetrics &&
    aggregatedMetrics.scientificMetrics.articles_with_sources_percent !== undefined &&
    aggregatedMetrics.scientificMetrics.articles_with_sources_percent < 70
  ) {
    mergedResult.recommendations.push({
      message: `Only ${aggregatedMetrics.scientificMetrics.articles_with_sources_percent}% of articles have scientific source links. Add references to PubMed, WHO, or Cochrane for evidence-based content.`,
      category: 'authority',
      severity: 'warning',
    });
  }

  // Validate and return
  return EEATAuditResultSchema.parse(mergedResult);
}

/**
 * Analyze E-E-A-T signals with automatic page discovery
 *
 * @param baseUrl - The base URL to start analysis from
 * @param options - Options for page discovery and analysis
 * @returns Aggregated E-E-A-T audit result with metrics
 *
 * @example
 * ```ts
 * const result = await analyzeEEATWithDiscovery('https://clinic.com', {
 *   filterType: 'blog',
 *   maxPages: 20
 * });
 * ```
 */
export async function analyzeEEATWithDiscovery(
  baseUrl: string,
  options: {
    useSitemap?: boolean;
    useRobots?: boolean;
    crawlInternalLinks?: boolean;
    maxPages?: number;
    filterType?: 'blog' | 'doctors' | 'articles' | 'all';
    maxConcurrent?: number;
    googleMapsApiKey?: string;
    googleBusinessApiKey?: string;
  } = {},
): Promise<EEATAuditResult> {
  const {
    useSitemap = true,
    useRobots = true,
    crawlInternalLinks = false,
    maxPages = 50,
    filterType = 'all',
    maxConcurrent = 5,
  } = options;

  // Discover pages
  console.log(`[EEATAudit] Discovering pages from ${baseUrl}...`);
  const discoveredUrls = await discoverPages(baseUrl, {
    useSitemap,
    useRobots,
    crawlInternalLinks,
    maxPages,
    filterType,
  });

  if (discoveredUrls.length === 0) {
    throw new Error('No pages discovered. Check sitemap.xml or robots.txt.');
  }

  console.log(`[EEATAudit] Found ${discoveredUrls.length} pages. Starting analysis...`);

  // Analyze all discovered pages
  return analyzeMultiplePages(discoveredUrls, {
    maxConcurrent,
    googleMapsApiKey: options.googleMapsApiKey,
    googleBusinessApiKey: options.googleBusinessApiKey,
  });
}
