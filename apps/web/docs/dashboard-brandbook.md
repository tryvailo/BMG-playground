# Dashboard Brandbook 2026
## Единый стиль и типографика для кабинета пользователя

---

## 1. Типографика

### 1.1. Шрифтовая система

**Основной шрифт:** Inter (Google Fonts)
- Веса: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- Используется для всего интерфейса
- CSS переменная: `--font-sans`

**Заголовочный шрифт:** Inter (тот же, что основной)
- CSS переменная: `--font-heading`

### 1.2. Иерархия заголовков

#### H1 - Главный заголовок страницы (Hero Title)
```css
text-3xl font-black italic tracking-tighter text-slate-900
```
- **Размер:** `text-3xl` (1.875rem / 30px)
- **Вес:** `font-black` (900)
- **Стиль:** `italic`
- **Трекинг:** `tracking-tighter` (-0.05em)
- **Цвет:** `text-slate-900`
- **Использование:** Заголовок Hero Summary Dashboard на всех страницах

**Пример:**
```tsx
<h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
  Technical Audit Results
</h1>
```

#### H2 - Заголовок секции
```css
text-2xl font-black flex items-center gap-2 text-slate-900
```
- **Размер:** `text-2xl` (1.5rem / 24px)
- **Вес:** `font-black` (900)
- **Стиль:** обычный (не italic)
- **Цвет:** `text-slate-900`
- **Использование:** Заголовки категорий (Category 1, Category 2, etc.)

**Пример:**
```tsx
<h2 className="text-2xl font-black flex items-center gap-2 text-slate-900">
  <Zap className="h-6 w-6 text-primary" />
  AI Optimization
</h2>
```

#### H3 - Подзаголовок карточки (BentoCard Title)
```css
text-[10px] font-black uppercase tracking-[0.2em] text-slate-600
```
- **Размер:** `text-[10px]` (0.625rem / 10px)
- **Вес:** `font-black` (900)
- **Стиль:** `uppercase`
- **Трекинг:** `tracking-[0.2em]` (0.2em)
- **Цвет:** `text-slate-600`
- **Использование:** Заголовки BentoCard компонентов

**Пример:**
```tsx
<h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
  Trust Signals Breakdown
</h3>
```

#### H4 - Заголовок метрики
```css
text-base font-bold text-slate-900
```
- **Размер:** `text-base` (1rem / 16px)
- **Вес:** `font-bold` (700)
- **Цвет:** `text-slate-900`
- **Использование:** Заголовки внутри карточек метрик

### 1.3. Основной текст

#### Body Large - Описание под заголовком
```css
text-sm font-medium text-slate-700
```
- **Размер:** `text-sm` (0.875rem / 14px)
- **Вес:** `font-medium` (500)
- **Цвет:** `text-slate-700`
- **Использование:** Описания под Hero заголовками

**Пример:**
```tsx
<p className="text-sm font-medium text-slate-700">
  Comprehensive technical SEO and performance analysis
</p>
```

#### Body - Обычный текст
```css
text-sm font-medium text-slate-600
```
- **Размер:** `text-sm` (0.875rem / 14px)
- **Вес:** `font-medium` (500)
- **Цвет:** `text-slate-600`
- **Использование:** Обычный текст в карточках

#### Body Small - Вторичный текст
```css
text-xs font-medium text-slate-500
```
- **Размер:** `text-xs` (0.75rem / 12px)
- **Вес:** `font-medium` (500)
- **Цвет:** `text-slate-500`
- **Использование:** Вторичная информация, подсказки

#### Body Extra Small - Метаданные
```css
text-[10px] font-bold text-slate-400
```
- **Размер:** `text-[10px]` (0.625rem / 10px)
- **Вес:** `font-bold` (700)
- **Цвет:** `text-slate-400`
- **Использование:** Метаданные, даты, статусы

### 1.4. Числовые значения

#### Score Large - Большой скор (Hero)
```css
text-5xl font-black italic tracking-tighter
```
- **Размер:** `text-5xl` (3rem / 48px)
- **Вес:** `font-black` (900)
- **Стиль:** `italic`
- **Трекинг:** `tracking-tighter` (-0.05em)
- **Использование:** Основной скор в Hero Summary Dashboard

