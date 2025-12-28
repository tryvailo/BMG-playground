-- ============================================================
-- Verify Data for tryvailo@gmail.com
-- ============================================================

-- Check user, account, project, and data
SELECT 
  'User Info' as check_type,
  u.id as user_id,
  u.email,
  u.created_at as user_created
FROM auth.users u
WHERE u.email = 'tryvailo@gmail.com';

-- Check account
SELECT 
  'Account Info' as check_type,
  a.id as account_id,
  a.name,
  a.email,
  a.created_at
FROM public.accounts a
WHERE a.email = 'tryvailo@gmail.com';

-- Check project
SELECT 
  'Project Info' as check_type,
  p.id as project_id,
  p.organization_id,
  p.domain,
  p.name,
  p.created_at
FROM public.projects p
WHERE p.organization_id = (SELECT id FROM auth.users WHERE email = 'tryvailo@gmail.com' LIMIT 1);

-- Check weekly_stats data
SELECT 
  'Weekly Stats Summary' as check_type,
  COUNT(*) as total_records,
  COUNT(DISTINCT project_id) as projects,
  MIN(week_start) as earliest_date,
  MAX(week_start) as latest_date,
  ROUND(MIN(clinic_ai_score)::numeric, 1) as min_score,
  ROUND(MAX(clinic_ai_score)::numeric, 1) as max_score,
  ROUND(AVG(clinic_ai_score)::numeric, 1) as avg_score
FROM public.weekly_stats
WHERE project_id IN (
  SELECT id FROM public.projects 
  WHERE organization_id = (SELECT id FROM auth.users WHERE email = 'tryvailo@gmail.com' LIMIT 1)
);

-- Check all weekly_stats records
SELECT 
  'Weekly Stats Details' as check_type,
  week_start,
  visability_score,
  tech_score,
  content_score,
  eeat_score,
  local_score,
  avg_position,
  ROUND(clinic_ai_score::numeric, 1) as clinic_ai_score
FROM public.weekly_stats
WHERE project_id IN (
  SELECT id FROM public.projects 
  WHERE organization_id = (SELECT id FROM auth.users WHERE email = 'tryvailo@gmail.com' LIMIT 1)
)
ORDER BY week_start ASC;

-- Final summary
SELECT 
  'Final Summary' as check_type,
  u.email,
  COUNT(DISTINCT p.id) as projects,
  COUNT(DISTINCT ws.id) as data_points,
  ROUND(MIN(ws.clinic_ai_score)::numeric, 1) as min_score,
  ROUND(MAX(ws.clinic_ai_score)::numeric, 1) as max_score,
  ROUND(AVG(ws.clinic_ai_score)::numeric, 1) as avg_score
FROM auth.users u
LEFT JOIN public.projects p ON p.organization_id = u.id
LEFT JOIN public.weekly_stats ws ON ws.project_id = p.id
WHERE u.email = 'tryvailo@gmail.com'
GROUP BY u.email;


