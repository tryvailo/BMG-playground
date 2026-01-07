# Аналіз конкурентів (Competitor Analysis)

> **Модуль:** `engine/competitor-analysis.ts`  
> **Версія:** 1.0  
> **Останнє оновлення:** 2025-01-03

---

## Призначення

Модуль аналізу конкурентного поля — порівняння клініки з топ-10 конкурентами за ключовими метриками GEO. Допомагає визначити позицію клініки на ринку та знайти точки росту.

---

## Джерело даних для конкурентів

Топ-10 конкурентів визначаються на основі **частоти появи в AI-відповідях** по всіх відстежуваних послугах клініки.

```typescript
function getTopCompetitors(scans: Scan[]): string[] {
  const domainCount = new Map<string, number>();
  
  for (const scan of scans) {
    const domains = extractDomainsFromResponse(scan.raw_response);
    for (const domain of domains) {
      domainCount.set(domain, (domainCount.get(domain) || 0) + 1);
    }
  }
  
  return Array.from(domainCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain]) => domain);
}
```

---

## Структура модуля

| # | Показник | Опис | Візуалізація |
|---|----------|------|--------------|
| 1 | ClinicAI Score vs ТОП-10 | Порівняння загального скору | Bar chart |
| 2 | Видимість послуг vs ТОП-10 | Порівняння % видимості | Bar chart |
| 3 | Середня позиція vs ТОП-10 | Порівняння позицій | Bar chart (inverted) |
| 4 | Технічна оптимізація vs ТОП-10 | Порівняння Tech Score | Bar chart |
| 5 | Оптимізація контенту vs ТОП-10 | Порівняння Content Score | Bar chart |
| 6 | E-E-A-T vs ТОП-10 | Порівняння EEAT Score | Bar chart |
| 7 | Локальні показники vs ТОП-10 | Порівняння Local Score | Bar chart |
| 8 | Таблиця ТОП-10 конкурентів | Перелік з показниками: назва, сайт, CAI, AIV, позиція | Таблиця (сортування по CAI) |
| 9 | Матриця позиціонування | CAI Score vs Позиція | Scatter plot (бульбашки) |
| 10 | Динаміка ClinicAI Score | Зміни за 3-6 місяців | Multi-line chart |
| 11 | Розподіл AIV по послугам | Видимість по кожній послузі | Horizontal bar chart |
| 12 | Конкуренція по E-E-A-T | Рейтинг конкурентів | Vertical bar chart (0-100) |
| 13 | Конкуренція по Tech | Рейтинг конкурентів | Vertical bar chart (0-100) |
| 14 | Конкуренція по Content | Рейтинг конкурентів | Vertical bar chart (0-100) |
| 15 | Конкуренція по Local | Рейтинг конкурентів | Vertical bar chart (0-100) |
| 16 | Gap аналіз по послугам | Де ви сильніші/слабші | Diverging bar chart |
| 17 | Конкурентна динаміка AIV | Динаміка AIV по конкретній послузі | Line chart + dropdown

---

## Агрегація статистики конкурентів

### Алгоритм

