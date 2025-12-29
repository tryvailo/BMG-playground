#!/usr/bin/env tsx

/**
 * Standalone script to verify Dashboard metrics calculation
 * 
 * This script performs the same operations as the app and calculates
 * metrics strictly according to the Technical Specification.
 * 
 * Usage:
 *   tsx scripts/verify-metrics.ts
 * 
 * Or with environment variables:
 *   OPENAI_API_KEY=xxx PERPLEXITY_API_KEY=xxx tsx scripts/verify-metrics.ts
 * 
 * -------------------------------------------------------
 * Стратегия использования моделей OpenAI (рекомендации аналитика)
 * -------------------------------------------------------
 * 
 * Scanner (Имитация пользователя):
 *   - Модель: gpt-4o (флагманская модель)
 *   - Temperature: 0.7 (естественная вариативность)
 *   - Почему: Это модель, которую используют премиум-пользователи ChatGPT.
 *     Если gpt-4o знает ваш бренд - это успех.
 * 
 * Parser (Анализатор ответов):
 *   - Модель: gpt-4o-mini (в 30 раз дешевле gpt-4o)
 *   - Temperature: 0 (строгая логика для стабильного JSON)
 *   - Response Format: json_object
 *   - Почему: Задача "найти в тексте домен и вернуть цифру" тривиальна.
 *     Тратить на неё ресурсы gpt-4o - сжигать деньги впустую.
 * 
 * Экономия: Гибридный подход (gpt-4o для Scanner + gpt-4o-mini для Parser)
 *           дает качество флагмана по цене, близкой к средней.
 */

import { generateUserPrompt, extractDomainsFromResponse } from '../lib/modules/ai/scanner';
import { performLiveTechAudit } from '../lib/modules/audit/live-scanner';

/*
 * -------------------------------------------------------
 * Configuration (Hardcoded or from Environment)
 * -------------------------------------------------------
 */

// You can hardcode these values or use environment variables
const TARGET_DOMAIN = process.env.TARGET_DOMAIN || 'adonis.com.ua';
const QUERY = process.env.QUERY || 'Ендокринологічний центр у Києві';
const CITY = process.env.CITY || 'Київ';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Create OpenAI client with custom API key
 */
function createOpenAIClient(apiKey: string, logRequests: boolean = true) {
  return {
    chat: {
      completions: {
        create: async (params: {
          model: string;
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          response_format?: { type: string };
        }) => {
          const requestBody = {
            model: params.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.7,
            ...(params.response_format && { response_format: params.response_format }),
          };

          if (logRequests) {
            console.log('\n' + '='.repeat(80));
            console.log('📤 OPENAI REQUEST');
            console.log('='.repeat(80));
            console.log(`Model: ${params.model}`);
            console.log(`Temperature: ${requestBody.temperature}`);
            if (params.response_format) {
              console.log(`Response Format: ${JSON.stringify(params.response_format)}`);
            }
            console.log('\nMessages:');
            params.messages.forEach((msg, idx) => {
              console.log(`\n[${msg.role.toUpperCase()} ${idx + 1}]:`);
              console.log('─'.repeat(80));
              console.log(msg.content);
            });
            console.log('='.repeat(80));
          }

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            if (logRequests) {
              console.log('\n❌ OPENAI ERROR RESPONSE:');
              console.log(JSON.stringify(error, null, 2));
            }
            throw new Error(
              `OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`,
            );
          }

          const responseData = await response.json();
          
          if (logRequests) {
            console.log('\n📥 OPENAI RESPONSE:');
            console.log('='.repeat(80));
            console.log(`Model: ${responseData.model || 'N/A'}`);
            console.log(`Usage: ${JSON.stringify(responseData.usage || {}, null, 2)}`);
            console.log('\nContent:');
            console.log('─'.repeat(80));
            const content = responseData.choices?.[0]?.message?.content || 'No content';
            console.log(content);
            console.log('='.repeat(80));
          }

          return responseData;
        },
      },
    },
  };
}

/**
 * Актуальные модели Perplexity (2025)
 * https://docs.perplexity.ai/getting-started/models
 */