**Пример:**
```tsx
<div className="text-5xl font-black italic tracking-tighter mb-1">
  {overallScore}
</div>
```

#### Score Medium - Средний скор
```css
text-2xl font-black italic tracking-tighter text-slate-900
```
- **Размер:** `text-2xl` (1.5rem / 24px)
- **Вес:** `font-black` (900)
- **Стиль:** `italic`
- **Трекинг:** `tracking-tighter`
- **Использование:** Значения в KPI карточках

#### Score Small - Маленький скор
```css
text-lg font-black italic text-slate-900
```
- **Размер:** `text-lg` (1.125rem / 18px)
- **Вес:** `font-black` (900)
- **Стиль:** `italic`
- **Использование:** Скоры в MinimalMetricCard

#### Percentage - Проценты
```css
text-xs font-black text-slate-900
```
- **Размер:** `text-xs` (0.75rem / 12px)
- **Вес:** `font-black` (900)
- **Цвет:** `text-slate-900`
- **Использование:** Проценты в прогресс-барах

### 1.5. Лейблы и метки

#### Label - Лейбл категории
```css
text-xs font-bold text-slate-700 uppercase tracking-wider
```
- **Размер:** `text-xs` (0.75rem / 12px)
- **Вес:** `font-bold` (700)
- **Стиль:** `uppercase`
- **Трекинг:** `tracking-wider` (0.05em)
- **Цвет:** `text-slate-700`
- **Использование:** Лейблы категорий в прогресс-барах

**Пример:**
```tsx
<span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
  AI
</span>
```

#### Badge Text - Текст в бейджах
```css
text-xs font-bold
```
- **Размер:** `text-xs` (0.75rem / 12px)
- **Вес:** `font-bold` (700)
- **Использование:** Текст в Badge компонентах

---

## 2. Цветовая система

### 2.1. Основные цвета текста

| Элемент | Класс | Hex | Использование |
|---------|-------|-----|---------------|
| Primary Text | `text-slate-900` | `#0f172a` | Основной текст, заголовки |
| Secondary Text | `text-slate-700` | `#334155` | Описания, body текст |
| Tertiary Text | `text-slate-600` | `#475569` | Вторичный текст |
| Muted Text | `text-slate-500` | `#64748b` | Менее важный текст |
| Disabled Text | `text-slate-400` | `#94a3b8` | Неактивный текст |

### 2.2. Цвета статусов

#### Success (Зеленый)
- **Текст:** `text-emerald-600` / `text-emerald-700`
- **Фон:** `bg-emerald-50` / `bg-emerald-600`
- **Граница:** `border-emerald-300`
- **Использование:** Успешные статусы, скоры >= 90

#### Warning (Оранжевый)
- **Текст:** `text-orange-600`
- **Фон:** `bg-orange-50` / `bg-orange-500`
- **Граница:** `border-orange-300`
- **Использование:** Предупреждения, скоры 50-89

#### Error (Красный)
- **Текст:** `text-red-600`
- **Фон:** `bg-red-50` / `bg-red-600`
- **Граница:** `border-red-300`
- **Использование:** Ошибки, скоры < 50

### 2.3. TOKENS цвета (для графиков и акцентов)

```typescript
const TOKENS = {
  colors: {
    c1: '#3b82f6', // Blue
    c2: '#8b5cf6', // Violet
    c3: '#10b981', // Emerald
    c4: '#f59e0b', // Amber
    c5: '#0ea5e9', // Sky
    c6: '#6366f1', // Indigo
    you: '#f43f5e', // Ruby (для текущей клиники)
    marketAvg: '#cbd5e1', // Slate (для среднего рынка)
  },
  shadows: {
    soft: 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
    deep: 'shadow-[0_20px_50px_rgba(0,0,0,0.06)]',
  }
};
```

---

## 3. Компоненты

### 3.1. BentoCard

**Базовый стиль:**
```css
border border-slate-200 bg-white shadow-[0_8px_32px_0_rgba(15,23,42,0.04)] 
overflow-hidden transition-all duration-300 
hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] group
```

