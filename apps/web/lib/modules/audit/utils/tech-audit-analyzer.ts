'use server';

import type { EphemeralAuditResult } from '../ephemeral-audit';
import type { DuplicateAnalysisResult } from '~/lib/utils/duplicate-analyzer';

/*
 * -------------------------------------------------------
 * Type Definitions
 * -------------------------------------------------------
 */

/**
 * OpenAI Client Interface
 */
interface OpenAIClient {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
        response_format?: { type: string };
      }) => Promise<{
        choices: Array<{
          message: {
            content: string | null;
          };
        }>;
      }>;
    };
  };
}

/**
 * Technical Audit AI Analysis Result
 */
export interface TechAuditAnalysis {
  overallScore: number; // 0-100
  summary: string; // Short verdict (2-3 sentences)
  criticalIssues: string[]; // Critical problems that need immediate attention
  priorityRecommendations: string[]; // Top 5-7 actionable recommendations
  strengths: string[]; // What's working well
  quickWins: string[]; // Easy fixes that can improve score quickly
}

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Create OpenAI client with optional API key
 */
function createOpenAIClient(apiKey?: string): OpenAIClient {
  const key = (apiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || '').trim();

  if (!key) {
    throw new Error('OpenAI API key is required. Provide it as a parameter or set OPENAI_API_KEY environment variable.');
  }

  const keySource = apiKey ? 'provided parameter' : 'environment variable';
  console.log(`[TechAuditAnalyzer] Using OpenAI key from ${keySource} for technical audit analysis`);

  return {
    chat: {
      completions: {
        create: async (params) => {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: params.model,
              messages: params.messages,
              temperature: params.temperature ?? 0.3,
              ...(params.response_format && { response_format: params.response_format }),
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(
              `OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`,
            );
          }

          return response.json();
        },
      },
    },
  };
}

/**
 * Safely parse JSON response from OpenAI
 */
function parseJsonResponse(content: string): TechAuditAnalysis {
  try {
    const parsed = JSON.parse(content) as Partial<TechAuditAnalysis>;

    return {
      overallScore: Math.max(0, Math.min(100, parsed.overallScore ?? 0)),
      summary: parsed.summary || 'Analysis completed',
      criticalIssues: Array.isArray(parsed.criticalIssues) ? parsed.criticalIssues : [],
      priorityRecommendations: Array.isArray(parsed.priorityRecommendations) ? parsed.priorityRecommendations : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins : [],
    };
  } catch (error) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]!) as Partial<TechAuditAnalysis>;
        return {
          overallScore: Math.max(0, Math.min(100, parsed.overallScore ?? 0)),
          summary: parsed.summary || 'Analysis completed',
          criticalIssues: Array.isArray(parsed.criticalIssues) ? parsed.criticalIssues : [],
          priorityRecommendations: Array.isArray(parsed.priorityRecommendations) ? parsed.priorityRecommendations : [],
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins : [],
        };
      } catch {
        // Fall through to default
      }
    }

    console.error('[TechAuditAnalyzer] Failed to parse JSON response:', error);
    return {
      overallScore: 0,
      summary: 'Failed to parse analysis response',
      criticalIssues: ['Unable to analyze technical audit data'],
      priorityRecommendations: ['Check OpenAI API key and try again'],
      strengths: [],
      quickWins: [],
    };
  }
}

/**
 * Format audit data for AI analysis
 */
