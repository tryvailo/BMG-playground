#!/usr/bin/env tsx

/**
 * Детальный анализ дубликатов контента
 * Показывает, какие именно фразы совпадают между страницами
 * 
 * Usage: tsx scripts/analyze-duplicate-details.ts <url1> <url2>
 * Example: tsx scripts/analyze-duplicate-details.ts "https://complimed.com.ua/successful-registration/" "https://complimed.com.ua/%d0%b1%d0%b5%d0%b7-%d1%80%d1%83%d0%b1%d1%80%d0%b8%d0%ba%d0%b8/kholetsystyt-shcho-tse-prychyny-symptomy/"
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envPath = join(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (_error) {
  console.warn('Could not load .env.local file');
}

import { crawlSiteContent } from '../lib/modules/audit/firecrawl-service';

/**
 * Clean text: convert to lowercase, remove punctuation and special characters
 */
function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert text into words array
 */
function textToWords(text: string): string[] {
  const cleaned = cleanText(text);
  return cleaned.split(' ').filter((word) => word.length > 0);
}

/**
 * Create a Set of 3-word shingles from text
 */
function createShingles(text: string): Set<string> {
  const words = textToWords(text);
  const shingles = new Set<string>();

  if (words.length < 3) {
    return shingles;
  }

  for (let i = 0; i <= words.length - 3; i++) {
    const shingle = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    shingles.add(shingle);
  }

  return shingles;
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity<T>(setA: Set<T>, setB: Set<T>): number {
  if (setA.size === 0 && setB.size === 0) {
    return 1.0;
  }

  if (setA.size === 0 || setB.size === 0) {
    return 0.0;
  }

  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) {
      intersection++;
    }
  });

  const union = setA.size + setB.size - intersection;

  if (union === 0) {
    return 0.0;
  }

  return intersection / union;
}

/**
 * Check if one set is a subset of another
 */
function checkSubsetSimilarity(
  smallerSet: Set<string>,
  largerSet: Set<string>,
  threshold: number = 0.85,
): number | null {
  if (smallerSet.size === 0 || largerSet.size === 0) {
    return null;
  }

  let found = 0;
  smallerSet.forEach((item) => {
    if (largerSet.has(item)) {
      found++;
    }
  });

  const containmentRatio = found / smallerSet.size;

  if (containmentRatio >= threshold) {
    const similarity = 0.85 + (containmentRatio - threshold) * (0.1 / (1 - threshold));
    return Math.min(similarity, 0.95);
  }

  return null;
}

