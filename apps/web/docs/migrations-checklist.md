# Чеклист миграций для продакшена

## ⚠️ ВАЖНО: Миграции НЕ применяются автоматически!

Vercel не применяет миграции БД автоматически. Их нужно применять **вручную** через Supabase Dashboard или CLI.

## Список миграций (в хронологическом порядке)

### ✅ Базовые миграции (должны быть уже применены):
- `20241219010757_schema.sql` - базовая схема
- `20251129_add_ai_visibility.sql` - AI Visibility
- `20251130_add_tech_audit_tables.sql` - Tech Audit таблицы

### ⚠️ Миграции, которые нужно проверить/применить:

#### 1. `20250127_add_local_indicators_audits.sql`
**Таблица:** `local_indicators_audits`  
**Статус:** Проверить, применена ли на продакшене

**Проверка:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'local_indicators_audits';
```

#### 2. `20250128_add_playground_audit_tables.sql` ⭐ **КРИТИЧЕСКИ ВАЖНО**
**Таблицы:** `playground_tech_audits`, `content_audits`, `eeat_audits`  
**Статус:** Вы сказали, что уже запущена ✅

**Проверка:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('playground_tech_audits', 'content_audits', 'eeat_audits')
ORDER BY table_name;
```

#### 3. `20251201_add_dashboard_metrics.sql`
**Изменения:** Добавляет колонки в `weekly_stats`  
**Статус:** Проверить

#### 4. `20251202_seed_dashboard_data.sql`
**Назначение:** Seed данные для демо проекта  
**Статус:** Опционально (только если нужны демо данные)

#### 5. `20251203_create_user_project.sql`
**Назначение:** Создание проектов для пользователей  
**Статус:** Проверить

#### 6. `20251225_ensure_all_users_have_data.sql`
**Назначение:** Обеспечение данных для всех пользователей  
**Статус:** Проверить

#### 7. `20251226_auto_create_user_project_trigger.sql`
**Назначение:** Триггер для автоматического создания проектов  
**Статус:** Проверить

#### 8. `20251227_fix_all_users_projects.sql`
**Назначение:** Исправление проектов пользователей  
**Статус:** Проверить

## Как применить миграции

### Вариант A: Через Supabase Dashboard (рекомендуется)

1. Откройте https://app.supabase.com/
2. Выберите ваш продакшн проект
3. Перейдите в **SQL Editor**
4. Откройте нужный файл миграции из `apps/web/supabase/migrations/`
5. Скопируйте **весь** SQL код
6. Вставьте в SQL Editor
7. Нажмите **Run** (Cmd/Ctrl + Enter)
8. Убедитесь, что выполнено успешно

### Вариант B: Через Supabase CLI

```bash
cd apps/web

# Связать проект (если еще не связан)
export SUPABASE_PROJECT_REF=your-project-ref
pnpm supabase link --project-ref $SUPABASE_PROJECT_REF

# Применить все новые миграции
pnpm supabase db push
```

## Проверка всех таблиц

Выполните этот запрос, чтобы увидеть все таблицы:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## Критически важные таблицы для новой функциональности

Эти таблицы **обязательно** должны существовать:

1. ✅ `local_indicators_audits` - для Local Indicators
2. ✅ `playground_tech_audits` - для Technical Audit
3. ✅ `content_audits` - для Content Optimization
4. ✅ `eeat_audits` - для E-E-A-T Assessment
5. ✅ `weekly_stats` - для Dashboard (должна быть с новыми колонками)
6. ✅ `tech_audits` - для Tech Audit (project-based)
7. ✅ `projects` - для проектов пользователей

## Рекомендации

1. **Применяйте миграции по порядку** (по дате в названии файла)
2. **Проверяйте каждую миграцию** после применения
3. **Делайте бэкап** перед применением миграций (если возможно)
4. **Тестируйте** после применения каждой миграции







