-- Check all subscriptions in the database
SELECT 
  s.id,
  s.account_id,
  a.email as account_email,
  s.plan_name,
  s.plan_id,
  s.payment_status,
  s.payment_method,
  s.price,
  s.created_at
FROM public.subscriptions s
LEFT JOIN public.accounts a ON s.account_id = a.id
ORDER BY s.created_at DESC
LIMIT 20;

-- Count subscriptions by status
SELECT 
  payment_status,
  COUNT(*) as count
FROM public.subscriptions
GROUP BY payment_status;

-- Check RLS policies on subscriptions table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'subscriptions';
