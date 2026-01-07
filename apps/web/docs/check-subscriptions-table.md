# Проверка таблицы subscriptions

## Быстрая проверка

Выполните в Supabase SQL Editor:

```sql
-- Проверить, существует ли таблица subscriptions
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
);

-- Если таблица существует, проверить структуру
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Проверить все подписки
SELECT * FROM public.subscriptions ORDER BY created_at DESC LIMIT 10;

-- Проверить RLS политики
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'subscriptions';
```

## Если таблица не существует

Примените миграцию:

1. Откройте Supabase Dashboard: http://localhost:54323
2. Перейдите в **SQL Editor**
3. Откройте файл: `apps/web/supabase/migrations/20250130_add_subscriptions_table.sql`
4. Скопируйте весь SQL код
5. Вставьте в SQL Editor
6. Нажмите **Run** (Cmd/Ctrl + Enter)

## Проверка через терминал

```bash
cd apps/web

# Проверить статус Supabase
pnpm supabase:status

# Применить миграции
pnpm supabase:reset
```

## Проверка переменных окружения

Убедитесь, что в `.env.local` есть:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Service role key можно найти в Supabase Dashboard → Settings → API → service_role key



