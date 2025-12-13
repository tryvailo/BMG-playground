# Рекомендации по улучшению дизайна и UX

## Анализ текущего состояния

### Что уже хорошо:
- ✅ Использование компонентов Shadcn UI
- ✅ Базовая структура карточек и таблиц
- ✅ Адаптивная верстка
- ✅ Темная тема поддерживается

### Что нужно улучшить:
- ⚠️ Непоследовательное использование дизайн-системы Makerkit
- ⚠️ Смешение кастомных стилей с системными токенами
- ⚠️ Недостаточное использование анимаций и переходов
- ⚠️ Цветовая схема не использует полный потенциал темы

---

## 1. Цветовая схема и дизайн-токены

### Текущие проблемы:
- Использование хардкодных цветов (`bg-emerald-100`, `text-slate-500`) вместо системных токенов
- Несогласованность цветов между компонентами

### Рекомендации:

#### 1.1 Используйте системные токены цвета

**Вместо:**
```tsx
className="bg-emerald-100 text-emerald-600"
className="bg-slate-200 border-slate-300"
```

**Используйте:**
```tsx
className="bg-primary/10 text-primary"
className="bg-muted border-border"
className="bg-card text-card-foreground"
```

#### 1.2 Создайте консистентную палитру для метрик

Создайте файл `apps/web/lib/design/metric-colors.ts`:

```typescript
import { cn } from '@kit/ui/utils';

export const metricColors = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    icon: 'text-primary',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
  },
} as const;

export function getMetricColorVariant(variant: keyof typeof metricColors) {
  return metricColors[variant];
}
```

#### 1.3 Используйте chart colors из темы

Для графиков используйте предопределенные цвета:
- `--chart-1` до `--chart-5` (автоматически адаптируются для dark mode)

---

## 2. Компоненты и структура

### 2.1 Улучшение KPI Cards

**Текущая реализация:** Кастомные карточки с хардкодными стилями

**Рекомендация:** Используйте компоненты Makerkit

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Skeleton } from '@kit/ui/skeleton';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
  variant?: 'primary' | 'success' | 'warning' | 'info';
  description?: string;
  loading?: boolean;
}