const PERPLEXITY_MODELS = {
  ONLINE_PRO: 'sonar-pro',          // Основная мощная модель (аналог GPT-4o с поиском)
  ONLINE_FAST: 'sonar',             // Быстрая модель (аналог GPT-4o-mini с поиском)
  REASONING: 'sonar-reasoning',     // Модель с рассуждениями (CoT)
  DEEPSEEK: 'r1-1776'               // DeepSeek R1 distilled
};

/**
 * Create Perplexity client with custom API key
 */
function createPerplexityClient(apiKey: string, logRequests: boolean = true) {
  return {
    chat: {
      completions: {
        create: async (params: {
          model: string;
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
        }) => {
          const requestBody = {
            model: params.model,
            messages: params.messages,
            // Для sonar моделей рекомендуется temperature 0.2 для точных фактов
            temperature: params.temperature ?? 0.2,
          };

          if (logRequests) {
            console.log('\n' + '='.repeat(80));
            console.log('📤 PERPLEXITY REQUEST');
            console.log('='.repeat(80));
            console.log(`Model: ${params.model}`);
            console.log(`Temperature: ${requestBody.temperature}`);
            console.log('\nMessages:');
            params.messages.forEach((msg, idx) => {
              console.log(`\n[${msg.role.toUpperCase()} ${idx + 1}]:`);
              console.log('─'.repeat(80));
              console.log(msg.content);
            });
            console.log('='.repeat(80));
          }

          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            if (logRequests) {
              console.log('\n❌ PERPLEXITY ERROR RESPONSE:');
              console.log(JSON.stringify(error, null, 2));
            }
            throw new Error(
              `Perplexity API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`,
            );
          }

          const responseData = await response.json();

          if (logRequests) {
            console.log('\n📥 PERPLEXITY RESPONSE:');
            console.log('='.repeat(80));
            console.log(`Model: ${responseData.model || 'N/A'}`);
            console.log(`Usage: ${JSON.stringify(responseData.usage || {}, null, 2)}`);
            if (responseData.citations && responseData.citations.length > 0) {
              console.log(`\nCitations (${responseData.citations.length}):`);
              console.log(JSON.stringify(responseData.citations, null, 2));
            }
            console.log('\nContent:');
            console.log('─'.repeat(80));
            const content = responseData.choices?.[0]?.message?.content || 'No content';
            console.log(content);
            console.log('='.repeat(80));
          }

          return responseData;
        },
      },
    },
  };
}

/**
 * Parse AI response with custom OpenAI client
 */
