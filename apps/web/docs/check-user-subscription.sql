-- Проверить пользователя tryvailo125@gmail.com и его подписку

-- Найти пользователя
SELECT 
  a.id,
  a.name,
  a.email,
  a.created_at
FROM public.accounts a
WHERE a.email = 'tryvailo125@gmail.com'
   OR a.name LIKE '%tryvailo125%';

-- Проверить подписки для этого пользователя
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
WHERE a.email = 'tryvailo125@gmail.com'
   OR a.name LIKE '%tryvailo125%'
ORDER BY s.created_at DESC;

-- Проверить все подписки (последние 10)
SELECT 
  s.id,
  s.plan_id,
  s.plan_name,
  s.payment_status,
  a.email,
  a.name,
  s.created_at
FROM public.subscriptions s
LEFT JOIN public.accounts a ON a.id = s.account_id
ORDER BY s.created_at DESC
LIMIT 10;

-- Проверить всех пользователей без подписок
SELECT 
  a.id,
  a.name,
  a.email,
  a.created_at
FROM public.accounts a
LEFT JOIN public.subscriptions s ON s.account_id = a.id
WHERE s.id IS NULL
ORDER BY a.created_at DESC;



