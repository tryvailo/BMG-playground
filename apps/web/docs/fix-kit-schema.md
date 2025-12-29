# Решение проблемы: schema "kit" does not exist

## Проблема

При применении миграции `20251129_add_ai_visibility.sql` возникает ошибка:
```
ERROR: 3F000: schema "kit" does not exist
```

## Причина

Схема `kit` создается в базовой миграции `20241219010757_schema.sql`, которая либо не была применена на продакшене, либо была применена частично.

## Решение

### Вариант 1: Создать схему kit вручную (быстрое решение)

Выполните в Supabase Dashboard → SQL Editor:

```sql
-- Create kit schema if it doesn't exist
create schema if not exists kit;

-- Grant usage on schema kit to authenticated and service_role
grant usage on schema kit to authenticated;
grant usage on schema kit to service_role;

-- Create unaccent extension in kit schema if it doesn't exist
create extension if not exists "unaccent" schema kit;
```

После этого попробуйте применить миграцию `20251129_add_ai_visibility.sql` снова.

### Вариант 2: Применить базовую миграцию полностью

Если базовая миграция `20241219010757_schema.sql` не была применена, примените её полностью:

1. Откройте Supabase Dashboard → SQL Editor
2. Откройте файл: `apps/web/supabase/migrations/20241219010757_schema.sql`
3. Скопируйте весь SQL код
4. Вставьте в SQL Editor
5. Нажмите Run

⚠️ **Внимание:** Эта миграция создает базовую структуру Makerkit. Если она уже частично применена, могут быть конфликты.

## Проверка после создания схемы

```sql
-- Проверка, что схема kit создана
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'kit';
```

Должна вернуться одна строка с `kit`.

## После создания схемы kit

После создания схемы `kit` вы сможете применить:
1. ✅ `20251129_add_ai_visibility.sql` - создаст таблицы projects, services, scans, weekly_stats
2. ✅ `20251201_add_dashboard_metrics.sql` - добавит колонки в weekly_stats


