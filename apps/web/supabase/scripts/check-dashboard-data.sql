-- ============================================================
-- Script to verify dashboard data in the database
-- Run this in Supabase SQL Editor to check:
-- 1. Table structure (new columns exist)
-- 2. Demo project exists
-- 3. 12 monthly data points for 2025
-- 4. ClinicAI Score calculations are correct
-- ============================================================

-- 1. Check if new columns exist in weekly_stats
SELECT 
  'Table Structure Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'weekly_stats'
        AND column_name = 'content_score'
    ) THEN '✅ content_score column exists'
    ELSE '❌ content_score column missing'
  END as status
UNION ALL
SELECT 
  'Table Structure Check',
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'weekly_stats'
        AND column_name = 'eeat_score'
    ) THEN '✅ eeat_score column exists'
    ELSE '❌ eeat_score column missing'
  END
UNION ALL
SELECT 
  'Table Structure Check',
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'weekly_stats'
        AND column_name = 'local_score'
    ) THEN '✅ local_score column exists'
    ELSE '❌ local_score column missing'
  END;

-- 2. Check for demo project
SELECT 
  'Demo Project Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.projects WHERE domain = 'demo-clinic.com'
    ) THEN '✅ Demo project exists'
    ELSE '❌ Demo project not found - run seed migration'
  END as status;

-- 3. Count data points for 2025
SELECT 
  'Data Points Count' as check_type,
  CASE 
    WHEN COUNT(*) = 12 THEN '✅ Found 12 monthly data points for 2025'
    WHEN COUNT(*) > 0 THEN '⚠️  Found ' || COUNT(*)::text || ' data points (expected 12)'
    ELSE '❌ No data found for 2025 - run seed migration'
  END as status
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01';

-- 4. Show all 2025 data points with calculated scores
SELECT 
  ws.week_start as "Month",
  ws.visability_score as "Visibility",
  ws.tech_score as "Tech",
  ws.content_score as "Content",
  ws.eeat_score as "E-E-A-T",
  ws.local_score as "Local",
  ws.clinic_ai_score as "ClinicAI Score",
  ws.avg_position as "Avg Position",
  -- Verify calculation
  ROUND(
    (COALESCE(ws.visability_score, 0) * 0.25 +
     COALESCE(ws.tech_score, 0) * 0.20 +
     COALESCE(ws.content_score, 0) * 0.20 +
     COALESCE(ws.eeat_score, 0) * 0.15 +
     COALESCE(ws.local_score, 0) * 0.10)::numeric, 2
  ) as "Calculated Score",
  CASE 
    WHEN ABS(ws.clinic_ai_score - (
      COALESCE(ws.visability_score, 0) * 0.25 +
      COALESCE(ws.tech_score, 0) * 0.20 +
      COALESCE(ws.content_score, 0) * 0.20 +
      COALESCE(ws.eeat_score, 0) * 0.15 +
      COALESCE(ws.local_score, 0) * 0.10
    )) < 0.01 THEN '✅'
    ELSE '❌'
  END as "Calculation OK"
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01'
ORDER BY ws.week_start ASC;

-- 5. Summary statistics
SELECT 
  'Summary Statistics' as metric,
  ROUND(AVG(ws.clinic_ai_score)::numeric, 2) as "Avg ClinicAI Score",
  ROUND(AVG(ws.visability_score)::numeric, 2) as "Avg Visibility",
  ROUND(AVG(ws.tech_score)::numeric, 2) as "Avg Tech",
  ROUND(AVG(ws.content_score)::numeric, 2) as "Avg Content",
  ROUND(AVG(ws.eeat_score)::numeric, 2) as "Avg E-E-A-T",
  ROUND(AVG(ws.local_score)::numeric, 2) as "Avg Local",
  ROUND(AVG(ws.avg_position)::numeric, 2) as "Avg Position"
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01';









