/**
 * Local Indicators Audit Types and Schemas
 * 
 * This file defines the Zod schemas for Local Indicators audit results.
 * Local Indicators measure how well a medical clinic is optimized for local search
 * and local business presence.
 * 
 * It is intentionally NOT a 'use server' file to allow
 * type imports in both server and client contexts.
 */

import { z } from 'zod';

/**
 * Google Business Profile (Completeness) Schema
 * Measures the degree to which all available fields in the Google Business Profile are filled
 */
const GoogleBusinessProfileSchema = z.object({
  /** Whether GBP data is available (has Place ID and API key) */
  data_available: z.boolean().optional(),
  /** Reason why data is not available */
  data_unavailable_reason: z.string().optional(),
  /** Percentage of filled profile fields (mandatory + optional) */
  completeness_percent: z.number().min(0).max(100),
  /** Number of filled fields */
  filled_fields_count: z.number().int().nonnegative(),
  /** Total number of available fields */
  total_fields_count: z.number().int().nonnegative(),
  /** Total number of photos */
  photos_count: z.number().int().nonnegative(),
  /** Number of high-quality photos (minimum 10-15 recommended) */
  high_quality_photos_count: z.number().int().nonnegative(),
  /** Whether exterior photos are present */
  has_exterior_photos: z.boolean(),
  /** Whether interior photos are present */
  has_interior_photos: z.boolean(),
  /** Whether team photos are present */
  has_team_photos: z.boolean(),
  /** Whether equipment photos are present */
  has_equipment_photos: z.boolean(),
  /** Number of active services/categories listed */
  services_count: z.number().int().nonnegative(),
  /** Number of categories */
  categories_count: z.number().int().nonnegative(),
  /** Whether description is present */
  has_description: z.boolean(),
  /** Whether business hours are set */
  has_business_hours: z.boolean(),
  /** Whether business hours are set for every day */
  has_all_days_hours: z.boolean(),
  /** Number of attributes (minimum 15 recommended) */
  attributes_count: z.number().int().nonnegative(),
  /** Whether Q&A section exists */
  has_qa: z.boolean(),
  /** Total number of posts */
  posts_count: z.number().int().nonnegative(),
  /** Average posts per month (minimum 1 per month recommended) */
  posts_per_month: z.number().nonnegative(),
  /** Date of last post (ISO string) */
  last_post_date: z.string().optional(),
});

/**
 * Review Response Platform Schema
 * Response metrics for a specific platform
 */
const ReviewResponsePlatformSchema = z.object({
  /** Platform name */
  platform: z.enum(['google', 'doc_ua', 'helsi']),
  /** Total reviews on this platform */
  total_reviews: z.number().int().nonnegative(),
  /** Number of reviews that received a response */
  responded_reviews: z.number().int().nonnegative(),
  /** Response rate percentage */
  response_rate_percent: z.number().min(0).max(100),
});

/**
 * Review Response Rate & Quality Schema
 * Measures the speed and quality of clinic's responses to reviews
 */
const ReviewResponseSchema = z.object({
  /** Whether review data is available */
  data_available: z.boolean().optional(),
  /** Reason why data is not available */
  data_unavailable_reason: z.string().optional(),
  /** Total number of reviews across all platforms */
  total_reviews: z.number().int().nonnegative(),
  /** Number of reviews that received a response */
  responded_reviews: z.number().int().nonnegative(),
  /** Overall response rate percentage */
  response_rate_percent: z.number().min(0).max(100),
  /** Number of reviews responded to within 24 hours */
  responded_within_24h: z.number().int().nonnegative(),
  /** Response rate for reviews answered within 24 hours */
  response_rate_24h_percent: z.number().min(0).max(100),
  /** Average response time in hours */
  average_response_time_hours: z.number().nonnegative().optional(),
  /** Number of negative reviews */
  negative_reviews_count: z.number().int().nonnegative(),
  /** Number of negative reviews that received a response */
  negative_reviews_responded: z.number().int().nonnegative(),
  /** Response rate for negative reviews */
  negative_response_rate_percent: z.number().min(0).max(100),
  /** Metrics per platform */
  platforms: z.array(ReviewResponsePlatformSchema),
});

/**
 * Google Business Profile Engagement Schema
 * Measures profile visibility and user actions
 */
const GBPEngagementSchema = z.object({
  /** Whether engagement data is available */
  data_available: z.boolean().optional(),
  /** Reason why data is not available */
  data_unavailable_reason: z.string().optional(),
  /** Total impressions per month (Search + Maps) */
  impressions_per_month: z.number().int().nonnegative(),
  /** Website clicks per month */
  website_clicks_per_month: z.number().int().nonnegative(),
  /** Phone calls per month */
  calls_per_month: z.number().int().nonnegative(),
  /** Direction requests per month */
  direction_requests_per_month: z.number().int().nonnegative(),
  /** Photo views per month (optional) */
  photo_views_per_month: z.number().int().nonnegative().optional(),
  /** Bookings per month (optional) */
  bookings_per_month: z.number().int().nonnegative().optional(),
  /** Total actions per month (sum of all actions) */
  total_actions_per_month: z.number().int().nonnegative(),
  /** Click-Through Rate (CTR) percentage */
  ctr_percent: z.number().min(0).max(100),
  /** Impressions from Search */
  search_impressions: z.number().int().nonnegative(),
  /** Impressions from Maps */
  maps_impressions: z.number().int().nonnegative(),
});

/**
 * Local Backlink Schema
 * Information about a single backlink
 */