**Структура:**
```tsx
<BentoCard title="Title" subtitle="Subtitle">
  {children}
</BentoCard>
```

**Заголовок карточки:**
- Title: `text-[10px] font-black uppercase tracking-[0.2em] text-slate-600`
- Subtitle: `text-sm font-bold text-slate-900`

### 3.2. Hero Summary Dashboard

**Структура:**
```tsx
<BentoCard className={cn('border-2 relative overflow-hidden bg-white', getScoreBgColor(overallScore))}>
  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
    <Icon className="w-24 h-24" />
  </div>
  <CardHeader>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
          Page Title
        </h1>
        <p className="text-sm font-medium text-slate-700">
          Description
        </p>
      </div>
      <div className="text-center">
        <div className={cn('text-5xl font-black italic tracking-tighter mb-1', getScoreColor(overallScore))}>
          {overallScore}
        </div>
        <div className="text-sm font-bold text-slate-600">
          / 100
        </div>
      </div>
    </div>
    {/* Category Progress Bars */}
  </CardHeader>
</BentoCard>
```

### 3.3. Category Progress Bar

**Структура:**
```tsx
<div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
  <div className="flex justify-between items-center">
    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
      CATEGORY
    </span>
    <span className="text-xs font-black text-slate-900">
      {score}%
    </span>
  </div>
  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
    <div
      className={cn(
        'transition-all duration-500 ease-out rounded-full shadow-sm h-full',
        score >= 90 ? 'bg-emerald-600' : score >= 50 ? 'bg-orange-500' : 'bg-red-600'
      )}
      style={{ width: `${score}%`, minWidth: score > 0 ? '4px' : '0' }}
    />
  </div>
</div>
```

### 3.4. MinimalMetricCard

**Заголовок:**
```css
text-base font-bold text-slate-900
```

**Скор:**
```css
text-lg font-black italic
```

**Описание:**
```css
text-xs text-slate-500
```

---

## 4. Spacing (Отступы)

### 4.1. Контейнеры

- **Основной контейнер:** `space-y-6` или `space-y-8` (между секциями)
- **Внутри секции:** `space-y-4` (между элементами)
- **Внутри карточки:** `space-y-2` или `space-y-3`

### 4.2. Padding

- **BentoCard:** `p-6`
- **CardHeader:** `pb-2` (если есть title/subtitle)
- **Category Progress Bar:** `p-3`
- **Gap Analysis карточка:** `p-4`

### 4.3. Margin

- **Hero Title:** `mb-2` (отступ от описания)
- **Hero Section:** `mb-6` (отступ перед категориями)
- **Category Grid:** `mt-6` (отступ после заголовка)

---

## 5. Границы и скругления

### 5.1. Скругления

- **BentoCard:** `rounded-xl` (0.75rem)
- **Category Progress Bar:** `rounded-xl` (0.75rem)
- **Progress Bar fill:** `rounded-full`
- **Badge:** `rounded-full`

### 5.2. Границы

- **BentoCard:** `border border-slate-200`
- **Hero BentoCard:** `border-2` + цветная граница по скору
- **Category Progress Bar:** `border border-slate-200`
- **Progress Bar:** `border border-slate-300`

---

## 6. Тени

### 6.1. BentoCard

- **Базовая:** `shadow-[0_8px_32px_0_rgba(15,23,42,0.04)]`
- **Hover:** `shadow-[0_20px_50px_rgba(0,0,0,0.08)]`

### 6.2. Progress Bar

- **Fill:** `shadow-sm`

---

## 7. Анимации и переходы

### 7.1. Transitions

- **BentoCard hover:** `transition-all duration-300`
- **Progress Bar fill:** `transition-all duration-500 ease-out`
- **Icon opacity:** `transition-opacity`

### 7.2. Hover эффекты

- **BentoCard:** `hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]`
- **Title в BentoCard:** `group-hover:text-primary transition-colors`
- **Icon в фоне:** `opacity-[0.03] group-hover:opacity-[0.08]`

---

## 8. Стандарты использования

### 8.1. Hero Summary Dashboard (обязателен на всех страницах)

