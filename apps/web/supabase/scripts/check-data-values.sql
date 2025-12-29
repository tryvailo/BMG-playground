-- ============================================================
-- Check that dashboard data has non-zero values
-- ============================================================

-- Check demo project and its data
SELECT 
  'Project Check' as check_type,
  p.id as project_id,
  p.domain,
  p.name,
  COUNT(ws.id) as total_records
FROM public.projects p
LEFT JOIN public.weekly_stats ws ON ws.project_id = p.id
WHERE p.domain = 'demo-clinic.com'
GROUP BY p.id, p.domain, p.name;

-- Check all 2025 data points with their values
SELECT 
  ws.week_start,
  ws.visability_score,
  ws.tech_score,
  ws.content_score,
  ws.eeat_score,
  ws.local_score,
  ws.clinic_ai_score,
  ws.avg_position,
  CASE 
    WHEN ws.visability_score > 0 
     AND ws.tech_score > 0 
     AND ws.content_score > 0 
     AND ws.eeat_score > 0 
     AND ws.local_score > 0 
     AND ws.clinic_ai_score > 0 
    THEN '✅ All values > 0'
    ELSE '❌ Some values are zero'
  END as data_quality
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01'
ORDER BY ws.week_start;

-- Summary: Count records with zero values
SELECT 
  'Data Quality Check' as check_type,
  COUNT(*) FILTER (WHERE ws.visability_score = 0 OR ws.visability_score IS NULL) as zero_visibility,
  COUNT(*) FILTER (WHERE ws.tech_score = 0 OR ws.tech_score IS NULL) as zero_tech,
  COUNT(*) FILTER (WHERE ws.content_score = 0 OR ws.content_score IS NULL) as zero_content,
  COUNT(*) FILTER (WHERE ws.eeat_score = 0 OR ws.eeat_score IS NULL) as zero_eeat,
  COUNT(*) FILTER (WHERE ws.local_score = 0 OR ws.local_score IS NULL) as zero_local,
  COUNT(*) FILTER (WHERE ws.clinic_ai_score = 0 OR ws.clinic_ai_score IS NULL) as zero_clinic_ai,
  COUNT(*) as total_records
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01';



