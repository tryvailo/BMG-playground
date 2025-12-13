'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
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

