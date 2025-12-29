-- ============================================================
-- Quick Verification Script for Dashboard Data
-- Run this in Supabase Studio SQL Editor to verify setup
-- ============================================================

-- 1. Check if demo project exists
SELECT 
  'Demo Project Check' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Demo project found'
    ELSE '❌ Demo project not found'
  END as status,
  COUNT(*) as count
FROM public.projects 
WHERE domain = 'demo-clinic.com';

-- 2. Check table structure (new columns)
SELECT 
  'Table Structure' as check_name,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ All new columns exist'
    ELSE '❌ Missing columns: ' || (3 - COUNT(*))::text
  END as status,
  COUNT(*) as columns_found
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'weekly_stats'
  AND column_name IN ('content_score', 'eeat_score', 'local_score');

-- 3. Count 2025 data points
SELECT 
  '2025 Data Points' as check_name,
  CASE 
    WHEN COUNT(*) = 12 THEN '✅ All 12 monthly data points found'
    WHEN COUNT(*) > 0 THEN '⚠️  Found ' || COUNT(*)::text || ' points (expected 12)'
    ELSE '❌ No data found for 2025'
  END as status,
  COUNT(*) as record_count
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01';

-- 4. Show all 2025 data with calculated scores
SELECT 
  TO_CHAR(ws.week_start, 'YYYY-MM') as month,
  ROUND(ws.visability_score::numeric, 1) as visibility,
  ROUND(ws.tech_score::numeric, 1) as tech,
  ROUND(ws.content_score::numeric, 1) as content,
  ROUND(ws.eeat_score::numeric, 1) as eeat,
  ROUND(ws.local_score::numeric, 1) as local,
  ROUND(ws.clinic_ai_score::numeric, 1) as clinic_ai_score,
  ROUND(ws.avg_position::numeric, 1) as avg_position,
  CASE 
    WHEN ABS(ws.clinic_ai_score - (
      COALESCE(ws.visability_score, 0) * 0.25 +
      COALESCE(ws.tech_score, 0) * 0.20 +
      COALESCE(ws.content_score, 0) * 0.20 +
      COALESCE(ws.eeat_score, 0) * 0.15 +
      COALESCE(ws.local_score, 0) * 0.10
    )) < 0.01 THEN '✅'
    ELSE '❌'
  END as calculation_ok
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01'
ORDER BY ws.week_start ASC;

-- 5. Summary statistics
SELECT 
  'Summary' as check_name,
  ROUND(AVG(ws.clinic_ai_score)::numeric, 2) as avg_clinic_ai_score,
  ROUND(MIN(ws.clinic_ai_score)::numeric, 2) as min_score,
  ROUND(MAX(ws.clinic_ai_score)::numeric, 2) as max_score,
  ROUND(AVG(ws.avg_position)::numeric, 2) as avg_position
FROM public.weekly_stats ws
JOIN public.projects p ON p.id = ws.project_id
WHERE p.domain = 'demo-clinic.com'
  AND ws.week_start >= '2025-01-01'
  AND ws.week_start < '2026-01-01';



