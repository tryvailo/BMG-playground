'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';

import { generateUserPrompt } from '~/lib/modules/ai/scanner';
import { calculateClinicAIScore } from '~/lib/modules/analytics/calculator';
import { mapLiveScanToDashboard, type ScanResult } from '~/lib/modules/ai/simulation-adapter';
import type { EphemeralAuditResult } from '~/lib/modules/audit/ephemeral-audit';
import type { TechAuditResult } from '~/lib/modules/audit/live-scanner';
import type { DashboardData } from '~/components/dashboard/DashboardView';

/*
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
 * Auditor (Анализ llms.txt):
 *   - Модель: gpt-4o-mini
 *   - Почему: Анализ текста файла - простая задача.
 * 
 * Экономия: Гибридный подход (gpt-4o для Scanner + gpt-4o-mini для Parser)
 *           дает качество флагмана по цене, близкой к средней.
 */

/*
 * -------------------------------------------------------
 * Playground Input Schema
 * -------------------------------------------------------
 */

const PlaygroundInputSchema = z.object({
  apiKeyOpenAI: z.string().min(1, 'OpenAI API key is required'),
  apiKeyPerplexity: z.string().min(1, 'Perplexity API key is required'),
  apiKeyGooglePageSpeed: z.string().optional(),
  apiKeyFirecrawl: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  query: z.string().min(1, 'Query is required'),
  city: z.string().min(1, 'City is required'),
});

type PlaygroundInput = z.infer<typeof PlaygroundInputSchema>;

/*
 * -------------------------------------------------------
 * Типизация для OpenAI
 * -------------------------------------------------------
 */

const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';

const OPENAI_MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  GPT4_TURBO: 'gpt-4-turbo',
  GPT35_TURBO: 'gpt-3.5-turbo',
} as const;

type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS] | string;

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequestParams {
  model: OpenAIModel;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'text' | 'json_object' };
  user?: string;
  stream?: boolean;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIErrorDetail {
  message: string;
  type: string;
  param?: string;
  code?: string;
}

class OpenAIAPIError extends Error {
  public status: number;
  public code?: string;
  public type?: string;

  constructor(status: number, errorData: OpenAIErrorDetail) {
    super(errorData.message || 'Unknown OpenAI API Error');
    this.name = 'OpenAIAPIError';
    this.status = status;
    this.code = errorData.code;
    this.type = errorData.type;
  }
}

interface OpenAIClientConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: OpenAIModel;
}

interface OpenAIClient {
  chat: {
    completions: {
      create: (
        params: OpenAIRequestParams,
        options?: { signal?: AbortSignal }
      ) => Promise<OpenAIResponse>;
    };
  };
}

/*
 * -------------------------------------------------------
 * Типизация для Perplexity
 * -------------------------------------------------------
 */

const PERPLEXITY_DEFAULT_BASE_URL = 'https://api.perplexity.ai';

const PERPLEXITY_MODELS = {
  ONLINE_PRO: 'sonar-pro',
  ONLINE_FAST: 'sonar',
  REASONING: 'sonar-reasoning',
  DEEPSEEK: 'r1-1776',
} as const;

type PerplexityModel = (typeof PERPLEXITY_MODELS)[keyof typeof PERPLEXITY_MODELS] | string;

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityRequestParams {
  model: PerplexityModel;
  messages: PerplexityMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: PerplexityMessage;
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

interface PerplexityErrorDetail {
  message: string;
  type: string;
  param?: string;
  code?: string;
}

class PerplexityAPIError extends Error {
  public status: number;
  public code?: string;
  public type?: string;

  constructor(status: number, errorData: PerplexityErrorDetail) {
    super(errorData.message || 'Unknown Perplexity API Error');
    this.name = 'PerplexityAPIError';
    this.status = status;
    this.code = errorData.code;
    this.type = errorData.type;
  }
}

interface PerplexityClientConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: PerplexityModel;
}

interface PerplexityClient {
  chat: {
    completions: {
      create: (
        params: PerplexityRequestParams,
        options?: { signal?: AbortSignal }
      ) => Promise<PerplexityResponse>;
    };
  };
}

/*
 * -------------------------------------------------------
 * Утилиты для Retry
 * -------------------------------------------------------
 */