```typescript
interface DomainStats {
  domain: string;
  appearances: number;      // Кількість згадок
  positions: number[];      // Всі позиції
  totalScans: number;
}

interface CompetitorPoint {
  domain: string;
  avgPosition: number | null;  // Середня позиція
  aiScore: number;             // Розрахований AI Score
  isClient: boolean;           // Чи це наша клініка
  mentions: number;            // Кількість згадок
}

function aggregateCompetitorStats(
  scans: Scan[],
  clientDomain?: string
): CompetitorPoint[] {
  const domainStatsMap = new Map<string, DomainStats>();
  
  for (const scan of scans) {
    const domains = extractDomainsFromResponse(scan.raw_response);
    
    for (const domain of domains) {
      if (!domainStatsMap.has(domain)) {
        domainStatsMap.set(domain, {
          domain,
          appearances: 0,
          positions: [],
          totalScans: 0
        });
      }
      
      const stats = domainStatsMap.get(domain)!;
      stats.appearances += 1;
      stats.totalScans += 1;
      
      if (scan.visible && scan.position !== null) {
        stats.positions.push(scan.position);
      }
    }
  }
  
  // Сортуємо за частотою появи
  const sorted = Array.from(domainStatsMap.values())
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 9);  // Топ-9 + клієнт
  
  return sorted.map(stats => {
    const avgPosition = stats.positions.length > 0
      ? stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length
      : null;
    
    // Розрахунок AI Score на основі visibility та position
    const visibilityRate = (stats.positions.length / stats.totalScans) * 100;
    const positionScore = avgPosition 
      ? Math.max(0, 100 - avgPosition * 10)
      : 0;
    const aiScore = visibilityRate * 0.6 + positionScore * 0.4;
    
    return {
      domain: stats.domain,
      avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
      aiScore: Math.round(aiScore * 10) / 10,
      isClient: clientDomain 
        ? stats.domain.toLowerCase() === clientDomain.toLowerCase()
        : false,
      mentions: stats.appearances
    };
  });
}
```

---

## Метрики порівняння

### 1. ClinicAI Score vs ТОП-10

```typescript
interface ClinicAIComparison {
  yourScore: number;
  top10Avg: number;
  percentile: number;      // На якому ви % серед конкурентів
  gap: number;             // Різниця до лідера
  competitors: Array<{
    name: string;
    domain: string;
    score: number;
  }>;
}

async function compareClinicAIScore(
  yourScore: number,
  competitors: string[]
): Promise<ClinicAIComparison> {
  const competitorScores = await Promise.all(
    competitors.map(async domain => ({
      domain,
      score: await calculateCompetitorClinicAIScore(domain)
    }))
  );
  
  const allScores = [...competitorScores.map(c => c.score), yourScore].sort((a, b) => b - a);
  const yourRank = allScores.indexOf(yourScore) + 1;
  const percentile = ((allScores.length - yourRank) / allScores.length) * 100;
  
  return {
    yourScore,
    top10Avg: avg(competitorScores.map(c => c.score)),
    percentile,
    gap: Math.max(...competitorScores.map(c => c.score)) - yourScore,
    competitors: competitorScores.sort((a, b) => b.score - a.score)
  };
}
```

### 2. Видимість послуг vs ТОП-10

```typescript
interface VisibilityComparison {
  yourVisibility: number;      // % ваших послуг в AI
  top10Avg: number;
  byService: Array<{
    service: string;
    yourPosition: number | null;
    competitorPositions: Map<string, number>;
  }>;
}

function compareVisibility(
  yourScans: Scan[],
  competitorData: Map<string, Scan[]>
): VisibilityComparison {
  const yourVisibleCount = yourScans.filter(s => s.visible).length;
  const yourVisibility = (yourVisibleCount / yourScans.length) * 100;
  
  const competitorVisibilities = Array.from(competitorData.entries()).map(([domain, scans]) => {
    const visible = scans.filter(s => s.visible).length;
    return (visible / scans.length) * 100;
  });
  
  return {
    yourVisibility,
    top10Avg: avg(competitorVisibilities),
    byService: groupByService(yourScans, competitorData)
  };
}
```

### 3. Середня позиція vs ТОП-10

```typescript
interface PositionComparison {
  yourAvgPosition: number | null;
  top10AvgPosition: number;
  ranking: Array<{
    domain: string;
    avgPosition: number;
    isYou: boolean;
  }>;
}

function comparePositions(
  yourScans: Scan[],
  competitorPoints: CompetitorPoint[]
): PositionComparison {
  const yourAvg = calculateAveragePosition(yourScans);
  
  const ranking = [
    { domain: 'your-clinic', avgPosition: yourAvg || 10, isYou: true },
    ...competitorPoints.map(c => ({
      domain: c.domain,
      avgPosition: c.avgPosition || 10,
      isYou: false
    }))
  ].sort((a, b) => a.avgPosition - b.avgPosition);  // Менше = краще
  
  return {
    yourAvgPosition: yourAvg,
    top10AvgPosition: avg(competitorPoints.map(c => c.avgPosition || 10)),
    ranking
  };
}
```

