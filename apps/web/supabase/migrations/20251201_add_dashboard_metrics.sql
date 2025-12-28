/*
 * -------------------------------------------------------
 * Dashboard Metrics Schema Extension
 * Migration: Extend weekly_stats table to store all components of ClinicAI Score
 * 
 * This migration adds fields to weekly_stats for:
 * - Content Optimization Score
 * - E-E-A-T Score  
 * - Local Indicators Score
 * 
 * Also creates a view for easy access to latest dashboard metrics
 * -------------------------------------------------------
 */

-- Add new columns to weekly_stats for complete ClinicAI Score calculation
-- Formula: 0.25*Visibility + 0.2*Tech + 0.2*Content + 0.15*E-E-A-T + 0.1*Local

alter table public.weekly_stats
  add column if not exists content_score double precision,
  add column if not exists eeat_score double precision,
  add column if not exists local_score double precision;

comment on column public.weekly_stats.content_score is 'Content Optimization Score (0-100)';
comment on column public.weekly_stats.eeat_score is 'E-E-A-T Score (0-100)';
comment on column public.weekly_stats.local_score is 'Local Indicators Score (0-100)';

-- Update existing comment for clinic_ai_score to reflect the full formula
comment on column public.weekly_stats.clinic_ai_score is 'ClinicAI Score calculated as: 0.25*Visibility + 0.2*Tech + 0.2*Content + 0.15*E-E-A-T + 0.1*Local';

/*
 * -------------------------------------------------------
 * View: dashboard_metrics_latest
 * Provides easy access to the latest dashboard metrics for each project
 * -------------------------------------------------------
 */
create or replace view public.dashboard_metrics_latest as
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

comment on view public.dashboard_metrics_latest is 'Latest dashboard metrics for each project';

-- Grant access to the view
grant select on public.dashboard_metrics_latest to authenticated;

/*
 * -------------------------------------------------------
 * Function: calculate_clinic_ai_score
 * Calculates ClinicAI Score from component scores
 * Formula: 0.25*Visibility + 0.2*Tech + 0.2*Content + 0.15*E-E-A-T + 0.1*Local
 * -------------------------------------------------------
 */
create or replace function kit.calculate_clinic_ai_score(
  visibility_score double precision,
  tech_score double precision,
  content_score double precision,
  eeat_score double precision,
  local_score double precision
) returns double precision
language plpgsql
immutable
as $$
declare
  result double precision;
begin
  -- Handle NULL values by treating them as 0
  result := 
    coalesce(visibility_score, 0) * 0.25 +
    coalesce(tech_score, 0) * 0.20 +
    coalesce(content_score, 0) * 0.20 +
    coalesce(eeat_score, 0) * 0.15 +
    coalesce(local_score, 0) * 0.10;
  
  -- Ensure result is between 0 and 100
  return greatest(0, least(100, round(result * 100) / 100));
end;
$$;

comment on function kit.calculate_clinic_ai_score is 'Calculates ClinicAI Score from component scores using weighted formula';

grant execute on function kit.calculate_clinic_ai_score(double precision, double precision, double precision, double precision, double precision) to authenticated;

/*
 * -------------------------------------------------------
 * Trigger: auto_calculate_clinic_ai_score
 * Automatically calculates clinic_ai_score when component scores are updated
 * -------------------------------------------------------
 */
create or replace function kit.auto_calculate_clinic_ai_score() returns trigger
language plpgsql
as $$
begin
  -- Only calculate if at least one component score is provided
  if new.visability_score is not null or 
     new.tech_score is not null or 
     new.content_score is not null or 
     new.eeat_score is not null or 
     new.local_score is not null then
    
    new.clinic_ai_score := kit.calculate_clinic_ai_score(
      new.visability_score,
      new.tech_score,
      new.content_score,
      new.eeat_score,
      new.local_score
    );
  end if;
  
  return new;
end;
$$;

-- Create trigger to auto-calculate clinic_ai_score
drop trigger if exists auto_calculate_clinic_ai_score on public.weekly_stats;
create trigger auto_calculate_clinic_ai_score
  before insert or update on public.weekly_stats
  for each row
  execute function kit.auto_calculate_clinic_ai_score();

