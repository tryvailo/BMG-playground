/*
 * -------------------------------------------------------
 * Fix All Users Projects
 * Migration: Ensure all users have projects with data
 * 
 * This migration ensures that every user in auth.users has:
 * 1. An account in public.accounts (if missing)
 * 2. A project in public.projects (if missing)
 * 3. 12 monthly data points in public.weekly_stats for 2025 (if missing)
 * -------------------------------------------------------
 */

-- Create projects and data for all users that don't have them
DO $$
DECLARE
  user_record RECORD;
  account_exists BOOLEAN;
  project_exists BOOLEAN;
  project_id uuid;
  project_domain text;
  data_exists BOOLEAN;
BEGIN
  -- Loop through all users
  FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
    RAISE NOTICE 'Processing user: % (ID: %)', user_record.email, user_record.id;
    
    -- 1. Ensure account exists
    SELECT EXISTS(SELECT 1 FROM public.accounts WHERE id = user_record.id) INTO account_exists;
    
    IF NOT account_exists THEN
      RAISE NOTICE 'Creating account for user: %', user_record.email;
      INSERT INTO public.accounts (id, name, email, created_at, updated_at)
      VALUES (
        user_record.id,
        COALESCE(user_record.raw_user_meta_data->>'name', split_part(user_record.email, '@', 1), 'User'),
        user_record.email,
        now(),
        now()
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- 2. Ensure project exists
    SELECT EXISTS(SELECT 1 FROM public.projects WHERE organization_id = user_record.id) INTO project_exists;
    
    IF NOT project_exists THEN
      -- Generate unique domain
      project_domain := 'demo-' || substring(user_record.id::text, 1, 8) || '.clinic.com';
      
      RAISE NOTICE 'Creating project for user: % (domain: %)', user_record.email, project_domain;
      
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
        user_record.id,
        project_domain,
        'My Clinic',
        '{}'::jsonb,
        now(),
        now()
      )
      RETURNING id INTO project_id;
      
      RAISE NOTICE 'Created project: %', project_id;
    ELSE
      -- Get existing project ID
      SELECT id INTO project_id
      FROM public.projects
      WHERE organization_id = user_record.id
      LIMIT 1;
      
      RAISE NOTICE 'Project already exists: %', project_id;
    END IF;
    
    -- 3. Ensure weekly_stats data exists
    SELECT EXISTS(
      SELECT 1 FROM public.weekly_stats 
      WHERE project_id = project_id 
      AND week_start >= '2025-01-01' 
      AND week_start < '2026-01-01'
      LIMIT 1
    ) INTO data_exists;
    
    IF NOT data_exists THEN
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
      
      RAISE NOTICE 'Created 12 weekly_stats records for project: %', project_id;
    ELSE
      RAISE NOTICE 'weekly_stats data already exists for project: %', project_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Completed: All users now have projects with data';
END;
$$;

-- Verification query
SELECT 
  'Verification' as status,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT a.id) as total_accounts,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT ws.id) as total_data_points
FROM auth.users u
LEFT JOIN public.accounts a ON a.id = u.id
LEFT JOIN public.projects p ON p.organization_id = u.id
LEFT JOIN public.weekly_stats ws ON ws.project_id = p.id;


