# ClinicAI Score (Сумарний звіт)

> **Модуль:** `engine/clinic-ai-score.ts`  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Призначення

ClinicAI Score — це головний комплексний показник, який відображає, наскільки клініка успішно представлена та оптимізована для генеративних AI-систем (ChatGPT, Perplexity, Claude тощо). Агрегує всі інші метрики системи в єдиний зрозумілий показник.

---

## Вхідні дані

### Обов'язкові параметри

| Параметр | Тип | Опис | Джерело |
|----------|-----|------|---------|
| `visibility` | `number` | Показник видимості послуг в AI (0-100) | Модуль: `visibility-calculator` |
| `tech` | `number` | Технічна оптимізація сайту (0-100) | Модуль: `tech-audit-service` |
| `content` | `number` | Оптимізація контенту (0-100) | Модуль: `content-optimizer` |
| `eeat` | `number` | E-E-A-T показники (0-100) | Модуль: `eeat-calculator` |
| `local` | `number` | Локальні показники (0-100) | Модуль: `local-seo-calculator` |

---

## Вихідні дані

| Поле | Тип | Опис | Діапазон |
|------|-----|------|----------|
| `score` | `number` | Фінальний ClinicAI Score | 0-100 |

---

## Алгоритм

### Крок 1: Валідація вхідних даних

```typescript
const validateScore = (score: number, name: string) => {
  if (score < 0 || score > 100) {
    throw new Error(`${name} score must be between 0 and 100, got ${score}`);
  }
};
```

Всі вхідні параметри перевіряються на відповідність діапазону 0-100.

### Крок 2: Зважене сумування

```typescript
const score = 
  0.25 * visibility +
  0.20 * tech +
  0.20 * content +
  0.15 * eeat +
  0.10 * local;
```

**Примітка:** Сума коефіцієнтів = 0.90. У оригінальному Functionality.md вказано `0.10*` без назви останнього компонента. В коді використовується 5 компонентів з сумою 0.90.

### Крок 3: Нормалізація результату

```typescript
return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
```

---

## Формули та коефіцієнти

### Основна формула

```
ClinicAI Score = 0.25 × Visibility + 0.20 × Tech + 0.20 × Content + 0.15 × E-E-A-T + 0.10 × Local
```

### Коефіцієнти (ваги)

| Компонент | Вага | Обґрунтування |
|-----------|------|---------------|
| **Visibility** | 0.25 (25%) | Найважливіший — безпосередня видимість у AI-відповідях |
| **Tech** | 0.20 (20%) | Технічна база для індексації |
| **Content** | 0.20 (20%) | Якість контенту для AI-систем |
| **E-E-A-T** | 0.15 (15%) | Довіра та авторитетність |
| **Local** | 0.10 (10%) | Локальна присутність |

### Розрахунок компонентів

#### Visibility (Видимість послуг)

```
Visibility = (Кількість послуг в AI) / (Загальна кількість послуг) × 100
```

**Джерело:** Розділ "Аналіз видачі послуг"

#### Tech (Технічна оптимізація)

Агрегований показник з розділу "Технічна оптимізація", включає:
- llms.txt (наявність + оптимізація)
- robots.txt (наявність + конфігурація)
- HTTPS
- Мобільна адаптивність
- Schema Markup (всі типи)
- Швидкість (desktop/mobile)
- Meta-теги

#### Content (Оптимізація контенту)

Агрегований показник з розділу "Оптимізація контенту", включає:
- Сторінки напрямків
- Сторінки послуг
- Сторінки лікарів
- Архітектура сайту
- Блог
- Унікальність контенту
- FAQ
- Контактна інформація

#### E-E-A-T

Агрегований показник з розділу "E-E-A-T показники", включає:
- Автори
- Експертність лікарів
- Досвід клініки
- Репутація
- Історії пацієнтів
- Прозорість
- Ліцензії
- Наукові джерела

#### Local

Агрегований показник з розділу "Локальні показники", включає:
- Google Business Profile
- Реакція на відгуки
- Local Backlinks
- Соціальні мережі
- Local Business Schema

---

## Edge Cases

### 1. Null/Undefined значення

```typescript
if (score === null || score === undefined) {
  throw new Error('Score value is required');
}
```

### 2. Вихід за межі діапазону

