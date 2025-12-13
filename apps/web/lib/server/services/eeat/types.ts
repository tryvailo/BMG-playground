/**
 * E-E-A-T Audit Types and Schemas
 *
 * This file defines the Zod schemas for E-E-A-T (Experience, Expertise,
 * Authoritativeness, Trustworthiness) audit results.
 *
 * IMPORTANT: "No Mock Data" policy - all schema fields represent
 * real on-page signals detected from HTML content.
 *
 * It is intentionally NOT a 'use server' file to allow
 * type imports in both server and client contexts.
 */

import { z } from 'zod';

/**
 * Article author information schema
 */
export const ArticleAuthorInfoSchema = z.object({
  /** Whether the page is identified as an article */
  is_article: z.boolean(),
  /** Whether author block is present */
  has_author_block: z.boolean(),
  /** Author name if found */
  author_name: z.string().optional(),
  /** Whether link to author profile exists */
  has_author_profile_link: z.boolean(),
  /** Author profile URL if found */
  author_profile_url: z.string().optional(),
});

/**
 * Author profile information schema
 */
export const AuthorProfileInfoSchema = z.object({
  /** Whether qualifications are found (Dr., MD, к.м.н., PhD) */
  has_qualifications: z.boolean(),
  /** Whether position/title is found */
  has_position: z.boolean(),
  /** Whether years of experience are mentioned */
  has_experience_years: z.boolean(),
  /** Whether links to diplomas/certificates exist */
  has_credentials_links: z.boolean(),
});

/**
 * Author metrics schema (aggregated)
 */
export const AuthorMetricsSchema = z.object({
  /** Percentage of blog pages with author */
  blog_pages_with_author_percent: z.number().min(0).max(100),
  /** Percentage of authors with verified credentials */
  authors_with_credentials_percent: z.number().min(0).max(100),
  /** Total articles analyzed */
  total_articles: z.number().int().nonnegative(),
  /** Articles with authors */
  articles_with_author: z.number().int().nonnegative(),
});

/**
 * Authorship signals schema
 * Detects author-related E-E-A-T signals on the page
 */
const AuthorshipSchema = z.object({
  /** Whether author blocks/bylines are present on the page */
  has_author_blocks: z.boolean(),
  /** Whether author credentials (education, certifications) are found */
  author_credentials_found: z.boolean(),
  /** Article author information (if page is an article) */
  article_author: ArticleAuthorInfoSchema.optional(),
  /** Author profile information (if author profile page) */
  author_profile: AuthorProfileInfoSchema.optional(),
  /** Aggregated author metrics (for multi-page analysis) */
  metrics: AuthorMetricsSchema.optional(),
});

/**
 * NAP (Name, Address, Phone) data schema
 */
export const NAPDataSchema = z.object({
  /** Clinic/company name */
  name: z.string().optional(),
  /** Physical address */
  address: z.string().optional(),
  /** Phone number */
  phone: z.string().optional(),
});

/**
 * NAP comparison schema
 */
export const NAPComparisonSchema = z.object({
  /** Website NAP data */
  website: NAPDataSchema,
  /** Google Business NAP data (if available) */
  google_business: NAPDataSchema.optional(),
  /** Percentage of NAP matches */
  match_percent: z.number().min(0).max(100).optional(),
  /** Whether name matches */
  name_matches: z.boolean().optional(),
  /** Whether address matches */
  address_matches: z.boolean().optional(),
  /** Whether phone matches */
  phone_matches: z.boolean().optional(),
});

/**
 * Legal entity information schema
 */
export const LegalEntityInfoSchema = z.object({
  /** Whether legal entity name is found */
  has_legal_entity_name: z.boolean(),
  /** Legal entity name if found */
  legal_entity_name: z.string().optional(),
  /** Whether registration number is found (ЕДРПОУ, tax ID) */
  has_registration_number: z.boolean(),
});

/**
 * About Us page information schema
 */
export const AboutUsInfoSchema = z.object({
  /** Whether About Us page link exists */
  has_about_us_link: z.boolean(),
  /** About Us page URL if found */
  about_us_url: z.string().optional(),
  /** Whether page contains clinic history */
  has_clinic_history: z.boolean(),
  /** Whether page contains mission/values */
  has_mission_values: z.boolean(),
  /** Whether page contains team information */
  has_team_info: z.boolean(),
});

/**
 * Contact block information schema
 */
