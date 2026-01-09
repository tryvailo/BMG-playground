-- Скрипт для проверки, что миграция subscriptions применена правильно

-- 1. Проверить существование таблицы
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
) as table_exists;

-- 2. Проверить структуру таблицы
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 3. Проверить индексы
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'subscriptions';

-- 4. Проверить RLS политики
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'subscriptions';

-- 5. Проверить триггеры
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'subscriptions';

-- 6. Проверить права доступа
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'subscriptions';

-- 7. Проверить данные (если есть)
SELECT COUNT(*) as total_subscriptions FROM public.subscriptions;

-- 8. Проверить пример данных
SELECT * FROM public.subscriptions ORDER BY created_at DESC LIMIT 5;




