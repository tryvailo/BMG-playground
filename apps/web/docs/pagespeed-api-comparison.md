# PageSpeed Insights: Веб-интерфейс vs API

## Сравнение данных

### Что показывает веб-интерфейс (https://pagespeed.web.dev/)

1. **Performance Score** (0-100)
2. **Core Web Vitals:**
   - LCP (Largest Contentful Paint)
   - FCP (First Contentful Paint)
   - CLS (Cumulative Layout Shift)
   - TBT (Total Blocking Time)
   - Speed Index
   - TTI (Time to Interactive)
3. **Opportunities** (рекомендации по улучшению)
4. **Diagnostics** (диагностическая информация)
5. **Categories:**
   - Performance
   - Accessibility
   - Best Practices
   - SEO
6. **Loading Experience** (реальные данные пользователей, если доступны)

### Что мы получаем через API (до обновления)

- ✅ Performance Score (desktop & mobile)

### Что мы получаем через API (после обновления)

- ✅ Performance Score (desktop & mobile)
- ✅ **Core Web Vitals:**
  - LCP (Largest Contentful Paint)
  - FCP (First Contentful Paint)
  - CLS (Cumulative Layout Shift)
  - TBT (Total Blocking Time)
  - Speed Index
  - TTI (Time to Interactive)
  - TTFB (Time to First Byte)
- ✅ **Opportunities** (топ 10 рекомендаций с приоритетом)
- ✅ **Categories:**
  - Performance
  - Accessibility
  - Best Practices
  - SEO

### Структура данных API

```typescript
interface PageSpeedDetailedMetrics {
  score: number | null;
  lcp: number | null;        // Largest Contentful Paint (ms)
  fcp: number | null;        // First Contentful Paint (ms)
  cls: number | null;        // Cumulative Layout Shift
  tbt: number | null;        // Total Blocking Time (ms)
  si: number | null;         // Speed Index (ms)
  tti: number | null;        // Time to Interactive (ms)
  ttfb: number | null;       // Time to First Byte (ms)
  opportunities: Array<{
    id: string;
    title: string;
    score: number;           // 0-100 (0 = worst)
    savings?: number;
    savingsUnit?: string;
  }>;
  categories: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
}
```

### Пример ответа API для asparagus.one

**Desktop:**
- Performance Score: 96/100
- LCP: 1250ms
- FCP: 754ms
- CLS: 0.01
- TBT: 46ms
- Speed Index: 1145ms
- TTI: 2332ms
- Opportunities: 10 рекомендаций

**Mobile:**
- Performance Score: 57/100
- LCP: 9642ms
- FCP: 7236ms
- CLS: 0.00
- TBT: 103ms
- Speed Index: 7236ms
- TTI: 10138ms
- Opportunities: 10 рекомендаций

### Что еще можно получить из API

1. **Loading Experience** - реальные данные пользователей (если доступны)
2. **Diagnostics** - детальная диагностическая информация
3. **All Opportunities** - все рекомендации (не только топ 10)
4. **Screenshots** - скриншоты страницы во время загрузки
5. **Network requests** - детали всех сетевых запросов

### Рекомендации по использованию

1. **Для базового аудита:** Используйте score + Core Web Vitals
2. **Для детального анализа:** Добавьте opportunities и categories
3. **Для мониторинга:** Используйте Loading Experience (если доступно)

### Ссылки

- [PageSpeed Insights API Documentation](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Lighthouse Scoring Guide](https://web.dev/performance-scoring/)
- [Core Web Vitals](https://web.dev/vitals/)

