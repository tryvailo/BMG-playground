-- Проверить создание подписок

-- 1. Проверить все подписки
SELECT 
  s.id,
  s.account_id,
  s.plan_id,
  s.plan_name,
  s.price,
  s.billing_interval,
  s.payment_method,
  s.payment_status,
  s.created_at,
  a.email,
  a.name
FROM public.subscriptions s
LEFT JOIN public.accounts a ON a.id = s.account_id
ORDER BY s.created_at DESC;

-- 2. Проверить последние созданные аккаунты
SELECT 
  a.id,
  a.name,
  a.email,
  a.created_at
FROM public.accounts a
ORDER BY a.created_at DESC
LIMIT 10;

-- 3. Проверить пользователей без подписок
SELECT 
  a.id,
  a.name,
  a.email,
  a.created_at
FROM public.accounts a
LEFT JOIN public.subscriptions s ON s.account_id = a.id
WHERE s.id IS NULL
ORDER BY a.created_at DESC;

-- 4. Проверить конкретного пользователя tryvailo125
SELECT 
  a.id,
  a.name,
  a.email,
  a.created_at,
  s.id as subscription_id,
  s.plan_id,
  s.plan_name,
  s.payment_status
FROM public.accounts a
LEFT JOIN public.subscriptions s ON s.account_id = a.id
WHERE a.email LIKE '%tryvailo125%'
   OR a.name LIKE '%tryvailo125%'
ORDER BY a.created_at DESC;

-- 5. Проверить структуру таблицы subscriptions
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;



