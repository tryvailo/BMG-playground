# Dashboard Brandbook Audit
## Проверка соответствия стандартам для каждой вкладки

---

## Стандарты для проверки

### Hero Summary Dashboard
- ✅ Заголовок: `text-3xl font-black italic tracking-tighter text-slate-900`
- ✅ Описание: `text-sm font-medium text-slate-700`
- ✅ Скор: `text-5xl font-black italic tracking-tighter`
- ✅ Скор подпись: `text-sm font-bold text-slate-600`

### Category Progress Bars
- ✅ Лейбл: `text-xs font-bold text-slate-700 uppercase tracking-wider`
- ✅ Значение: `text-xs font-black text-slate-900`
- ✅ Контейнер: `p-3 bg-slate-50 rounded-xl border border-slate-200`
- ✅ Progress Bar: `h-3 w-full bg-slate-200 rounded-full border border-slate-300`

### BentoCard Title/Subtitle
- ✅ Title: `text-[10px] font-black uppercase tracking-[0.2em] text-slate-600`
- ✅ Subtitle: `text-sm font-bold text-slate-900`

---

## 1. Home (AI Visibility Dashboard)

**Файл:** `components/dashboard/DashboardView.tsx`

### Hero Summary Dashboard
- [ ] Заголовок: `text-3xl font-black italic tracking-tighter text-slate-900` ✅
- [ ] Описание: `text-sm font-medium text-slate-700` ✅
- [ ] Скор: `text-5xl font-black italic tracking-tighter` ✅
- [ ] Скор подпись: `text-sm font-bold text-slate-600` ✅

### Category Progress Bars
- [ ] Лейбл: `text-xs font-bold text-slate-700 uppercase tracking-wider` ✅
- [ ] Значение: `text-xs font-black text-slate-900` ✅
- [ ] Контейнер: `p-3 bg-slate-50 rounded-xl border border-slate-200` ✅

### KPI Cards (старые)
- [ ] Title: `text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground italic` ⚠️ (должно быть `tracking-[0.2em]` и `text-slate-600`)
- [ ] Value: `text-2xl font-black italic tracking-tighter text-slate-900` ✅

### Section Headers
- [ ] Title: `text-lg font-black tracking-tight flex items-center gap-2 uppercase tracking-[0.15em] text-slate-800 dark:text-slate-200 italic` ⚠️ (нестандартный стиль)

**Статус:** ⚠️ Требует обновления KPI Cards и Section Headers

---

## 2. Technical Audit

**Файл:** `components/dashboard/playground/TechAuditSection.tsx`

### Hero Summary Dashboard
- [ ] Заголовок: `text-3xl font-black italic tracking-tighter text-slate-900` ✅
- [ ] Описание: `text-sm font-medium text-slate-700` ✅
- [ ] Скор: `text-5xl font-black italic tracking-tighter` ✅
- [ ] Скор подпись: `text-sm font-bold text-slate-600` ✅

### Category Progress Bars
- [ ] Лейбл: `text-xs font-bold text-slate-700 uppercase tracking-wider` ✅
- [ ] Значение: `text-xs font-black text-slate-900` ✅
- [ ] Контейнер: `p-3 bg-slate-50 rounded-xl border border-slate-200` ✅

### Category Headers (H2)
- [ ] Заголовок: `text-2xl font-black flex items-center gap-2 text-slate-900` ✅

**Статус:** ✅ Соответствует стандартам

---

## 3. Local Indicators

**Файл:** `components/features/playground/LocalIndicatorsSection.tsx`

### Hero Summary Dashboard
- [ ] Заголовок: `text-3xl font-black italic tracking-tighter text-slate-900` ✅
- [ ] Описание: `text-sm font-medium text-slate-700` ✅
- [ ] Скор: `text-5xl font-black italic tracking-tighter` ✅
- [ ] Скор подпись: `text-sm font-bold text-slate-600` ✅

### Category Progress Bars
- [ ] Лейбл: `text-xs font-bold text-slate-700 uppercase tracking-wider` ✅
- [ ] Значение: `text-xs font-black text-slate-900` ✅
- [ ] Контейнер: `p-3 bg-slate-50 rounded-xl border border-slate-200` ✅

**Статус:** ✅ Соответствует стандартам

---

## 4. E-E-A-T Assessment

**Файл:** `components/features/playground/EEATAuditSection.tsx`

### Hero Summary Dashboard
- [ ] Заголовок: `text-3xl font-black italic tracking-tighter text-slate-900` ✅
- [ ] Описание: `text-sm font-medium text-slate-700` ✅
- [ ] Скор: `text-5xl font-black italic tracking-tighter` ✅
- [ ] Скор подпись: `text-sm font-bold text-slate-600` ✅

