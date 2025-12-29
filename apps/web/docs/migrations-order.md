# Порядок применения миграций на продакшене

## ⚠️ ВАЖНО: Применяйте миграции строго по порядку!

Миграции нужно применять в хронологическом порядке (по дате в названии файла).

## Правильный порядок применения:

### 1. ✅ `20241219010757_schema.sql`
**Базовая схема** - должна быть уже применена  
Создает базовые таблицы Makerkit

### 2. ⚠️ `20251129_add_ai_visibility.sql` - **ОБЯЗАТЕЛЬНО ПРИМЕНИТЬ ПЕРВОЙ!**
**Создает:** `projects`, `services`, `scans`, `weekly_stats`  
**Критически важно:** Создает таблицу `weekly_stats`, которая нужна для следующих миграций

### 3. ⚠️ `20251130_add_tech_audit_tables.sql`
**Создает:** `tech_audits`, `pages_audit`  
Для Technical Audit (project-based)

### 4. ⚠️ `20250127_add_local_indicators_audits.sql`
**Создает:** `local_indicators_audits`  
Для Local Indicators

### 5. ✅ `20250128_add_playground_audit_tables.sql` - **УЖЕ ПРИМЕНЕНА**
**Создает:** `playground_tech_audits`, `content_audits`, `eeat_audits`

### 6. ⚠️ `20251201_add_dashboard_metrics.sql` - **НУЖНО ПРИМЕНИТЬ**
**Изменяет:** `weekly_stats` (добавляет колонки)  
**Требует:** Таблица `weekly_stats` должна существовать (из миграции #2)

### 7. `20251202_seed_dashboard_data.sql`
**Назначение:** Seed данные для демо проекта  
**Опционально:** Только если нужны демо данные

### 8. `20251203_create_user_project.sql`
**Назначение:** Создание проектов для пользователей

### 9. `20251225_ensure_all_users_have_data.sql`
**Назначение:** Обеспечение данных для всех пользователей

### 10. `20251226_auto_create_user_project_trigger.sql`
**Назначение:** Триггер для автоматического создания проектов

### 11. `20251227_fix_all_users_projects.sql`
**Назначение:** Исправление проектов пользователей

## Решение вашей проблемы

Вы пытались применить `20251201_add_dashboard_metrics.sql`, но получили ошибку, потому что таблица `weekly_stats` не существует.

**Решение:** Сначала примените миграцию `20251129_add_ai_visibility.sql`, которая создает эту таблицу.

## Инструкция по применению

### Шаг 1: Применить `20251129_add_ai_visibility.sql`

1. Откройте Supabase Dashboard → SQL Editor
2. Откройте файл: `apps/web/supabase/migrations/20251129_add_ai_visibility.sql`
3. Скопируйте **весь** SQL код
4. Вставьте в SQL Editor
5. Нажмите **Run**
6. Убедитесь, что выполнено успешно

### Шаг 2: Проверить создание таблиц

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('projects', 'services', 'scans', 'weekly_stats')
ORDER BY table_name;
```

Должно вернуться 4 таблицы.

### Шаг 3: Применить `20251201_add_dashboard_metrics.sql`

Теперь эта миграция должна пройти успешно, так как таблица `weekly_stats` уже существует.

## Быстрая проверка всех таблиц

```sql
-- Проверка всех критически важных таблиц
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('projects', 'weekly_stats', 'services', 'scans') THEN '✅ Базовая (AI Visibility)'
    WHEN table_name IN ('tech_audits', 'pages_audit') THEN '✅ Tech Audit'
    WHEN table_name IN ('local_indicators_audits') THEN '✅ Local Indicators'
    WHEN table_name IN ('playground_tech_audits', 'content_audits', 'eeat_audits') THEN '✅ Playground Audits'
    ELSE 'ℹ️ Другое'
  END as category
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'projects', 'weekly_stats', 'services', 'scans',
    'tech_audits', 'pages_audit',
    'local_indicators_audits',
    'playground_tech_audits', 'content_audits', 'eeat_audits'
  )
ORDER BY category, table_name;
```


