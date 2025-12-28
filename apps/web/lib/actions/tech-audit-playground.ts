'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { performEphemeralTechAudit, type EphemeralAuditResult } from '~/lib/modules/audit/ephemeral-audit';
import { analyzeTechAudit } from '~/lib/modules/audit/utils/tech-audit-analyzer';
import type { TechAuditAnalysis } from '~/lib/modules/audit/utils/tech-audit-analyzer';
import type { DuplicateAnalysisResult } from '~/lib/utils/duplicate-analyzer';

/**
 * Playground Tech Audit Input Schema
 */
const TechAuditInputSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  apiKeyOpenAI: z.string().optional(),
  apiKeyGooglePageSpeed: z.string().optional(),
});

type TechAuditInput = z.infer<typeof TechAuditInputSchema>;

/**
 * Run technical audit in Playground mode
 * 
 * This function performs a standalone technical audit without running
 * the full dashboard simulation.
 * 
 * @param input - Tech audit input with domain and optional API keys
 * @returns EphemeralAuditResult with all audit data
 */
export const runPlaygroundTechAudit = enhanceAction(
  async (input: TechAuditInput, user?: undefined): Promise<EphemeralAuditResult> => {
    const { domain, apiKeyOpenAI, apiKeyGooglePageSpeed } = input;

    console.log('[PlaygroundTechAudit] Starting audit for:', domain);
    console.log('[PlaygroundTechAudit] PageSpeed key provided:', !!apiKeyGooglePageSpeed);
    console.log('[PlaygroundTechAudit] OpenAI key provided:', !!apiKeyOpenAI);

    // Normalize domain URL
    const normalizedDomain = domain.startsWith('http://') || domain.startsWith('https://')
      ? domain
      : `https://${domain}`;

    // Use OpenAI key from input, or fallback to environment variable
    const openaiKeyForAudit = (apiKeyOpenAI?.trim() || process.env.OPENAI_API_KEY?.trim() || '').trim();

    if (!openaiKeyForAudit) {
      console.warn('[PlaygroundTechAudit] No OpenAI key provided. llms.txt analysis will be skipped.');
    }

    // Perform ephemeral tech audit
    const auditResult = await performEphemeralTechAudit(
      normalizedDomain,
      openaiKeyForAudit,
      apiKeyGooglePageSpeed?.trim() || undefined,
    );

    console.log('[PlaygroundTechAudit] Audit completed. Results:');
    console.log('[PlaygroundTechAudit] Desktop Speed:', auditResult.speed.desktop);
    console.log('[PlaygroundTechAudit] Mobile Speed:', auditResult.speed.mobile);

    // Save audit result to database
    try {
      const supabase = getSupabaseServerAdminClient();
      
      const insertData = {
        url: normalizedDomain,
        audit_result: auditResult,
        domain: domain.trim(),
      };
      
      console.log('[PlaygroundTechAudit] Inserting audit data:', {
        url: insertData.url,
        hasResult: !!insertData.audit_result,
        domain: insertData.domain,
      });
      
      const { data: savedData, error: saveError } = await (supabase as any)
        .from('playground_tech_audits')
        .insert(insertData)
        .select()
        .single();

      if (saveError) {
        console.error('[PlaygroundTechAudit] Failed to save audit to database:', {
          error: saveError,
          message: saveError.message,
          details: saveError.details,
          hint: saveError.hint,
        });
        // Don't throw - saving is optional, audit result is still returned
      } else {
        console.log('[PlaygroundTechAudit] Audit result saved to database successfully:', {
          id: savedData?.id,
          url: savedData?.url,
          createdAt: savedData?.created_at,
        });
      }
    } catch (saveError) {
      console.error('[PlaygroundTechAudit] Error saving audit to database:', saveError);
      // Don't throw - saving is optional
    }

    return auditResult;
  },
  {
    auth: false, // Playground actions don't require authentication
    schema: TechAuditInputSchema,
  },
);

/**
 * AI Analysis Input Schema
 */
const AIAnalysisInputSchema = z.object({
  audit: z.any(), // EphemeralAuditResult - using any to avoid circular dependencies
  apiKeyOpenAI: z.string().optional(),
  duplicateAnalysis: z.any().optional().nullable(), // DuplicateAnalysisResult
});

type AIAnalysisInput = z.infer<typeof AIAnalysisInputSchema>;

/**
 * Run AI analysis on technical audit results
 * 
 * @param input - Audit result, OpenAI key, and optional duplicate analysis
 * @returns AI analysis result
 */
export const runAIAnalysis = enhanceAction(
  async (input: AIAnalysisInput, user?: undefined): Promise<TechAuditAnalysis> => {
    const { audit, apiKeyOpenAI, duplicateAnalysis } = input;

    console.log('[AIAnalysis] Starting AI analysis...');
    console.log('[AIAnalysis] OpenAI key provided:', !!apiKeyOpenAI);
    console.log('[AIAnalysis] Duplicate analysis provided:', !!duplicateAnalysis);

    const result = await analyzeTechAudit(
      audit as EphemeralAuditResult,
      apiKeyOpenAI?.trim(),
      duplicateAnalysis as DuplicateAnalysisResult | null | undefined,
    );

    console.log('[AIAnalysis] Analysis completed. Overall score:', result.overallScore);

    return result;
  },
  {
    auth: false, // Playground actions don't require authentication
    schema: AIAnalysisInputSchema,
  },
);

/**
 * Get the most recent Technical Audit for a URL
 * 
 * @param url - URL to get the latest audit for
 * @returns The latest audit with result and metadata, or null if none exists
 */
export const getLatestPlaygroundTechAudit = enhanceAction(
  async (params: { url: string }): Promise<{ result: EphemeralAuditResult; createdAt: string } | null> => {
    const { url } = params;
    
    // Normalize URL (ensure it has protocol)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      const supabase = getSupabaseServerAdminClient();
      
      console.log('[PlaygroundTechAudit] Fetching latest audit from database:', { url: normalizedUrl });
      
      // Try exact match first
      let { data, error } = await (supabase as any)
        .from('playground_tech_audits')
        .select('audit_result, created_at, id, url')
        .eq('url', normalizedUrl)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // If no exact match, try without protocol (for flexibility)
      if (!data && !error) {
        const urlWithoutProtocol = normalizedUrl.replace(/^https?:\/\//, '');
        const { data: dataAlt, error: errorAlt } = await (supabase as any)
          .from('playground_tech_audits')
          .select('audit_result, created_at, id, url')
          .or(`url.eq.${normalizedUrl},url.ilike.%${urlWithoutProtocol}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (dataAlt && !errorAlt) {
          data = dataAlt;
        }
        if (errorAlt && !error) {
          error = errorAlt;
        }
      }

      if (error) {
        console.error('[PlaygroundTechAudit] Failed to fetch latest audit:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }

      if (!data || !data.audit_result) {
        console.log('[PlaygroundTechAudit] No audit found in database for URL:', normalizedUrl);
        return null;
      }

      console.log('[PlaygroundTechAudit] Found audit in database:', {
        id: data.id,
        url: data.url,
        createdAt: data.created_at,
      });

      return {
        result: data.audit_result as EphemeralAuditResult,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('[PlaygroundTechAudit] Error fetching latest audit:', error);
      return null;
    }
  },
  {
    auth: false, // Playground actions don't require authentication
  },
);

