# AIV Score (Аналіз послуг)

> **Модуль:** `engine/aiv-score.ts`  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Призначення

AIV Score (AI Visibility Score) — метрика для кожної конкретної медичної послуги, яка відображає, наскільки клініка ефективно представлена і видима в системах штучного інтелекту. Об'єднує показники видимості, позиції та конкурентного оточення.

---

## Вхідні дані

### Обов'язкові параметри

| Параметр | Тип | Опис | Джерело |
|----------|-----|------|---------|
| `isVisible` | `boolean` | Чи показується послуга в AI-відповідях | AI Scanner |
| `position` | `number \| null` | Позиція в списку (1, 2, 3...) або null | AI Scanner |
| `totalResults` | `number` | Загальна кількість результатів у відповіді | AI Scanner |
| `competitorsAvgScore` | `number` | Середній ClinicAI Score конкурентів (0-100) | Агрегація |

---

## Вихідні дані

| Поле | Тип | Опис | Діапазон |
|------|-----|------|----------|
| `finalScore` | `number` | Фінальний AIV Score | 0-100 |
| `visibilityPart` | `number` | Внесок видимості | 0-30 |
| `positionPart` | `number` | Внесок позиції | 0-25 |
| `competitorPart` | `number` | Внесок конкурентного аналізу | 0-20 |

---

## Алгоритм

### Крок 1: Визначення V (Visibility)

```typescript
const V = isVisible ? 1 : 0;
```

- Якщо послуга показується → V = 1
- Якщо не показується → V = 0 (весь Score = 0)

### Крок 2: Розрахунок P_Score (Position Score)

```typescript
let P_Score: number;

if (!isVisible || position === null) {
  P_Score = 0;
} else if (position === 1) {
  P_Score = 100; // Топ-1 = максимум
} else {
  P_Score = (1 - position / totalResults) * 100;
  P_Score = Math.max(0, Math.min(100, P_Score));
}
```

**Логіка:**
- Позиція 1 → P_Score = 100
- Позиція 2 з 5 → P_Score = (1 - 2/5) × 100 = 60
- Позиція 5 з 5 → P_Score = (1 - 5/5) × 100 = 0

### Крок 3: Розрахунок компонентів

```typescript
const visibilityPart = V * 100 * 0.30; // Max: 30
const positionPart = P_Score * 0.25;    // Max: 25
const competitorPart = C * 0.20;        // Max: 20
```

### Крок 4: Фінальний розрахунок

```typescript
const finalScore = V * (visibilityPart + positionPart + competitorPart);
```

**Важливо:** Якщо V = 0, весь Score = 0 (множник V спереду).

---

## Формули та коефіцієнти

### Основна формула

```
AIV Score = V × ((V × 100 × 0.30) + (P × 0.25) + (C × 0.20))
```

Де:
- **V** = Видимість (1 або 0)
- **P** = Позиційний Score (0-100)
- **C** = Середній ClinicAI Score конкурентів (0-100)

### Розрахунок P (Position Score)

```
Якщо позиція = 1:
  P = 100

Інакше:
  P = (1 - (поточна_позиція / всього_результатів)) × 100
```

### Коефіцієнти (ваги)

| Компонент | Вага | Максимум | Обґрунтування |
|-----------|------|----------|---------------|
| Visibility | 0.30 | 30 | Факт присутності найважливіший |
| Position | 0.25 | 25 | Вища позиція = більше кліків |
| Competitors | 0.20 | 20 | Контекст конкурентного поля |

**Загальний максимум:** 75 (якщо V=1, P=100, C=100)

---

## Edge Cases

### 1. Послуга не видима

```typescript
if (!isVisible) {
  return {
    visibilityPart: 0,
    positionPart: 0,
    competitorPart: 0,
    finalScore: 0
  };
}
```

### 2. Position = null (видима, але позиція невідома)

```typescript
if (position === null) {
  P_Score = 0; // Не враховуємо позицію
}
```

### 3. totalResults < 1

```typescript
if (totalResults < 1) {
  throw new Error('totalResults must be at least 1');
}
```

### 4. Position > totalResults

```typescript
if (position !== null && position > totalResults) {
  throw new Error(`position must be between 1 and totalResults`);
}
```

