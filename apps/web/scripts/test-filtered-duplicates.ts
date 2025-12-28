#!/usr/bin/env tsx

/**
 * Тест фильтрации ложных срабатываний
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
} catch {
  console.warn('Could not load .env.local file');
}

import { crawlSiteContent } from '../lib/modules/audit/firecrawl-service';
import { analyzeContentDuplicates } from '../lib/utils/duplicate-analyzer';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              ТЕСТ ФИЛЬТРАЦИИ ЛОЖНЫХ СРАБАТЫВАНИЙ                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  const urlA = 'https://complimed.com.ua/successful-registration/';
  const urlB = 'https://complimed.com.ua/%d0%b1%d0%b5%d0%b7-%d1%80%d1%83%d0%b1%d1%80%d0%b8%d0%ba%d0%b8/kholetsystyt-shcho-tse-prychyny-symptomy/';

  console.log('📥 Загружаю страницы...\n');

  const pagesA = await crawlSiteContent(urlA, 1);
  const pagesB = await crawlSiteContent(urlB, 1);

  if (pagesA.length === 0 || pagesB.length === 0) {
    throw new Error('Не удалось загрузить страницы');
  }

  const pageA = pagesA[0]!;
  const pageB = pagesB[0]!;

  console.log('📄 Информация о страницах:');
  console.log(`   Страница A: ${pageA.metadata?.title || 'N/A'}`);
  console.log(`   Страница B: ${pageB.metadata?.title || 'N/A'}\n`);

  console.log('🔬 Запускаю анализ с фильтрацией...\n');

  // Используем обновленный алгоритм с фильтрацией
  const result = analyzeContentDuplicates([pageA, pageB], 50, 10);

  console.log('\n📊 РЕЗУЛЬТАТЫ:');
  console.log('─'.repeat(80));
  console.log(`   Страниц проанализировано: ${result.pagesScanned}`);
  console.log(`   Дубликатов найдено: ${result.duplicatesFound}`);

  if (result.duplicatesFound === 0) {
    console.log('\n✅ УСПЕХ: Ложное срабатывание отфильтровано!');
    console.log('   Страница с минимальным контентом была исключена из анализа.');
  } else {
    console.log('\n⚠️  ВНИМАНИЕ: Дубликат все еще обнаружен');
    result.results.forEach((dup, idx) => {
      console.log(`\n   Дубликат ${idx + 1}:`);
      console.log(`      Страница A: ${dup.titleA}`);
      console.log(`      Страница B: ${dup.titleB}`);
      console.log(`      Сходство: ${dup.similarity}%`);
    });
  }

  console.log('\n');
}

main().catch((error) => {
  console.error('❌ Ошибка:', error);
  process.exit(1);
});

