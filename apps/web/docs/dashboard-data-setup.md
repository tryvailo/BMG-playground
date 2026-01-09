# Настройка данных для Dashboard

## Обзор

Дашборд использует данные из таблицы `weekly_stats`, которая хранит агрегированные метрики по неделям. Для демонстрации созданы мок-данные за 2025 год (12 записей - по одной на каждый месяц).

## Структура данных

Таблица `weekly_stats` содержит следующие поля:
- `visability_score` - Видимость послуг (0-100)
- `tech_score` - Техническая оптимизация (0-100)
- `content_score` - Оптимизация контента (0-100)
- `eeat_score` - E-E-A-T показатели (0-100)
- `local_score` - Локальные показатели (0-100)
- `clinic_ai_score` - ClinicAI Score (автоматически рассчитывается)
- `avg_position` - Средняя позиция в AI ответах

**Формула ClinicAI Score:**
```
0.25 × Visibility + 0.2 × Tech + 0.2 × Content + 0.15 × E-E-A-T + 0.1 × Local
```

## Применение миграций

### Шаг 1: Применить миграцию структуры

Сначала нужно применить миграцию, которая добавляет новые колонки в таблицу `weekly_stats`:

```bash
cd apps/web
pnpm supabase db reset
```

Или через Supabase Dashboard:
1. Откройте SQL Editor
2. Скопируйте содержимое `supabase/migrations/20250128_add_dashboard_metrics.sql`
3. Выполните SQL

### Шаг 2: Заполнить мок-данными

Применить seed миграцию для создания demo проекта и заполнения данными:

```bash
cd apps/web
pnpm supabase db reset
```

Или через Supabase Dashboard:
1. Откройте SQL Editor
2. Скопируйте содержимое `supabase/migrations/20250128_seed_dashboard_data.sql`
3. Выполните SQL

## Проверка данных

### Вариант 1: SQL скрипт (рекомендуется)

1. Откройте Supabase Dashboard → SQL Editor
2. Скопируйте содержимое `supabase/scripts/check-dashboard-data.sql`
3. Выполните SQL
4. Проверьте результаты:
   - ✅ Все колонки существуют
   - ✅ Demo проект создан
   - ✅ Найдено 12 записей за 2025 год
   - ✅ ClinicAI Score рассчитан правильно

### Вариант 2: TypeScript скрипт

```bash
cd apps/web
pnpm tsx scripts/verify-dashboard-data.ts
```

**Примечание:** Убедитесь, что установлены переменные окружения:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Получить ключи можно командой:
```bash
pnpm supabase status
```

## Структура мок-данных

Мок-данные показывают постепенное улучшение метрик в течение 2025 года:

| Месяц | Visibility | Tech | Content | E-E-A-T | Local | ClinicAI Score | Position |
|-------|-----------|------|---------|---------|-------|----------------|----------|
| Январь | 45% | 60% | 55% | 50% | 40% | ~52% | 8.5 |
| Февраль | 48% | 62% | 58% | 52% | 42% | ~54% | 8.0 |
| Март | 52% | 65% | 62% | 55% | 45% | ~57% | 7.5 |
| Апрель | 55% | 70% | 65% | 58% | 48% | ~60% | 7.0 |
| Май | 58% | 72% | 70% | 60% | 50% | ~63% | 6.5 |
| Июнь | 62% | 74% | 72% | 65% | 52% | ~66% | 6.0 |
| Июль | 65% | 76% | 74% | 68% | 58% | ~69% | 5.5 |
| Август | 68% | 78% | 76% | 70% | 62% | ~72% | 5.0 |
| Сентябрь | 72% | 80% | 78% | 72% | 65% | ~75% | 4.5 |
| Октябрь | 75% | 82% | 80% | 75% | 68% | ~78% | 4.0 |
| Ноябрь | 78% | 84% | 82% | 78% | 70% | ~81% | 3.5 |
| Декабрь | 80% | 85% | 84% | 80% | 72% | ~83% | 3.0 |

## Использование в приложении

После применения миграций дашборд автоматически загрузит данные из базы данных:

1. Откройте вкладку "Dashboard" в приложении
2. Данные загрузятся автоматически из таблицы `weekly_stats`
3. График покажет динамику ClinicAI Score за 2025 год (12 точек)
4. KPI карточки отобразят последние значения метрик

## Устранение проблем

### Проблема: "No data found"

**Решение:**
1. Проверьте, что миграции применены: `pnpm supabase db reset`
2. Проверьте наличие demo проекта: выполните SQL из `check-dashboard-data.sql`
3. Убедитесь, что `projectId = 'demo'` в компоненте дашборда

### Проблема: "Column does not exist"

**Решение:**
1. Убедитесь, что миграция `20250128_add_dashboard_metrics.sql` применена
2. Проверьте структуру таблицы:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'weekly_stats';
   ```

### Проблема: "clinic_ai_score is NULL"

**Решение:**
1. Проверьте, что триггер создан:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'auto_calculate_clinic_ai_score';
   ```
2. Если триггер отсутствует, выполните миграцию `20250128_add_dashboard_metrics.sql` снова

## Дополнительные ресурсы

- Миграция структуры: `supabase/migrations/20250128_add_dashboard_metrics.sql`
- Seed данные: `supabase/migrations/20250128_seed_dashboard_data.sql`
- SQL проверка: `supabase/scripts/check-dashboard-data.sql`
- TypeScript проверка: `scripts/verify-dashboard-data.ts`









