#!/usr/bin/env tsx

/**
 * Пример кода для вызова Perplexity API
 * Обновлено для использования моделей серии 'sonar' и 'sonar-pro'
 * 
 * Демонстрирует различные способы вызова API и обработки ответов
 */

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'your-api-key-here';
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Список актуальных моделей Perplexity (по состоянию на начало 2025)
 * https://docs.perplexity.ai/getting-started/models
 */
const MODELS = {
  ONLINE_PRO: 'sonar-pro',          // Основная мощная модель (аналог GPT-4o с поиском)
  ONLINE_FAST: 'sonar',             // Быстрая модель (аналог GPT-4o-mini с поиском)
  REASONING: 'sonar-reasoning',     // Модель с рассуждениями (CoT)
  DEEPSEEK: 'r1-1776'               // DeepSeek R1 distilled
};

/**
 * Метод 1: Простой вызов через fetch
 * Используем sonar-pro как наиболее сбалансированную модель
 */
async function callPerplexitySimple(prompt: string) {
  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODELS.ONLINE_PRO, 
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      // temperature для online моделей лучше держать в диапазоне 0.6-0.8 или не указывать (default 0.2 для chat, но для online поиска выше)
      temperature: 0.2, 
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Perplexity API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || null;
}

/**
 * Метод 2: Вызов с обработкой ошибок и fallback моделями
 * Обновлен список моделей от самой мощной к самой простой
 */
async function callPerplexityWithFallback(prompt: string) {
  const models = [
    MODELS.ONLINE_PRO,      // Сначала пробуем лучшую
    MODELS.ONLINE_FAST,     // Если упала, пробуем быструю
    MODELS.DEEPSEEK,        // Пробуем альтернативу (R1)
    MODELS.REASONING        // Пробуем reasoning (может быть медленнее)
  ];

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(`Model ${model} failed:`, error);
        continue; // Попробуем следующую модель
      }

      const data = await response.json();
      console.log(`✅ Success with model: ${model}`);
      return {
        model,
        content: data.choices[0]?.message?.content || null,
        usage: data.usage,
        // Цитаты (источники) часто нужны при работе с Perplexity
        citations: data.citations || [], 
        fullResponse: data,
      };
    } catch (error) {
      console.log(`Model ${model} error:`, error);
      continue;
    }
  }

  throw new Error('All Perplexity models failed');
}

/**
 * Метод 3: Создание клиента
 */
function createPerplexityClient(apiKey: string) {
  return {
    chat: {
      completions: {
        create: async (params: {
          model: string;
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          max_tokens?: number;
        }) => {
          const response = await fetch(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: params.model,
              messages: params.messages,
              temperature: params.temperature ?? 0.2,
              max_tokens: params.max_tokens,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(
              `Perplexity API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`,
            );
          }

          return response.json();
        },
      },
    },
  };
}

/**
 * Метод 4: Использование клиента с актуальной моделью
 */
async function callPerplexityWithClient(prompt: string) {
  const client = createPerplexityClient(PERPLEXITY_API_KEY);
  
  try {
    const response = await client.chat.completions.create({
      model: MODELS.ONLINE_PRO, // Используем sonar-pro
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    return {
      content: response.choices[0]?.message?.content || null,
      model: response.model,
      usage: response.usage,
      citations: response.citations,
    };
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw error;
  }
}

/**
 * Метод 5: Параллельные запросы
 */
async function callPerplexityParallel(prompts: string[]) {
  const client = createPerplexityClient(PERPLEXITY_API_KEY);
  
  // Для параллельных запросов лучше использовать более легкую модель, чтобы избежать rate limits
  const modelToUse = MODELS.ONLINE_FAST; 
  const requests = prompts.map((prompt) =>
    client.chat.completions.create({
      model: modelToUse,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  );

  const results = await Promise.allSettled(requests);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        prompt: prompts[index],
        success: true,
        content: result.value.choices[0]?.message?.content || null,
        usage: result.value.usage,
        citations: result.value.citations,
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
 * Пример использования
 */
async function main() {
  const testPrompt = 'What are the top 3 endocrinology clinics in Kyiv, Ukraine? Provide short summary.';

  console.log('=== Метод 1: Простой вызов (sonar-pro) ===');
  try {
    const result1 = await callPerplexitySimple(testPrompt);
    console.log('Result:', result1);
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n=== Метод 2: С fallback моделями ===');
  try {
    const result2 = await callPerplexityWithFallback(testPrompt);
    console.log('Result Content:', result2.content);
    console.log('Model Used:', result2.model);
    console.log('Citations:', result2.citations);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Запуск примера
// main().catch(console.error);

export {
  callPerplexitySimple,
  callPerplexityWithFallback,
  createPerplexityClient,
  callPerplexityWithClient,
  callPerplexityParallel,
  MODELS
};

