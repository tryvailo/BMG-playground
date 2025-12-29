'use server';

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

  const systemPrompt = `You are an expert in Generative Engine Optimization (GEO). Analyze the provided llms.txt file content against these 'Ideal Variant' criteria:

- Markdown structure (proper formatting with headers, lists, etc.)
- Presence of key information (can be in various formats):
  * About/Description: Information about the organization, mission, values, or background
  * Services: List or description of services offered (can be in "Основні напрямки", "Services", or similar sections)
  * Doctors/Staff: Information about medical staff, specialists, or doctors (can be mentioned in descriptions, examples, or dedicated sections)
  * Contact Information: Addresses, phone numbers, email, or instructions on how to contact (can be in addresses, "телефоном", or contact sections)
- Clear descriptions and unique selling points
- Up-to-date contact info (addresses, phone numbers, or clear instructions on how to find contact details)
- No noise/ads

Important: Information can be presented in various formats:
- Explicit sections with headers (## About, ## Services, etc.)
- Embedded in descriptions and examples
- In metadata fields (addresses, contact info)
- In language-specific sections
- In query examples or instructions

Be flexible in recognizing information even if it's not in a standard format.`;

  const userPrompt = `Analyze the following llms.txt content and provide a JSON response with:
- score: A number from 0-100 indicating how well the file meets the ideal variant criteria. Consider that information can be present in various formats, not just explicit sections.
- summary: A short verdict (1-2 sentences) describing the overall quality and what information is present
- missing_sections: An array of strings listing what's genuinely missing or could be improved (e.g., "No explicit About section" only if there's truly no information about the organization, "Could add direct phone number" if only addresses are present)
- recommendations: An array of actionable advice strings for improvement (e.g., "Consider adding an explicit Services section header", "Include direct phone number for easier contact")

llms.txt content:
${content}

Return only valid JSON in this format:
{
  "score": number,
  "summary": string,
  "missing_sections": string[],
  "recommendations": string[]
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
    console.error('[LlmsAnalyzer] Error analyzing llms.txt:', error);
    
    // Return a default error response
    return {
      score: 0,
      summary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      missing_sections: ['Unable to complete analysis'],
      recommendations: ['Ensure OpenAI API key is valid and try again'],
    };
  }
}