export const ContactBlockInfoSchema = z.object({
  /** Whether email is present */
  has_email: z.boolean(),
  /** Email address if found */
  email: z.string().optional(),
  /** Whether booking form exists */
  has_booking_form: z.boolean(),
  /** Whether map is embedded */
  has_map: z.boolean(),
});

/**
 * Department information schema
 */
export const DepartmentInfoSchema = z.object({
  /** Department name */
  name: z.string(),
  /** Department URL if found */
  url: z.string().optional(),
});

/**
 * Trust signals schema
 * Detects trust-related indicators on the page
 */
const TrustSchema = z.object({
  /** Whether a privacy policy link is present */
  has_privacy_policy: z.boolean(),
  /** Whether licenses/certifications are displayed */
  has_licenses: z.boolean(),
  /** Whether a contact page link is found */
  contact_page_found: z.boolean(),
  /** Whether NAP (Name, Address, Phone) data is present */
  nap_present: z.boolean(),
  /** Extracted NAP data */
  nap_data: NAPDataSchema.optional(),
  /** NAP comparison with external sources */
  nap_comparison: NAPComparisonSchema.optional(),
  /** Legal entity information */
  legal_entity: LegalEntityInfoSchema.optional(),
  /** About Us page information */
  about_us: AboutUsInfoSchema.optional(),
  /** Contact block information */
  contact_block: ContactBlockInfoSchema.optional(),
  /** List of departments */
  departments: z.array(DepartmentInfoSchema).optional(),
});

/**
 * Media link information schema
 */
export const MediaLinkInfoSchema = z.object({
  /** Media source URL */
  url: z.string(),
  /** Media source name/label */
  name: z.string().optional(),
  /** Whether source is authoritative medical media */
  is_authoritative: z.boolean(),
});

/**
 * Publication information schema
 */
export const PublicationInfoSchema = z.object({
  /** Publication title or journal name */
  title: z.string().optional(),
  /** Publication URL or DOI */
  url: z.string().optional(),
  /** Whether DOI is present */
  has_doi: z.boolean(),
});

/**
 * Association membership information schema
 */
export const AssociationMembershipInfoSchema = z.object({
  /** Association name */
  name: z.string(),
  /** Association URL if found */
  url: z.string().optional(),
  /** Whether membership is verified (has link/logo) */
  is_verified: z.boolean(),
});

/**
 * Scientific sources metrics schema
 */
export const ScientificSourcesMetricsSchema = z.object({
  /** Percentage of articles with scientific source links */
  articles_with_sources_percent: z.number().min(0).max(100).optional(),
  /** Total articles analyzed */
  total_articles: z.number().int().nonnegative().optional(),
  /** Articles with sources */
  articles_with_sources: z.number().int().nonnegative().optional(),
});

/**
 * Authority signals schema
 * Detects authority and scientific credibility indicators
 */
const AuthoritySchema = z.object({
  /** Count of links to high-authority scientific domains */
  scientific_sources_count: z.number().int().nonnegative(),
  /** Whether community/media mentions are found (conferences, interviews, etc.) */
  has_community_mentions: z.boolean(),
  /** Media links found */
  media_links: z.array(MediaLinkInfoSchema).optional(),
  /** Journal publications found */
  publications: z.array(PublicationInfoSchema).optional(),
  /** Association memberships found */
  association_memberships: z.array(AssociationMembershipInfoSchema).optional(),
  /** Scientific sources metrics (for multi-page analysis) */
  scientific_metrics: ScientificSourcesMetricsSchema.optional(),
});

/**
 * Google Maps rating information schema
 */
export const GoogleMapsRatingSchema = z.object({
  /** Average star rating (0-5) */
  rating: z.number().min(0).max(5).optional(),
  /** Total number of reviews */
  review_count: z.number().int().nonnegative().optional(),
  /** Place ID from Google Maps */
  place_id: z.string().optional(),
  /** Whether rating data was successfully fetched */
  fetched: z.boolean(),
});

/**
 * Aggregator rating information schema
 */
export const AggregatorRatingSchema = z.object({
  /** Platform name (e.g., 'Doc.ua', 'Likarni') */
  platform: z.string(),
  /** Average rating */
  rating: z.number().min(0).max(5).optional(),
  /** Review count */
  review_count: z.number().int().nonnegative().optional(),
  /** Whether rating was successfully fetched */
  fetched: z.boolean(),
});

/**
 * Average rating calculation schema
 */
export const AverageRatingSchema = z.object({
  /** Average rating across all platforms */
  average_rating: z.number().min(0).max(5).optional(),
  /** Total review count */
  total_reviews: z.number().int().nonnegative().optional(),
  /** Number of platforms with ratings */
  platforms_count: z.number().int().nonnegative(),
});

