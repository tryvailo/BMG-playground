import { getOpenAIClient } from './clients';

/*
 * -------------------------------------------------------
 * AI Scanner Utilities
 * -------------------------------------------------------
 */

export interface ParsedAIResponse {
  domainPresent: boolean;
  rank: number | null; // 1-10, null if not found
  competitors: string[]; // List of other domains/clinics mentioned
  rawAnalysis: string; // Full analysis text
  trustScore: number; // 1-10, E-E-A-T trust score based on brand mentions/authority
  localScore: number; // 1-10, Local score based on physical address presence
}

/**
 * Generate a user prompt for AI search
 * Creates a prompt like "I'm looking for {query} in {city}. Recommend top 5 clinics..."
 * 
 * @param query - The medical service query (e.g., "dental implants")
 * @param city - The city location (e.g., "New York")
 * @returns Formatted prompt string
 */
export function generateUserPrompt(query: string, city: string): string {
  if (!query || !city) {
    throw new Error('Query and city are required');
  }

  return `I'm looking for ${query} in ${city}. Can you recommend the top 5 clinics or medical facilities that provide this service? Please include their names, locations, and any relevant details about why you're recommending them.`;
}

/**
 * Parse AI response to extract domain visibility information
 * Uses gpt-4o-mini to analyze the text and extract:
 * - Is the domain present?
 * - What is the rank (1-10)?
 * - Who else is listed?
 * 
 * @param responseText - The raw AI response text to analyze
 * @param targetDomain - The domain we're looking for (e.g., "clinic.com")
 * @returns Parsed response with domain presence, rank, and competitors
 */
export async function parseAiResponse(
  responseText: string,
  targetDomain: string,
): Promise<ParsedAIResponse> {
  if (!responseText || !targetDomain) {
    throw new Error('Response text and target domain are required');
  }

  const openai = getOpenAIClient();

  // Normalize domain for comparison (remove www, https, etc.)
  const normalizeDomain = (domain: string): string => {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const normalizedTargetDomain = normalizeDomain(targetDomain);

  // Create analysis prompt
  const analysisPrompt = `Analyze the following AI response about medical clinic recommendations. Extract the following information in JSON format:

{
  "domainPresent": boolean, // Is "${targetDomain}" (or any variation like www.${targetDomain}) mentioned in the response?
  "rank": number | null, // If the domain is present, what is its position/rank in the list (1-10)? null if not found
  "competitors": string[], // List of all other clinic names or domains mentioned in the response
  "rawAnalysis": string, // Brief explanation of your analysis
  "trustScore": number, // For the specific domain "${targetDomain}", if found, estimate a Trust Score (1-10) based on brand mentions, authority signals, reputation indicators, and E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness). If not found, return 0.
  "localScore": number // For the specific domain "${targetDomain}", if found, estimate a Local Score (1-10) based on physical address presence, location mentions, local context, and geographic relevance in the search context. If not found, return 0.
}

AI Response to analyze:
${responseText}

Important:
- Check for the domain "${targetDomain}" in any form (with/without www, http/https)
- If the domain appears, determine its position in the recommendation list (1st, 2nd, 3rd, etc.)
- Extract all other clinic names or domains mentioned
- For Trust Score: Consider factors like brand recognition, authority mentions, expert credentials, patient reviews/mentions, years of experience, certifications, awards, or other trust signals in the response
- For Local Score: Consider factors like physical address mentioned, street address, city/neighborhood references, "located at", "visit us at", local landmarks, proximity indicators, or other location-specific context
- Return valid JSON only, no markdown formatting`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that analyzes medical clinic recommendations and extracts structured data. Always return valid JSON.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent parsing
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse JSON response
    let parsed: ParsedAIResponse;
    try {
      parsed = JSON.parse(content) as ParsedAIResponse;
    } catch (parseError) {
      // Fallback: try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]!) as ParsedAIResponse;
      } else {
        throw new Error(`Failed to parse JSON response: ${content}`);
      }
    }

    // Validate and normalize the response
    const result: ParsedAIResponse = {
      domainPresent: Boolean(parsed.domainPresent),
      rank: parsed.rank && parsed.rank >= 1 && parsed.rank <= 10 ? parsed.rank : null,
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
      rawAnalysis: parsed.rawAnalysis || content,
      trustScore: parsed.domainPresent
        ? Math.max(0, Math.min(10, Math.round(parsed.trustScore || 0)))
        : 0,
      localScore: parsed.domainPresent
        ? Math.max(0, Math.min(10, Math.round(parsed.localScore || 0)))
        : 0,
    };

    // Additional validation: check if domain is actually present in response text
    // This is a fallback in case the AI missed it
    const responseTextLower = responseText.toLowerCase();
    const domainVariations = [
      normalizedTargetDomain,
      `www.${normalizedTargetDomain}`,
      `https://${normalizedTargetDomain}`,
      `http://${normalizedTargetDomain}`,
    ];

    const isActuallyPresent = domainVariations.some((variant) =>
      responseTextLower.includes(variant),
    );

    // If we found the domain in text but AI said it's not present, correct it
    if (isActuallyPresent && !result.domainPresent) {
      result.domainPresent = true;
      // Try to estimate rank by finding position in text
      const domainIndex = responseTextLower.indexOf(normalizedTargetDomain);
      if (domainIndex > 0) {
        // Simple heuristic: count how many clinic names appear before this domain
        const textBeforeDomain = responseTextLower.substring(0, domainIndex);
        const clinicIndicators = [
          '1.',
          '2.',
          '3.',
          '4.',
          '5.',
          'first',
          'second',
          'third',
          'recommend',
        ];
        const estimatedRank = clinicIndicators.reduce((count, indicator) => {
          return count + (textBeforeDomain.match(new RegExp(indicator, 'gi'))?.length || 0);
        }, 0);
        if (estimatedRank > 0 && estimatedRank <= 10) {
          result.rank = estimatedRank;
        }
      }
    }

    return result;
  } catch (_error) {
    // Fallback parsing if AI analysis fails
    const responseTextLower = responseText.toLowerCase();
    const normalizedTarget = normalizeDomain(targetDomain);
    const domainPresent = responseTextLower.includes(normalizedTarget);

    return {
      domainPresent,
      rank: domainPresent ? 1 : null, // Default to rank 1 if found, null otherwise
      competitors: [],
      rawAnalysis: `Fallback analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      trustScore: 0, // Default to 0 if domain not found or parsing failed
      localScore: 0, // Default to 0 if domain not found or parsing failed
    };
  }
}

/**
 * Extract all domains from AI response text
 * Helper function to find all domain-like strings in the response
 * 
 * @param responseText - The AI response text
 * @returns Array of extracted domains
 */
export function extractDomainsFromResponse(responseText: string): string[] {
  if (!responseText) {
    return [];
  }

  // Domain regex pattern
  const domainRegex =
    /(?:https?:\/\/)?(?:www\.)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,})/gi;

  const matches = responseText.matchAll(domainRegex);
  const domains = new Set<string>();

  for (const match of matches) {
    const domain = match[1]?.toLowerCase();
    if (
      domain &&
      !domain.includes('localhost') &&
      !domain.includes('127.0.0.1') &&
      !domain.includes('example.com')
    ) {
      domains.add(domain);
    }
  }

  return Array.from(domains);
}

