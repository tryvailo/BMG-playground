/*
 * -------------------------------------------------------
 * Migration: Add extended audit fields to playground_tech_audits
 * 
 * Adds columns for storing duplicate analysis and noindex analysis
 * results together with the main audit.
 * -------------------------------------------------------
 */

-- Add duplicate_result column for storing DuplicateAnalysisResult
alter table public.playground_tech_audits
add column if not exists duplicate_result jsonb;

comment on column public.playground_tech_audits.duplicate_result is 'Duplicate content analysis result (DuplicateAnalysisResult)';

-- Add noindex_result column for storing NoindexAnalysisResult
alter table public.playground_tech_audits
add column if not exists noindex_result jsonb;

comment on column public.playground_tech_audits.noindex_result is 'Noindex pages analysis result (NoindexAnalysisResult)';

-- Add ai_analysis column for storing TechAuditAnalysis
alter table public.playground_tech_audits
add column if not exists ai_analysis jsonb;

comment on column public.playground_tech_audits.ai_analysis is 'AI-powered technical audit analysis (TechAuditAnalysis)';