### 5. competitorsAvgScore поза діапазоном

```typescript
if (competitorsAvgScore < 0 || competitorsAvgScore > 100) {
  throw new Error('competitorsAvgScore must be between 0 and 100');
}
```

---

## Залежності

### Внутрішні модулі

- `engine/ai-scanner.ts` — отримання visibility, position, totalResults
- `engine/competitor-aggregator.ts` — розрахунок competitorsAvgScore

### Зовнішні API

- **OpenAI API** — для сканування AI-відповідей
- **Perplexity API** — альтернативне джерело (опціонально)

---

## Приклади

### Приклад 1: Топ-1 позиція

**Вхід:**
```typescript
{
  isVisible: true,
  position: 1,
  totalResults: 5,
  competitorsAvgScore: 70
}
```

**Розрахунок:**
```
V = 1
P_Score = 100 (позиція 1)
C = 70

visibilityPart = 1 × 100 × 0.30 = 30
positionPart = 100 × 0.25 = 25
competitorPart = 70 × 0.20 = 14

finalScore = 1 × (30 + 25 + 14) = 69
```

**Результат:** `69.00`

### Приклад 2: Середня позиція

**Вхід:**
```typescript
{
  isVisible: true,
  position: 3,
  totalResults: 5,
  competitorsAvgScore: 60
}
```

**Розрахунок:**
```
V = 1
P_Score = (1 - 3/5) × 100 = 40
C = 60

visibilityPart = 30
positionPart = 40 × 0.25 = 10
competitorPart = 60 × 0.20 = 12

finalScore = 1 × (30 + 10 + 12) = 52
```

**Результат:** `52.00`

### Приклад 3: Невидима послуга

**Вхід:**
```typescript
{
  isVisible: false,
  position: null,
  totalResults: 5,
  competitorsAvgScore: 80
}
```

**Результат:** `0.00`

### Приклад 4: Остання позиція

**Вхід:**
```typescript
{
  isVisible: true,
  position: 5,
  totalResults: 5,
  competitorsAvgScore: 50
}
```

**Розрахунок:**
```
P_Score = (1 - 5/5) × 100 = 0

finalScore = 1 × (30 + 0 + 10) = 40
```

**Результат:** `40.00`

---

## Додаткові метрики розділу

### Видимість послуг (Visibility Rate)

```typescript
function calculateVisibilityRate(
  totalServices: number,
  visibleServices: number
): number {
  if (totalServices === 0) return 0;
  return (visibleServices / totalServices) * 100;
}
```

**Формула:**
```
Visibility Rate = (Кількість послуг в AI / Загальна кількість) × 100
```

### Середня позиція (Average Position)

```typescript
function calculateAveragePosition(scans: Scan[]): number | null {
  const visibleScans = scans.filter(s => s.visible && s.position !== null);
  
  if (visibleScans.length === 0) return null;
  
  const sum = visibleScans.reduce((acc, s) => acc + s.position, 0);
  return sum / visibleScans.length;
}
```

---

## Дані для таблиці послуг

| Поле | Тип | Опис |
|------|-----|------|
| `service` | `string` | Назва послуги |
| `page` | `string` | URL сторінки послуги |
| `country` | `string` | Країна запиту |
| `city` | `string` | Місто запиту |
| `visible` | `boolean` | Чи показується в AI |
| `url` | `string \| null` | URL клініки в AI-відповіді |
| `position` | `string` | Формат: "2(5)" — позиція 2 з 5 |
| `aivScore` | `number` | Розрахований AIV Score |
| `competitors` | `string[]` | Перелік конкурентів |
| `competitorUrls` | `string[]` | URL конкурентів |

---

## Тестування

### Unit тести

