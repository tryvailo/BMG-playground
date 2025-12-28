# Постоянное решение проблемы с catch блоками

## ✅ Решение применено

### Что было сделано:

1. **Настроено ESLint правило `caughtErrorsIgnorePattern`**
   - Разрешены неиспользуемые переменные в catch блоках с префиксом `_`
   - Файл: `apps/web/eslint.config.mjs`

2. **Исправлены все catch блоки**
   - Где `error` не используется → `catch (_error)`
   - Где `error` используется → `catch (error)`

3. **Создана документация**
   - `apps/web/docs/error-analysis-and-solution.md` - полный анализ проблемы
   - `apps/web/docs/permanent-solution.md` - это руководство

## 📋 Правила использования catch блоков

### ✅ Правильно:

```typescript
// Если error НЕ используется
} catch (_error) {
  return false;
}

// Если error используется
} catch (error) {
  console.error('Error:', error);
  throw error;
}
```

### ❌ Неправильно:

```typescript
// ESLint ошибка: 'error' is defined but never used
} catch (error) {
  return false;
}

// TypeScript ошибка: Cannot find name 'error'
} catch {
  console.error('Error:', error);
}
```

## 🔧 Конфигурация ESLint

В файле `apps/web/eslint.config.mjs` добавлено правило:

```javascript
{
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_', // Разрешить _error в catch
      },
    ],
  },
}
```

## 📝 Как использовать

### При написании нового кода:

1. **Если error не нужен:**
   ```typescript
   } catch (_error) {
     // обработка без использования error
   }
   ```

2. **Если error нужен:**
   ```typescript
   } catch (error) {
     console.error('Error:', error);
     // использование error
   }
   ```

### При рефакторинге:

1. Проверьте, используется ли `error` в catch блоке
2. Если используется → оставьте `catch (error)`
3. Если не используется → замените на `catch (_error)`

## 🚀 Автоматизация

### Pre-commit hook (рекомендуется):

```bash
#!/bin/sh
# .husky/pre-commit
pnpm --filter web lint:fix
pnpm --filter web typecheck
```

### VS Code настройки:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## ✅ Результат

- ✅ TypeScript компиляция: **0 ошибок**
- ✅ ESLint ошибки с catch блоками: **0 ошибок**
- ✅ Единообразный подход во всем проекте
- ✅ Автоматическая проверка через ESLint

## 📚 Дополнительная информация

- Полный анализ проблемы: `apps/web/docs/error-analysis-and-solution.md`
- Скрипт для автоматического исправления: `apps/web/scripts/fix-catch-blocks.sh`

