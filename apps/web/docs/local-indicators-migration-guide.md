# Инструкция по применению миграции для Local Indicators

## Шаг 1: Применить миграцию к базе данных

### Вариант A: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Скопируйте содержимое файла `supabase/migrations/20250127_add_local_indicators_audits.sql`
5. Вставьте SQL в редактор
6. Нажмите **Run** (или Cmd/Ctrl + Enter)

### Вариант B: Через Supabase CLI (если проект связан)

```bash
cd apps/web
pnpm --filter web supabase db push
```

Или если используете локальный Supabase:

```bash
cd apps/web
pnpm supabase:reset
```

## Шаг 2: Проверить применение миграции

После применения миграции проверьте, что таблица создана:

```sql
-- Выполните в SQL Editor:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'local_indicators_audits';
```

Должна вернуться одна строка с `local_indicators_audits`.

## Шаг 3: Очистить кеш браузера

1. Откройте DevTools (F12 или Cmd+Option+I)
2. Перейдите в **Application** (или **Хранилище**)
3. Нажмите **Clear Storage** (или **Очистить хранилище**)
4. Убедитесь, что выбрано **Clear site data** (или **Очистить данные сайта**)
5. Нажмите **Clear site data** (или **Очистить данные сайта**)

Или используйте Hard Refresh:
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R

## Шаг 4: Перезапустить dev server (если нужно)

Если dev server запущен:

1. Остановите его (Ctrl+C в терминале)
2. Запустите заново:
   ```bash
   pnpm run dev
   ```

## Шаг 5: Проверить работу

1. Откройте страницу Local Indicators в браузере
2. Проверьте консоль браузера (F12) - не должно быть ошибок
3. Если данных нет - нажмите кнопку "Run Local Indicators Audit"
4. После выполнения проверьте, что данные отображаются
5. Перейдите на другую вкладку и вернитесь - данные должны загрузиться автоматически

## SQL для применения миграции

```sql
/*
 * -------------------------------------------------------
 * Local Indicators Audit Schema
 * Migration: Add table for Local Indicators audit results
 * Table: local_indicators_audits
 * 
 * This migration creates a table to store Local Indicators audit results
 * for playground usage (no project_id required).
 * -------------------------------------------------------
 */

/*
 * -------------------------------------------------------
 * Table: local_indicators_audits
 * Stores Local Indicators audit results
 * -------------------------------------------------------
 */
create table if not exists public.local_indicators_audits (
  id uuid not null default extensions.uuid_generate_v4(),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Audit results (stored as JSONB for flexibility)
  audit_result jsonb not null,
  
  -- Metadata
  clinic_name text,
  city text,
  place_id text,
  
  primary key (id)
);

comment on table public.local_indicators_audits is 'Local Indicators audit results for playground';
comment on column public.local_indicators_audits.url is 'URL of the audited website';
comment on column public.local_indicators_audits.audit_result is 'Full LocalIndicatorsAuditResult JSON data';
comment on column public.local_indicators_audits.clinic_name is 'Clinic name used for the audit';
comment on column public.local_indicators_audits.city is 'City name used for the audit';
comment on column public.local_indicators_audits.place_id is 'Google Place ID if found';

-- Create indexes for faster queries
create index if not exists local_indicators_audits_url_idx on public.local_indicators_audits(url);
create index if not exists local_indicators_audits_created_at_idx on public.local_indicators_audits(created_at desc);

-- Enable RLS on local_indicators_audits
alter table public.local_indicators_audits enable row level security;

-- RLS Policies for local_indicators_audits
-- Since we're using admin client (service role), RLS is bypassed
-- But we still create policies for future use with authenticated users

-- SELECT: Allow all (for playground usage)
create policy local_indicators_audits_select on public.local_indicators_audits
  for select
  using (true);

-- INSERT: Allow all (for playground usage)
create policy local_indicators_audits_insert on public.local_indicators_audits
  for insert
  with check (true);

-- UPDATE: Allow all (for playground usage)
create policy local_indicators_audits_update on public.local_indicators_audits
  for update
  using (true)
  with check (true);

-- DELETE: Allow all (for playground usage)
create policy local_indicators_audits_delete on public.local_indicators_audits
  for delete
  using (true);

-- Grant permissions
-- Service role bypasses RLS, but we grant for completeness
grant select, insert, update, delete on public.local_indicators_audits to service_role;
grant select, insert, update, delete on public.local_indicators_audits to authenticated;
grant select, insert, update, delete on public.local_indicators_audits to anon;
```

## Устранение проблем

### Ошибка: "relation does not exist"
- Убедитесь, что миграция применена
- Проверьте, что вы находитесь в правильной базе данных

### Ошибка: "permission denied"
- Убедитесь, что используете правильные права доступа
- Проверьте, что RLS политики созданы

### Ошибка: "isLoadingLatest is not defined"
- Очистите кеш браузера (Hard Refresh)
- Перезапустите dev server

### Ошибка 404 для server action
- Убедитесь, что миграция применена
- Проверьте, что `SUPABASE_SERVICE_ROLE_KEY` настроен в `.env.local`
- Перезапустите dev server








