# 📊 Data Engine Specifications

> Документація бізнес-логіки для міграції в ізольований data engine

---

## Огляд

Ця папка містить детальні специфікації всіх метрик, формул та алгоритмів системи GEO (Generative Engine Optimization) для медичних клінік.

### Мета документації

1. **Ізоляція логіки** — відокремити бізнес-логіку від UI та бази даних
2. **Модульність** — кожен модуль має бути незалежним та тестованим
3. **Повнота** — всі формули, коефіцієнти та edge cases задокументовані
4. **Міграція** — полегшити перенос в новий проект

---

## Структура документації

| Файл | Модуль | Опис |
|------|--------|------|
| [_template.md](./_template.md) | — | Шаблон для нових специфікацій |
| [01-clinic-ai-score.md](./01-clinic-ai-score.md) | `clinic-ai-score.ts` | Головний показник клініки |
| [02-aiv-score.md](./02-aiv-score.md) | `aiv-score.ts` | Показник видимості послуги |
| [03-tech-audit.md](./03-tech-audit.md) | `tech-audit.ts` | Технічна оптимізація |
| [04-content-optimization.md](./04-content-optimization.md) | `content-score.ts` | Оптимізація контенту |
| [05-eeat-score.md](./05-eeat-score.md) | `eeat-score.ts` | E-E-A-T показники |
| [06-local-score.md](./06-local-score.md) | `local-score.ts` | Локальні показники |
| [07-competitor-analysis.md](./07-competitor-analysis.md) | `competitor-analysis.ts` | Аналіз конкурентів |

---

## Архітектура Data Engine

```
src/server/services/engine/
├── index.ts                    # Головний експорт
├── types.ts                    # Спільні типи
├── constants.ts                # Константи, ваги, пороги
│
├── scores/
│   ├── clinic-ai-score.ts      # ClinicAI Score
│   ├── aiv-score.ts            # AIV Score (послуги)
│   ├── tech-score.ts           # Tech Score
│   ├── content-score.ts        # Content Score
│   ├── eeat-score.ts           # E-E-A-T Score
│   └── local-score.ts          # Local Score
│
├── audits/
│   ├── tech-audit.ts           # Технічний аудит
│   ├── html-parser.ts          # Парсинг HTML
│   ├── schema-analyzer.ts      # Аналіз Schema Markup
│   └── llms-analyzer.ts        # Аналіз llms.txt
│
├── scanners/
│   ├── ai-scanner.ts           # Сканування AI-відповідей
│   ├── domain-extractor.ts     # Витяг доменів
│   └── position-tracker.ts     # Відстеження позицій
│
└── analytics/
    ├── competitor-aggregator.ts # Агрегація конкурентів
    ├── visibility-calculator.ts # Розрахунок видимості
    └── gap-analyzer.ts          # Gap аналіз
```

---

## Головна формула системи

### ClinicAI Score

```
ClinicAI Score = 0.25 × Visibility + 0.20 × Tech + 0.20 × Content + 0.15 × E-E-A-T + 0.10 × Local
```

### Ваги компонентів

| Компонент | Вага | Пріоритет |
|-----------|------|-----------|
| Visibility | 25% | 🔴 Критичний |
| Tech | 20% | 🟠 Високий |
| Content | 20% | 🟠 Високий |
| E-E-A-T | 15% | 🟡 Середній |
| Local | 10% | 🟢 Базовий |

**Загальна сума ваг:** 90% (10% зарезервовано)

---

## Принципи реалізації

### 1. Чисті функції

```typescript
// ✅ Добре — чиста функція
function calculateScore(inputs: ScoreInputs): number {
  return inputs.a * 0.5 + inputs.b * 0.5;
}

// ❌ Погано — залежність від зовнішнього стану
function calculateScore(inputs: ScoreInputs): number {
  return inputs.a * globalWeight + fetchFromDB();
}
```

### 2. Валідація на вході

