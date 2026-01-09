-- ============================================================
-- Check Data for Specific User
-- ============================================================

-- Replace 'tryvailo@gmail.com' with the actual email
\set email 'tryvailo@gmail.com'

-- 1. Find user
SELECT 
  'User Info' as check_type,
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = :'email';

-- 2. Check account
SELECT 
  'Account Info' as check_type,
  id as account_id,
  name,
  email,
  created_at
FROM public.accounts
WHERE email = :'email';

-- 3. Check projects
SELECT 
  'Project Info' as check_type,
  p.id as project_id,
  p.domain,
  p.name,
  p.organization_id,
  a.email as owner_email
FROM public.projects p
JOIN auth.users a ON a.id = p.organization_id
WHERE a.email = :'email';

-- 4. Check weekly_stats
SELECT 
  'Weekly Stats Info' as check_type,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE week_start >= '2025-01-01' AND week_start < '2026-01-01') as records_2025,
  ROUND(MIN(clinic_ai_score)::numeric, 1) as min_score,
  ROUND(MAX(clinic_ai_score)::numeric, 1) as max_score,
  ROUND(AVG(clinic_ai_score)::numeric, 1) as avg_score
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
JOIN auth.users a ON a.id = p.organization_id
WHERE a.email = :'email';

-- 5. Show sample data
SELECT 
  'Sample Data' as check_type,
  ws.week_start,
  ROUND(ws.visability_score::numeric, 1) as visibility,
  ROUND(ws.tech_score::numeric, 1) as tech,
  ROUND(ws.content_score::numeric, 1) as content,
  ROUND(ws.eeat_score::numeric, 1) as eeat,
  ROUND(ws.local_score::numeric, 1) as local,
  ROUND(ws.clinic_ai_score::numeric, 1) as clinic_ai,
  ROUND(ws.avg_position::numeric, 1) as position
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
JOIN auth.users a ON a.id = p.organization_id
WHERE a.email = :'email'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01'
ORDER BY ws.week_start
LIMIT 5;









