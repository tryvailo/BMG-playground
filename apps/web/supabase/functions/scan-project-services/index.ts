// Supabase Edge Function for scanning project services
// This function handles long-running scans using Perplexity and OpenAI APIs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  projectId: string;
}

interface Service {
  id: string;
  project_id: string;
  name: string;
  search_query: string;
  path: string | null;
  location_city: string | null;
  location_country: string | null;
}

interface Project {
  id: string;
  organization_id: string;
  domain: string;
  name: string;
  settings: Record<string, unknown>;
}

interface ParsedResponse {
  domainPresent: boolean;
  rank: number | null;
  competitors: string[];
  rawAnalysis: string;
}

interface ScanResult {
  service_id: string;
  ai_engine: 'openai' | 'perplexity';
  visible: boolean;
  position: number | null;
  raw_response: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!openaiApiKey || !perplexityApiKey) {
      throw new Error('Missing AI API keys');
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const { projectId }: RequestBody = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'projectId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found', details: projectError }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const projectData = project as Project;

    // Fetch all services for this project
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('project_id', projectId);

    if (servicesError) {
      throw new Error(`Failed to fetch services: ${servicesError.message}`);
    }

    if (!services || services.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No services found for this project' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const servicesData = services as Service[];

    // Process each service
    const scanResults: ScanResult[] = [];
    const errors: Array<{ serviceId: string; error: string }> = [];

    for (const service of servicesData) {
      try {
        // Generate user prompt
        const city = service.location_city || 'New York';
        const userPrompt = `I'm looking for ${service.search_query} in ${city}. Can you recommend the top 5 clinics or medical facilities that provide this service? Please include their names, locations, and any relevant details about why you're recommending them.`;

        // Call Perplexity API
        let perplexityResponse: string | null = null;
        try {
          const perplexityRes = await fetch(
            'https://api.perplexity.ai/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${perplexityApiKey}`,
              },
              body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [{ role: 'user', content: userPrompt }],
                temperature: 0.7,
              }),
            },
          );

          if (perplexityRes.ok) {
            const perplexityData = await perplexityRes.json();
            perplexityResponse =
              perplexityData.choices?.[0]?.message?.content || null;
          }
        } catch (err) {
          console.error(`Perplexity error for service ${service.id}:`, err);
        }

        // Call OpenAI API
        let openaiResponse: string | null = null;
        try {
          const openaiRes = await fetch(
            'https://api.openai.com/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${openaiApiKey}`,
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: userPrompt }],
                temperature: 0.7,
              }),
            },
          );

          if (openaiRes.ok) {
            const openaiData = await openaiRes.json();
            openaiResponse = openaiData.choices?.[0]?.message?.content || null;
          }
        } catch (err) {
          console.error(`OpenAI error for service ${service.id}:`, err);
        }

        // Parse responses
        const aiEngines: Array<'openai' | 'perplexity'> = ['openai', 'perplexity'];
        const responses: Array<{ engine: 'openai' | 'perplexity'; text: string | null }> = [
          { engine: 'openai', text: openaiResponse },
          { engine: 'perplexity', text: perplexityResponse },
        ];

        for (const { engine, text } of responses) {
          if (!text) continue;

          // Parse AI response to find domain
          const parsed = await parseAiResponse(text, projectData.domain, openaiApiKey);

          // Create scan result
          const scanResult: ScanResult = {
            service_id: service.id,
            ai_engine: engine,
            visible: parsed.domainPresent,
            position: parsed.rank,
            raw_response: text,
          };

          scanResults.push(scanResult);

          // Insert scan into database
          const { error: insertError } = await supabase
            .from('scans')
            .insert({
              service_id: service.id,
              ai_engine: engine,
              visible: parsed.domainPresent,
              position: parsed.rank,
              raw_response: text,
              analyzed_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(
              `Failed to insert scan for service ${service.id}:`,
              insertError,
            );
            errors.push({
              serviceId: service.id,
              error: `Insert error: ${insertError.message}`,
            });
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error processing service ${service.id}:`, errorMessage);
        errors.push({
          serviceId: service.id,
          error: errorMessage,
        });
      }
    }

    // Calculate aggregated statistics
    const visibleScans = scanResults.filter((s) => s.visible);
    const totalScans = scanResults.length;
    const visibilityRate =
      totalScans > 0 ? (visibleScans.length / totalScans) * 100 : 0;

    const positions = visibleScans
      .map((s) => s.position)
      .filter((p): p is number => p !== null);
    const avgPosition =
      positions.length > 0
        ? positions.reduce((sum, p) => sum + p, 0) / positions.length
        : null;

    // Calculate clinic AI score (simplified - you may want to use the full calculator)
    const clinicAiScore = visibilityRate * 0.6 + (avgPosition ? (11 - avgPosition) * 4 : 0);

    // Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Upsert weekly stats
    const { error: statsError } = await supabase
      .from('weekly_stats')
      .upsert(
        {
          project_id: projectId,
          week_start: weekStartStr,
          clinic_ai_score: Math.round(clinicAiScore * 10) / 10,
          visability_score: Math.round(visibilityRate * 10) / 10,
          avg_position: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
          tech_score: null, // Would need to be calculated separately
        },
        {
          onConflict: 'project_id,week_start',
        },
      );

    if (statsError) {
      console.error('Failed to update weekly stats:', statsError);
    }

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        projectId,
        servicesProcessed: servicesData.length,
        scansCreated: scanResults.length,
        visibilityRate: Math.round(visibilityRate * 10) / 10,
        avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
        clinicAiScore: Math.round(clinicAiScore * 10) / 10,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge function error:', errorMessage);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

/**
 * Parse AI response to extract domain visibility information
 * Uses gpt-4o-mini to analyze the text
 */
async function parseAiResponse(
  responseText: string,
  targetDomain: string,
  openaiApiKey: string,
): Promise<ParsedResponse> {
  // Normalize domain for comparison
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
  "domainPresent": boolean,
  "rank": number | null,
  "competitors": string[],
  "rawAnalysis": string
}

AI Response to analyze:
${responseText}

Important:
- Check for the domain "${targetDomain}" in any form (with/without www, http/https)
- If the domain appears, determine its position in the recommendation list (1st, 2nd, 3rd, etc.)
- Extract all other clinic names or domains mentioned
- Return valid JSON only, no markdown formatting`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
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
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse JSON response
    let parsed: ParsedResponse;
    try {
      parsed = JSON.parse(content) as ParsedResponse;
    } catch {
      // Fallback: try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]!) as ParsedResponse;
      } else {
        throw new Error(`Failed to parse JSON response: ${content}`);
      }
    }

    // Validate and normalize
    const result: ParsedResponse = {
      domainPresent: Boolean(parsed.domainPresent),
      rank:
        parsed.rank && parsed.rank >= 1 && parsed.rank <= 10
          ? parsed.rank
          : null,
      competitors: Array.isArray(parsed.competitors)
        ? parsed.competitors
        : [],
      rawAnalysis: parsed.rawAnalysis || content,
    };

    // Additional validation: check if domain is actually present
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

    if (isActuallyPresent && !result.domainPresent) {
      result.domainPresent = true;
      // Simple rank estimation
      const domainIndex = responseTextLower.indexOf(normalizedTargetDomain);
      if (domainIndex > 0) {
        const textBeforeDomain = responseTextLower.substring(0, domainIndex);
        const clinicIndicators = ['1.', '2.', '3.', '4.', '5.', 'first', 'second', 'third'];
        const estimatedRank = clinicIndicators.reduce((count, indicator) => {
          return (
            count + (textBeforeDomain.match(new RegExp(indicator, 'gi'))?.length || 0)
          );
        }, 0);
        if (estimatedRank > 0 && estimatedRank <= 10) {
          result.rank = estimatedRank;
        }
      }
    }

    return result;
  } catch {
    // Fallback parsing
    const responseTextLower = responseText.toLowerCase();
    const normalizedTarget = normalizeDomain(targetDomain);
    const domainPresent = responseTextLower.includes(normalizedTarget);

    return {
      domainPresent,
      rank: domainPresent ? 1 : null,
      competitors: [],
      rawAnalysis: `Fallback analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