---

## Матриця позиціонування (Scatter Plot)

### Опис

Візуалізація конкурентного поля на двовимірній матриці:
- **X-axis:** Середня позиція (1-10, менше = краще)
- **Y-axis:** ClinicAI Score (0-100, більше = краще)
- **Розмір бульбашки:** Кількість послуг в AI
- **Колір:** Зелений (ви), Оранжевий (топ-3), Сірий (інші)

### Алгоритм

```typescript
interface ScatterPoint {
  domain: string;
  x: number;           // avgPosition
  y: number;           // clinicAIScore
  size: number;        // serviceCount
  color: 'green' | 'orange' | 'gray';
  label: string;
}

function generateScatterPlotData(
  yourData: { avgPosition: number; score: number; services: number },
  competitors: CompetitorPoint[],
  top3Domains: string[]
): ScatterPoint[] {
  const points: ScatterPoint[] = [
    {
      domain: 'your-clinic',
      x: yourData.avgPosition,
      y: yourData.score,
      size: yourData.services,
      color: 'green',
      label: 'Ви'
    }
  ];
  
  for (const comp of competitors) {
    points.push({
      domain: comp.domain,
      x: comp.avgPosition || 10,
      y: comp.aiScore,
      size: comp.mentions,
      color: top3Domains.includes(comp.domain) ? 'orange' : 'gray',
      label: comp.domain
    });
  }
  
  return points;
}
```

### Інтерпретація квадрантів

| Квадрант | X (позиція) | Y (score) | Інтерпретація |
|----------|-------------|-----------|---------------|
| Верхній правий | Низька | Високий | Лідери ринку |
| Верхній лівий | Висока | Високий | Потенціал для росту |
| Нижній правий | Низька | Низький | Випадкові згадки |
| Нижній лівий | Висока | Низький | Аутсайдери |

---

## Динаміка ClinicAI Score

### Опис

Графік зміни ClinicAI Score за останні 3-6 місяців для вас та топ-10 конкурентів.

### Алгоритм

```typescript
interface DynamicsData {
  period: string[];           // ['2024-07', '2024-08', ...]
  series: Array<{
    domain: string;
    isYou: boolean;
    values: number[];         // Score за кожен період
    trend: 'up' | 'down' | 'stable';
  }>;
}

async function getScoreDynamics(
  yourDomain: string,
  competitors: string[],
  monthsBack: number = 6
): Promise<DynamicsData> {
  const periods = generateMonthPeriods(monthsBack);
  
  const series = await Promise.all(
    [yourDomain, ...competitors].map(async domain => {
      const values = await Promise.all(
        periods.map(period => getHistoricalScore(domain, period))
      );
      
      const trend = determineTrend(values);
      
      return {
        domain,
        isYou: domain === yourDomain,
        values,
        trend
      };
    })
  );
  
  return { period: periods, series };
}

function determineTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const first = values[0];
  const last = values[values.length - 1];
  const change = last - first;
  
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}
```

---

## Gap аналіз

### Опис

Визначення слабких місць конкурентів, де ви можете їх випередити.

### Алгоритм