/**
 * Reputation signals schema
 * Detects external reputation indicators
 */
const ReputationSchema = z.object({
  /** External platforms linked from the page (e.g., 'Google Maps', 'Doc.ua', 'Likarni') */
  linked_platforms: z.array(z.string()),
  /** Social media platforms linked (e.g., 'Instagram', 'Facebook') */
  social_links: z.array(z.string()),
  /** Google Maps rating information (if API key provided) */
  google_maps_rating: GoogleMapsRatingSchema.optional(),
  /** Aggregator ratings (if available) */
  aggregator_ratings: z.array(AggregatorRatingSchema).optional(),
  /** Average rating across all platforms */
  average_rating: AverageRatingSchema.optional(),
});

/**
 * Case study structure schema
 */
export const CaseStudyStructureSchema = z.object({
  /** Whether complaint/symptoms section exists */
  has_complaint: z.boolean(),
  /** Whether diagnosis section exists */
  has_diagnosis: z.boolean(),
  /** Whether treatment section exists */
  has_treatment: z.boolean(),
  /** Whether result section exists */
  has_result: z.boolean(),
  /** Whether timeline is present */
  has_timeline: z.boolean(),
  /** Whether metrics (before/after) are present */
  has_metrics: z.boolean(),
  /** Whether doctor commentary exists */
  has_doctor_commentary: z.boolean(),
  /** Structure completeness score (0-100) */
  completeness_score: z.number().min(0).max(100),
});

/**
 * Case studies by specialty schema
 */
export const CaseStudiesBySpecialtySchema = z.object({
  /** Specialty name */
  specialty: z.string(),
  /** Number of case studies for this specialty */
  count: z.number().int().nonnegative(),
});

/**
 * PII compliance information schema
 */
export const PIIComplianceInfoSchema = z.object({
  /** Whether PII data is absent (compliant) */
  is_compliant: z.boolean(),
  /** Whether patient names are anonymized */
  names_anonymized: z.boolean(),
  /** Whether addresses are absent */
  addresses_absent: z.boolean(),
  /** Whether phone numbers are absent */
  phones_absent: z.boolean(),
});

/**
 * Experience signals schema
 * Detects experience-related content on the page
 */
const ExperienceSchema = z.object({
  /** Whether case studies or patient stories are present */
  has_case_studies: z.boolean(),
  /** Whether specific experience figures are found (e.g., "10+ років", "5000+ пацієнтів") */
  experience_figures_found: z.boolean(),
  /** Case study structure analysis */
  case_study_structure: CaseStudyStructureSchema.optional(),
  /** Case studies by specialty */
  case_studies_by_specialty: z.array(CaseStudiesBySpecialtySchema).optional(),
  /** PII compliance information */
  pii_compliance: PIIComplianceInfoSchema.optional(),
});

/**
 * E-E-A-T Audit Result Schema
 * Main schema for E-E-A-T audit results based on real on-page signals
 */
/**
 * Doctor credentials information schema
 */
export const DoctorCredentialsInfoSchema = z.object({
  /** Whether diplomas are found (links/images) */
  has_diplomas: z.boolean(),
  /** Whether certificates are found */
  has_certificates: z.boolean(),
  /** Whether association memberships are mentioned */
  has_association_memberships: z.boolean(),
  /** Whether continuing education courses are mentioned */
  has_continuing_education: z.boolean(),
  /** Diploma/certificate links found */
  credential_links: z.array(z.string()).optional(),
});

/**
 * Doctor expertise metrics schema
 */
export const DoctorExpertiseMetricsSchema = z.object({
  /** Percentage of doctor pages with credentials */
  doctor_pages_with_credentials_percent: z.number().min(0).max(100).optional(),
  /** Total doctor pages analyzed */
  total_doctor_pages: z.number().int().nonnegative().optional(),
  /** Doctor pages with credentials */
  doctor_pages_with_credentials: z.number().int().nonnegative().optional(),
});

export const EEATAuditResultSchema = z.object({
  authorship: AuthorshipSchema,
  trust: TrustSchema,
  authority: AuthoritySchema,
  reputation: ReputationSchema,
  experience: ExperienceSchema,
  recommendations: z.array(z.string()),
  // Multi-page analysis metadata
  analyzed_pages_count: z.number().int().nonnegative().optional(),
  total_pages_discovered: z.number().int().nonnegative().optional(),
  analysis_scope: z.enum(['single_page', 'multi_page']).optional(),
  multi_page_metrics: z.object({
    doctor_expertise_metrics: DoctorExpertiseMetricsSchema.optional(),
  }).optional(),
});