function formatAuditDataForAI(audit: EphemeralAuditResult, duplicateAnalysis?: DuplicateAnalysisResult | null): string {
  const parts: string[] = [];

  // Performance
  parts.push('## Performance Metrics');
  parts.push(`Desktop Speed: ${audit.speed.desktop ?? 'N/A'}/100`);
  parts.push(`Mobile Speed: ${audit.speed.mobile ?? 'N/A'}/100`);
  
  if (audit.speed.desktopDetails) {
    const d = audit.speed.desktopDetails;
    parts.push(`Desktop LCP: ${d.lcp ? `${Math.round(d.lcp)}ms` : 'N/A'}`);
    parts.push(`Desktop FCP: ${d.fcp ? `${Math.round(d.fcp)}ms` : 'N/A'}`);
    parts.push(`Desktop CLS: ${d.cls !== null ? d.cls.toFixed(3) : 'N/A'}`);
    parts.push(`Desktop TBT: ${d.tbt ? `${Math.round(d.tbt)}ms` : 'N/A'}`);
    if (d.opportunities.length > 0) {
      parts.push(`Desktop Opportunities: ${d.opportunities.slice(0, 3).map(o => o.title).join(', ')}`);
    }
  }
  
  if (audit.speed.mobileDetails) {
    const m = audit.speed.mobileDetails;
    parts.push(`Mobile LCP: ${m.lcp ? `${Math.round(m.lcp)}ms` : 'N/A'}`);
    parts.push(`Mobile FCP: ${m.fcp ? `${Math.round(m.fcp)}ms` : 'N/A'}`);
    parts.push(`Mobile CLS: ${m.cls !== null ? m.cls.toFixed(3) : 'N/A'}`);
    parts.push(`Mobile TBT: ${m.tbt ? `${Math.round(m.tbt)}ms` : 'N/A'}`);
    if (m.opportunities.length > 0) {
      parts.push(`Mobile Opportunities: ${m.opportunities.slice(0, 3).map(o => o.title).join(', ')}`);
    }
  }

  // Security
  parts.push('\n## Security & Mobile');
  parts.push(`HTTPS: ${audit.security.https ? 'Yes' : 'No'}`);
  parts.push(`Mobile Friendly: ${audit.security.mobileFriendly ? 'Yes' : 'No'}`);

  // Files
  parts.push('\n## Core Files');
  parts.push(`robots.txt: ${audit.files.robots ? 'Present' : 'Missing'}`);
  parts.push(`sitemap.xml: ${audit.files.sitemap ? 'Present' : 'Missing'}`);
  parts.push(`llms.txt: ${audit.files.llmsTxt.present ? `Present (Score: ${audit.files.llmsTxt.score}/100)` : 'Missing'}`);

  // Schema Markup
  parts.push('\n## Schema Markup');
  parts.push(`Medical Organization: ${audit.schema.hasMedicalOrg ? 'Yes' : 'No'}`);
  parts.push(`Physician: ${audit.schema.hasPhysician ? 'Yes' : 'No'}`);
  parts.push(`Medical Procedure: ${audit.schema.hasMedicalProcedure ? 'Yes' : 'No'}`);
  parts.push(`Local Business: ${audit.schema.hasLocalBusiness ? 'Yes' : 'No'}`);
  parts.push(`FAQ: ${audit.schema.hasFAQPage ? 'Yes' : 'No'}`);
  parts.push(`Reviews: ${audit.schema.hasReview ? 'Yes' : 'No'}`);
  parts.push(`Breadcrumb List: ${audit.schema.hasBreadcrumbList ? 'Yes' : 'No'}`);

  // Meta Tags
  parts.push('\n## Meta Tags & SEO');
  parts.push(`Title: ${audit.meta.title ? `${audit.meta.title.length} chars - "${audit.meta.title.substring(0, 60)}..."` : 'Missing'}`);
  parts.push(`Description: ${audit.meta.description ? `${audit.meta.description.length} chars` : 'Missing'}`);
  parts.push(`H1: ${audit.meta.h1 ? 'Present' : 'Missing'}`);
  parts.push(`Canonical: ${audit.meta.canonical ? 'Present' : 'Missing'}`);
  parts.push(`Lang: ${audit.meta.lang || 'Missing'}`);

  // Images
  parts.push('\n## Images');
  parts.push(`Total: ${audit.images.total}`);
  parts.push(`Missing Alt: ${audit.images.missingAlt} (${audit.images.total > 0 ? Math.round((audit.images.missingAlt / audit.images.total) * 100) : 0}%)`);

  // External Links
  parts.push('\n## External Links');
  parts.push(`Total: ${audit.externalLinks.total}`);
  parts.push(`Broken: ${audit.externalLinks.broken}`);
  parts.push(`Trusted: ${audit.externalLinks.trusted}`);

  // Duplicates
  parts.push('\n## Duplicate Prevention');
  parts.push(`WWW Redirect: ${audit.duplicates.wwwRedirect}`);
  parts.push(`Trailing Slash: ${audit.duplicates.trailingSlash}`);
  parts.push(`HTTP → HTTPS: ${audit.duplicates.httpRedirect}`);

  // Deep Content Analysis (Duplicate Content)
  if (duplicateAnalysis) {
    parts.push('\n## Deep Content Analysis - Duplicate Content');
    parts.push(`Pages Scanned: ${duplicateAnalysis.pagesScanned}`);
    parts.push(`Duplicates Found: ${duplicateAnalysis.duplicatesFound}`);
    if (duplicateAnalysis.duplicatesFound > 0) {
      parts.push(`\nDuplicate Pairs (showing top 5):`);
      duplicateAnalysis.results.slice(0, 5).forEach((dup, idx) => {
        parts.push(`  ${idx + 1}. "${dup.titleA || dup.urlA}" ↔ "${dup.titleB || dup.urlB}" (${dup.similarity}% similarity)`);
      });
      if (duplicateAnalysis.duplicatesFound > 5) {
        parts.push(`  ... and ${duplicateAnalysis.duplicatesFound - 5} more duplicate pairs`);
      }
    } else {
      parts.push('No duplicate content detected - excellent!');
    }
  } else {
    parts.push('\n## Deep Content Analysis - Duplicate Content');
    parts.push('Not available (Firecrawl API key not provided or analysis skipped)');
  }

  return parts.join('\n');
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Analyze complete technical audit using AI
 * 
 * Uses GPT-4o-mini to analyze all technical audit data and provide:
 * - Overall score (0-100)
 * - Summary verdict
 * - Critical issues
 * - Priority recommendations
 * - Strengths
 * - Quick wins
 * 
 * @param audit - Complete EphemeralAuditResult to analyze
 * @param openaiKey - Optional OpenAI API key (uses OPENAI_API_KEY env var if not provided)
 * @param duplicateAnalysis - Optional duplicate content analysis results
 * @returns AI analysis result
 */
export async function analyzeTechAudit(
  audit: EphemeralAuditResult,
  openaiKey?: string,
  duplicateAnalysis?: DuplicateAnalysisResult | null,
): Promise<TechAuditAnalysis> {
  const client = createOpenAIClient(openaiKey);

  const systemPrompt = `You are an expert technical SEO and web performance analyst specializing in medical/healthcare websites. Your task is to analyze comprehensive technical audit data and provide actionable insights.

Analyze the technical audit data considering:
1. Performance (PageSpeed scores, Core Web Vitals)
2. Security (HTTPS, mobile-friendliness)
3. Core files (robots.txt, sitemap.xml, llms.txt)
4. Schema markup (Medical Organization, Physician, etc.)
5. Meta tags and SEO elements
6. Images accessibility
7. External links health
8. Duplicate prevention (URL duplicates)
9. Deep content analysis (duplicate content across pages) - CRITICAL for SEO
10. PageSpeed opportunities

IMPORTANT: If duplicate content is found, this is a critical SEO issue that must be addressed. Include specific recommendations about consolidating or rewriting duplicate content pages.

Provide a comprehensive analysis that helps improve the website's technical SEO and performance.`;

  const auditData = formatAuditDataForAI(audit, duplicateAnalysis);

  const userPrompt = `Analyze the following technical audit data and provide a JSON response with:

- overallScore: A number from 0-100 representing the overall technical health of the website
- summary: A concise 2-3 sentence verdict describing the website's technical status and main areas of concern
- criticalIssues: An array of 3-5 critical problems that need immediate attention (e.g., "Mobile performance score is 45/100, indicating severe performance issues", "Found 12 duplicate content pairs - this can cause SEO penalties")
- priorityRecommendations: An array of 5-7 actionable recommendations prioritized by impact. MUST include recommendations about duplicate content if found (e.g., "Optimize images to reduce LCP from 9642ms to under 2500ms", "Consolidate or rewrite 12 duplicate content pages to avoid SEO penalties")
- strengths: An array of 3-5 things the website is doing well (e.g., "HTTPS is properly configured", "Schema markup includes Medical Organization", "No duplicate content detected across scanned pages")
- quickWins: An array of 2-4 easy fixes that can improve the score quickly (e.g., "Add missing alt tags to 32 images", "Fix 3 broken external links", "Rewrite duplicate content on pages with >95% similarity")

Technical Audit Data:
${auditData}

Return only valid JSON in this format:
{
  "overallScore": number,
  "summary": string,
  "criticalIssues": string[],
  "priorityRecommendations": string[],
  "strengths": string[],
  "quickWins": string[]
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      response_format: { type: 'json_object' },
    });

    const responseContent = response.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    return parseJsonResponse(responseContent);
  } catch (error) {
    console.error('[TechAuditAnalyzer] Error analyzing technical audit:', error);

    return {
      overallScore: 0,
      summary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      criticalIssues: ['Unable to complete AI analysis'],
      priorityRecommendations: ['Ensure OpenAI API key is valid and try again'],
      strengths: [],
      quickWins: [],
    };
  }
}