```typescript
interface GapAnalysis {
  services: Array<{
    service: string;
    yourAIV: number;
    top10AvgAIV: number;
    gap: number;           // Різниця (позитивна = ви краще)
    opportunity: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

function performGapAnalysis(
  yourServiceScores: Map<string, number>,
  competitorScores: Map<string, Map<string, number>>
): GapAnalysis {
  const gaps: GapAnalysis['services'] = [];
  
  for (const [service, yourScore] of yourServiceScores) {
    const competitorScoresForService = Array.from(competitorScores.values())
      .map(scores => scores.get(service) || 0);
    
    const avgCompetitorScore = avg(competitorScoresForService);
    const gap = yourScore - avgCompetitorScore;
    
    gaps.push({
      service,
      yourAIV: yourScore,
      top10AvgAIV: avgCompetitorScore,
      gap,
      opportunity: determineOpportunity(gap, avgCompetitorScore)
    });
  }
  
  // Сортуємо за потенціалом росту (великий негативний gap = можливість)
  gaps.sort((a, b) => a.gap - b.gap);
  
  const recommendations = generateRecommendations(gaps);
  
  return { services: gaps, recommendations };
}

function determineOpportunity(gap: number, competitorAvg: number): 'high' | 'medium' | 'low' {
  if (gap < -20 && competitorAvg < 50) return 'high';   // Всі слабкі, ви теж
  if (gap < -10) return 'medium';                        // Ви відстаєте
  return 'low';                                          // Ви на рівні або краще
}
```

### Візуалізація (Diverging Bar Chart)

```typescript
interface DivergingBarData {
  service: string;
  value: number;    // gap (позитивний = зелений вправо, негативний = червоний вліво)
  color: 'green' | 'red';
}

function formatForDivergingChart(gaps: GapAnalysis['services']): DivergingBarData[] {
  return gaps.map(g => ({
    service: g.service,
    value: g.gap,
    color: g.gap >= 0 ? 'green' : 'red'
  }));
}
```

---

## Таблиця ТОП-10 конкурентів

### Структура

```typescript
interface CompetitorTableRow {
  rank: number;
  name: string;
  domain: string;
  clinicAIScore: number;
  avgAIVScore: number;
  avgPosition: number;
  isYou: boolean;
}

function generateCompetitorTable(
  yourData: CompetitorTableRow,
  competitors: CompetitorPoint[]
): CompetitorTableRow[] {
  const allRows = [
    yourData,
    ...competitors.map((c, i) => ({
      rank: 0,  // Буде заповнено після сортування
      name: c.domain.replace(/\..*/, ''),  // Коротка назва
      domain: c.domain,
      clinicAIScore: c.aiScore,
      avgAIVScore: calculateAvgAIV(c),
      avgPosition: c.avgPosition || 0,
      isYou: false
    }))
  ];
  
  // Сортуємо за ClinicAI Score
  allRows.sort((a, b) => b.clinicAIScore - a.clinicAIScore);
  
  // Присвоюємо ранги
  return allRows.map((row, i) => ({ ...row, rank: i + 1 }));
}
```

---

## Конкуренція по категоріях

### По технічній оптимізації

```typescript
interface TechComparisonData {
  yourScore: number;
  competitors: Array<{
    domain: string;
    score: number;
  }>;
}

async function compareTechOptimization(
  yourDomain: string,
  competitors: string[]
): Promise<TechComparisonData> {
  const yourAudit = await runEphemeralAudit(yourDomain);
  const yourScore = yourAudit.aiAnalysis?.overallScore || 0;
  
  const competitorAudits = await Promise.all(
    competitors.slice(0, 10).map(async domain => ({
      domain,
      score: (await runEphemeralAudit(domain)).aiAnalysis?.overallScore || 0
    }))
  );
  
  return {
    yourScore,
    competitors: competitorAudits.sort((a, b) => b.score - a.score)
  };
}
```

### По E-E-A-T

```typescript
// Аналогічна структура для EEAT, Content, Local
```

---

## Розподіл AIV Score по послугам

### Опис

Горизонтальна стовпчикова діаграма, що показує на які послуги сконцентрована видимість конкурентів у AI.

### Алгоритм