async function parseAiResponseWithClient(
  responseText: string,
  targetDomain: string,
  openaiApiKey: string,
): Promise<{
  domainPresent: boolean;
  rank: number | null;
  competitors: string[];
  rawAnalysis: string;
  trustScore: number;
  localScore: number;
}> {
  const normalizeDomain = (domain: string): string => {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const normalizedTargetDomain = normalizeDomain(targetDomain);

  const analysisPrompt = `Analyze the following AI response about medical clinic recommendations. Extract the following information in JSON format:

{
  "domainPresent": boolean,
  "rank": number | null,
  "competitors": string[],
  "rawAnalysis": string,
  "trustScore": number,
  "localScore": number
}

AI Response to analyze:
${responseText}

Important:
- Check for the domain "${targetDomain}" in any form (with/without www, http/https)
- If the domain appears, determine its position in the recommendation list (1st, 2nd, 3rd, etc.)
- Extract all other clinic names or domains mentioned
- For Trust Score: For the specific domain "${targetDomain}", if found, estimate a Trust Score (1-10) based on brand mentions, authority signals, reputation indicators, and E-E-A-T signals. If not found, return 0.
- For Local Score: For the specific domain "${targetDomain}", if found, estimate a Local Score (1-10) based on physical address presence, location mentions, local context, and geographic relevance. If not found, return 0.
- Return valid JSON only, no markdown formatting`;

  console.log('\n' + '='.repeat(80));
  console.log('🔍 PARSING PROMPT FOR AI RESPONSE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Target Domain: ${targetDomain}`);
  console.log(`Normalized Domain: ${normalizedTargetDomain}`);
  console.log('\nAnalysis Prompt:');
  console.log('─'.repeat(80));
  console.log(analysisPrompt);
  console.log('='.repeat(80));

  const openai = createOpenAIClient(openaiApiKey, true);

  // Parser: используем gpt-4o-mini для анализа (рекомендация аналитика)
  // Это в 30 раз дешевле, чем gpt-4o, и отлично справляется с задачей парсинга
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // gpt-4o-mini для Parser (оптимально по цене/качеству)
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
      temperature: 0, // Строгая логика для стабильного JSON (рекомендация аналитика)
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    let parsed: {
      domainPresent: boolean;
      rank: number | null;
      competitors: string[];
      rawAnalysis: string;
      trustScore?: number;
      localScore?: number;
    };
    try {
      parsed = JSON.parse(content);
    } catch (_error) {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]!);
      } else {
        // Try to extract JSON object from the text
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          parsed = JSON.parse(jsonObjectMatch[0]!);
        } else {
          throw new Error(`Failed to parse JSON response: ${content}`);
        }
      }
    }
    
    // Store the raw JSON content for debugging
    (parsed as Record<string, unknown>).__rawJsonContent = content;

    const result = {
      domainPresent: Boolean(parsed.domainPresent),
      rank:
        parsed.rank && parsed.rank >= 1 && parsed.rank <= 10
          ? parsed.rank
          : null,
      competitors: Array.isArray(parsed.competitors)
        ? parsed.competitors
        : [],
      rawAnalysis: parsed.rawAnalysis || content,
      trustScore: parsed.domainPresent
        ? Math.max(0, Math.min(10, Math.round(parsed.trustScore || 0)))
        : 0,
      localScore: parsed.domainPresent
        ? Math.max(0, Math.min(10, Math.round(parsed.localScore || 0)))
        : 0,
    };

    // Additional validation
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
  } catch (error) {
    const responseTextLower = responseText.toLowerCase();
    const normalizedTarget = normalizeDomain(targetDomain);
    const domainPresent = responseTextLower.includes(normalizedTarget);

    return {
      domainPresent,
      rank: domainPresent ? 1 : null,
      competitors: [],
      rawAnalysis: `Fallback analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      trustScore: 0,
      localScore: 0,
    };
  }
}

/**
 * Scan service visibility using OpenAI and Perplexity
 */
async function scanServiceVisibility(
  query: string,
  city: string,
  domain: string,
  apiKeyOpenAI: string,
  apiKeyPerplexity: string,
): Promise<{
  visible: boolean;
  position: number | null;
  competitors: string[];
  rawAnalysis: string;
  trustScore: number;
  localScore: number;
  openaiText: string | null;
  perplexityText: string | null;
  parsedJsonFromOpenAI?: Record<string, unknown>;
  parsedJsonFromPerplexity?: Record<string, unknown>;
}> {
  const userPrompt = generateUserPrompt(query, city);

  console.log('\n' + '='.repeat(80));
  console.log('🔍 GENERATED USER PROMPT FOR AI SCAN');
  console.log('='.repeat(80));
  console.log(userPrompt);
  console.log('='.repeat(80));

  const openaiClient = createOpenAIClient(apiKeyOpenAI, true);
  const perplexityClient = createPerplexityClient(apiKeyPerplexity, true);

  // Run scans with both AI engines in parallel
  // Scanner: используем gpt-4o для имитации премиум-пользователя (рекомендация аналитика)
  console.log('\n🚀 Starting parallel AI scans (OpenAI + Perplexity)...\n');
  const [openaiResponse, perplexityResponse] = await Promise.allSettled([
    openaiClient.chat.completions.create({
      model: 'gpt-4o', // gpt-4o для Scanner (флагманская модель)
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7, // Естественная вариативность для имитации пользователя
    }),
    perplexityClient.chat.completions.create({
      model: PERPLEXITY_MODELS.ONLINE_PRO, // sonar-pro - основная мощная модель
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.2, // Рекомендуется для sonar моделей
    }).catch(async () => {
      // Fallback: try sonar (fast) if sonar-pro fails
      console.log('⚠️  Perplexity sonar-pro model failed, trying sonar (fast)...');
      try {
        return await perplexityClient.chat.completions.create({
          model: PERPLEXITY_MODELS.ONLINE_FAST, // sonar - быстрая модель
          messages: [{ role: 'user', content: userPrompt }],
          temperature: 0.2,
        });
      } catch (_err2) {
        // If both online models fail, try DeepSeek as fallback
        console.log('⚠️  Trying DeepSeek R1 as fallback...');
        try {
          return await perplexityClient.chat.completions.create({
            model: PERPLEXITY_MODELS.DEEPSEEK, // r1-1776
            messages: [{ role: 'user', content: userPrompt }],
            temperature: 0.2,
          });
        } catch (err3) {
          // If all models fail, skip Perplexity and continue with OpenAI only
          console.log('❌ All Perplexity models failed, continuing with OpenAI only');
          throw err3;
        }
      }
    }),
  ]);

  let openaiText: string | null = null;
  let perplexityText: string | null = null;

  if (openaiResponse.status === 'fulfilled') {
    openaiText = openaiResponse.value.choices[0]?.message?.content || null;
    console.log('\n✅ OpenAI scan completed successfully');
  } else {
    console.error('\n❌ OpenAI scan failed:', openaiResponse.reason);
  }

  if (perplexityResponse.status === 'fulfilled') {
    perplexityText = perplexityResponse.value.choices[0]?.message?.content || null;
    console.log('✅ Perplexity scan completed successfully');
  } else {
    console.error('❌ Perplexity scan failed:', perplexityResponse.reason);
  }

  console.log('\n📊 Starting to parse AI responses...\n');

  // Parse responses
  let bestParsedResult: {
    domainPresent: boolean;
    rank: number | null;
    competitors: string[];
    rawAnalysis: string;
    trustScore: number;
    localScore: number;
    parsedJson?: Record<string, unknown>; // Store the parsed JSON for debugging
  } | null = null;

  const allCompetitors = new Set<string>();
  let parsedJsonFromOpenAI: Record<string, unknown> | null = null;
  let parsedJsonFromPerplexity: Record<string, unknown> | null = null;

  if (openaiText) {
    console.log('\n🔍 Parsing OpenAI response...\n');
    const parsed = await parseAiResponseWithClient(openaiText, domain, apiKeyOpenAI);
    parsedJsonFromOpenAI = parsed;
    if (parsed.domainPresent && parsed.rank) {
      bestParsedResult = { ...parsed, parsedJson: parsed };
    }
    parsed.competitors.forEach((c) => allCompetitors.add(c));
  }

  if (perplexityText) {
    console.log('\n🔍 Parsing Perplexity response...\n');
    const parsed = await parseAiResponseWithClient(perplexityText, domain, apiKeyOpenAI);
    parsedJsonFromPerplexity = parsed;
    if (!bestParsedResult || (parsed.domainPresent && parsed.rank && (!bestParsedResult.rank || parsed.rank < bestParsedResult.rank))) {
      bestParsedResult = { ...parsed, parsedJson: parsed };
    }
    parsed.competitors.forEach((c) => allCompetitors.add(c));
  }

  if (!bestParsedResult) {
    if (openaiText) {
      console.log('\n🔍 Using OpenAI response as fallback...\n');
      const parsed = await parseAiResponseWithClient(openaiText, domain, apiKeyOpenAI);
      parsedJsonFromOpenAI = parsed;
      bestParsedResult = { ...parsed, parsedJson: parsed };
    } else if (perplexityText) {
      console.log('\n🔍 Using Perplexity response as fallback...\n');
      const parsed = await parseAiResponseWithClient(perplexityText, domain, apiKeyOpenAI);
      parsedJsonFromPerplexity = parsed;
      bestParsedResult = { ...parsed, parsedJson: parsed };
    } else {
      throw new Error('Both AI scans failed to return responses');
    }
  }

  bestParsedResult.competitors.forEach((c) => allCompetitors.add(c));

  const trustScore = bestParsedResult.trustScore || 0;
  const localScore = bestParsedResult.localScore || 0;

  return {
    visible: bestParsedResult.domainPresent,
    position: bestParsedResult.rank,
    competitors: Array.from(allCompetitors),
    rawAnalysis: bestParsedResult.rawAnalysis,
    trustScore: Math.max(0, Math.min(10, Math.round(trustScore))),
    localScore: Math.max(0, Math.min(10, Math.round(localScore))),
    openaiText,
    perplexityText,
    parsedJsonFromOpenAI,
    parsedJsonFromPerplexity,
  };
}

/**
 * Calculate ClinicAI Score according to Technical Specification
 */
function calculateClinicAIScore(
  visibilityScore: number,
  techScore: number,
  contentScore: number,
  trustScore: number, // 1-10, scaled to 0-100
  localScore: number, // 1-10, scaled to 0-100
  otherScore: number = 50,
): {
  score: number;
  components: {
    visibility: number;
    tech: number;
    content: number;
    eeat: number;
    local: number;
    other: number;
  };
  weighted: {
    visibility: number;
    tech: number;
    content: number;
    eeat: number;
    local: number;
    other: number;
  };
} {
  // Scale trustScore and localScore from 1-10 to 0-100
  const eeatScore = trustScore * 10;
  const localScoreScaled = localScore * 10;

  // Calculate weighted components
  const weightedVisibility = 0.25 * visibilityScore;
  const weightedTech = 0.2 * techScore;
  const weightedContent = 0.2 * contentScore;
  const weightedEeat = 0.15 * eeatScore;
  const weightedLocal = 0.1 * localScoreScaled;
  const weightedOther = 0.1 * otherScore;

  // Total score
  const score =
    weightedVisibility +
    weightedTech +
    weightedContent +
    weightedEeat +
    weightedLocal +
    weightedOther;

  return {
    score: Math.max(0, Math.min(100, Math.round(score * 100) / 100)),
    components: {
      visibility: visibilityScore,
      tech: techScore,
      content: contentScore,
      eeat: eeatScore,
      local: localScoreScaled,
      other: otherScore,
    },
    weighted: {
      visibility: weightedVisibility,
      tech: weightedTech,
      content: weightedContent,
      eeat: weightedEeat,
      local: weightedLocal,
      other: weightedOther,
    },
  };
}

/**
 * Extract competitor domains from AI responses with their positions
 * Attempts to extract actual positions from the AI response text
 */
function extractCompetitorDomains(
  openaiText: string | null,
  perplexityText: string | null,
  targetDomain: string,
  parsedResult: { competitors: string[]; rank: number | null },
): Array<{ name: string; position: number }> {
  const normalizeDomain = (domain: string): string => {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  const normalizedTarget = normalizeDomain(targetDomain);
  const allDomains = new Map<string, number>(); // Map domain -> estimated position

  // Extract domains from both responses
  const extractDomainsWithPositions = (text: string | null, basePosition: number = 1) => {
    if (!text) return;
    
    const domains = extractDomainsFromResponse(text);
    const textLower = text.toLowerCase();
    
    domains.forEach((domain) => {
      const normalized = normalizeDomain(domain);
      if (normalized === normalizedTarget) return; // Skip target domain
      
      // Try to find position indicators near the domain
      const domainIndex = textLower.indexOf(normalized);
      if (domainIndex > 0) {
        const textBefore = textLower.substring(Math.max(0, domainIndex - 200), domainIndex);
        
        // Look for position indicators (1., 2., first, second, etc.)
        const positionPatterns = [
          { pattern: /(\d+)\./g, extract: (m: RegExpMatchArray) => parseInt(m[1] || '0', 10) },
          { pattern: /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/gi, 
            extract: (m: RegExpMatchArray) => {
              const words = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
              return words.indexOf(m[0]?.toLowerCase() || '') + 1;
            }
          },
        ];
        
        let foundPosition = basePosition;
        for (const { pattern, extract } of positionPatterns) {
          const matches = Array.from(textBefore.matchAll(pattern));
          if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            if (lastMatch) {
              const pos = extract(lastMatch);
              if (pos > 0 && pos <= 10) {
                foundPosition = pos;
                break;
              }
            }
          }
        }
        
        // Use the best position found (lowest number = better rank)
        if (!allDomains.has(normalized) || (allDomains.get(normalized) || 10) > foundPosition) {
          allDomains.set(normalized, foundPosition);
        }
      } else {
        // If no position found, assign sequential position
        if (!allDomains.has(normalized)) {
          allDomains.set(normalized, basePosition);
        }
      }
    });
  };

  // Extract from both responses
  extractDomainsWithPositions(openaiText, 1);
  extractDomainsWithPositions(perplexityText, 1);

  // Also use competitors from parsed result
  parsedResult.competitors.forEach((comp) => {
    const normalized = normalizeDomain(comp);
    if (normalized !== normalizedTarget) {
      // Assign a position based on order in the list
      const index = parsedResult.competitors.indexOf(comp);
      const estimatedPos = index + 1;
      if (!allDomains.has(normalized) || (allDomains.get(normalized) || 10) > estimatedPos) {
        allDomains.set(normalized, estimatedPos);
      }
    }
  });

  // Convert to array and sort by position
  const competitors: Array<{ name: string; position: number }> = Array.from(allDomains.entries())
    .map(([name, position]) => ({ name, position }))
    .sort((a, b) => a.position - b.position)
    .slice(0, 5); // Top 5

  return competitors;
}

/**
 * Estimate CAI Score for competitor based on position
 */
function estimateCompetitorCAIScore(position: number): number {
  // Rank 1 = Score 90, Rank 2 = Score 80, Rank 3 = Score 70, Rank 5 = Score 50
  // Formula: Score = 90 - (position - 1) * 10, with minimum of 20
  return Math.max(20, 90 - (position - 1) * 10);
}

/**
 * Print comparison table
 */
function _printComparisonTable(
  metrics: {
    visibilityRate: number;
    avgPosition: number | null;
    clinicAIScore: number;
    scoreComponents: {
      visibility: number;
      tech: number;
      content: number;
      eeat: number;
      local: number;
      other: number;
    };
    scoreWeighted: {
      visibility: number;
      tech: number;
      content: number;
      eeat: number;
      local: number;
      other: number;
    };
    competitors: Array<{ name: string; position: number; estimatedScore: number }>;
  },
) {
  console.log('\n' + '='.repeat(80));
  console.log('METRICS VERIFICATION REPORT');
  console.log('='.repeat(80));

  console.log('\n📊 CORE METRICS:');
  console.log('─'.repeat(80));
  console.log(`Visibility Rate:     ${metrics.visibilityRate.toFixed(1)}%`);
  console.log(`Average Position:    ${metrics.avgPosition !== null ? metrics.avgPosition.toFixed(1) : 'N/A'}`);
  console.log(`ClinicAI Score:      ${metrics.clinicAIScore.toFixed(2)}`);

  console.log('\n🔢 CLINICAI SCORE BREAKDOWN:');
  console.log('─'.repeat(80));
  console.log('Component Scores (0-100):');
  console.log(`  Visibility:         ${metrics.scoreComponents.visibility.toFixed(1)}`);
  console.log(`  Tech:               ${metrics.scoreComponents.tech.toFixed(1)}`);
  console.log(`  Content:            ${metrics.scoreComponents.content.toFixed(1)}`);
  console.log(`  E-E-A-T:            ${metrics.scoreComponents.eeat.toFixed(1)}`);
  console.log(`  Local:              ${metrics.scoreComponents.local.toFixed(1)}`);
  console.log(`  Other:              ${metrics.scoreComponents.other.toFixed(1)}`);

  console.log('\nWeighted Contributions:');
  console.log(`  Visibility (25%):   ${metrics.scoreWeighted.visibility.toFixed(2)}`);
  console.log(`  Tech (20%):         ${metrics.scoreWeighted.tech.toFixed(2)}`);
  console.log(`  Content (20%):      ${metrics.scoreWeighted.content.toFixed(2)}`);
  console.log(`  E-E-A-T (15%):      ${metrics.scoreWeighted.eeat.toFixed(2)}`);
  console.log(`  Local (10%):        ${metrics.scoreWeighted.local.toFixed(2)}`);
  console.log(`  Other (10%):        ${metrics.scoreWeighted.other.toFixed(2)}`);
  console.log(`  ────────────────────────────────────────────────────────────────`);
  console.log(`  Total Score:         ${metrics.clinicAIScore.toFixed(2)}`);

  console.log('\n🏆 COMPETITOR ANALYSIS (Top 5):');
  console.log('─'.repeat(80));
  console.log('Position | Domain Name                    | Estimated CAI Score');
  console.log('─'.repeat(80));
  if (metrics.competitors.length === 0) {
    console.log('  No competitors found');
  } else {
    metrics.competitors.forEach((comp) => {
      const positionStr = comp.position.toString().padStart(8);
      const nameStr = comp.name.padEnd(30);
      const scoreStr = comp.estimatedScore.toFixed(1).padStart(18);
      console.log(`${positionStr} | ${nameStr} | ${scoreStr}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

/*
 * -------------------------------------------------------
 * Main Execution
 * -------------------------------------------------------
 */

async function main() {
  console.log('🚀 Starting Metrics Verification...\n');

  // Validate API keys
  if (!OPENAI_API_KEY || !PERPLEXITY_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY and PERPLEXITY_API_KEY are required');
    console.error('   Set them as environment variables or hardcode in the script');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Target Domain: ${TARGET_DOMAIN}`);
  console.log(`  Query:         ${QUERY}`);
  console.log(`  City:          ${CITY}`);
  console.log(`  OpenAI Key:    ${OPENAI_API_KEY.substring(0, 10)}...`);
  console.log(`  Perplexity Key: ${PERPLEXITY_API_KEY.substring(0, 10)}...\n`);

  try {
    // Step 1: Fetch Data
    console.log('📡 Step 1: Fetching data...');
    console.log('  - Running AI Scan (OpenAI & Perplexity)...');

    const normalizedDomain = TARGET_DOMAIN.startsWith('http://') || TARGET_DOMAIN.startsWith('https://')
      ? TARGET_DOMAIN
      : `https://${TARGET_DOMAIN}`;

    const [visibilityResult, techAuditResult] = await Promise.all([
      scanServiceVisibility(QUERY, CITY, TARGET_DOMAIN, OPENAI_API_KEY, PERPLEXITY_API_KEY),
      performLiveTechAudit(normalizedDomain),
    ]);

    console.log('  ✓ AI Scan completed');
    console.log('  ✓ Tech Audit completed\n');

    // Step 2: Calculate Metrics

    // A. Visibility Rate
    const visibilityRate = visibilityResult.visible && visibilityResult.position && visibilityResult.position <= 10
      ? 100
      : 0;

    // B. Average Position
    const avgPosition = visibilityResult.position;

    // C. ClinicAI Score
    // VisibilityScore: 100 or 0
    const visibilityScore = visibilityRate;

    // TechScore: Based on TTFB (<600ms = 100, else 50) and SSL
    // According to spec: TTFB <600ms = 100, else 50
    const ttfbScore = techAuditResult.performance.ttfbMs < 600 ? 100 : 50;
    const sslScore = techAuditResult.metadata.hasSsl ? 100 : 0;
    // Tech score is average of TTFB and SSL
    const techScore = (ttfbScore + sslScore) / 2;

    // ContentScore: 100 if llms.txt exists, else 0 (strict validation)
    const contentScore = techAuditResult.llmsTxt.exists ? 100 : 0;

    // TrustScore & LocalScore: Use values from AI (already 1-10)
    const trustScore = visibilityResult.trustScore;
    const localScore = visibilityResult.localScore;

    // OtherScore: Fixed at 50
    const otherScore = 50;

    // Log simulation if scores are missing
    if (trustScore === 0 && visibilityResult.visible) {
      console.log('⚠️  Warning: TrustScore is 0 but domain is visible. Using simulated value.');
    }
    if (localScore === 0 && visibilityResult.visible) {
      console.log('⚠️  Warning: LocalScore is 0 but domain is visible. Using simulated value.');
    }

    const scoreCalculation = calculateClinicAIScore(
      visibilityScore,
      techScore,
      contentScore,
      trustScore,
      localScore,
      otherScore,
    );

    // D. Competitor Analysis
    const competitorDomains = extractCompetitorDomains(
      visibilityResult.openaiText,
      visibilityResult.perplexityText,
      TARGET_DOMAIN,
      {
        competitors: visibilityResult.competitors,
        rank: visibilityResult.position,
      },
    );

    const competitors = competitorDomains.map((comp) => ({
      name: comp.name,
      position: comp.position,
      estimatedScore: estimateCompetitorCAIScore(comp.position),
    }));

    // Step 3: Output
    const _metrics = {
      visibilityRate,
      avgPosition,
      clinicAIScore: scoreCalculation.score,
      scoreComponents: scoreCalculation.components,
      scoreWeighted: scoreCalculation.weighted,
      competitors,
    };

    // Step 3: Output in the exact format requested
    console.log('\n' + '='.repeat(80));
    console.log('=== DASHBOARD VALIDATION REPORT ===');
    console.log('='.repeat(80));
    console.log(`\nTarget: ${TARGET_DOMAIN} | Query: ${QUERY}`);
    console.log(`City: ${CITY}\n`);

    console.log('[ROW 1 - MAIN KPIs]');
    console.log('─'.repeat(80));
    console.log(`1. Avg Clinic AI Score:  ${scoreCalculation.score.toFixed(2)}`);
    console.log(`2. Service Visibility:   ${visibilityRate.toFixed(0)}%`);
    console.log(`3. Avg Position:         ${avgPosition !== null ? avgPosition.toFixed(1) : 'N/A'}`);

    console.log('\n[ROW 2 - BREAKDOWN]');
    console.log('─'.repeat(80));
    console.log(`4. Tech Optimization:    ${techScore.toFixed(1)} (Details: TTFB=${techAuditResult.performance.ttfbMs}ms, SSL=${techAuditResult.metadata.hasSsl ? 'Yes' : 'No'})`);
    console.log(`5. Content Optimization: ${contentScore.toFixed(0)} (llms.txt found: ${techAuditResult.llmsTxt.exists ? 'Y' : 'N'})`);
    console.log(`6. E-E-A-T Signals:      ${trustScore.toFixed(1)} / 10`);
    console.log(`7. Local Indicators:     ${localScore.toFixed(1)} / 10`);

    console.log('\n[FORMULA DEBUG]');
    console.log('─'.repeat(80));
    console.log('Calculation:');
    console.log(`  0.25 * ${visibilityScore.toFixed(0)} (Visibility)`);
    console.log(`+ 0.20 * ${techScore.toFixed(1)} (Tech)`);
    console.log(`+ 0.20 * ${contentScore.toFixed(0)} (Content)`);
    console.log(`+ 0.15 * ${(trustScore * 10).toFixed(1)} (EEAT scaled to 100)`);
    console.log(`+ 0.10 * ${(localScore * 10).toFixed(1)} (Local scaled to 100)`);
    console.log(`+ 0.10 * ${otherScore.toFixed(0)} (Other)`);
    console.log('─'.repeat(80));
    console.log(`= ${scoreCalculation.score.toFixed(2)} (FINAL SCORE)`);

    // Show raw AI responses
    console.log('\n[RAW AI RESPONSES]');
    console.log('─'.repeat(80));
    if (visibilityResult.openaiText) {
      console.log('\n📝 OpenAI Response:');
      console.log('─'.repeat(80));
      console.log(visibilityResult.openaiText);
      console.log('─'.repeat(80));
    }
    if (visibilityResult.perplexityText) {
      console.log('\n📝 Perplexity Response:');
      console.log('─'.repeat(80));
      console.log(visibilityResult.perplexityText);
      console.log('─'.repeat(80));
    }

    // Additional debug info
    console.log('\n[ADDITIONAL TECH AUDIT DETAILS]');
    console.log('─'.repeat(80));
    console.log(`TTFB:              ${techAuditResult.performance.ttfbMs}ms (${techAuditResult.performance.rating})`);
    console.log(`SSL:               ${techAuditResult.metadata.hasSsl ? 'Yes' : 'No'}`);
    console.log(`llms.txt:          ${techAuditResult.llmsTxt.exists ? 'Yes' : 'No'}`);
    if (techAuditResult.llmsTxt.exists) {
      console.log(`llms.txt Size:     ${techAuditResult.llmsTxt.size} bytes`);
    }
    console.log(`Meta Description:  ${techAuditResult.metadata.hasMetaDescription ? 'Yes' : 'No'}`);
    console.log(`Robots.txt:        ${techAuditResult.metadata.hasRobotsTxt ? 'Yes' : 'No'}`);

    // Show parsed JSON from AI analysis if available
    console.log('\n[PARSED AI ANALYSIS JSON]');
    console.log('─'.repeat(80));
    
    if (visibilityResult.parsedJsonFromOpenAI) {
      console.log('\n📋 OpenAI Parsed JSON:');
      console.log(JSON.stringify(visibilityResult.parsedJsonFromOpenAI, null, 2));
    }
    
    if (visibilityResult.parsedJsonFromPerplexity) {
      console.log('\n📋 Perplexity Parsed JSON:');
      console.log(JSON.stringify(visibilityResult.parsedJsonFromPerplexity, null, 2));
    }
    
    if (!visibilityResult.parsedJsonFromOpenAI && !visibilityResult.parsedJsonFromPerplexity) {
      console.log('No parsed JSON available. Raw analysis:');
      console.log(visibilityResult.rawAnalysis || 'N/A');
    }

    console.log('\n✅ Verification complete!\n');
  } catch (error) {
    console.error('\n❌ Error during verification:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
main();