/**
 * Обертка для Retry с экспоненциальной задержкой
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelay?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  let delay = options.initialDelay ?? 1000;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      // Прекращаем попытки, если это не ошибка сети или не 429/5xx
      const isRetryable = 
        (error instanceof OpenAIAPIError || error instanceof PerplexityAPIError)
          ? (error.status === 429 || error.status >= 500)
          : true; // Network errors (fetch failed) are usually retryable

      if (attempt > maxRetries || !isRetryable) {
        throw error;
      }

      console.warn(`[Retry] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Экспоненциальный рост
    }
  }
  throw new Error('Unreachable');
}

/*
 * -------------------------------------------------------
 * Улучшенные клиенты OpenAI и Perplexity
 * -------------------------------------------------------
 */

/**
 * Create OpenAI client with custom API key (улучшенная версия)
 */
function createOpenAIClient(config: OpenAIClientConfig): OpenAIClient {
  const baseURL = (config.baseURL || OPENAI_DEFAULT_BASE_URL).replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  return {
    chat: {
      completions: {
        create: async (
          params: OpenAIRequestParams,
          options?: { signal?: AbortSignal }
        ): Promise<OpenAIResponse> => {
          // Валидация для JSON Mode
          if (params.response_format?.type === 'json_object') {
            const hasJsonWord = params.messages.some(m => 
              m.content.toLowerCase().includes('json')
            );
            if (!hasJsonWord) {
              console.warn('⚠️ Warning: JSON mode requires the word "JSON" in messages.');
            }
          }

          const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...params,
              model: params.model || config.defaultModel || OPENAI_MODELS.GPT4O_MINI,
            }),
            signal: options?.signal,
          });

          if (!response.ok) {
            let errorData: OpenAIErrorDetail = { message: response.statusText, type: 'unknown' };
            try {
              const json = await response.json();
              if (json.error) errorData = json.error;
            } catch (_e) {
              // Ignore parsing error, use default
            }
            throw new OpenAIAPIError(response.status, errorData);
          }

          return response.json() as Promise<OpenAIResponse>;
        },
      },
    },
  };
}

/**
 * Create Perplexity client with custom API key (улучшенная версия)
 */
function createPerplexityClient(config: PerplexityClientConfig): PerplexityClient {
  const baseURL = (config.baseURL || PERPLEXITY_DEFAULT_BASE_URL).replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  return {
    chat: {
      completions: {
        create: async (
          params: PerplexityRequestParams,
          options?: { signal?: AbortSignal }
        ): Promise<PerplexityResponse> => {
          const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...params,
              model: params.model || config.defaultModel || PERPLEXITY_MODELS.ONLINE_FAST,
            }),
            signal: options?.signal,
          });

          if (!response.ok) {
            let errorData: PerplexityErrorDetail = { message: response.statusText, type: 'unknown' };
            try {
              const json = await response.json();
              if (json.error) errorData = json.error;
            } catch (_e) {
              // Ignore parsing error, use default
            }
            throw new PerplexityAPIError(response.status, errorData);
          }

          return response.json() as Promise<PerplexityResponse>;
        },
      },
    },
  };
}

/**
 * Result of service visibility scan
 */
interface ServiceVisibilityResult {
  visible: boolean;
  position: number | null;
  competitors: string[];
  rawAnalysis: string;
  trustScore: number; // 1-10, E-E-A-T trust score
  localScore: number; // 1-10, Local score
  openaiText: string | null; // Raw OpenAI response
  perplexityText: string | null; // Raw Perplexity response
  bestAiEngine: 'openai' | 'perplexity' | null; // Which AI found the domain
  llmLogs: LLMRequestLog[]; // Logs of all LLM requests and responses
}

/**
 * Log entry for LLM request/response
 */
export interface LLMRequestLog {
  provider: 'openai' | 'perplexity';
  model: string;
  role: 'scanner' | 'parser';
  prompt: string;
  requestBody: unknown;
  responseBody: {
    content: string;
    model: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  } | null;
  error?: string;
}

/**
 * Scan service visibility using OpenAI and Perplexity (с улучшенной обработкой ошибок)
 */
