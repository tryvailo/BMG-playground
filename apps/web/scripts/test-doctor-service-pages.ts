#!/usr/bin/env tsx

/**
 * Тест для проверки, что страница врача и страница услуги не считаются дубликатами
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
import { analyzeContentDuplicates } from '../lib/utils/duplicate-analyzer';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        ТЕСТ: СТРАНИЦА ВРАЧА vs СТРАНИЦА УСЛУГИ                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  const urlA = 'https://complimed.com.ua/fakh%d1%96vts%d1%96/senko-hanna-ivanivna/';
  const urlB = 'https://complimed.com.ua/otolaringologiya/';

  console.log('📥 Загружаю страницы...\n');

  const pagesA = await crawlSiteContent(urlA, 1);
  const pagesB = await crawlSiteContent(urlB, 1);

  if (pagesA.length === 0 || pagesB.length === 0) {
    throw new Error('Не удалось загрузить страницы');
  }

  const pageA = pagesA[0]!;
  const pageB = pagesB[0]!;

  const contentA = pageA.markdown || pageA.content || '';
  const contentB = pageB.markdown || pageB.content || '';

  // Подсчет шинглов для анализа
  function textToWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter((word) => word.length > 0);
  }

  function createShingles(text: string): Set<string> {
    const words = textToWords(text);
    const shingles = new Set<string>();
    for (let i = 0; i <= words.length - 3; i++) {
      const shingle = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      shingles.add(shingle);
    }
    return shingles;
  }

  const shinglesA = createShingles(contentA);
  const shinglesB = createShingles(contentB);
  const sizeRatio = shinglesA.size / shinglesB.size;

  console.log('📄 Информация о страницах:');
  console.log(`   Страница A (врач): ${pageA.metadata?.title || 'N/A'}`);
  console.log(`      Шинглов: ${shinglesA.size}`);
  console.log(`   Страница B (услуга): ${pageB.metadata?.title || 'N/A'}`);
  console.log(`      Шинглов: ${shinglesB.size}`);
  console.log(`   Соотношение размеров: ${(sizeRatio * 100).toFixed(1)}% (A/B)`);
  console.log(`   Порог для subset detection: 60%`);
  console.log(`   Статус: ${sizeRatio >= 0.6 ? '⚠️  Может сработать subset detection' : '✅ Subset detection НЕ сработает (это упоминание, не дублирование)'}\n`);

  console.log('🔬 Запускаю анализ с улучшенной фильтрацией...\n');

  const result = analyzeContentDuplicates([pageA, pageB], 50, 10, 0.6);

  console.log('\n📊 РЕЗУЛЬТАТЫ:');
  console.log('─'.repeat(80));
  console.log(`   Страниц проанализировано: ${result.pagesScanned}`);
  console.log(`   Дубликатов найдено: ${result.duplicatesFound}`);

  if (result.duplicatesFound === 0) {
    console.log('\n✅ УСПЕХ: Страницы НЕ считаются дубликатами!');
    console.log('   Это правильно, так как страница врача - это полная страница,');
    console.log('   а на странице услуги есть только блок/упоминание врача.');
    console.log('   Это НЕ дублирование контента.');
  } else {
    console.log('\n⚠️  ВНИМАНИЕ: Дубликат все еще обнаружен');
    result.results.forEach((dup, idx) => {
      console.log(`\n   Дубликат ${idx + 1}:`);
      console.log(`      Страница A: ${dup.titleA}`);
      console.log(`      Страница B: ${dup.titleB}`);
      console.log(`      Сходство: ${dup.similarity}%`);
    });
  }

  // Показываем Jaccard similarity для справки
  let intersection = 0;
  shinglesA.forEach((shingle) => {
    if (shinglesB.has(shingle)) {
      intersection++;
    }
  });
  const union = shinglesA.size + shinglesB.size - intersection;
  const jaccardSim = union > 0 ? (intersection / union) * 100 : 0;

  console.log(`\n📈 Jaccard Similarity (для справки): ${jaccardSim.toFixed(2)}%`);
  console.log(`   Пересечение: ${intersection} шинглов`);
  console.log(`   Объединение: ${union} шинглов`);

  console.log('\n');
}

main().catch((error) => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
});

