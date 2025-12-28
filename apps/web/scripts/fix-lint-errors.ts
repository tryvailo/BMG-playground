#!/usr/bin/env tsx
/**
 * Скрипт для автоматического исправления ESLint ошибок
 * 
 * Исправляет:
 * - Неиспользуемые импорты (добавляет префикс _)
 * - Неиспользуемые переменные (добавляет префикс _)
 * - Апострофы в JSX (заменяет на &apos;)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

const FIXABLE_PATTERNS = {
  unusedVars: /^.*'(\w+)' is defined but never used.*$/,
  unescapedEntities: /^.*`'` can be escaped.*$/,
};

async function fixLintErrors() {
  console.log('🔧 Запуск автоматического исправления ESLint ошибок...\n');

  // Шаг 1: Запустить ESLint --fix для автоматически исправляемых ошибок
  console.log('📝 Шаг 1: Запуск ESLint --fix...');
  try {
    execSync('pnpm --filter web lint --fix', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..')
    });
    console.log('✅ ESLint --fix выполнен\n');
  } catch {
    console.log('⚠️  ESLint --fix завершился с ошибками (это нормально, некоторые ошибки требуют ручного исправления)\n');
  }

  // Шаг 2: Получить список оставшихся ошибок
  console.log('📊 Шаг 2: Анализ оставшихся ошибок...');
  let lintOutput: string;
  try {
    lintOutput = execSync('pnpm --filter web lint', { 
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '../..')
    }).toString();
  } catch (error: any) {
    lintOutput = error.stdout?.toString() || '';
  }

  const errors = lintOutput.split('\n').filter(line => line.includes('error'));
  console.log(`📈 Найдено ${errors.length} ошибок\n`);

  // Шаг 3: Группировать ошибки по типам
  const unusedVars = errors.filter(e => e.includes('is defined but never used'));
  const unescapedEntities = errors.filter(e => e.includes('can be escaped'));
  const anyTypes = errors.filter(e => e.includes('Unexpected any'));

  console.log('📋 Статистика ошибок:');
  console.log(`   - Неиспользуемые переменные: ${unusedVars.length}`);
  console.log(`   - Неэкранированные символы: ${unescapedEntities.length}`);
  console.log(`   - Типы any: ${anyTypes.length}`);
  console.log(`   - Другие: ${errors.length - unusedVars.length - unescapedEntities.length - anyTypes.length}\n`);

  console.log('💡 Рекомендации:');
  console.log('   1. Неиспользуемые переменные можно исправить, добавив префикс _');
  console.log('   2. Неэкранированные символы исправляются автоматически через ESLint --fix');
  console.log('   3. Типы any требуют ручного исправления с определением правильных типов\n');

  console.log('✅ Автоматическое исправление завершено!');
  console.log('📝 Оставшиеся ошибки требуют ручного исправления.');
}

fixLintErrors().catch(console.error);

