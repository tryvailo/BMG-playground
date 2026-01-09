'use server';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import type { ContentAuditResult } from '~/lib/server/services/content/types';
import type { EEATAuditResult } from '~/lib/server/services/eeat/types';
import type { LocalIndicatorsAuditResult } from '~/lib/server/services/local/types';

/**
 * Audit History Types
 */
export interface AuditHistoryEntry<T> {
  id: string;
  result: T;
  createdAt: string;
}

export interface AuditTrendData {
  hasPrevious: boolean;
  previousCreatedAt?: string;
  trends: Record<string, number | null>;
}

/**
 * Normalize URL for database queries
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

/**
 * Get previous Content Audit for trend calculation
 * Returns the second most recent audit (not the current one)
 */
export const getPreviousContentAudit = enhanceAction(
  async (params: { url: string; currentAuditId?: string }): Promise<AuditHistoryEntry<ContentAuditResult> | null> => {
    const normalizedUrl = normalizeUrl(params.url);

    try {
      const supabase = getSupabaseServerAdminClient();
      
      // Get the two most recent audits
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('content_audits')
        .select('id, audit_result, created_at, url')
        .eq('url', normalizedUrl)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error || !data || data.length < 2) {
        return null;
      }

      // Return the second (previous) audit
      const previous = data[1];
      return {
        id: previous.id,
        result: previous.audit_result as ContentAuditResult,
        createdAt: previous.created_at,
      };
    } catch (error) {
      console.error('[AuditHistory] Error fetching previous content audit:', error);
      return null;
    }
  },
  { auth: false },
);

/**
 * Get previous E-E-A-T Audit for trend calculation
 */
export const getPreviousEEATAudit = enhanceAction(
  async (params: { url: string }): Promise<AuditHistoryEntry<EEATAuditResult> | null> => {
    const normalizedUrl = normalizeUrl(params.url);

    try {
      const supabase = getSupabaseServerAdminClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('eeat_audits')
        .select('id, audit_result, created_at, url')
        .eq('url', normalizedUrl)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error || !data || data.length < 2) {
        return null;
      }

      const previous = data[1];
      return {
        id: previous.id,
        result: previous.audit_result as EEATAuditResult,
        createdAt: previous.created_at,
      };
    } catch (error) {
      console.error('[AuditHistory] Error fetching previous EEAT audit:', error);
      return null;
    }
  },
  { auth: false },
);

/**
 * Get previous Local Indicators Audit for trend calculation
 */
export const getPreviousLocalAudit = enhanceAction(
  async (params: { url: string }): Promise<AuditHistoryEntry<LocalIndicatorsAuditResult> | null> => {
    const normalizedUrl = normalizeUrl(params.url);

    try {
      const supabase = getSupabaseServerAdminClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('local_indicators_audits')
        .select('id, audit_result, created_at, url')
        .eq('url', normalizedUrl)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error || !data || data.length < 2) {
        return null;
      }

      const previous = data[1];
      return {
        id: previous.id,
        result: previous.audit_result as LocalIndicatorsAuditResult,
        createdAt: previous.created_at,
      };
    } catch (error) {
      console.error('[AuditHistory] Error fetching previous local audit:', error);
      return null;
    }
  },
  { auth: false },
);

/**
 * Tech Audit Result type (simplified for history)
 */
interface TechAuditHistoryResult {
  speed: { desktop: number | null; mobile: number | null };
  security: { https: boolean; mobileFriendly: boolean };
  files: { robots: boolean; sitemap: boolean; llmsTxt: { present: boolean; score: number } };
  schema: Record<string, boolean>;
  meta: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Get previous Tech Audit for trend calculation
 */
export const getPreviousTechAudit = enhanceAction(
  async (params: { url: string }): Promise<AuditHistoryEntry<TechAuditHistoryResult> | null> => {
    const normalizedUrl = normalizeUrl(params.url);

    try {
      const supabase = getSupabaseServerAdminClient();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('playground_tech_audits')
        .select('id, audit_result, created_at, url')
        .eq('url', normalizedUrl)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error || !data || data.length < 2) {
        return null;
      }

      const previous = data[1];
      return {
        id: previous.id,
        result: previous.audit_result as TechAuditHistoryResult,
        createdAt: previous.created_at,
      };
    } catch (error) {
      console.error('[AuditHistory] Error fetching previous tech audit:', error);
      return null;
    }
  },
  { auth: false },
);

/**
 * Calculate Content Audit trends from previous audit
 */
