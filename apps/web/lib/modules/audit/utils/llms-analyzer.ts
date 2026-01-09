'use server';

import { heuristicLlmsAnalysis } from './llms-heuristic';

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
 * LLMS.txt Analysis Result
 */
export interface LlmsTxtAnalysis {
  score: number; // 0-100
  summary: string; // Short verdict
  missing_sections: string[]; // List of what's missing
  recommendations: string[]; // Actionable advice
}

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Create OpenAI client with optional API key
 * If no key is provided, uses OPENAI_API_KEY from environment
 */
function createOpenAIClient(apiKey?: string): OpenAIClient {
  // Priority: 1) provided key, 2) OPENAI_API_KEY env var
  const key = (apiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || '').trim();

  if (!key) {
    throw new Error('OpenAI API key is required. Provide it as a parameter or set OPENAI_API_KEY environment variable.');
  }
  
  // Log key source for debugging (without exposing the actual key)
  const keySource = apiKey ? 'provided parameter' : 'environment variable';
  console.log(`[LlmsAnalyzer] Using OpenAI key from ${keySource} for llms.txt analysis`);

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
function parseJsonResponse(content: string): LlmsTxtAnalysis {
  try {
    const parsed = JSON.parse(content) as Partial<LlmsTxtAnalysis>;
    
    // Validate and normalize the response
    return {
      score: Math.max(0, Math.min(100, parsed.score ?? 0)),
      summary: parsed.summary || 'Analysis completed',
      missing_sections: Array.isArray(parsed.missing_sections) ? parsed.missing_sections : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (error) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]!) as Partial<LlmsTxtAnalysis>;
        return {
          score: Math.max(0, Math.min(100, parsed.score ?? 0)),
          summary: parsed.summary || 'Analysis completed',
          missing_sections: Array.isArray(parsed.missing_sections) ? parsed.missing_sections : [],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        };
      } catch (_error) {
        // Fall through to default
      }
    }

    // If all parsing fails, return a default response
    console.error('[LlmsAnalyzer] Failed to parse JSON response:', error);
    return {
      score: 0,
      summary: 'Failed to parse analysis response',
      missing_sections: ['Unable to analyze content'],
      recommendations: ['Check llms.txt file format and try again'],
    };
  }
}

/*
 * -------------------------------------------------------
 * Main Function
 * -------------------------------------------------------
 */

/**
 * Analyze llms.txt file content using AI
 * 
 * Uses GPT-4o-mini to analyze the llms.txt content against ideal variant criteria:
 * - Markdown structure
 * - Presence of 'treasure URLs' (About, Services, Doctors, Contacts)
 * - Clear descriptions and unique selling points
 * - Up-to-date contact info
 * - No noise/ads
 * 
 * @param content - The llms.txt file content to analyze
 * @param openaiKey - Optional OpenAI API key (uses OPENAI_API_KEY env var if not provided)
 * @returns Analysis result with score, summary, missing sections, and recommendations
 */
