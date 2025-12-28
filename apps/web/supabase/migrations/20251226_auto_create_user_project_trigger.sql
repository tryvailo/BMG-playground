/*
 * -------------------------------------------------------
 * Auto-Create Project Trigger
 * Migration: Automatically create project and data when account is created
 * 
 * This migration creates a trigger that automatically creates a project
 * with demo data whenever a new account is created.
 * -------------------------------------------------------
 */

-- Function to auto-create project and data for new account
CREATE OR REPLACE FUNCTION kit.auto_create_project_for_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  project_id uuid;
  project_domain text;
  project_exists BOOLEAN;
BEGIN
  -- Check if project already exists
  SELECT EXISTS(SELECT 1 FROM public.projects WHERE organization_id = NEW.id) INTO project_exists;
  
  IF project_exists THEN
    RETURN NEW;
  END IF;
  
  -- Generate unique domain
  project_domain := 'demo-' || substring(NEW.id::text, 1, 8) || '.clinic.com';
  
  -- Create project
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
    NEW.id,
    project_domain,
    'My Clinic',
    '{}'::jsonb,
    now(),
    now()
  )
  RETURNING id INTO project_id;
  
  -- Create demo data (12 monthly data points for 2025)
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
  
  RAISE NOTICE 'Auto-created project % with data for account %', project_id, NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on accounts table
DROP TRIGGER IF EXISTS auto_create_project_for_account ON public.accounts;
CREATE TRIGGER auto_create_project_for_account
  AFTER INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION kit.auto_create_project_for_account();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION kit.auto_create_project_for_account() TO authenticated, service_role;

COMMENT ON FUNCTION kit.auto_create_project_for_account() IS 'Automatically creates a project with demo data when a new account is created';

-- Now create projects and data for all existing accounts that don't have them
DO $$
DECLARE
  account_record RECORD;
  project_id uuid;
  project_domain text;
BEGIN
  FOR account_record IN 
    SELECT a.id, a.email 
    FROM public.accounts a
    WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE organization_id = a.id)
  LOOP
    RAISE NOTICE 'Creating project for existing account: % (ID: %)', account_record.email, account_record.id;
    
    project_domain := 'demo-' || substring(account_record.id::text, 1, 8) || '.clinic.com';
    
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
      account_record.id,
      project_domain,
      'My Clinic',
      '{}'::jsonb,
      now(),
      now()
    )
    RETURNING id INTO project_id;
    
    -- Create demo data
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
    
    RAISE NOTICE 'Created project % with data for account %', project_id, account_record.id;
  END LOOP;
  
  RAISE NOTICE '✅ Completed: All existing accounts now have projects with data';
END;
$$;

