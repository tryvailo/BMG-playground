/*
 * -------------------------------------------------------
 * Seed Dashboard Data for 2025
 * Migration: Fill weekly_stats with mock data for 2025 (12 monthly data points)
 * 
 * This migration creates:
 * - A demo project if it doesn't exist
 * - 12 monthly data points in weekly_stats for 2025
 * - Realistic values showing gradual improvement over time
 * -------------------------------------------------------
 */

-- Create demo project if it doesn't exist
-- Note: This assumes there's at least one account in the system
-- If no accounts exist, you'll need to create one first
DO $$
DECLARE
  demo_project_id uuid;
  demo_account_id uuid;
BEGIN
  -- Get first account or create a demo account
  SELECT id INTO demo_account_id FROM public.accounts LIMIT 1;
  
  IF demo_account_id IS NULL THEN
    -- Create a demo account if none exists
    INSERT INTO public.accounts (id, name, email, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Demo Clinic',
      'demo@clinic.com',
      now(),
      now()
    )
    RETURNING id INTO demo_account_id;
  END IF;

  -- Check if demo project exists
  SELECT id INTO demo_project_id 
  FROM public.projects 
  WHERE domain = 'demo-clinic.com' 
  LIMIT 1;

  -- Create demo project if it doesn't exist
  IF demo_project_id IS NULL THEN
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
      demo_account_id,
      'demo-clinic.com',
      'Demo Medical Clinic',
      '{}'::jsonb,
      now(),
      now()
    )
    RETURNING id INTO demo_project_id;
  END IF;

  -- Delete existing weekly_stats for this project to avoid duplicates
  DELETE FROM public.weekly_stats WHERE project_id = demo_project_id;

  -- Insert 12 monthly data points for 2025
  -- Each month shows gradual improvement in metrics
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
    (demo_project_id, '2025-01-06', 45.0, 60.0, 55.0, 50.0, 40.0, 8.5, now(), now()),
    
    -- February 2025 - Small improvement
    (demo_project_id, '2025-02-03', 48.0, 62.0, 58.0, 52.0, 42.0, 8.0, now(), now()),
    
    -- March 2025 - Continued growth
    (demo_project_id, '2025-03-03', 52.0, 65.0, 62.0, 55.0, 45.0, 7.5, now(), now()),
    
    -- April 2025 - Tech improvements
    (demo_project_id, '2025-04-07', 55.0, 70.0, 65.0, 58.0, 48.0, 7.0, now(), now()),
    
    -- May 2025 - Content optimization
    (demo_project_id, '2025-05-05', 58.0, 72.0, 70.0, 60.0, 50.0, 6.5, now(), now()),
    
    -- June 2025 - E-E-A-T improvements
    (demo_project_id, '2025-06-02', 62.0, 74.0, 72.0, 65.0, 52.0, 6.0, now(), now()),
    
    -- July 2025 - Local signals boost
    (demo_project_id, '2025-07-07', 65.0, 76.0, 74.0, 68.0, 58.0, 5.5, now(), now()),
    
    -- August 2025 - Strong performance
    (demo_project_id, '2025-08-04', 68.0, 78.0, 76.0, 70.0, 62.0, 5.0, now(), now()),
    
    -- September 2025 - Peak visibility
    (demo_project_id, '2025-09-01', 72.0, 80.0, 78.0, 72.0, 65.0, 4.5, now(), now()),
    
    -- October 2025 - Maintaining high scores
    (demo_project_id, '2025-10-06', 75.0, 82.0, 80.0, 75.0, 68.0, 4.0, now(), now()),
    
    -- November 2025 - Excellent performance
    (demo_project_id, '2025-11-03', 78.0, 84.0, 82.0, 78.0, 70.0, 3.5, now(), now()),
    
    -- December 2025 - Year-end peak
    (demo_project_id, '2025-12-01', 80.0, 85.0, 84.0, 80.0, 72.0, 3.0, now(), now());

  -- Note: clinic_ai_score will be automatically calculated by the trigger
  -- based on the formula: 0.25*Visibility + 0.2*Tech + 0.2*Content + 0.15*E-E-A-T + 0.1*Local

  RAISE NOTICE 'Demo project created/updated with ID: %', demo_project_id;
  RAISE NOTICE 'Inserted 12 monthly data points for 2025';
END $$;

-- Verify the data was inserted correctly
DO $$
DECLARE
  record_count integer;
  demo_project_id uuid;
BEGIN
  SELECT id INTO demo_project_id 
  FROM public.projects 
  WHERE domain = 'demo-clinic.com' 
  LIMIT 1;

  IF demo_project_id IS NOT NULL THEN
    SELECT COUNT(*) INTO record_count
    FROM public.weekly_stats
    WHERE project_id = demo_project_id
      AND week_start >= '2025-01-01'
      AND week_start < '2026-01-01';

    RAISE NOTICE 'Verification: Found % records for 2025 in weekly_stats', record_count;
    
    IF record_count = 12 THEN
      RAISE NOTICE '✅ Success: All 12 monthly data points created correctly';
    ELSE
      RAISE WARNING '⚠️ Warning: Expected 12 records, found %', record_count;
    END IF;
  END IF;
END $$;