const LocalBacklinkSchema = z.object({
  /** Domain of the linking site */
  domain: z.string(),
  /** Full URL of the backlink */
  url: z.string(),
  /** Anchor text (if available) */
  anchor_text: z.string().optional(),
  /** Whether this is a local domain */
  is_local: z.boolean(),
  /** Type of backlink source */
  type: z.enum(['city_portal', 'news', 'partner', 'association', 'charity', 'blogger', 'other']),
});

/**
 * Local Backlinks by Type Schema
 * Breakdown of backlinks by source type
 */
const LocalBacklinksByTypeSchema = z.object({
  /** Links from city portals */
  city_portals: z.number().int().nonnegative(),
  /** Links from news sites */
  news_sites: z.number().int().nonnegative(),
  /** Links from partners */
  partners: z.number().int().nonnegative(),
  /** Links from medical associations */
  medical_associations: z.number().int().nonnegative(),
  /** Links from charity foundations */
  charity_foundations: z.number().int().nonnegative(),
  /** Links from local bloggers */
  local_bloggers: z.number().int().nonnegative(),
});

/**
 * Local Backlinks Schema
 * Measures links from local sources
 */
const LocalBacklinksSchema = z.object({
  /** Whether backlinks data is available */
  data_available: z.boolean().optional(),
  /** Reason why data is not available */
  data_unavailable_reason: z.string().optional(),
  /** Total number of local backlinks */
  total_local_backlinks: z.number().int().nonnegative(),
  /** Number of unique local domains linking to the clinic */
  unique_local_domains: z.number().int().nonnegative(),
  /** City where the clinic is located */
  city: z.string().optional(),
  /** Breakdown of backlinks by type */
  backlinks_by_type: LocalBacklinksByTypeSchema,
  /** Array of individual backlinks */
  backlinks: z.array(LocalBacklinkSchema),
});

/**
 * Social Media Profile Schema
 * Information about a social media profile
 */
const SocialMediaProfileSchema = z.object({
  /** Whether profile exists */
  has_profile: z.boolean(),
  /** Whether profile has correct NAP (Name, Address, Phone) */
  has_correct_nap: z.boolean(),
  /** Whether profile has geotags */
  has_geotags: z.boolean(),
  /** Whether profile mentions the city/district */
  has_city_mentions: z.boolean(),
  /** Number of posts about local events */
  posts_about_local_events: z.number().int().nonnegative(),
  /** Whether there is interaction with local audience */
  interaction_with_local_audience: z.boolean(),
  /** Profile URL (if found) */
  profile_url: z.string().optional(),
});

/**
 * Local Social Media Activity Schema
 * Measures active clinic profiles on social media
 */
const LocalSocialMediaSchema = z.object({
  /** Facebook profile information */
  facebook: SocialMediaProfileSchema,
  /** Instagram profile information */
  instagram: SocialMediaProfileSchema,
});

/**
 * Local Business Schema Schema
 * Measures LocalBusiness schema markup implementation
 */
const LocalBusinessSchemaSchema = z.object({
  /** Whether LocalBusiness schema is implemented */
  is_implemented: z.boolean(),
  /** Whether schema is functioning correctly */
  is_functioning_correctly: z.boolean(),
  /** Type of schema found */
  schema_type: z.enum(['LocalBusiness', 'MedicalBusiness', 'Physician', 'Hospital']).optional(),
  /** Whether name field is present */
  has_name: z.boolean(),
  /** Whether address field is present */
  has_address: z.boolean(),
  /** Whether phone field is present */
  has_phone: z.boolean(),
  /** Whether hours field is present */
  has_hours: z.boolean(),
  /** Whether price range field is present (optional) */
  has_price_range: z.boolean().optional(),
  /** Whether aggregate rating field is present (optional) */
  has_aggregate_rating: z.boolean().optional(),
  /** Array of schema validation errors */
  schema_errors: z.array(z.string()).optional(),
  /** Array of schema validation warnings */
  schema_warnings: z.array(z.string()).optional(),
  /** Overall validation status */
  validation_status: z.enum(['valid', 'invalid', 'warning']).optional(),
});

/**
 * Local Indicators Audit Result Schema
 * Main schema for local indicators audit results
 */
export const LocalIndicatorsAuditResultSchema = z.object({
  /** Google Business Profile completeness metrics */
  google_business_profile: GoogleBusinessProfileSchema,
  /** Review response rate and quality metrics */
  review_response: ReviewResponseSchema,
  /** Google Business Profile engagement metrics */
  gbp_engagement: GBPEngagementSchema,
  /** Local backlinks metrics */
  local_backlinks: LocalBacklinksSchema,
  /** Local social media activity metrics */
  local_social_media: LocalSocialMediaSchema,
  /** Local Business schema markup metrics */
  local_business_schema: LocalBusinessSchemaSchema,
  /** Array of recommendations for improvement */
  recommendations: z.array(z.string()),
});

/**
 * Type inference from Zod schemas
 */
export type LocalIndicatorsAuditResult = z.infer<typeof LocalIndicatorsAuditResultSchema>;
export type GoogleBusinessProfile = z.infer<typeof GoogleBusinessProfileSchema>;
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;
export type ReviewResponsePlatform = z.infer<typeof ReviewResponsePlatformSchema>;
export type GBPEngagement = z.infer<typeof GBPEngagementSchema>;
export type LocalBacklinks = z.infer<typeof LocalBacklinksSchema>;
export type LocalBacklink = z.infer<typeof LocalBacklinkSchema>;
export type LocalBacklinksByType = z.infer<typeof LocalBacklinksByTypeSchema>;
export type LocalSocialMedia = z.infer<typeof LocalSocialMediaSchema>;
export type SocialMediaProfile = z.infer<typeof SocialMediaProfileSchema>;
export type LocalBusinessSchema = z.infer<typeof LocalBusinessSchemaSchema>;



