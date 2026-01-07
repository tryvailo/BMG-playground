# Применение миграций вручную

## Проблема
Если Supabase CLI не видит запущенный Supabase (ошибка "supabase start is not running"), но контейнеры Docker запущены, можно применить миграции вручную через Supabase Studio.

## Решение

### Вариант 1: Через Supabase Studio (рекомендуется)

1. Откройте Supabase Studio: http://localhost:54323
2. Перейдите в **SQL Editor** (в левом меню)
3. Откройте файл миграции: `apps/web/supabase/migrations/20251129_add_ai_visibility.sql`
4. Скопируйте весь SQL код из файла
5. Вставьте в SQL Editor
6. Нажмите **Run** (или Cmd/Ctrl + Enter)

### Вариант 2: Применить все миграции по порядку

Примените миграции в следующем порядке:

1. **20241219010757_schema.sql** - базовая схема (схема `kit`, таблица `accounts`)
2. **20251129_add_ai_visibility.sql** - таблица `projects` и `weekly_stats`
3. **20251203_create_user_project.sql** - функция `ensure_user_has_project`
4. Остальные миграции по необходимости

### Вариант 3: Через psql (если установлен)

```bash
# Подключитесь к базе данных
psql postgresql://postgres:postgres@localhost:54322/postgres

# Примените миграции
\i apps/web/supabase/migrations/20241219010757_schema.sql
\i apps/web/supabase/migrations/20251129_add_ai_visibility.sql
\i apps/web/supabase/migrations/20251203_create_user_project.sql
```

### Проверка после применения

Выполните в SQL Editor:

```sql
-- Проверка, что таблица projects существует
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'projects';

-- Проверка, что функция ensure_user_has_project существует
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'kit' 
  AND routine_name = 'ensure_user_has_project';
```

## Важные миграции для онбординга

Для работы онбординга необходимы следующие миграции:

1. **20241219010757_schema.sql** - создает схему `kit` и таблицу `accounts`
2. **20251129_add_ai_visibility.sql** - создает таблицу `projects` и `weekly_stats`
3. **20251203_create_user_project.sql** - создает функцию `ensure_user_has_project`

Если эти миграции не применены, онбординг не сможет создать проект.



