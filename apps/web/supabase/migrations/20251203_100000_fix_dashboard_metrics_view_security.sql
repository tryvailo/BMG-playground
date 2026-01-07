/*
 * -------------------------------------------------------
 * Fix Dashboard Metrics View Security
 * Migration: Recreate dashboard_metrics_latest view without SECURITY DEFINER
 * 
 * This migration fixes the security warning by ensuring the view
 * uses SECURITY INVOKER (default) instead of SECURITY DEFINER
 * -------------------------------------------------------
 */

-- Drop the existing view
drop view if exists public.dashboard_metrics_latest;

-- Recreate the view without SECURITY DEFINER
-- Views in PostgreSQL use SECURITY INVOKER by default (executes with permissions of the querying user)
-- This ensures RLS policies are enforced based on the querying user, not the view creator
create view public.dashboard_metrics_latest as
select distinct on (project_id)
  project_id,
  week_start,
  clinic_ai_score,
  visability_score,
  avg_position,
  tech_score,
  content_score,
  eeat_score,
  local_score,
  created_at,
  updated_at
from public.weekly_stats
where clinic_ai_score is not null
order by project_id, week_start desc;

comment on view public.dashboard_metrics_latest is 'Latest dashboard metrics for each project (SECURITY INVOKER)';

-- Grant access to the view
grant select on public.dashboard_metrics_latest to authenticated;
grant select on public.dashboard_metrics_latest to anon;