### Category Progress Bars
- [ ] Лейбл: `text-xs font-bold text-slate-700 uppercase tracking-wider` ✅
- [ ] Значение: `text-xs font-black text-slate-900` ✅
- [ ] Контейнер: `p-3 bg-slate-50 rounded-xl border border-slate-200` ✅

### BentoCard Title (Trust Signals)
- [ ] Title: `text-[10px] font-black uppercase tracking-[0.2em] text-slate-600` ✅
- [ ] Subtitle: `text-sm font-bold text-slate-900` ✅

**Статус:** ✅ Соответствует стандартам

---

## 5. Content Optimization

**Файл:** `components/features/playground/ContentAuditSection.tsx`

### Hero Summary Dashboard
- [ ] Заголовок: `text-3xl font-black italic tracking-tighter text-slate-900` ✅
- [ ] Описание: `text-sm font-medium text-slate-700` ✅
- [ ] Скор: `text-5xl font-black italic tracking-tighter` ✅
- [ ] Скор подпись: `text-sm font-bold text-slate-600` ✅

### Category Progress Bars
- [ ] Лейбл: `text-xs font-bold text-slate-700 uppercase tracking-wider` ✅
- [ ] Значение: `text-xs font-black text-slate-900` ✅
- [ ] Контейнер: `p-3 bg-slate-50 rounded-xl border border-slate-200` ✅

**Статус:** ✅ Соответствует стандартам

---

## 6. Competitors

**Файл:** `components/dashboard/competitors/CompetitorsOverview.tsx`

### Hero Summary Dashboard
- [ ] Заголовок: `text-3xl font-black italic tracking-tighter text-slate-900` ✅
- [ ] Описание: `text-sm font-medium text-slate-700` ✅
- [ ] Позиция: `text-5xl font-black italic tracking-tighter` ✅
- [ ] Подпись: `text-sm font-bold text-slate-600` ✅

### Category Progress Bars
- [ ] Лейбл: `text-xs font-bold text-slate-700 uppercase tracking-wider` ✅
- [ ] Значение: `text-xs font-black text-slate-900` ✅
- [ ] Контейнер: `p-3 bg-slate-50 rounded-xl border border-slate-200` ✅

### BentoCard Title
- [ ] Title: `text-[10px] font-black uppercase tracking-[0.2em] text-slate-600` ✅
- [ ] Subtitle: `text-sm font-bold text-slate-900` ✅

### KPI Cards (старые)
- [ ] Title: `text-[10px] font-black uppercase tracking-[0.2em] text-slate-600` ✅
- [ ] Value: `text-3xl font-black italic tracking-tighter text-slate-900` ✅

**Статус:** ✅ Соответствует стандартам

---

## Сводная таблица

| Вкладка | Hero Summary | Category Bars | BentoCard | KPI Cards | Section Headers | Статус |
|---------|--------------|---------------|-----------|-----------|-----------------|--------|
| Home | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ Требует обновления |
| Technical Audit | ✅ | ✅ | ✅ | N/A | ✅ | ✅ OK |
| Local Indicators | ✅ | ✅ | ✅ | N/A | N/A | ✅ OK |
| E-E-A-T Assessment | ✅ | ✅ | ✅ | N/A | N/A | ✅ OK |
| Content Optimization | ✅ | ✅ | ✅ | N/A | N/A | ✅ OK |
| Competitors | ✅ | ✅ | ✅ | ✅ | N/A | ✅ OK |

---

## Проблемы для исправления

### 1. Home (AI Visibility Dashboard)

#### KPI Cards
**Текущий стиль:**
```tsx
<CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground italic">
```

**Должен быть:**
```tsx
<CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
```
- Убрать `italic`
- Изменить `tracking-[0.15em]` на `tracking-[0.2em]`
- Изменить `text-muted-foreground` на `text-slate-600`

#### Section Headers
**Текущий стиль:**
```tsx
<h3 className="text-lg font-black tracking-tight flex items-center gap-2 uppercase tracking-[0.15em] text-slate-800 dark:text-slate-200 italic">
```

**Должен быть:**
```tsx
<h3 className="text-2xl font-black flex items-center gap-2 text-slate-900">
```
- Изменить размер с `text-lg` на `text-2xl`
- Убрать `tracking-tight`, `uppercase`, `tracking-[0.15em]`, `italic`
- Убрать `dark:` классы
- Изменить цвет на `text-slate-900`

---

## Рекомендации

1. **Приоритет 1:** Обновить Home (AI Visibility Dashboard) - KPI Cards и Section Headers
2. **Приоритет 2:** Проверить все остальные компоненты на соответствие стандартам
3. **Приоритет 3:** Создать единый компонент для KPI Cards с правильными стилями
4. **Приоритет 4:** Создать единый компонент для Section Headers

---

**Дата проверки:** 2026  
**Версия брендбука:** 1.0