export function KpiCard({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  variant = 'primary',
  description,
  loading 
}: KpiCardProps) {
  const colors = getMetricColorVariant(variant);
  
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = trend !== undefined && trend >= 0;
  const trendDisplay = trend !== undefined 
    ? `${isPositive ? '+' : ''}${trend.toFixed(1)}%`
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trendDisplay && (
          <div className="flex items-center mt-4 text-xs">
            {isPositive ? (
              <ArrowUp className="h-3 w-3 text-emerald-600 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={cn(
              'font-medium',
              isPositive ? 'text-emerald-600' : 'text-red-600'
            )}>
              {trendDisplay}
            </span>
            <span className="text-muted-foreground ml-2">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 2.2 Использование EmptyState компонента

**Вместо кастомных пустых состояний:**

```tsx
import { EmptyState, EmptyStateHeading, EmptyStateText, EmptyStateButton } from '@kit/ui/empty-state';

<EmptyState>
  <EmptyStateHeading>No Data Available</EmptyStateHeading>
  <EmptyStateText>
    There is not enough data to display the trend analysis yet.
  </EmptyStateText>
  <EmptyStateButton onClick={handleRefresh}>
    Refresh Data
  </EmptyStateButton>
</EmptyState>
```

### 2.3 Улучшение таблиц

**Используйте компоненты Table из Makerkit с улучшенным стилем:**

```tsx
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@kit/ui/table';
import { Skeleton } from '@kit/ui/skeleton';

// Добавьте состояние загрузки
{isLoading ? (
  <Table>
    <TableHeader>
      <TableRow>
        {columns.map((col) => (
          <TableHead key={col.key}>
            <Skeleton className="h-4 w-20" />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          {columns.map((col) => (
            <TableCell key={col.key}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
) : (
  // Ваша таблица с данными
)}
```

---

## 3. UX улучшения

### 3.1 Добавьте состояния загрузки

Используйте `Skeleton` компоненты для всех асинхронных данных:

```tsx
import { Skeleton } from '@kit/ui/skeleton';

// Для карточек
<Skeleton className="h-32 w-full" />

// Для графиков
<Skeleton className="h-72 w-full rounded-lg" />
```

### 3.2 Используйте анимации

Makerkit предоставляет встроенные анимации:

```tsx
// Fade up animation
<div className="animate-fade-up">
  {content}
</div>

// Fade down animation
<div className="animate-fade-down">
  {content}
</div>
```

### 3.3 Улучшите интерактивность

Добавьте hover эффекты и transitions:

```tsx
<Card className="
  transition-all duration-200 
  hover:shadow-md hover:scale-[1.02]
  cursor-pointer
">
```

### 3.4 Используйте Badge компоненты правильно

```tsx
import { Badge } from '@kit/ui/badge';

// Используйте правильные варианты
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Inactive</Badge>
```

---

## 4. Графики и визуализация

### 4.1 Используйте Chart компоненты из Makerkit

**Вместо прямого использования Recharts:**

```tsx
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@kit/ui/chart';

const chartConfig = {
  score: {
    label: 'ClinicAI Score',
    color: 'hsl(var(--chart-1))',
  },
};

<ChartContainer config={chartConfig}>
  <AreaChart data={trend}>
    <ChartTooltip content={<ChartTooltipContent />} />
    {/* остальные компоненты */}
  </AreaChart>
</ChartContainer>
```

### 4.2 Улучшите tooltips

Используйте стилизованные tooltips:

```tsx
<ChartTooltipContent 
  indicator="dot"
  labelFormatter={(value) => formatDate(value)}
  formatter={(value) => [`${value.toFixed(1)}`, 'Score']}
/>
```

---

## 5. Структура страниц

### 5.1 Используйте Page компоненты правильно

```tsx
import { 
  Page, 
  PageBody, 
  PageHeader, 
  PageTitle, 
  PageDescription 
} from '@kit/ui/page';

<Page>
  <PageHeader 
    title="Dashboard"
    description="Your AI visibility at a glance"
  >
    <PageHeaderActions>
      <Button>Export</Button>
    </PageHeaderActions>
  </PageHeader>
  
  <PageBody>
    {/* Ваш контент */}
  </PageBody>
</Page>
```

### 5.2 Используйте правильные spacing

```tsx
// Используйте системные spacing
<div className="space-y-6"> {/* Вместо space-y-4 или space-y-8 */}
  <Card>...</Card>
  <Card>...</Card>
</div>
```

---

## 6. Темная тема

### 6.1 Всегда тестируйте в обоих режимах

Убедитесь, что все компоненты правильно работают в dark mode:

```tsx
// ❌ Плохо
className="bg-white text-black"

// ✅ Хорошо
className="bg-card text-card-foreground"
```

### 6.2 Используйте правильные цвета для границ

```tsx
// ❌ Плохо
border-slate-200

// ✅ Хорошо
border-border
```

---

## 7. Конкретные улучшения для ваших компонентов

### 7.1 DashboardView.tsx

**Рекомендации:**
1. Замените кастомные KPI карточки на улучшенную версию с использованием Card компонентов
2. Используйте ChartContainer для графиков
3. Добавьте состояния загрузки
4. Используйте системные цвета

### 7.2 ServicesTable.tsx

**Рекомендации:**
1. Используйте EmptyState для пустого состояния
2. Добавьте Skeleton для загрузки
3. Улучшите стили форм (используйте системные стили)
4. Используйте правильные Badge варианты

### 7.3 TechAuditOverview.tsx

**Рекомендации:**
1. Уже хорошо использует Card компоненты ✅
2. Можно улучшить CircleGauge - использовать системные цвета
3. Добавить анимации при появлении

---

## 8. Чеклист для применения

- [ ] Создать файл с метриками цветов (`metric-colors.ts`)
- [ ] Заменить все хардкодные цвета на системные токены
- [ ] Обновить KpiCard компонент
- [ ] Добавить Skeleton состояния везде
- [ ] Использовать EmptyState компоненты
- [ ] Обновить графики для использования ChartContainer
- [ ] Протестировать в light и dark режимах
- [ ] Добавить hover эффекты и transitions
- [ ] Использовать правильные Badge варианты
- [ ] Улучшить spacing и layout

---

## 9. Примеры кода

### Пример улучшенной KPI карточки

См. раздел 2.1 выше

### Пример улучшенного графика

```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@kit/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const chartConfig = {
  score: {
    label: 'ClinicAI Score',
    color: 'hsl(var(--chart-1))',
  },
};

<Card>
  <CardHeader>
    <CardTitle>AIV Score History</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer config={chartConfig} className="h-72">
      <AreaChart data={trend}>
        <defs>
          <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatDate(value)}
        />
        <YAxis 
          domain={[0, 100]} 
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area 
          type="monotone"
          dataKey="score" 
          stroke="var(--color-score)" 
          strokeWidth={2} 
          fill="url(#fillScore)"
        />
      </AreaChart>
    </ChartContainer>
  </CardContent>
</Card>
```

---

## 10. Дополнительные ресурсы

- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Makerkit Components](packages/ui/src)
- [Tailwind CSS Documentation](https://tailwindcss.com)

---

## Заключение

Основные принципы:
1. **Консистентность** - используйте системные токены везде
2. **Доступность** - тестируйте в обоих темах
3. **UX** - добавляйте состояния загрузки и анимации
4. **Компоненты** - используйте готовые компоненты Makerkit вместо кастомных

Следуя этим рекомендациям, вы получите более профессиональный, консистентный и поддерживаемый интерфейс.