export async function analyzeLlmsTxt(
  content: string,
  openaiKey?: string,
): Promise<LlmsTxtAnalysis> {
  const client = createOpenAIClient(openaiKey);

  const systemPrompt = `You are a professional SEO and GEO (Generative Engine Optimization) specialist with expertise in:
- Schema markup and structured data optimization
- Local SEO and geographic targeting
- AI visibility (AIV) and LLM indexation
- Technical content optimization for LLMs

When analyzing llms.txt files for medical/healthcare organizations, evaluate:

CRITICAL SECTIONS (must-have for GEO):
1. Organization Identity:
   - Clear legal entity name and aliases
   - Geographic focus (specific cities, regions, countries)
   - Medical specialization/categories with specific procedures listed
   - Hierarchy: Organization → Specializations → Procedures

2. Local Service Information (GEO crucial):
   - Multiple office locations with explicit addresses (street, city, postal code)
   - Phone numbers in local format (e.g., +38 for Ukraine)
   - Service areas covered (e.g., "Serving 5 districts of Kyiv")
   - Hours of operation (especially for emergency services)

3. Medical Expertise & Authority (EEAT signals):
   - Doctor/specialist names with credentials (degree, specialization, years of experience)
   - Qualifications and certifications (licenses, board certifications)
   - Published articles or case studies
   - Professional affiliations and memberships

4. Service Definitions:
   - Each service should include: procedure name, description, conditions treated, expected outcomes
   - Links to authoritative medical resources (WHO, PubMed, national health ministries)
   - Contraindications and risk information (builds trust)

5. SEO/GEO Technical Requirements:
   - Clean Markdown with proper hierarchy (H1, H2, H3)
   - No keyword stuffing or AI-spam patterns
   - Updated dates for freshness signals
   - Structured data-ready format

SCORING CRITERIA:
- 80-100: Complete information in all critical sections, perfectly formatted, authority signals strong
- 60-79: Missing 1 critical section or weak on authority signals
- 40-59: Missing 2-3 sections or significant formatting issues
- 20-39: Incomplete medical information or poor structure
- 0-19: Minimal useful content or too generic`;

  const userPrompt = `You are evaluating this llms.txt for a medical organization as a professional SEO/GEO specialist.

CONTEXT:
- Target audience: LLM systems (ChatGPT, Perplexity, Claude) that rely on accurate medical information
- Primary goal: Maximize visibility in LLM responses for local medical queries
- Risk level: High (medical content must be accurate and trustworthy)

ANALYSIS TASK:
Score each critical section:

1. ORGANIZATION IDENTITY (0-20 points):
   - Is the legal name and aliases clearly stated? (medical organization name must be unambiguous)
   - Are geographic locations explicit (cities, regions)? (critical for local AI results)
   - Is medical specialization clearly categorized? (e.g., "Cardiology", "Orthopedic Surgery")

2. LOCAL SERVICE INFO (0-25 points):
   - How many office locations are listed with full addresses? (0 = 0pts, 1-2 = 10pts, 3+ = 15pts)
   - Are phone numbers in local format? Missing = huge GEO penalty
   - Is service area coverage defined? (e.g., "serves Kyiv and Lviv regions")
   - Are hours of operation provided?

3. MEDICAL AUTHORITY (0-25 points):
   - Doctor credentials quality (names + degree level = 10pts, with specialization = 15pts, with years exp = 25pts)
   - Are licenses/certifications mentioned?
   - Any published articles or case studies? (adds 10 bonus points)

4. SERVICE DEFINITIONS (0-20 points):
   - Each service includes description + conditions treated? (10 pts)
   - Links to authoritative medical sources? (5 pts)
   - Contraindications/risks mentioned? (5 pts)

5. TECHNICAL QUALITY (0-10 points):
   - Markdown properly formatted
   - No AI-spam patterns
   - Fresh/updated dates present

After scoring, provide recommendations that are:
- Specific and actionable (not generic advice)
- Prioritized by GEO impact (what helps most in LLM results)
- Technically precise (use SEO/GEO terminology)

Return JSON:
{
  "score": number (0-100),
  "summary": string (concise professional assessment),
  "missing_sections": string[] (specific gaps, only if genuinely missing),
  "recommendations": string[] (prioritized by GEO impact, max 6)
}

EXAMPLE RECOMMENDATIONS (your style):
✓ "Add 3+ office addresses with postal codes in Ukrainian local format (+38-XX-XXX-XXXX)"
✓ "List each doctor's license number and specialization registry to strengthen medical authority signals"
✓ "Create a 'Conditions Treated' section mapping procedures to ICD-10 codes for medical AI precision"
✗ "Make content better" ❌ TOO VAGUE

llms.txt content:
${content}`;

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

    const parsed = parseJsonResponse(responseContent);
    // Mark that this result came from AI analysis
    return { ...parsed, analysisMethod: 'ai' } as unknown as LlmsTxtAnalysis;
  } catch (error) {
    console.error('[LlmsAnalyzer] Error analyzing llms.txt:', error);
    
    // If AI analysis fails (network/API key/etc.), fall back to a deterministic
    // heuristic analyzer so the UI can still show meaningful PROBLEMS and
    // RECOMMENDATIONS instead of a generic score=0.
    try {
      return heuristicLlmsAnalysis(content, error instanceof Error ? String(error.message) : 'AI error');
    } catch (heuristicError) {
      console.error('[LlmsAnalyzer] Heuristic analysis also failed:', heuristicError);
      return {
        score: 0,
        summary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        missing_sections: ['Unable to complete analysis'],
        recommendations: ['Ensure OpenAI API key is valid and try again'],
        analysisMethod: 'heuristic',
        fallbackReason: error instanceof Error ? error.message : String(error),
      } as unknown as LlmsTxtAnalysis;
    }
  }
}

// Heuristic function moved to llms-heuristic.ts to avoid 'use server' requirement
// Import it directly from './llms-heuristic' instead of re-exporting