```typescript
describe('calculateServiceAivScore', () => {
  it('should return 0 when not visible', () => {
    const result = calculateServiceAivScore({
      isVisible: false,
      position: null,
      totalResults: 5,
      competitorsAvgScore: 80
    });
    expect(result.finalScore).toBe(0);
  });

  it('should give max position score for position 1', () => {
    const result = calculateServiceAivScore({
      isVisible: true,
      position: 1,
      totalResults: 10,
      competitorsAvgScore: 50
    });
    expect(result.positionPart).toBe(25); // 100 * 0.25
  });

  it('should handle last position correctly', () => {
    const result = calculateServiceAivScore({
      isVisible: true,
      position: 5,
      totalResults: 5,
      competitorsAvgScore: 50
    });
    expect(result.positionPart).toBe(0);
  });

  it('should throw for invalid totalResults', () => {
    expect(() => calculateServiceAivScore({
      isVisible: true,
      position: 1,
      totalResults: 0, // Invalid
      competitorsAvgScore: 50
    })).toThrow('totalResults must be at least 1');
  });
});
```

---

## Нотатки з міграції

### Що було в старому коді

- **Файл:** `apps/web/lib/modules/analytics/calculator.ts`
- **Функція:** `calculateServiceAivScore()`
- **Інтерфейси:**
  - `ServiceAivScoreInputs`
  - `ServiceAivScoreBreakdown`

### Допоміжні функції для міграції

З того ж файлу:
- `calculateVisibilityRate()` — розрахунок % видимості
- `calculateAveragePosition()` — середня позиція
- `countVisibleServices()` — підрахунок видимих послуг
- `countTotalServices()` — підрахунок всіх послуг

---

## 2.1 Аналіз однієї послуги (детальний вигляд)

### Опис

При кліку на конкретну послугу відкривається детальний вигляд з:
1. Інформацією про послугу (з таблиці)
2. Графіком динаміки AIV Score за останній рік
3. AI-генерованими рекомендаціями

### Структура даних

```typescript
interface ServiceDetailView {
  // Базові дані з таблиці
  service: string;
  page: string;
  country: string;
  city: string;
  visible: boolean;
  url: string | null;
  position: string;        // Формат: "2(5)"
  aivScore: number;
  competitors: string[];
  competitorUrls: string[];
  
  // Історичні дані
  history: Array<{
    date: string;          // ISO date
    aivScore: number;
  }>;
  
  // AI рекомендації
  recommendations: string[];
}
```

### AI Рекомендації (Prompt логіка)

```typescript
interface RecommendationInput {
  servicePage: string;           // URL сторінки послуги клієнта
  competitorPages: string[];     // URL аналогічних сторінок конкурентів
  currentMetrics: {
    aivScore: number;
    position: number | null;
    visible: boolean;
    techScore: number;           // З технічного аудиту
    contentScore: number;        // З аналізу контенту
    eeatScore: number;           // З E-E-A-T аналізу
  };
}

async function generateRecommendations(input: RecommendationInput): Promise<string[]> {
  // Prompt для GPT-4:
  // 1. Аналіз сторінки послуги клієнта
  // 2. Порівняння з конкурентами
  // 3. Врахування всіх показників (Tech, Content, E-E-A-T)
  // 4. Генерація персоналізованих рекомендацій
  
  const prompt = `
    Проаналізуй сторінку послуги "${input.servicePage}" та порівняй з конкурентами.
    
    Поточні показники:
    - AIV Score: ${input.currentMetrics.aivScore}
    - Позиція: ${input.currentMetrics.position || 'не показується'}
    - Tech Score: ${input.currentMetrics.techScore}
    - Content Score: ${input.currentMetrics.contentScore}
    - E-E-A-T Score: ${input.currentMetrics.eeatScore}
    
    Конкуренти: ${input.competitorPages.join(', ')}
    
    Надай 5-7 конкретних рекомендацій для покращення видимості цієї послуги в AI.
  `;
  
  return await callOpenAI(prompt);
}
```

### Графік динаміки AIV Score

```typescript
interface AIVScoreChartData {
  labels: string[];      // Дати (місяці/тижні)
  values: number[];      // AIV Score значення
  trend: 'up' | 'down' | 'stable';
}

function prepareChartData(history: ServiceDetailView['history']): AIVScoreChartData {
  // Групування по тижнях/місяцях
  // Інтерполяція проміжних значень
  // Визначення тренду
}
```

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова специфікація на основі аналізу коду |
| 1.1 | 2025-01-03 | Додано секцію 2.1 Аналіз однієї послуги |
