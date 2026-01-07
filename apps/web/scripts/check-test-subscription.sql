-- Проверить созданную подписку для тестового пользователя

-- Найти тестового пользователя
SELECT 
  a.id,
  a.name,
  a.email,
  a.created_at
FROM public.accounts a
WHERE a.email LIKE 'test-lastivka-%@example.com'
ORDER BY a.created_at DESC
LIMIT 1;

-- Проверить подписку
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
WHERE a.email LIKE 'test-lastivka-%@example.com'
ORDER BY s.created_at DESC
LIMIT 1;

-- Проверить все подписки
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
LIMIT 5;



