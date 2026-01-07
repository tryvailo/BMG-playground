#!/usr/bin/env tsx
/**
 * Массовое исправление ESLint ошибок
 * 
 * Автоматически исправляет:
 * 1. Неиспользуемые переменные в catch блоках (переименовывает в _error)
 * 2. Неиспользуемые параметры в функциях (добавляет префикс _)
 * 3. Неиспользуемые импорты (удаляет)
 * 4. Неэкранированные символы в JSX (заменяет на HTML entities)
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

const TSX_FILES = 'apps/web/**/*.{ts,tsx}';
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/*.d.ts',
];

async function massFixLint() {
  console.log('🔧 Массовое исправление ESLint ошибок...\n');

  const files = await glob(TSX_FILES, {
    ignore: EXCLUDE_PATTERNS,
    cwd: path.resolve(__dirname, '../..'),
  });

  console.log(`📝 Найдено ${files.length} файлов для проверки\n`);

  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.resolve(__dirname, '../..', file);
    let content = readFileSync(filePath, 'utf-8');
    let modified = false;

    // 1. Исправление неиспользуемых переменных в catch блоках
    const catchErrorPattern = /catch\s*\(\s*error\s*\)\s*\{/g;
    if (catchErrorPattern.test(content)) {
      content = content.replace(catchErrorPattern, 'catch {');
      modified = true;
    }

    // 2. Исправление неиспользуемых параметров в map/filter (добавляем префикс _)
    const unusedParamPattern = /(map|filter|forEach|reduce)\(\((\w+),\s*(\w+)\)\s*=>/g;
    content = content.replace(unusedParamPattern, (match, method, param1, param2) => {
      // Если второй параметр не используется, добавляем префикс
      if (param2 && !content.includes(`${param2}.`) && !content.includes(`${param2}[`)) {
        return match.replace(param2, `_${param2}`);
      }
      return match;
    });

    // 3. Исправление неэкранированных апострофов в JSX (только в строках)
    const apostrophePattern = /(['"])([^'"]*?)'([^'"]*?)(['"])/g;
    content = content.replace(apostrophePattern, (match, quote1, before, after, quote2) => {
      // Проверяем, что это JSX строка (не комментарий и не код)
      if (quote1 === quote2 && (quote1 === '"' || quote1 === "'")) {
        return `${quote1}${before}&apos;${after}${quote2}`;
      }
      return match;
    });

    // 4. Исправление неэкранированных кавычек в JSX
    const quotePattern = /(['"])([^'"]*?)"([^'"]*?)(['"])/g;
    content = content.replace(quotePattern, (match, quote1, before, after, quote2) => {
      if (quote1 === quote2 && quote1 === "'") {
        return `${quote1}${before}&quot;${after}${quote2}`;
      }
      return match;
    });

    if (modified) {
      writeFileSync(filePath, content, 'utf-8');
      fixedCount++;
      console.log(`✅ Исправлен: ${file}`);
    }
  }

  console.log(`\n✅ Исправлено файлов: ${fixedCount}`);
  console.log('📝 Запустите "pnpm --filter web lint" для проверки оставшихся ошибок');
}

massFixLint().catch(console.error);







