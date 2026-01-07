/*
 * -------------------------------------------------------
 * Create Project for User
 * Migration: Create a project for each user account if they don't have one
 * 
 * This migration ensures that every user has at least one project
 * with demo data for the dashboard.
 * -------------------------------------------------------
 */

-- Function to create a project for a user account if it doesn't exist
CREATE OR REPLACE FUNCTION kit.ensure_user_has_project(account_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  project_id uuid;
  project_domain text;
BEGIN
  -- Generate a unique domain for the user based on their account ID
  project_domain := 'demo-' || substring(account_id::text, 1, 8) || '.clinic.com';
  
  -- Check if user already has a project
  SELECT id INTO project_id
  FROM public.projects
  WHERE organization_id = account_id
  LIMIT 1;
  
  -- If no project exists, create one
  IF project_id IS NULL THEN
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
      account_id,
      project_domain,
      'My Clinic',
      '{}'::jsonb,
      now(),
      now()
    )
    RETURNING id INTO project_id;
    
    -- Create demo data for the new project (12 monthly data points for 2025)
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
    
    -- Note: clinic_ai_score will be automatically calculated by the trigger
  END IF;
  
  RETURN project_id;
END;
$$;

-- Create projects for all existing accounts that don't have one
DO $$
DECLARE
  account_record RECORD;
  project_id uuid;
BEGIN
  FOR account_record IN SELECT id FROM public.accounts LOOP
    SELECT kit.ensure_user_has_project(account_record.id) INTO project_id;
    RAISE NOTICE 'Ensured project for account %: project_id = %', account_record.id, project_id;
  END LOOP;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION kit.ensure_user_has_project(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION kit.ensure_user_has_project(uuid) IS 'Creates a project with demo data for a user account if it does not exist';







