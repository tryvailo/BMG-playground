SELECT s.plan_name, s.plan_id, s.billing_interval, a.email
   FROM public.subscriptions s
   LEFT JOIN public.accounts a ON a.id = s.account_id
   ORDER BY s.created_at DESC;