async function scanServiceVisibility(
  query: string,
  city: string,
  domain: string,
  apiKeyOpenAI: string,
  apiKeyPerplexity: string,
): Promise<ServiceVisibilityResult> {
  const userPrompt = generateUserPrompt(query, city);
  const llmLogs: LLMRequestLog[] = [];

  // Create AI clients с улучшенной конфигурацией
  // defaultModel используется только как fallback, в Scanner явно указываем gpt-4o
  const openaiClient = createOpenAIClient({
    apiKey: apiKeyOpenAI,
    defaultModel: OPENAI_MODELS.GPT4O_MINI, // Для Parser и других задач
  });
  const perplexityClient = createPerplexityClient({
    apiKey: apiKeyPerplexity,
    defaultModel: PERPLEXITY_MODELS.ONLINE_FAST,
  });

  // Prepare request bodies for logging
  const openaiRequestBody = {
    model: OPENAI_MODELS.GPT4O,
    messages: [{ role: 'user', content: userPrompt }],
    temperature: 0.7,
  };
  const perplexityRequestBody = {
    model: PERPLEXITY_MODELS.ONLINE_FAST,
    messages: [{ role: 'user', content: userPrompt }],
    temperature: 0.7,
  };

  // Run scans with both AI engines in parallel с retry логикой
  // Scanner: используем gpt-4o для имитации премиум-пользователя (рекомендация аналитика)
  const [openaiResponse, perplexityResponse] = await Promise.allSettled([
    withRetry(() =>
      openaiClient.chat.completions.create({
        model: OPENAI_MODELS.GPT4O, // gpt-4o для Scanner (флагманская модель)
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.7, // Естественная вариативность для имитации пользователя
      })
    ),
    withRetry(() =>
      perplexityClient.chat.completions.create({
        model: PERPLEXITY_MODELS.ONLINE_FAST,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.7,
      })
    ),
  ]);

  // Extract responses с улучшенной обработкой ошибок и логированием
  let openaiText: string | null = null;
  let perplexityText: string | null = null;

  if (openaiResponse.status === 'fulfilled') {
    const response = openaiResponse.value;
    openaiText = response.choices[0]?.message?.content || null;
    llmLogs.push({
      provider: 'openai',
      model: response.model || OPENAI_MODELS.GPT4O,
      role: 'scanner',
      prompt: userPrompt,
      requestBody: openaiRequestBody,
      responseBody: {
        content: openaiText || '',
        model: response.model,
        usage: response.usage,
      },
    });
  } else {
    const error = openaiResponse.reason;
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof OpenAIAPIError) {
      console.error(`[OpenAI] API error: ${error.status} - ${error.message}`);
    } else {
      console.error('[OpenAI] Scan failed:', error);
    }
    llmLogs.push({
      provider: 'openai',
      model: OPENAI_MODELS.GPT4O,
      role: 'scanner',
      prompt: userPrompt,
      requestBody: openaiRequestBody,
      responseBody: null,
      error: errorMessage,
    });
  }

  if (perplexityResponse.status === 'fulfilled') {
    const response = perplexityResponse.value;
    perplexityText = response.choices[0]?.message?.content || null;
    llmLogs.push({
      provider: 'perplexity',
      model: response.model || PERPLEXITY_MODELS.ONLINE_FAST,
      role: 'scanner',
      prompt: userPrompt,
      requestBody: perplexityRequestBody,
      responseBody: {
        content: perplexityText || '',
        model: response.model,
        usage: response.usage,
      },
    });
  } else {
    const error = perplexityResponse.reason;
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof PerplexityAPIError) {
      console.error(`[Perplexity] API error: ${error.status} - ${error.message}`);
    } else {
      console.error('[Perplexity] Scan failed:', error);
    }
    llmLogs.push({
      provider: 'perplexity',
      model: PERPLEXITY_MODELS.ONLINE_FAST,
      role: 'scanner',
      prompt: userPrompt,
      requestBody: perplexityRequestBody,
      responseBody: null,
      error: errorMessage,
    });
  }

  // Parse responses to find domain and competitors
  let bestParsedResult: {
    domainPresent: boolean;
    rank: number | null;
    competitors: string[];
    rawAnalysis: string;
    trustScore: number;
    localScore: number;
  } | null = null;

  let openaiParsed: {
    domainPresent: boolean;
    rank: number | null;
    competitors: string[];
    rawAnalysis: string;
    trustScore: number;
    localScore: number;
  } | null = null;
  let perplexityParsed: {
    domainPresent: boolean;
    rank: number | null;
    competitors: string[];
    rawAnalysis: string;
    trustScore: number;
    localScore: number;
  } | null = null;

  const allCompetitors = new Set<string>();

  // Try parsing both responses with error handling
  if (openaiText) {
    try {
      const parseResult = await parseAiResponseWithClient(openaiText, domain, apiKeyOpenAI, llmLogs);
      openaiParsed = parseResult.parsed;
      llmLogs.push(...parseResult.logs);
      if (openaiParsed.domainPresent && openaiParsed.rank) {
        bestParsedResult = openaiParsed;
      }
      openaiParsed.competitors.forEach((c) => allCompetitors.add(c));
    } catch (error) {
      console.error('[scanServiceVisibility] Error parsing OpenAI response:', error);
      llmLogs.push({
        provider: 'openai',
        model: OPENAI_MODELS.GPT4O_MINI,
        role: 'parser',
        prompt: `Parse response for domain: ${domain}`,
        requestBody: { text: openaiText.substring(0, 100) + '...' },
        responseBody: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (perplexityText) {
    try {
      const parseResult = await parseAiResponseWithClient(perplexityText, domain, apiKeyOpenAI, llmLogs);
      perplexityParsed = parseResult.parsed;
      llmLogs.push(...parseResult.logs);
      if (!bestParsedResult || (perplexityParsed.domainPresent && perplexityParsed.rank && (!bestParsedResult.rank || perplexityParsed.rank < bestParsedResult.rank))) {
        bestParsedResult = perplexityParsed;
      }
      perplexityParsed.competitors.forEach((c) => allCompetitors.add(c));
    } catch (error) {
      console.error('[scanServiceVisibility] Error parsing Perplexity response:', error);
      llmLogs.push({
        provider: 'perplexity',
        model: PERPLEXITY_MODELS.ONLINE_FAST,
        role: 'parser',
        prompt: `Parse response for domain: ${domain}`,
        requestBody: { text: perplexityText.substring(0, 100) + '...' },
        responseBody: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // If no domain found in either response, use the first available parsed result
  if (!bestParsedResult) {
    if (openaiParsed) {
      bestParsedResult = openaiParsed;
    } else if (perplexityParsed) {
      bestParsedResult = perplexityParsed;
    } else {
      // Provide more detailed error message
      const hasOpenAIText = !!openaiText;
      const hasPerplexityText = !!perplexityText;
      const openaiError = openaiResponse.status === 'rejected' 
        ? (openaiResponse.reason instanceof Error ? openaiResponse.reason.message : String(openaiResponse.reason))
        : null;
      const perplexityError = perplexityResponse.status === 'rejected'
        ? (perplexityResponse.reason instanceof Error ? perplexityResponse.reason.message : String(perplexityResponse.reason))
        : null;
      
      let errorMessage = 'Both AI scans failed to return responses. ';
      if (hasOpenAIText && hasPerplexityText) {
        errorMessage += 'Both scans returned text but parsing failed.';
      } else if (hasOpenAIText) {
        errorMessage += `OpenAI returned text but parsing failed. Perplexity error: ${perplexityError || 'No response'}.`;
      } else if (hasPerplexityText) {
        errorMessage += `Perplexity returned text but parsing failed. OpenAI error: ${openaiError || 'No response'}.`;
      } else {
        errorMessage += `OpenAI error: ${openaiError || 'No response'}. Perplexity error: ${perplexityError || 'No response'}.`;
      }
      
      throw new Error(errorMessage);
    }
  }

  // Merge competitors from both responses
  bestParsedResult.competitors.forEach((c) => allCompetitors.add(c));

  // Get trustScore and localScore from the best result
  const trustScore = bestParsedResult.trustScore || 0;
  const localScore = bestParsedResult.localScore || 0;

  // Determine which AI engine found the domain (use already parsed results)
  let bestAiEngine: 'openai' | 'perplexity' | null = null;
  if (bestParsedResult.domainPresent) {
    if (openaiParsed && openaiParsed.domainPresent && openaiParsed.rank) {
      bestAiEngine = 'openai';
    } else if (perplexityParsed && perplexityParsed.domainPresent && perplexityParsed.rank) {
      bestAiEngine = 'perplexity';
    }
  }

  return {
    visible: bestParsedResult.domainPresent,
    position: bestParsedResult.rank,
    competitors: Array.from(allCompetitors),
    rawAnalysis: bestParsedResult.rawAnalysis,
    trustScore: Math.max(0, Math.min(10, Math.round(trustScore))),
    localScore: Math.max(0, Math.min(10, Math.round(localScore))),
    openaiText,
    perplexityText,
    bestAiEngine,
    llmLogs,
  };
}

/**
 * Parse AI response with custom OpenAI client (с улучшенной обработкой ошибок)
 */
async function parseAiResponseWithClient(
  responseText: string,
  targetDomain: string,
  openaiApiKey: string,
  _existingLogs: LLMRequestLog[] = [],
): Promise<{
  parsed: {
    domainPresent: boolean;
    rank: number | null;
    competitors: string[];
    rawAnalysis: string;
    trustScore: number;
    localScore: number;
  };
  logs: LLMRequestLog[];
}> {
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
- For Trust Score: For the specific domain "${targetDomain}", if found, estimate a Trust Score (1-10) based on brand mentions, authority signals, reputation indicators, and E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness). If not found, return 0.
- For Local Score: For the specific domain "${targetDomain}", if found, estimate a Local Score (1-10) based on physical address presence, location mentions, local context, and geographic relevance in the search context. If not found, return 0.
- Return valid JSON only, no markdown formatting`;

  const openai = createOpenAIClient({
    apiKey: openaiApiKey,
    defaultModel: OPENAI_MODELS.GPT4O_MINI,
  });

  const parserLogs: LLMRequestLog[] = [];
  const parserRequestBody = {
    model: OPENAI_MODELS.GPT4O_MINI,
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
    temperature: 0,
    response_format: { type: 'json_object' },
  };

  try {
    // Parser: используем gpt-4o-mini для анализа (рекомендация аналитика)
    // Это в 30 раз дешевле, чем gpt-4o, и отлично справляется с задачей парсинга
    const response = await withRetry(() =>
      openai.chat.completions.create({
        model: OPENAI_MODELS.GPT4O_MINI, // gpt-4o-mini для Parser (оптимально по цене/качеству)
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
      })
    );

    const content = response.choices[0]?.message?.content;
    
    parserLogs.push({
      provider: 'openai',
      model: response.model || OPENAI_MODELS.GPT4O_MINI,
      role: 'parser',
      prompt: analysisPrompt,
      requestBody: parserRequestBody,
      responseBody: {
        content: content || '',
        model: response.model,
        usage: response.usage,
      },
    });

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse JSON response
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
      // Fallback: try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]!);
      } else {
        throw new Error(`Failed to parse JSON response: ${content}`);
      }
    }

    // Validate and normalize
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

    return {
      parsed: result,
      logs: parserLogs,
    };
  } catch (error) {
    // Fallback parsing с улучшенной обработкой ошибок
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof OpenAIAPIError) {
      console.error(`[Parse] OpenAI API error: ${error.status} - ${error.message}`);
    } else {
      console.error('[Parse] Error:', error);
    }

    parserLogs.push({
      provider: 'openai',
      model: OPENAI_MODELS.GPT4O_MINI,
      role: 'parser',
      prompt: analysisPrompt,
      requestBody: parserRequestBody,
      responseBody: null,
      error: errorMessage,
    });

    const responseTextLower = responseText.toLowerCase();
    const normalizedTarget = normalizeDomain(targetDomain);
    const domainPresent = responseTextLower.includes(normalizedTarget);

    return {
      parsed: {
        domainPresent,
        rank: domainPresent ? 1 : null,
        competitors: [],
        rawAnalysis: `Fallback analysis: ${errorMessage}`,
        trustScore: 0,
        localScore: 0,
      },
      logs: parserLogs,
    };
  }
}

/**
 * Extract detailed competitor information from AI response
 */
async function extractCompetitorDetails(
  responseText: string,
  competitors: string[],
  openaiApiKey: string,
): Promise<Array<{
  rank: number;
  name: string;
  url?: string;
  strengths?: string;
}>> {
  if (competitors.length === 0) {
    return [];
  }

  const analysisPrompt = `Analyze the following AI response about medical clinic recommendations. Extract detailed information about each competitor mentioned.

AI Response:
${responseText}

Competitors to analyze: ${competitors.join(', ')}

For each competitor, extract:
1. Their rank/position in the list (1st, 2nd, 3rd, etc.)
2. Their name (exact as mentioned)
3. URL/domain if mentioned (or null)
4. Strengths/advantages mentioned (e.g., "Good reviews", "Modern facilities", "Experienced staff")

Return JSON in this format:
{
  "competitors": [
    {
      "rank": number,
      "name": string,
      "url": string | null,
      "strengths": string | null
    }
  ]
}

Return valid JSON only, no markdown formatting.`;

  const openai = createOpenAIClient({
    apiKey: openaiApiKey,
    defaultModel: OPENAI_MODELS.GPT4O_MINI,
  });

  try {
    const response = await withRetry(() =>
      openai.chat.completions.create({
        model: OPENAI_MODELS.GPT4O_MINI,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts structured data from medical clinic recommendations. Always return valid JSON.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      })
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    if (parsed.competitors && Array.isArray(parsed.competitors)) {
      return parsed.competitors.map((comp: Record<string, unknown>) => ({
        rank: comp.rank || 0,
        name: comp.name || '',
        url: comp.url || undefined,
        strengths: comp.strengths || undefined,
      }));
    }

    return [];
  } catch (error) {
    console.error('[Extract Competitors] Error:', error);
    // Fallback: return basic competitor list with sequential ranks
    return competitors.map((name, index) => ({
      rank: index + 1,
      name,
    }));
  }
}

/**
 * Generate recommendation text based on analysis
 */
function generateRecommendationText(
  visible: boolean,
  position: number | null,
  totalResults: number,
  competitors: Array<{ rank: number; name: string; strengths?: string }>,
): string {
  if (!visible) {
    return `Your domain was not found in the AI recommendations. Consider improving your online presence, local SEO, and ensuring your clinic information is easily discoverable. Focus on building authority signals and local citations.`;
  }

  if (position === null) {
    return `Your domain was mentioned but position could not be determined. Continue improving your visibility through content optimization and local SEO.`;
  }

  const positionText = position === 1 ? 'first' : position === 2 ? 'second' : position === 3 ? 'third' : `${position}th`;
  const topCompetitors = competitors.filter(c => c.rank < position && c.rank <= 3).slice(0, 2);

  let recommendation = `Great! Your domain was found in ${positionText} position out of ${totalResults} recommendations. `;

  if (topCompetitors.length > 0) {
    recommendation += `To improve your ranking, consider analyzing what makes ${topCompetitors.map(c => c.name).join(' and ')} stand out. `;
    if (topCompetitors[0]?.strengths) {
      recommendation += `For example, ${topCompetitors[0].name} is noted for: ${topCompetitors[0].strengths}. `;
    }
  }

  recommendation += `Focus on enhancing your E-E-A-T signals, local presence, and technical optimization to move up in rankings.`;

  return recommendation;
}

/*
 * -------------------------------------------------------
 * Server Action Implementation
 * -------------------------------------------------------
 */

/**
 * Calculate ClinicAI Score using real tech audit data and E-E-A-T/Local scores
 */
function _calculateImprovedClinicAIScore(
  visibility: number,
  techAudit: TechAuditResult,
  trustScore: number, // 1-10 from AI analysis
  localScore: number, // 1-10 from AI analysis
): number {
  // Visibility score (0-100)
  const visibilityScore = visibility;

  // Tech Score based on TTFB and SSL
  // TTFB: Good (< 600ms) = 100, Poor (>= 600ms) = 50
  const ttfbScore = techAudit.performance.rating === 'Good' ? 100 : 50;
  // SSL: Has SSL = 100, No SSL = 0
  const sslScore = techAudit.metadata.hasSsl ? 100 : 0;
  // Tech score is average of TTFB and SSL
  const techScore = (ttfbScore + sslScore) / 2;

  // Content Score based on llms.txt existence
  // Has llms.txt = 100, No llms.txt = 50 (not critical, but recommended)
  const contentScore = techAudit.llmsTxt.exists ? 100 : 50;

  // E-E-A-T Score: Convert trustScore (1-10) to (0-100) scale
  // Multiply by 10 to get 0-100 range
  const eeatScore = trustScore * 10;

  // Local Score: Convert localScore (1-10) to (0-100) scale
  // Multiply by 10 to get 0-100 range
  const localScoreScaled = localScore * 10;

  // Use the full ClinicAI Score formula with real data
  const score = calculateClinicAIScore({
    visibility: visibilityScore,
    tech: techScore,
    content: contentScore,
    eeat: eeatScore,
    local: localScoreScaled,
  });

  return score;
}

/**
 * Service Analysis Data interface
 */
export interface ServiceAnalysisData {
  query: string;
  location: string;
  foundUrl: string | null; // The URL of our site found in AI response (or null)
  position: number | null;
  totalResults: number; // How many competitors were listed
  aiEngine: string; // e.g., "OpenAI / GPT-4o" or "Perplexity / sonar-pro"
  competitors: Array<{
    rank: number;
    name: string;
    url?: string; // If available/hallucinated by AI
    strengths?: string; // Extracted from AI text (e.g. "Good reviews")
  }>;
  recommendationText: string; // Generated advice based on the comparison
  llmLogs: LLMRequestLog[]; // Logs of all LLM requests and responses
}

/**
 * Adapter function to convert EphemeralAuditResult to TechAuditResult format
 * for backward compatibility with mapLiveScanToDashboard
 */
function _adaptEphemeralToTechAudit(
  ephemeral: EphemeralAuditResult,
  url: string,
): {
  llmsTxt: { exists: boolean; size: number; contentPreview: string };
  performance: { ttfbMs: number; rating: 'Good' | 'Poor' };
  metadata: { hasRobotsTxt: boolean; hasSsl: boolean; hasMetaDescription: boolean };
  url: string;
} {
  // Estimate TTFB from PageSpeed score (lower score = likely higher TTFB)
  // Use mobile score as it's typically more representative
  const speedScore = ephemeral.speed.mobile ?? ephemeral.speed.desktop ?? 50;
  // Inverse relationship: score 100 = ~200ms TTFB, score 0 = ~2000ms TTFB
  const estimatedTtfbMs = Math.max(200, Math.min(2000, 2000 - (speedScore / 100) * 1800));

  return {
    llmsTxt: {
      exists: ephemeral.files.llmsTxt.present,
      size: 0, // Not available in ephemeral audit
      contentPreview: '', // Not available in ephemeral audit
    },
    performance: {
      ttfbMs: estimatedTtfbMs,
      rating: estimatedTtfbMs < 600 ? 'Good' : 'Poor',
    },
    metadata: {
      hasRobotsTxt: ephemeral.files.robots,
      hasSsl: ephemeral.security.https,
      hasMetaDescription: !!ephemeral.meta.description,
    },
    url,
  };
}

/**
 * Run a live dashboard test in Playground mode
 * 
 * This function performs parallel scans:
 * - Task A: Service visibility scan (OpenAI/Perplexity)
 * - Task B: Ephemeral tech audit (PageSpeed, HTML parsing, file checks, schema analysis)
 * 
 * Then calculates improved ClinicAI Score using real tech data
 * and returns dashboard data formatted for visualization.
 * 
 * @param input - Playground input with API keys and query parameters
 * @returns Object with DashboardData, ServiceAnalysisData, and techAudit
 */
export const runLiveDashboardTest = enhanceAction(
  async (input: PlaygroundInput, _user?: undefined): Promise<DashboardData & { serviceAnalysis: ServiceAnalysisData; techAudit: null }> => {
    try {
      console.log('[runLiveDashboardTest] Starting with input:', {
        domain: input.domain,
        query: input.query,
        city: input.city,
        hasOpenAIKey: !!input.apiKeyOpenAI,
        hasPerplexityKey: !!input.apiKeyPerplexity,
      });

      // Validate input parameters
      if (!input.domain || !input.domain.trim()) {
        throw new Error('Domain is required');
      }
      if (!input.query || !input.query.trim()) {
        throw new Error('Query is required');
      }
      if (!input.city || !input.city.trim()) {
        throw new Error('City is required');
      }
      if (!input.apiKeyOpenAI || !input.apiKeyOpenAI.trim()) {
        throw new Error('OpenAI API key is required');
      }
      if (!input.apiKeyPerplexity || !input.apiKeyPerplexity.trim()) {
        throw new Error('Perplexity API key is required');
      }

      const { apiKeyOpenAI, apiKeyPerplexity, domain, query, city } = input;

      // Normalize domain URL for tech audit
      const normalizedDomain = domain.startsWith('http://') || domain.startsWith('https://')
        ? domain
        : `https://${domain}`;

      console.log('[runLiveDashboardTest] Normalized domain:', normalizedDomain);

      // Step 1: Run service visibility scan only
      // Technical audit is now run separately via "Run Technical Audit" button
      console.log('[runLiveDashboardTest] Starting service visibility scan...');
      const visibilityResult = await scanServiceVisibility(query.trim(), city.trim(), domain.trim(), apiKeyOpenAI.trim(), apiKeyPerplexity.trim());
      console.log('[runLiveDashboardTest] Service visibility scan completed');

      // Step 2: Create ScanResult with E-E-A-T/Local scores
      // The score will be calculated inside mapLiveScanToDashboard using the refined formula
      const scanResult: ScanResult = {
        visible: visibilityResult.visible,
        position: visibilityResult.position,
        competitors: visibilityResult.competitors,
        trustScore: visibilityResult.trustScore,
        localScore: visibilityResult.localScore,
        // calculatedScore is not set - will be calculated in mapLiveScanToDashboard
      };

      // Step 3: Map to DashboardData using simulation adapter
      // Note: Tech audit is now run separately, so we use default/mocked values for tech metrics
      // These will be updated when user runs "Run Technical Audit" separately
      const mockTechAuditResult = {
        llmsTxt: { exists: false, size: 0, contentPreview: '' },
        performance: { ttfbMs: 800, rating: 'Good' as const },
        metadata: { hasRobotsTxt: true, hasSsl: true, hasMetaDescription: true },
        url: normalizedDomain,
      };

      const dashboardData = mapLiveScanToDashboard(scanResult, domain, mockTechAuditResult);

      // Step 4: Extract detailed competitor information
      console.log('[runLiveDashboardTest] Extracting competitor details...');
      const bestResponseText = visibilityResult.bestAiEngine === 'openai' 
        ? visibilityResult.openaiText 
        : visibilityResult.bestAiEngine === 'perplexity'
        ? visibilityResult.perplexityText
        : visibilityResult.openaiText || visibilityResult.perplexityText;

      let competitorDetails;
      try {
        competitorDetails = bestResponseText
          ? await extractCompetitorDetails(bestResponseText, visibilityResult.competitors, apiKeyOpenAI)
          : visibilityResult.competitors.map((name, index) => ({
              rank: index + 1,
              name,
            }));
        console.log('[runLiveDashboardTest] Competitor details extracted:', competitorDetails.length);
      } catch (error) {
        console.error('[runLiveDashboardTest] Error extracting competitor details:', error);
        // Fallback to simple mapping
        competitorDetails = visibilityResult.competitors.map((name, index) => ({
          rank: index + 1,
          name,
        }));
      }

      // Determine AI engine name
      const aiEngineName = visibilityResult.bestAiEngine === 'openai'
        ? 'OpenAI / GPT-4o'
        : visibilityResult.bestAiEngine === 'perplexity'
        ? 'Perplexity / sonar-pro'
        : visibilityResult.openaiText && visibilityResult.perplexityText
        ? 'OpenAI / GPT-4o + Perplexity / sonar-pro'
        : visibilityResult.openaiText
        ? 'OpenAI / GPT-4o'
        : 'Perplexity / sonar-pro';

      // Generate recommendation text
      const recommendationText = generateRecommendationText(
        visibilityResult.visible,
        visibilityResult.position,
        competitorDetails.length,
        competitorDetails,
      );

      // Create ServiceAnalysisData
      const serviceAnalysis: ServiceAnalysisData = {
        query: input.query,
        location: input.city,
        foundUrl: visibilityResult.visible ? `https://${domain}` : null,
        position: visibilityResult.position,
        totalResults: competitorDetails.length,
        aiEngine: aiEngineName,
        competitors: competitorDetails,
        recommendationText,
        llmLogs: visibilityResult.llmLogs || [],
      };

      const result: DashboardData & { serviceAnalysis: ServiceAnalysisData; techAudit: null } = {
        ...dashboardData,
        serviceAnalysis,
        techAudit: null, // Tech audit is run separately via "Run Technical Audit" button
      };
      
      return result;
    } catch (error) {
      console.error('[runLiveDashboardTest] Error running live test:', error);
      console.error('[runLiveDashboardTest] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('[runLiveDashboardTest] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        input: {
          domain: input.domain,
          query: input.query,
          city: input.city,
          hasOpenAIKey: !!input.apiKeyOpenAI,
          hasPerplexityKey: !!input.apiKeyPerplexity,
        },
      });
      
      // Улучшенная обработка ошибок
      if (error instanceof OpenAIAPIError) {
        throw new Error(
          `OpenAI API error (${error.status}): ${error.message}. Please check your API key and try again.`
        );
      } else if (error instanceof PerplexityAPIError) {
        throw new Error(
          `Perplexity API error (${error.status}): ${error.message}. Please check your API key and try again.`
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to run playground test: ${errorMessage}`,
      );
    }
  },
  {
    schema: PlaygroundInputSchema,
    auth: false, // Playground is a testing environment, no auth required
  },
);