async function analyzePair(urlA: string, urlB: string) {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    ДЕТАЛЬНЫЙ АНАЛИЗ ДУБЛИКАТОВ КОНТЕНТА                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  console.log('📥 Загружаю страницы...\n');

  // Fetch pages
  const pagesA = await crawlSiteContent(urlA, 1);
  const pagesB = await crawlSiteContent(urlB, 1);

  if (pagesA.length === 0 || pagesB.length === 0) {
    throw new Error('Не удалось загрузить одну или обе страницы');
  }

  const pageA = pagesA[0]!;
  const pageB = pagesB[0]!;

  const contentA = pageA.markdown || pageA.content || '';
  const contentB = pageB.markdown || pageB.content || '';

  console.log('📄 ИНФОРМАЦИЯ О СТРАНИЦАХ:');
  console.log('─'.repeat(80));
  console.log(`\nСтраница A:`);
  console.log(`  Заголовок: ${pageA.metadata?.title || 'Нет заголовка'}`);
  console.log(`  URL: ${pageA.metadata?.url || urlA}`);
  console.log(`  Длина контента: ${contentA.length} символов`);
  console.log(`  Количество слов: ${textToWords(contentA).length}`);

  console.log(`\nСтраница B:`);
  console.log(`  Заголовок: ${pageB.metadata?.title || 'Нет заголовка'}`);
  console.log(`  URL: ${pageB.metadata?.url || urlB}`);
  console.log(`  Длина контента: ${contentB.length} символов`);
  console.log(`  Количество слов: ${textToWords(contentB).length}`);

  // Create shingles
  console.log('\n🔬 Создаю шинглы (3-словные последовательности)...');
  const shinglesA = createShingles(contentA);
  const shinglesB = createShingles(contentB);

  console.log(`  Страница A: ${shinglesA.size} уникальных шинглов`);
  console.log(`  Страница B: ${shinglesB.size} уникальных шинглов`);

  // Calculate similarities
  console.log('\n📊 РАСЧЕТ СХОДСТВА:');
  console.log('─'.repeat(80));

  const jaccardSim = jaccardSimilarity(shinglesA, shinglesB);
  console.log(`\n1. Jaccard Similarity: ${(jaccardSim * 100).toFixed(2)}%`);
  console.log(`   Формула: |A ∩ B| / |A ∪ B|`);

  // Find intersection
  const intersection: string[] = [];
  shinglesA.forEach((shingle) => {
    if (shinglesB.has(shingle)) {
      intersection.push(shingle);
    }
  });

  const union = shinglesA.size + shinglesB.size - intersection.length;

  console.log(`   Пересечение (A ∩ B): ${intersection.length} шинглов`);
  console.log(`   Объединение (A ∪ B): ${union} шинглов`);
  console.log(`   Результат: ${intersection.length} / ${union} = ${(jaccardSim * 100).toFixed(2)}%`);

  // Check subset relationships
  console.log('\n2. Проверка отношений подмножества:');
  const subsetSimAB = checkSubsetSimilarity(shinglesA, shinglesB);
  const subsetSimBA = checkSubsetSimilarity(shinglesB, shinglesA);

  if (subsetSimAB !== null) {
    console.log(`   ✅ Страница A является подмножеством B: ${(subsetSimAB * 100).toFixed(2)}%`);
    console.log(`      (${((intersection.length / shinglesA.size) * 100).toFixed(2)}% шинглов из A найдены в B)`);
  } else {
    console.log(`   ❌ Страница A НЕ является подмножеством B`);
  }

  if (subsetSimBA !== null) {
    console.log(`   ✅ Страница B является подмножеством A: ${(subsetSimBA * 100).toFixed(2)}%`);
    console.log(`      (${((intersection.length / shinglesB.size) * 100).toFixed(2)}% шинглов из B найдены в A)`);
  } else {
    console.log(`   ❌ Страница B НЕ является подмножеством A`);
  }

  // Determine final similarity
  let finalSimilarity: number;
  let detectionMethod: string;

  if (jaccardSim >= 0.85) {
    finalSimilarity = jaccardSim;
    detectionMethod = 'Jaccard Similarity';
  } else if (subsetSimAB !== null) {
    finalSimilarity = subsetSimAB;
    detectionMethod = 'Subset: A в B';
  } else if (subsetSimBA !== null) {
    finalSimilarity = subsetSimBA;
    detectionMethod = 'Subset: B в A';
  } else {
    finalSimilarity = jaccardSim;
    detectionMethod = 'Jaccard Similarity (ниже порога)';
  }

  console.log('\n🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:');
  console.log('─'.repeat(80));
  console.log(`   Сходство: ${(finalSimilarity * 100).toFixed(2)}%`);
  console.log(`   Метод обнаружения: ${detectionMethod}`);
  console.log(`   Порог дубликата: 85%`);
  console.log(`   Статус: ${finalSimilarity >= 0.85 ? '✅ ДУБЛИКАТ ОБНАРУЖЕН' : '❌ НЕ ДУБЛИКАТ'}`);

  // Show matching shingles
  console.log('\n📝 СОВПАДАЮЩИЕ ФРАЗЫ (первые 50 примеров):');
  console.log('─'.repeat(80));
  if (intersection.length > 0) {
    const examples = intersection.slice(0, 50);
    examples.forEach((shingle, idx) => {
      console.log(`   ${idx + 1}. "${shingle}"`);
    });
    if (intersection.length > 50) {
      console.log(`   ... и еще ${intersection.length - 50} совпадающих фраз`);
    }
  } else {
    console.log('   Нет совпадающих фраз');
  }

  // Show unique shingles from each page
  console.log('\n📋 УНИКАЛЬНЫЕ ФРАЗЫ СТРАНИЦЫ A (не найденные в B, первые 20):');
  console.log('─'.repeat(80));
  const uniqueA: string[] = [];
  shinglesA.forEach((shingle) => {
    if (!shinglesB.has(shingle)) {
      uniqueA.push(shingle);
    }
  });
  if (uniqueA.length > 0) {
    uniqueA.slice(0, 20).forEach((shingle, idx) => {
      console.log(`   ${idx + 1}. "${shingle}"`);
    });
    if (uniqueA.length > 20) {
      console.log(`   ... и еще ${uniqueA.length - 20} уникальных фраз`);
    }
  } else {
    console.log('   Все фразы страницы A найдены в B (A - подмножество B)');
  }

  console.log('\n📋 УНИКАЛЬНЫЕ ФРАЗЫ СТРАНИЦЫ B (не найденные в A, первые 20):');
  console.log('─'.repeat(80));
  const uniqueB: string[] = [];
  shinglesB.forEach((shingle) => {
    if (!shinglesA.has(shingle)) {
      uniqueB.push(shingle);
    }
  });
  if (uniqueB.length > 0) {
    uniqueB.slice(0, 20).forEach((shingle, idx) => {
      console.log(`   ${idx + 1}. "${shingle}"`);
    });
    if (uniqueB.length > 20) {
      console.log(`   ... и еще ${uniqueB.length - 20} уникальных фраз`);
    }
  } else {
    console.log('   Все фразы страницы B найдены в A (B - подмножество A)');
  }

  // Content preview
  console.log('\n📄 ПРЕВЬЮ КОНТЕНТА:');
  console.log('─'.repeat(80));
  console.log('\nСтраница A (первые 500 символов):');
  console.log(contentA.substring(0, 500) + (contentA.length > 500 ? '...' : ''));
  console.log('\nСтраница B (первые 500 символов):');
  console.log(contentB.substring(0, 500) + (contentB.length > 500 ? '...' : ''));

  // Analysis summary
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              ВЫВОДЫ                                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  if (finalSimilarity >= 0.95) {
    console.log('🔴 ВЫСОКАЯ СТЕПЕНЬ ДУБЛИРОВАНИЯ (95%+)');
    console.log('   Возможные причины:');
    if (subsetSimAB !== null || subsetSimBA !== null) {
      console.log('   • Одна страница содержит почти весь контент другой');
      console.log('   • Общие шаблоны (header, footer, navigation, sidebar)');
      console.log('   • Одинаковые формы, кнопки, виджеты');
    } else {
      console.log('   • Очень похожий контент с минимальными различиями');
      console.log('   • Общие блоки контента (статьи, списки, описания)');
    }
  } else if (finalSimilarity >= 0.85) {
    console.log('🟡 УМЕРЕННАЯ СТЕПЕНЬ ДУБЛИРОВАНИЯ (85-95%)');
    console.log('   Возможные причины:');
    console.log('   • Значительное перекрытие контента');
    console.log('   • Общие структурные элементы');
    console.log('   • Похожие разделы или статьи');
  }

  console.log('\n💡 РЕКОМЕНДАЦИИ:');
  if (finalSimilarity >= 0.85) {
    console.log('   1. Проверьте, не дублируется ли контент намеренно');
    console.log('   2. Используйте canonical tags для указания основной страницы');
    console.log('   3. Рассмотрите объединение похожих страниц');
    console.log('   4. Убедитесь, что каждая страница имеет уникальный контент');
  } else {
    console.log('   ✅ Степень дублирования в пределах нормы');
  }

  console.log('\n');
}

async function main() {
  const urlA = process.argv[2];
  const urlB = process.argv[3];

  if (!urlA || !urlB) {
    console.error('❌ Ошибка: необходимо указать два URL');
    console.error('\nИспользование:');
    console.error('  tsx scripts/analyze-duplicate-details.ts <url1> <url2>');
    console.error('\nПример:');
    console.error('  tsx scripts/analyze-duplicate-details.ts "https://complimed.com.ua/successful-registration/" "https://complimed.com.ua/%d0%b1%d0%b5%d0%b7-%d1%80%d1%83%d0%b1%d1%80%d0%b8%d0%ba%d0%b8/kholetsystyt-shcho-tse-prychyny-symptomy/"');
    process.exit(1);
  }

  try {
    await analyzePair(urlA, urlB);
  } catch (error) {
    console.error('\n❌ Ошибка при анализе:', error);
    if (error instanceof Error) {
      console.error('   Сообщение:', error.message);
    }
    process.exit(1);
  }
}

main().catch(console.error);