/**
 * License image information schema
 */
export const LicenseImageInfoSchema = z.object({
  /** License image/document URL */
  url: z.string(),
  /** License type or description */
  description: z.string().optional(),
});

/**
 * License section information schema
 */
export const LicenseSectionInfoSchema = z.object({
  /** Whether dedicated license section exists */
  has_license_section: z.boolean(),
  /** License section URL if found */
  license_section_url: z.string().optional(),
  /** Whether section has structured list of licenses */
  has_structured_list: z.boolean(),
});

/**
 * Accreditation information schema
 */
export const AccreditationInfoSchema = z.object({
  /** Accreditation name or type */
  name: z.string(),
  /** Accreditation document URL if found */
  url: z.string().optional(),
});

/**
 * Privacy policy content schema
 */
export const PrivacyPolicyContentSchema = z.object({
  /** Whether medical data processing is described */
  has_medical_data_processing: z.boolean(),
  /** Whether GDPR consent is mentioned */
  has_gdpr_consent: z.boolean(),
  /** Whether user rights are described */
  has_user_rights: z.boolean(),
  /** Whether contact for questions is provided */
  has_contact_info: z.boolean(),
});

/**
 * GDPR compliance information schema
 */
export const GDPRComplianceInfoSchema = z.object({
  /** Whether cookie banner exists */
  has_cookie_banner: z.boolean(),
  /** Whether consent form exists */
  has_consent_form: z.boolean(),
  /** Whether privacy policy link is in form */
  has_privacy_link_in_form: z.boolean(),
});

/**
 * Type inference from Zod schema
 */
export type EEATAuditResult = z.infer<typeof EEATAuditResultSchema>;
export type Authorship = z.infer<typeof AuthorshipSchema>;
export type Trust = z.infer<typeof TrustSchema>;
export type Authority = z.infer<typeof AuthoritySchema>;
export type Reputation = z.infer<typeof ReputationSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;

// Additional type exports
export type ArticleAuthorInfo = z.infer<typeof ArticleAuthorInfoSchema>;
export type AuthorProfileInfo = z.infer<typeof AuthorProfileInfoSchema>;
export type AuthorMetrics = z.infer<typeof AuthorMetricsSchema>;
export type NAPData = z.infer<typeof NAPDataSchema>;
export type NAPComparison = z.infer<typeof NAPComparisonSchema>;
export type LegalEntityInfo = z.infer<typeof LegalEntityInfoSchema>;
export type AboutUsInfo = z.infer<typeof AboutUsInfoSchema>;
export type ContactBlockInfo = z.infer<typeof ContactBlockInfoSchema>;
export type DepartmentInfo = z.infer<typeof DepartmentInfoSchema>;
export type MediaLinkInfo = z.infer<typeof MediaLinkInfoSchema>;
export type PublicationInfo = z.infer<typeof PublicationInfoSchema>;
export type AssociationMembershipInfo = z.infer<typeof AssociationMembershipInfoSchema>;
export type ScientificSourcesMetrics = z.infer<typeof ScientificSourcesMetricsSchema>;
export type CaseStudyStructure = z.infer<typeof CaseStudyStructureSchema>;
export type CaseStudiesBySpecialty = z.infer<typeof CaseStudiesBySpecialtySchema>;
export type PIIComplianceInfo = z.infer<typeof PIIComplianceInfoSchema>;
export type DoctorCredentialsInfo = z.infer<typeof DoctorCredentialsInfoSchema>;
export type DoctorExpertiseMetrics = z.infer<typeof DoctorExpertiseMetricsSchema>;
export type LicenseImageInfo = z.infer<typeof LicenseImageInfoSchema>;
export type LicenseSectionInfo = z.infer<typeof LicenseSectionInfoSchema>;
export type AccreditationInfo = z.infer<typeof AccreditationInfoSchema>;
export type PrivacyPolicyContent = z.infer<typeof PrivacyPolicyContentSchema>;
export type GDPRComplianceInfo = z.infer<typeof GDPRComplianceInfoSchema>;
export type GoogleMapsRating = z.infer<typeof GoogleMapsRatingSchema>;
export type AggregatorRating = z.infer<typeof AggregatorRatingSchema>;
export type AverageRating = z.infer<typeof AverageRatingSchema>;
