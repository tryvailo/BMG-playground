-- ============================================================
-- Quick Fix for tryvailo@gmail.com
-- Creates project and data for this specific user
-- ============================================================

DO $$
DECLARE
  user_id uuid;
  account_id uuid;
  project_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM auth.users WHERE email = 'tryvailo@gmail.com' LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User tryvailo@gmail.com not found';
  END IF;
  
  RAISE NOTICE 'Found user: tryvailo@gmail.com (ID: %)', user_id;
  
  -- Ensure account exists
  INSERT INTO public.accounts (id, name, email, created_at, updated_at)
  VALUES (user_id, 'tryvailo', 'tryvailo@gmail.com', now(), now())
  ON CONFLICT (id) DO UPDATE SET updated_at = now()
  RETURNING id INTO account_id;
  
  RAISE NOTICE 'Account ensured: %', account_id;
  
  -- Create project if doesn't exist
  INSERT INTO public.projects (id, organization_id, domain, name, settings, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    user_id,
    'demo-' || substring(user_id::text, 1, 8) || '.clinic.com',
    'My Clinic',
    '{}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO project_id;
  
  -- Get project ID if it already exists
  IF project_id IS NULL THEN
    SELECT id INTO project_id FROM public.projects WHERE organization_id = user_id LIMIT 1;
  END IF;
  
  RAISE NOTICE 'Project ID: %', project_id;
  
  -- Delete existing data to avoid duplicates
  DELETE FROM public.weekly_stats WHERE project_id = project_id;
  
  -- Create data (12 monthly data points for 2025)
  INSERT INTO public.weekly_stats (project_id, week_start, visability_score, tech_score, content_score, eeat_score, local_score, avg_position, created_at, updated_at)
  VALUES
    (project_id, '2025-01-06', 45.0, 60.0, 55.0, 50.0, 40.0, 8.5, now(), now()),
    (project_id, '2025-02-03', 48.0, 62.0, 58.0, 52.0, 42.0, 8.0, now(), now()),
    (project_id, '2025-03-03', 52.0, 65.0, 62.0, 55.0, 45.0, 7.5, now(), now()),
    (project_id, '2025-04-07', 55.0, 70.0, 65.0, 58.0, 48.0, 7.0, now(), now()),
    (project_id, '2025-05-05', 58.0, 72.0, 70.0, 60.0, 50.0, 6.5, now(), now()),
    (project_id, '2025-06-02', 62.0, 74.0, 72.0, 65.0, 52.0, 6.0, now(), now()),
    (project_id, '2025-07-07', 65.0, 76.0, 74.0, 68.0, 58.0, 5.5, now(), now()),
    (project_id, '2025-08-04', 68.0, 78.0, 76.0, 70.0, 62.0, 5.0, now(), now()),
    (project_id, '2025-09-01', 72.0, 80.0, 78.0, 72.0, 65.0, 4.5, now(), now()),
    (project_id, '2025-10-06', 75.0, 82.0, 80.0, 75.0, 68.0, 4.0, now(), now()),
    (project_id, '2025-11-03', 78.0, 84.0, 82.0, 78.0, 70.0, 3.5, now(), now()),
    (project_id, '2025-12-01', 80.0, 85.0, 84.0, 80.0, 72.0, 3.0, now(), now());
  
  RAISE NOTICE '✅ Created project % and 12 data points for tryvailo@gmail.com', project_id;
END;
$$;

-- Verification
SELECT 
  'Verification' as status,
  a.email,
  COUNT(DISTINCT p.id) as projects,
  COUNT(DISTINCT ws.id) as data_points,
  ROUND(MIN(ws.clinic_ai_score)::numeric, 1) as min_score,
  ROUND(MAX(ws.clinic_ai_score)::numeric, 1) as max_score
FROM auth.users a
LEFT JOIN public.projects p ON p.organization_id = a.id
LEFT JOIN public.weekly_stats ws ON ws.project_id = p.id
WHERE a.email = 'tryvailo@gmail.com'
GROUP BY a.email;