**Структура:**
1. BentoCard с цветной границей по скору
2. Декоративная иконка в фоне (opacity 0.03)
3. Заголовок H1 (text-3xl font-black italic)
4. Описание (text-sm font-medium)
5. Большой скор (text-5xl font-black italic)
6. Категории с прогресс-барами

### 8.2. Категории

**Всегда использовать:**
- Grid layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[N] gap-4`
- Контейнер: `space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200`
- Лейбл: `text-xs font-bold text-slate-700 uppercase tracking-wider`
- Значение: `text-xs font-black text-slate-900`
- Progress Bar: высота `h-3`, фон `bg-slate-200`, граница `border border-slate-300`

### 8.3. Цветовая логика скоров

```typescript
const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-emerald-700';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBgColor = (score: number) => {
  if (score >= 90) return 'bg-emerald-50 border-emerald-300';
  if (score >= 50) return 'bg-orange-50 border-orange-300';
  return 'bg-red-50 border-red-300';
};
```

---

## 9. Запрещенные практики

❌ **НЕ использовать:**
- Разные размеры шрифтов для одинаковых элементов
- Разные веса шрифтов для одинаковых элементов
- Разные трекинги для одинаковых элементов
- Кастомные размеры шрифтов без необходимости (использовать стандартные: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl)
- Разные цвета для одинаковых элементов
- Разные стили для Hero заголовков на разных страницах

✅ **Всегда использовать:**
- Единые классы из этого брендбука
- TOKENS для цветов графиков
- Стандартные размеры и веса
- Консистентные отступы и spacing

---

## 10. Чеклист для проверки страницы

При проверке каждой страницы убедитесь:

- [ ] Hero Summary Dashboard использует `text-3xl font-black italic tracking-tighter` для заголовка
- [ ] Hero Summary Dashboard использует `text-5xl font-black italic tracking-tighter` для скора
- [ ] Описание использует `text-sm font-medium text-slate-700`
- [ ] Category Progress Bars используют `text-xs font-bold text-slate-700 uppercase tracking-wider` для лейблов
- [ ] Category Progress Bars используют `text-xs font-black text-slate-900` для значений
- [ ] Все цвета соответствуют цветовой системе
- [ ] Все отступы соответствуют spacing системе
- [ ] Все скругления соответствуют стандартам
- [ ] Все тени соответствуют стандартам
- [ ] Все анимации используют стандартные transition классы

---

## 11. Примеры использования

### Пример 1: Hero Summary Dashboard

```tsx
<BentoCard className={cn('border-2 relative overflow-hidden bg-white', getScoreBgColor(overallScore))}>
  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
    <Zap className="w-24 h-24" />
  </div>
  <CardHeader>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
          AI Visibility Dashboard
        </h1>
        <p className="text-sm font-medium text-slate-700">
          Comprehensive AI visibility and performance analysis
        </p>
      </div>
      <div className="text-center">
        <div className={cn('text-5xl font-black italic tracking-tighter mb-1', getScoreColor(overallScore))}>
          {overallScore.toFixed(1)}
        </div>
        <div className="text-sm font-bold text-slate-600">
          / 100
        </div>
      </div>
    </div>
    {/* Category Progress Bars */}
  </CardHeader>
</BentoCard>
```

### Пример 2: Category Progress Bar

```tsx
<div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
  <div className="flex justify-between items-center">
    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tech</span>
    <span className="text-xs font-black text-slate-900">{score.toFixed(1)}%</span>
  </div>
  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
    <div
      className={cn(
        'transition-all duration-500 ease-out rounded-full shadow-sm h-full',
        score >= 90 ? 'bg-emerald-600' : score >= 50 ? 'bg-orange-500' : 'bg-red-600'
      )}
      style={{ width: `${score}%`, minWidth: score > 0 ? '4px' : '0' }}
    />
  </div>
</div>
```

---

## 12. Миграция существующих страниц

При обновлении существующих страниц:

1. Заменить все заголовки Hero на стандартный стиль
2. Заменить все скоры на стандартные стили
3. Унифицировать Category Progress Bars
4. Проверить все цвета
5. Проверить все отступы
6. Проверить все тени и скругления

---

**Версия:** 1.0  
**Дата:** 2026  
**Статус:** Активный стандарт




