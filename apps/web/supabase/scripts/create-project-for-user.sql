-- ============================================================
-- Create Project and Data for Specific User
-- ============================================================

-- Replace with the actual email
\set email 'tryvailo@gmail.com'

DO $$
DECLARE
  user_id uuid;
  account_id uuid;
  project_id uuid;
  project_domain text;
BEGIN
  -- 1. Find user
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = :'email';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', :'email';
  END IF;
  
  RAISE NOTICE 'Found user: % (ID: %)', :'email', user_id;
  
  -- 2. Ensure account exists
  SELECT id INTO account_id
  FROM public.accounts
  WHERE id = user_id;
  
  IF account_id IS NULL THEN
    RAISE NOTICE 'Creating account for user: %', :'email';
    INSERT INTO public.accounts (id, name, email, created_at, updated_at)
    VALUES (
      user_id,
      split_part(:'email', '@', 1),
      :'email',
      now(),
      now()
    )
    RETURNING id INTO account_id;
    RAISE NOTICE 'Created account: %', account_id;
  ELSE
    RAISE NOTICE 'Account already exists: %', account_id;
  END IF;
  
  -- 3. Check if project exists
  SELECT id INTO project_id
  FROM public.projects
  WHERE organization_id = user_id
  LIMIT 1;
  
  IF project_id IS NULL THEN
    -- Generate unique domain
    project_domain := 'demo-' || substring(user_id::text, 1, 8) || '.clinic.com';
    
    RAISE NOTICE 'Creating project for user: % (domain: %)', :'email', project_domain;
    
    INSERT INTO public.projects (
      id,
      organization_id,
      domain,
      name,
      settings,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      user_id,
      project_domain,
      'My Clinic',
      '{}'::jsonb,
      now(),
      now()
    )
    RETURNING id INTO project_id;
    
    RAISE NOTICE 'Created project: %', project_id;
  ELSE
    RAISE NOTICE 'Project already exists: %', project_id;
  END IF;
  
  -- 4. Check if weekly_stats data exists
  IF NOT EXISTS(
    SELECT 1 FROM public.weekly_stats 
    WHERE project_id = project_id 
    AND week_start >= '2025-01-01' 
    AND week_start < '2026-01-01'
    LIMIT 1
  ) THEN
    RAISE NOTICE 'Creating weekly_stats data for project: %', project_id;
    
    -- Delete any existing data to avoid duplicates
    DELETE FROM public.weekly_stats WHERE project_id = project_id;
    
    -- Insert 12 monthly data points for 2025
    INSERT INTO public.weekly_stats (
      project_id,
      week_start,
      visability_score,
      tech_score,
      content_score,
      eeat_score,
      local_score,
      avg_position,
      created_at,
      updated_at
    ) VALUES
      -- January 2025 - Starting point (lower scores)
      (project_id, '2025-01-06', 45.0, 60.0, 55.0, 50.0, 40.0, 8.5, now(), now()),
      
      -- February 2025 - Small improvement
      (project_id, '2025-02-03', 48.0, 62.0, 58.0, 52.0, 42.0, 8.0, now(), now()),
      
      -- March 2025 - Continued growth
      (project_id, '2025-03-03', 52.0, 65.0, 62.0, 55.0, 45.0, 7.5, now(), now()),
      
      -- April 2025 - Tech improvements
      (project_id, '2025-04-07', 55.0, 70.0, 65.0, 58.0, 48.0, 7.0, now(), now()),
      
      -- May 2025 - Content optimization
      (project_id, '2025-05-05', 58.0, 72.0, 70.0, 60.0, 50.0, 6.5, now(), now()),
      
      -- June 2025 - E-E-A-T improvements
      (project_id, '2025-06-02', 62.0, 74.0, 72.0, 65.0, 52.0, 6.0, now(), now()),
      
      -- July 2025 - Local signals boost
      (project_id, '2025-07-07', 65.0, 76.0, 74.0, 68.0, 58.0, 5.5, now(), now()),
      
      -- August 2025 - Strong performance
      (project_id, '2025-08-04', 68.0, 78.0, 76.0, 70.0, 62.0, 5.0, now(), now()),
      
      -- September 2025 - Peak visibility
      (project_id, '2025-09-01', 72.0, 80.0, 78.0, 72.0, 65.0, 4.5, now(), now()),
      
      -- October 2025 - Maintaining high scores
      (project_id, '2025-10-06', 75.0, 82.0, 80.0, 75.0, 68.0, 4.0, now(), now()),
      
      -- November 2025 - Excellent performance
      (project_id, '2025-11-03', 78.0, 84.0, 82.0, 78.0, 70.0, 3.5, now(), now()),
      
      -- December 2025 - Year-end peak
      (project_id, '2025-12-01', 80.0, 85.0, 84.0, 80.0, 72.0, 3.0, now(), now());
    
    RAISE NOTICE 'Created 12 weekly_stats records for project: %', project_id;
  ELSE
    RAISE NOTICE 'weekly_stats data already exists for project: %', project_id;
  END IF;
  
  RAISE NOTICE '✅ Completed: Project and data created for user: %', :'email';
END;
$$;

-- Verification
SELECT 
  'Verification' as check_type,
  a.email,
  COUNT(DISTINCT p.id) as projects,
  COUNT(DISTINCT ws.id) as data_points,
  ROUND(MIN(ws.clinic_ai_score)::numeric, 1) as min_score,
  ROUND(MAX(ws.clinic_ai_score)::numeric, 1) as max_score
FROM auth.users a
LEFT JOIN public.projects p ON p.organization_id = a.id
LEFT JOIN public.weekly_stats ws ON ws.project_id = p.id
WHERE a.email = :'email'
GROUP BY a.email;