```typescript
// Вхідні дані
if (visibility < 0 || visibility > 100) {
  throw new Error('Visibility score must be between 0 and 100');
}

// Вихідний результат
return Math.max(0, Math.min(100, calculatedScore));
```

### 3. Часткові дані

Якщо один з компонентів недоступний, рекомендована поведінка:
```typescript
// Варіант 1: Використати 0
const visibility = inputs.visibility ?? 0;

// Варіант 2: Перерахувати ваги
// Не рекомендується — порушує консистентність
```

---

## Залежності

### Внутрішні модулі

- `engine/visibility-calculator.ts` — розрахунок Visibility
- `engine/tech-audit-score.ts` — розрахунок Tech
- `engine/content-score.ts` — розрахунок Content
- `engine/eeat-score.ts` — розрахунок E-E-A-T
- `engine/local-score.ts` — розрахунок Local

### Зовнішні API

Немає прямих залежностей. Всі дані надходять через внутрішні модулі.

---

## Приклади

### Приклад 1: Добре оптимізована клініка

**Вхід:**
```typescript
{
  visibility: 85,
  tech: 78,
  content: 82,
  eeat: 75,
  local: 90
}
```

**Розрахунок:**
```
Score = 0.25×85 + 0.20×78 + 0.20×82 + 0.15×75 + 0.10×90
Score = 21.25 + 15.6 + 16.4 + 11.25 + 9.0
Score = 73.5
```

**Результат:** `73.50`

### Приклад 2: Нова клініка без оптимізації

**Вхід:**
```typescript
{
  visibility: 10,
  tech: 45,
  content: 30,
  eeat: 20,
  local: 15
}
```

**Розрахунок:**
```
Score = 0.25×10 + 0.20×45 + 0.20×30 + 0.15×20 + 0.10×15
Score = 2.5 + 9.0 + 6.0 + 3.0 + 1.5
Score = 22.0
```

**Результат:** `22.00`

### Приклад 3: Edge case — максимальні значення

**Вхід:**
```typescript
{
  visibility: 100,
  tech: 100,
  content: 100,
  eeat: 100,
  local: 100
}
```

**Результат:** `90.00` (сума ваг = 0.90)

---

## Візуалізація

### Динаміка ClinicAI Score

- **Тип графіка:** Line chart
- **Вісь X:** Час (тижні)
- **Вісь Y:** Score (0-100)
- **Оновлення:** Раз на тиждень з інтерполяцією проміжних значень

### Конкурентний аналіз (Scatter Plot)

- **Вісь X:** Середня позиція в AI-видачі (1-10, чим менше — тим краще)
- **Вісь Y:** ClinicAI Score (0-100)
- **Розмір бульбашки:** Кількість послуг у AI
- **Кольори:**
  - Зелений — ваша клініка
  - Оранжевий — Top-3 конкуренти
  - Сірий — інші конкуренти

---

## Тестування

### Unit тести

```typescript
describe('calculateClinicAIScore', () => {
  it('should calculate correct score with valid inputs', () => {
    const result = calculateClinicAIScore({
      visibility: 80,
      tech: 70,
      content: 60,
      eeat: 50,
      local: 40
    });
    expect(result).toBeCloseTo(63.5, 2);
  });

  it('should throw error for out-of-range values', () => {
    expect(() => calculateClinicAIScore({
      visibility: 150, // Invalid
      tech: 70,
      content: 60,
      eeat: 50,
      local: 40
    })).toThrow('Visibility score must be between 0 and 100');
  });

  it('should clamp result to 0-100 range', () => {
    const result = calculateClinicAIScore({
      visibility: 100,
      tech: 100,
      content: 100,
      eeat: 100,
      local: 100
    });
    expect(result).toBeLessThanOrEqual(100);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
```

---

## Нотатки з міграції

### Що було в старому коді

- **Файл:** `apps/web/lib/modules/analytics/calculator.ts`
- **Функція:** `calculateClinicAIScore()`
- **Особливості:** 
  - Інтерфейс `ClinicAIScoreInputs`
  - Валідація через helper `validateScore()`
  - Округлення до 2 знаків після коми

### Що потрібно змінити

1. Винести в окремий модуль `engine/clinic-ai-score.ts`
2. Додати документацію JSDoc
3. Експортувати типи окремо
4. Додати unit-тести

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова специфікація на основі аналізу коду |
