-- ============================================================
-- Verify that dashboard data has non-zero values
-- ============================================================

-- 1. Check project exists
SELECT 
  'Project' as check_type,
  p.id::text as project_id,
  p.domain,
  p.name,
  CASE WHEN p.id IS NOT NULL THEN '✅ Found' ELSE '❌ Not found' END as status
FROM public.projects p
WHERE p.domain = 'demo-clinic.com'
LIMIT 1;

-- 2. Count records and check for zero values
SELECT 
  'Data Quality' as check_type,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE ws.clinic_ai_score > 0) as non_zero_scores,
  COUNT(*) FILTER (WHERE ws.visability_score > 0) as non_zero_visibility,
  COUNT(*) FILTER (WHERE ws.tech_score > 0) as non_zero_tech,
  COUNT(*) FILTER (WHERE ws.content_score > 0) as non_zero_content,
  COUNT(*) FILTER (WHERE ws.eeat_score > 0) as non_zero_eeat,
  COUNT(*) FILTER (WHERE ws.local_score > 0) as non_zero_local,
  CASE 
    WHEN COUNT(*) = 12 
     AND COUNT(*) FILTER (WHERE ws.clinic_ai_score > 0) = 12
     AND COUNT(*) FILTER (WHERE ws.visability_score > 0) = 12
    THEN '✅ All data is non-zero'
    ELSE '❌ Some data is zero'
  END as quality_status
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01';

-- 3. Show all values to verify they are non-zero
SELECT 
  ws.week_start as "Month",
  ROUND(ws.visability_score::numeric, 1) as "Visibility",
  ROUND(ws.tech_score::numeric, 1) as "Tech",
  ROUND(ws.content_score::numeric, 1) as "Content",
  ROUND(ws.eeat_score::numeric, 1) as "E-E-A-T",
  ROUND(ws.local_score::numeric, 1) as "Local",
  ROUND(ws.clinic_ai_score::numeric, 1) as "ClinicAI Score",
  ROUND(ws.avg_position::numeric, 1) as "Position",
  CASE 
    WHEN ws.clinic_ai_score > 0 
     AND ws.visability_score > 0 
     AND ws.tech_score > 0 
     AND ws.content_score > 0 
     AND ws.eeat_score > 0 
     AND ws.local_score > 0 
    THEN '✅'
    ELSE '❌'
  END as "OK"
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01'
ORDER BY ws.week_start;

-- 4. Check trigger is working
SELECT 
  'Trigger Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'auto_calculate_clinic_ai_score'
    ) THEN '✅ Trigger exists'
    ELSE '❌ Trigger missing'
  END as status;

-- 5. Test calculation manually for latest record
SELECT 
  'Calculation Test' as check_type,
  ws.week_start,
  ROUND(ws.clinic_ai_score::numeric, 2) as stored_score,
  ROUND((
    COALESCE(ws.visability_score, 0) * 0.25 +
    COALESCE(ws.tech_score, 0) * 0.20 +
    COALESCE(ws.content_score, 0) * 0.20 +
    COALESCE(ws.eeat_score, 0) * 0.15 +
    COALESCE(ws.local_score, 0) * 0.10
  )::numeric, 2) as calculated_score,
  CASE 
    WHEN ABS(ws.clinic_ai_score - (
      COALESCE(ws.visability_score, 0) * 0.25 +
      COALESCE(ws.tech_score, 0) * 0.20 +
      COALESCE(ws.content_score, 0) * 0.20 +
      COALESCE(ws.eeat_score, 0) * 0.15 +
      COALESCE(ws.local_score, 0) * 0.10
    )) < 0.01 THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as match_status
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
ORDER BY ws.week_start DESC
LIMIT 1;









