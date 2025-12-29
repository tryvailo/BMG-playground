# Анализ причин повторяющихся ESLint ошибок и стратегия их устранения

## Проблема

Постоянно возникают одни и те же типы ESLint ошибок, что указывает на системные проблемы в процессе разработки.

## Основные причины

### 1. Неиспользуемые импорты (`@typescript-eslint/no-unused-vars`)

**Причины:**
- Разработчики импортируют компоненты/иконки "на будущее", но забывают их использовать
- Копирование кода из других файлов вместе с неиспользуемыми импортами
- Рефакторинг, при котором удаляется использование, но импорт остается
- Автодополнение IDE добавляет импорты, которые не используются

**Примеры:**
- `Legend`, `Tooltip`, `ArrowUp`, `ArrowDown`, `TrendingUp`, `Lightbulb` и др.

**Решение:**
- Использовать автоматическое удаление неиспользуемых импортов
- Настроить pre-commit hooks для проверки
- Использовать `eslint --fix` автоматически

### 2. Неэкранированные символы в JSX (`react/no-unescaped-entities`)

**Причины:**
- Разработчики пишут текст напрямую в JSX с апострофами и кавычками
- Копирование текста из других источников без экранирования
- Незнание правил ESLint для JSX

**Примеры:**
- `site's` → должно быть `site&apos;s`
- `'MedicalEntity'` → должно быть `&apos;MedicalEntity&apos;`
- `"recovery time"` → должно быть `&quot;recovery time&quot;`

**Решение:**
- Использовать `eslint --fix` для автоматического исправления
- Настроить автоматическое форматирование при сохранении
- Использовать i18n для всех текстов (избегает проблемы)

### 3. Использование типа `any` (`@typescript-eslint/no-explicit-any`)

**Причины:**
- Быстрое прототипирование без правильной типизации
- Незнание правильных типов
- Сложные типы, которые кажутся трудными для определения

**Примеры:**
- `const BentoCard = ({ children, className, title, subtitle }: any) =>`

**Решение:**
- Всегда определять интерфейсы для props
- Использовать утилитарные типы TypeScript (`Record`, `Pick`, `Omit`)
- Использовать `unknown` вместо `any` когда тип действительно неизвестен

## Стратегия устранения

### Немедленные действия

1. **Исправить все текущие ошибки** ✅
   - Удалить неиспользуемые импорты
   - Экранировать все специальные символы в JSX
   - Заменить все `any` на правильные типы

2. **Настроить автоматическое исправление**

```json
// package.json
{
  "scripts": {
    "lint:fix": "pnpm --filter web lint --fix",
    "pre-commit": "pnpm lint:fix && pnpm typecheck"
  }
}
```

3. **Настроить pre-commit hooks**

```bash
# .husky/pre-commit
#!/bin/sh
pnpm lint:fix
pnpm typecheck
```

### Долгосрочные решения

1. **Настроить автоматическое форматирование при сохранении**

В `.vscode/settings.json`:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true
}
```

2. **Использовать ESLint плагины для автоматического удаления импортов**

```json
// eslint.config.mjs
{
  plugins: ['unused-imports'],
  rules: {
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': 'warn'
  }
}
```

3. **Добавить строгие правила в ESLint**

```json
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'react/no-unescaped-entities': 'error'
  }
}
```

4. **Использовать TypeScript strict mode**

В `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

5. **Добавить проверку в CI/CD**

В GitHub Actions или другом CI:
```yaml
- name: Lint
  run: pnpm lint
- name: Type Check
  run: pnpm typecheck
```

## Рекомендации для разработчиков

1. **Всегда запускать `pnpm lint:fix` перед коммитом**
2. **Использовать i18n для всех текстов** (избегает проблем с экранированием)
3. **Определять типы сразу**, не использовать `any`
4. **Удалять неиспользуемые импорты сразу** после рефакторинга
5. **Использовать IDE плагины** для автоматического форматирования

## Автоматизация

### Скрипт для автоматического исправления всех ошибок

```bash
#!/bin/bash
# scripts/fix-lint.sh

echo "Running ESLint auto-fix..."
pnpm --filter web lint --fix

echo "Running TypeScript check..."
pnpm --filter web typecheck

echo "Done!"
```

### Git hook для автоматической проверки

```bash
#!/bin/sh
# .git/hooks/pre-commit

pnpm lint:fix
if [ $? -ne 0 ]; then
  echo "Lint errors found. Please fix them before committing."
  exit 1
fi
```

## Итог

Основные причины повторяющихся ошибок:
1. Отсутствие автоматизации в процессе разработки
2. Недостаточная настройка IDE
3. Отсутствие pre-commit hooks
4. Незнание правил ESLint

**Решение:** Комбинация автоматизации, правильной настройки инструментов и соблюдения best practices.