export const getContentAuditTrends = enhanceAction(
  async (params: { 
    url: string; 
    currentScores: { structure: number; textQuality: number; authority: number } 
  }): Promise<AuditTrendData> => {
    const previous = await getPreviousContentAudit({ url: params.url });
    
    if (!previous) {
      return { hasPrevious: false, trends: {} };
    }

    // Calculate previous scores using the same logic as current
    const prevResult = previous.result;
    
    // Structure score calculation (same as in ContentAuditSection)
    const prevStructure = calculateContentStructureScore(prevResult);
    const prevTextQuality = calculateContentTextQualityScore(prevResult);
    const prevAuthority = calculateContentAuthorityScore(prevResult);

    return {
      hasPrevious: true,
      previousCreatedAt: previous.createdAt,
      trends: {
        structure: params.currentScores.structure - prevStructure,
        textQuality: params.currentScores.textQuality - prevTextQuality,
        authority: params.currentScores.authority - prevAuthority,
      },
    };
  },
  { auth: false },
);

/**
 * Helper: Calculate structure score from ContentAuditResult
 */
function calculateContentStructureScore(result: ContentAuditResult): number {
  const s = result.structure;
  const scores: { value: number; weight: number }[] = [];
  
  // Direction pages (10%)
  const directionScore = s.direction_pages_count && s.direction_pages_count > 0 
    ? Math.min(100, s.direction_pages_count >= 5 ? 100 : s.direction_pages_count * 20) 
    : 0;
  scores.push({ value: directionScore, weight: 0.10 });
  
  // Service pages (15%)
  const serviceScore = s.has_service_pages 
    ? (s.service_pages_count && s.service_pages_count > 5 ? 100 : s.service_pages_count ? 60 : 50) 
    : 0;
  scores.push({ value: serviceScore, weight: 0.15 });
  
  // Doctor pages (15%)
  let doctorScore = 0;
  if (s.has_doctor_pages) {
    doctorScore = 20;
    if (s.doctor_details?.has_photos) doctorScore += 20;
    if (s.doctor_details?.has_bio) doctorScore += 20;
    if (s.doctor_details?.has_experience) doctorScore += 20;
    if (s.doctor_details?.has_certificates) doctorScore += 20;
  }
  scores.push({ value: doctorScore, weight: 0.15 });
  
  // Architecture (15%)
  scores.push({ value: s.architecture_score, weight: 0.15 });
  
  // Blog (10%)
  let blogScore = 0;
  if (s.has_blog && s.blog_details) {
    blogScore = 30;
    if (s.blog_details.posts_count >= 10) blogScore += 30;
    else if (s.blog_details.posts_count > 0) blogScore += s.blog_details.posts_count * 3;
    if (s.blog_details.is_regularly_updated) blogScore += 40;
  }
  scores.push({ value: Math.min(100, blogScore), weight: 0.10 });
  
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = scores.reduce((sum, s) => sum + (s.value * s.weight), 0);
  return Math.round(weightedSum / totalWeight);
}

/**
 * Helper: Calculate text quality score from ContentAuditResult
 */
function calculateContentTextQualityScore(result: ContentAuditResult): number {
  const uniquenessWeight = 0.15 / 0.20;
  const waterinessWeight = 0.05 / 0.20;
  const uniquenessScore = result.text_quality.uniqueness_score;
  const waterinessScore = 100 - result.text_quality.wateriness_score;
  return Math.round(uniquenessScore * uniquenessWeight + waterinessScore * waterinessWeight);
}

/**
 * Helper: Calculate authority score from ContentAuditResult
 */
function calculateContentAuthorityScore(result: ContentAuditResult): number {
  const a = result.authority;
  const scores: { value: number; weight: number }[] = [];
  
  // Authoritative links (5%)
  const linkScore = a.authority_links_count > 0 ? Math.min(100, a.authority_links_count * 20) : 0;
  scores.push({ value: linkScore, weight: 0.05 });
  
  // FAQ (5%)
  const faqScore = a.faq_count >= 10 ? 100 : a.faq_count >= 3 ? 70 : a.faq_count > 0 ? 30 : 0;
  scores.push({ value: faqScore, weight: 0.05 });
  
  // Contacts (5%)
  const contactScore = ((a.has_valid_phone ? 50 : 0) + (a.has_valid_address ? 50 : 0));
  scores.push({ value: contactScore, weight: 0.05 });
  
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = scores.reduce((sum, s) => sum + (s.value * s.weight), 0);
  return Math.round(weightedSum / totalWeight);
}
