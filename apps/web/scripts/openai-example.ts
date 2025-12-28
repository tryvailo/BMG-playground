#!/usr/bin/env tsx

/**
 * Профессиональный клиент OpenAI API (Vanilla TS)
 * Без зависимостей, с типизацией, обработкой ошибок и Retry-логикой.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

// === 1. ТИПИЗАЦИЯ ===

export const MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  GPT4_TURBO: 'gpt-4-turbo',
  GPT35_TURBO: 'gpt-3.5-turbo', // Legacy модель
} as const;

export type OpenAIModel = (typeof MODELS)[keyof typeof MODELS] | string;

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequestParams {
  model: OpenAIModel;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'text' | 'json_object' };
  user?: string;
  stream?: boolean;
}

// Интерфейс успешного ответа
export interface OpenAIResponse {
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

// Интерфейс ошибки от API
export interface OpenAIErrorDetail {
  message: string;
  type: string;
  param?: string;
  code?: string;
}

// === 2. КЛАСС ОШИБКИ ===

export class OpenAIAPIError extends Error {
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

// === 3. КЛИЕНТ ===

export interface OpenAIClientConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: OpenAIModel;
}

export interface OpenAIClient {
  chat: {
    completions: {
      create: (
        params: OpenAIRequestParams,
        options?: { signal?: AbortSignal }
      ) => Promise<OpenAIResponse>;
    };
  };
}

export function createOpenAIClient(config: OpenAIClientConfig): OpenAIClient {
  const baseURL = (config.baseURL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  };

  return {
    chat: {
      completions: {
        /**
         * Основной метод создания завершений
         * Поддерживает AbortSignal для отмены/таймаута
         */
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
              model: params.model || config.defaultModel || MODELS.GPT4O_MINI,
            }),
            signal: options?.signal,
          });

          if (!response.ok) {
            let errorData: OpenAIErrorDetail = { message: response.statusText, type: 'unknown' };
            try {
              const json = await response.json();
              if (json.error) errorData = json.error;
            } catch (e) {
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

// === 4. УТИЛИТЫ ===

/**
 * Обертка для Retry с экспоненциальной задержкой
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; initialDelay?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  let delay = options.initialDelay ?? 1000;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Прекращаем попытки, если это не ошибка сети или не 429/5xx
      const isRetryable = 
        error instanceof OpenAIAPIError 
          ? (error.status === 429 || error.status >= 500)
          : true; // Network errors (fetch failed) are usually retryable

      if (attempt > maxRetries || !isRetryable) {
        throw error;
      }

      console.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Экспоненциальный рост
    }
  }
  throw new Error('Unreachable');
}

/**
 * Функция для параллельного выполнения с ограничением (Concurrency Limit)
 * Полезна для дашбордов, чтобы не упереться в Rate Limit
 */
export async function runParallelLimited<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit: number
): Promise<PromiseSettledResult<R>[]> {
  const results: Promise<PromiseSettledResult<R>>[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    const resultPromise: Promise<PromiseSettledResult<R>> = p.then(
      v => ({ status: 'fulfilled' as const, value: v }),
      e => ({ status: 'rejected' as const, reason: e })
    );
    results.push(resultPromise);

    const e: Promise<void> = p.then(() => {
      executing.splice(executing.indexOf(e), 1);
    }, () => {
      executing.splice(executing.indexOf(e), 1);
    });
    executing.push(e);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// === 5. ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ ===

/**
 * Метод 1: Простой вызов через fetch
 */
export async function callOpenAISimple(prompt: string) {
  const client = createOpenAIClient({
    apiKey: OPENAI_API_KEY,
    defaultModel: MODELS.GPT4O_MINI,
  });

  const response = await client.chat.completions.create({
    model: MODELS.GPT4O_MINI,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || null;
}

/**
 * Метод 2: Вызов с обработкой ошибок и fallback моделями
 */
export async function callOpenAIWithFallback(prompt: string) {
  const models = [
    MODELS.GPT4O,
    MODELS.GPT4O_MINI,
    MODELS.GPT4_TURBO,
    MODELS.GPT35_TURBO,
  ];

  const client = createOpenAIClient({
    apiKey: OPENAI_API_KEY,
  });

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      console.log(`✅ Success with model: ${model}`);
      return {
        model,
        content: response.choices[0]?.message?.content || null,
        usage: response.usage,
        fullResponse: response,
      };
    } catch {
      if (error instanceof OpenAIAPIError) {
        console.log(`Model ${model} failed: ${error.status} - ${error.message}`);
      } else {
        console.log(`Model ${model} error:`, error);
      }
      continue;
    }
  }

  throw new Error('All OpenAI models failed');
}

/**
 * Метод 3: Использование клиента
 */
export async function callOpenAIWithClient(prompt: string) {
  const client = createOpenAIClient({
    apiKey: OPENAI_API_KEY,
    defaultModel: MODELS.GPT4O_MINI,
  });
  
  try {
    const response = await client.chat.completions.create({
      model: MODELS.GPT4O_MINI,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return {
      content: response.choices[0]?.message?.content || null,
      model: response.model,
      usage: response.usage,
    };
  } catch {
    if (error instanceof OpenAIAPIError) {
      console.error(`OpenAI API error: ${error.status} - ${error.message}`);
    } else {
      console.error('OpenAI API error:', error);
    }
    throw error;
  }
}

/**
 * Метод 4: Вызов с JSON режимом (structured output)
 */
export async function callOpenAIWithJSONMode(prompt: string) {
  const client = createOpenAIClient({
    apiKey: OPENAI_API_KEY,
    defaultModel: MODELS.GPT4O_MINI,
  });
  
  try {
    const response = await client.chat.completions.create({
      model: MODELS.GPT4O_MINI,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || null;
    return {
      content,
      parsed: content ? JSON.parse(content) : null,
      model: response.model,
      usage: response.usage,
    };
  } catch {
    if (error instanceof OpenAIAPIError) {
      console.error(`OpenAI API error: ${error.status} - ${error.message}`);
    } else {
      console.error('OpenAI API error:', error);
    }
    throw error;
  }
}

/**
 * Метод 5: Параллельные запросы с ограничением
 */
export async function callOpenAIParallel(prompts: string[], concurrencyLimit: number = 5) {
  const client = createOpenAIClient({
    apiKey: OPENAI_API_KEY,
    defaultModel: MODELS.GPT4O_MINI,
  });
  
  const results = await runParallelLimited(
    prompts,
    async (prompt) => {
      const response = await client.chat.completions.create({
        model: MODELS.GPT4O_MINI,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      return {
        prompt,
        content: response.choices[0]?.message?.content || null,
        usage: response.usage,
      };
    },
    concurrencyLimit
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        success: true,
        ...result.value,
      };
    } else {
      return {
        prompt: prompts[index],
        success: false,
        error: result.reason,
      };
    }
  });
}

/**
 * Метод 6: Вызов с системным промптом
 */
export async function callOpenAIWithSystemPrompt(
  systemPrompt: string,
  userPrompt: string,
) {
  const client = createOpenAIClient({
    apiKey: OPENAI_API_KEY,
    defaultModel: MODELS.GPT4O_MINI,
  });
  
  try {
    const response = await client.chat.completions.create({
      model: MODELS.GPT4O_MINI,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    return {
      content: response.choices[0]?.message?.content || null,
      model: response.model,
      usage: response.usage,
    };
  } catch {
    if (error instanceof OpenAIAPIError) {
      console.error(`OpenAI API error: ${error.status} - ${error.message}`);
    } else {
      console.error('OpenAI API error:', error);
    }
    throw error;
  }
}

/**
 * Метод 7: Обработка с retry логикой (используя withRetry)
 */
export async function callOpenAIWithRetry(prompt: string) {
  const client = createOpenAIClient({
    apiKey: OPENAI_API_KEY,
    defaultModel: MODELS.GPT4O_MINI,
  });
  
  try {
    const response = await withRetry(() =>
      client.chat.completions.create({
        model: MODELS.GPT4O_MINI,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      })
    );

    return {
      content: response.choices[0]?.message?.content || null,
      model: response.model,
      usage: response.usage,
    };
  } catch {
    if (error instanceof OpenAIAPIError) {
      console.error(`OpenAI API error: ${error.status} - ${error.message}`);
    } else {
      console.error('OpenAI API error:', error);
    }
    throw error;
  }
}

/**
 * Метод 8: Запрос с таймаутом через AbortSignal
 */
export async function callOpenAIWithTimeout(prompt: string, timeoutMs: number = 10000) {
  const client = createOpenAIClient({
    apiKey: OPENAI_API_KEY,
    defaultModel: MODELS.GPT4O_MINI,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.chat.completions.create(
      {
        model: MODELS.GPT4O_MINI,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);
    return {
      content: response.choices[0]?.message?.content || null,
      model: response.model,
      usage: response.usage,
    };
  } catch {
    clearTimeout(timeout);
    if (error instanceof OpenAIAPIError) {
      console.error(`OpenAI API error: ${error.status} - ${error.message}`);
    } else if (error instanceof Error && error.name === 'AbortError') {
      console.error('Request timeout');
    } else {
      console.error('OpenAI API error:', error);
    }
    throw error;
  }
}

// === 6. ПРИМЕР ИСПОЛЬЗОВАНИЯ ===

async function main() {
  const testPrompt = 'What are the top 5 programming languages in 2025?';

  console.log('=== Метод 1: Простой вызов ===');
  try {
    const result1 = await callOpenAISimple(testPrompt);
    console.log('Result:', result1);
  } catch {
    if (error instanceof OpenAIAPIError) {
      console.error(`API Error: ${error.status} - ${error.message}`);
    } else {
      console.error('Error:', error);
    }
  }

  console.log('\n=== Метод 2: С fallback моделями ===');
  try {
    const result2 = await callOpenAIWithFallback(testPrompt);
    console.log('Result:', result2);
  } catch {
    console.error('Error:', error);
  }

  console.log('\n=== Метод 3: С клиентом ===');
  try {
    const result3 = await callOpenAIWithClient(testPrompt);
    console.log('Result:', result3);
  } catch {
    console.error('Error:', error);
  }

  console.log('\n=== Метод 4: С JSON режимом ===');
  try {
    const jsonPrompt = 'Return a JSON object with top 3 programming languages and their popularity scores.';
    const result4 = await callOpenAIWithJSONMode(jsonPrompt);
    console.log('Result:', result4);
  } catch {
    console.error('Error:', error);
  }

  console.log('\n=== Метод 6: С системным промптом ===');
  try {
    const systemPrompt = 'You are a helpful assistant that provides concise answers.';
    const result6 = await callOpenAIWithSystemPrompt(systemPrompt, testPrompt);
    console.log('Result:', result6);
  } catch {
    console.error('Error:', error);
  }

  console.log('\n=== Метод 7: С retry логикой ===');
  try {
    const result7 = await callOpenAIWithRetry(testPrompt);
    console.log('Result:', result7);
  } catch {
    console.error('Error:', error);
  }

  console.log('\n=== Метод 8: С таймаутом ===');
  try {
    const result8 = await callOpenAIWithTimeout(testPrompt, 10000);
    console.log('Result:', result8);
  } catch {
    console.error('Error:', error);
  }

  // Пример с таймаутом и JSON режимом
  console.log('\n=== Комбинированный пример: Таймаут + JSON ===');
  try {
    const client = createOpenAIClient({
      apiKey: OPENAI_API_KEY,
      defaultModel: MODELS.GPT4O_MINI,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await client.chat.completions.create(
      {
        model: MODELS.GPT4O_MINI,
        messages: [{ role: 'user', content: 'Say hello in JSON format: { "msg": "..." }' }],
        response_format: { type: 'json_object' },
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);
    const content = res.choices[0]?.message?.content;
    if (content) {
      console.log('Result:', JSON.parse(content));
    } else {
      console.log('Result: No content received');
    }
  } catch (err) {
    if (err instanceof OpenAIAPIError) {
      console.error(`API Error: ${err.status} - ${err.message}`);
    } else {Now we need to build the UI for the "Technical Optimization" tab.
Create a new component `src/components/dashboard/audit/TechAuditOverview.tsx`.

**Input Props:**
It accepts a `auditData` prop of type `TechAudit` (the DB model we defined).

**Layout Requirements (Shadcn UI):**

1.  **Top Section: Status & Scores**
    - Display the Audit Date and Status (Completed/Running/Failed).
    - **Score Cards Row:**
      - **Desktop Speed:** Circle Gauge (0-100) using PageSpeed data. Color: Red (<50), Orange (50-89), Green (90+).
      - **Mobile Speed:** Circle Gauge (0-100).
      - **LLMS.txt Score:** Circle Gauge (0-100) based on AI analysis.

2.  **Middle Section: File & Security Checks (Grid Layout)**
    - **Card: "AI Files Configuration"**
      - `llms.txt`: Badge (Found/Missing). If found, show a small "AI Quality Score".
      - `robots.txt`: Badge (Found/Missing).
      - `sitemap.xml`: Badge (Found/Missing).
    - **Card: "Security & Access"**
      - `HTTPS`: Check icon (Green) or X icon (Red).
      - `Mobile Friendly`: Check/X icon.

3.  **Bottom Section: Schema Markup Analysis**
    - **Card: "Structured Data (Schema.org)"**
    - Display a list of required schemas from the specs:
      - MedicalOrganization
      - Physician
      - MedicalProcedure
      - LocalBusiness
      - FAQPage
    - For each, show a status icon (Check/X) based on the `schema_summary` JSON data.

**Styling:**
Use `Lucide-React` icons. Ensure the layout is responsive (stack on mobile).
If `auditData` is null (no audit run yet), show an "Empty State" with a "Run Audit" button.
      console.error('Network/Timeout Error:', err);
    }
  }
}

// Запуск примера (раскомментируйте для тестирования)
main().catch(console.error);