```typescript
function calculateScore(value: number): number {
  // Завжди валідуємо
  if (value < 0 || value > 100) {
    throw new Error(`Value must be 0-100, got ${value}`);
  }
  
  // Логіка розрахунку
  return value * 0.5;
}
```

### 3. Безпечні значення за замовчуванням

```typescript
function processData(data: Data | null): Result {
  // Null-safe access
  const value = data?.score ?? 0;
  
  // Empty array handling
  const items = data?.items ?? [];
  
  return calculate(value, items);
}
```

### 4. Документовані edge cases

```typescript
/**
 * Розрахунок середньої позиції
 * 
 * @edge-case Порожній масив → повертає null
 * @edge-case Всі невидимі → повертає null
 * @edge-case Позиція null → ігнорується
 */
function calculateAveragePosition(scans: Scan[]): number | null {
  const visible = scans.filter(s => s.visible && s.position !== null);
  
  if (visible.length === 0) return null;
  
  return sum(visible.map(s => s.position!)) / visible.length;
}
```

---

## Зовнішні залежності

### API

| API | Призначення | Обов'язковий |
|-----|-------------|--------------|
| Google PageSpeed Insights | Швидкість сайту | Так |
| OpenAI API | AI-аналіз | Так |
| Google Places API | GBP дані | Ні |
| Ahrefs/Semrush | Backlinks | Ні |

### Бібліотеки

| Бібліотека | Призначення |
|------------|-------------|
| `cheerio` | Парсинг HTML |
| `zod` | Валідація схем |

---

## Міграція зі старого коду

### Джерела коду

| Старий шлях | Новий модуль |
|-------------|--------------|
| `apps/web/lib/modules/analytics/calculator.ts` | `scores/` |
| `apps/web/lib/modules/audit/` | `audits/` |
| `apps/web/lib/modules/ai/scanner.ts` | `scanners/` |
| `apps/web/lib/modules/audit/utils/` | `audits/` |

### Чек-лист міграції

- [ ] Витягнути чисту логіку з кожного файлу
- [ ] Видалити залежності від Supabase
- [ ] Видалити React/UI код
- [ ] Додати типи TypeScript
- [ ] Написати unit тести
- [ ] Задокументувати API

---

## Тестування

### Структура тестів

```
src/server/services/engine/__tests__/
├── clinic-ai-score.test.ts
├── aiv-score.test.ts
├── tech-audit.test.ts
└── ...
```

### Приклад тесту

```typescript
import { calculateClinicAIScore } from '../scores/clinic-ai-score';

describe('calculateClinicAIScore', () => {
  it('should calculate correct score with valid inputs', () => {
    const result = calculateClinicAIScore({
      visibility: 80,
      tech: 70,
      content: 60,
      eeat: 50,
      local: 40
    });
    
    expect(result).toBeCloseTo(63.5, 1);
  });

  it('should throw for out-of-range values', () => {
    expect(() => calculateClinicAIScore({
      visibility: 150, // Invalid
      tech: 70,
      content: 60,
      eeat: 50,
      local: 40
    })).toThrow();
  });

  it('should handle edge case: all zeros', () => {
    const result = calculateClinicAIScore({
      visibility: 0,
      tech: 0,
      content: 0,
      eeat: 0,
      local: 0
    });
    
    expect(result).toBe(0);
  });
});
```

---

## Контрибуція

### Додавання нової метрики

1. Створити файл специфікації на основі `_template.md`
2. Реалізувати модуль в `src/server/services/engine/`
3. Написати unit тести
4. Оновити цей README

### Зміна формули

1. Оновити специфікацію у відповідному `.md` файлі
2. Додати запис у Changelog
3. Оновити тести
4. Перевірити залежні модулі

---

## Changelog

| Дата | Зміни |
|------|-------|
| 2025-01-03 | Початкова версія специфікацій на основі Functionality.md та аналізу коду |

---

## Контакти

Питання щодо специфікацій → створіть Issue в репозиторії