```typescript
interface ServiceDistributionData {
  services: string[];
  data: Array<{
    domain: string;
    isYou: boolean;
    aivScores: Map<string, number>;  // service -> AIV Score
  }>;
}

async function getServiceDistribution(
  yourDomain: string,
  competitors: string[],
  services: string[]
): Promise<ServiceDistributionData> {
  const allDomains = [yourDomain, ...competitors.slice(0, 3)];
  
  const data = await Promise.all(
    allDomains.map(async domain => {
      const scores = new Map<string, number>();
      
      for (const service of services) {
        const aiv = await getAIVScoreForService(domain, service);
        scores.set(service, aiv);
      }
      
      return {
        domain,
        isYou: domain === yourDomain,
        aivScores: scores
      };
    })
  );
  
  return { services, data };
}
```

### Візуалізація

- **Тип:** Horizontal grouped bar chart
- **Вісь Y:** Назви послуг
- **Вісь X:** AIV Score (0-100)
- **Групи:** Ваша клініка + топ-3 конкуренти
- **Кольори:** 
  - Зелений — ви
  - Помаранчевий/Жовтий/Червоний — конкуренти

---

## Конкурентна динаміка AIV Score по послугам

### Опис

Лінійний графік динаміки AIV Score для конкретної послуги в порівнянні з топ-10 конкурентами.

### Алгоритм

```typescript
interface ServiceDynamicsData {
  service: string;
  period: string[];
  series: Array<{
    domain: string;
    isYou: boolean;
    values: number[];
  }>;
}

async function getServiceDynamics(
  service: string,
  yourDomain: string,
  competitors: string[],
  monthsBack: number = 6
): Promise<ServiceDynamicsData> {
  const periods = generateMonthPeriods(monthsBack);
  
  const series = await Promise.all(
    [yourDomain, ...competitors].map(async domain => ({
      domain,
      isYou: domain === yourDomain,
      values: await Promise.all(
        periods.map(period => getHistoricalAIVScore(domain, service, period))
      )
    }))
  );
  
  return { service, period: periods, series };
}
```

---

## Edge Cases

### 1. Менше 10 конкурентів

```typescript
if (competitors.length < 10) {
  return {
    note: `Found only ${competitors.length} competitors`,
    competitors: competitors  // Повертаємо скільки є
  };
}
```

### 2. Немає історичних даних

```typescript
if (!hasHistoricalData(domain)) {
  return {
    dynamics: null,
    note: 'Historical data not available'
  };
}
```

### 3. Клініка не згадується в AI

```typescript
if (!yourScans.some(s => s.visible)) {
  return {
    yourPosition: null,
    gap: 'N/A',
    recommendation: 'Focus on improving visibility first'
  };
}
```

### 4. Конкурент без сайту

```typescript
if (!(await checkSiteExists(competitorDomain))) {
  // Пропускаємо технічний аналіз
  return {
    techScore: null,
    note: 'Website not accessible'
  };
}
```

---

## Залежності

### Внутрішні модулі

- `engine/clinic-ai-score.ts` — розрахунок ClinicAI Score
- `engine/aiv-score.ts` — розрахунок AIV Score
- `engine/tech-audit.ts` — технічний аудит
- `engine/ai-scanner.ts` — сканування AI-відповідей

### Зовнішні API

Для повного аналізу конкурентів потрібно:
- Доступ до їх сайтів (публічний)
- Можливо Ahrefs/Semrush для backlinks

### База даних

Потрібні таблиці для зберігання:
- Історичних скорів
- Сканів по послугах
- Кешованих даних конкурентів

---

## Нотатки з міграції

### Поточний код

- `apps/web/lib/modules/analytics/calculator.ts`:
  - `aggregateCompetitorStats()` — агрегація статистики конкурентів
  - `extractDomainsFromResponse()` — витяг доменів з відповіді

### Що потрібно додати

1. Зберігання історичних даних
2. Регулярне оновлення скорів конкурентів
3. Візуалізація графіків (frontend)
4. API endpoints для порівняння

---

## Changelog

| Версія | Дата | Опис змін |
|--------|------|-----------|
| 1.0 | 2025-01-03 | Початкова специфікація на основі Functionality.md та коду |
