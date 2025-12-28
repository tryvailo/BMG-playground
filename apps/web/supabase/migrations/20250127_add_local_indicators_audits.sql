/*
 * -------------------------------------------------------
 * Local Indicators Audit Schema
 * Migration: Add table for Local Indicators audit results
 * Table: local_indicators_audits
 * 
 * This migration creates a table to store Local Indicators audit results
 * for playground usage (no project_id required).
 * -------------------------------------------------------
 */

/*
 * -------------------------------------------------------
 * Table: local_indicators_audits
 * Stores Local Indicators audit results
 * -------------------------------------------------------
 */
create table if not exists public.local_indicators_audits (
  id uuid not null default extensions.uuid_generate_v4(),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Audit results (stored as JSONB for flexibility)
  audit_result jsonb not null,
  
  -- Metadata
  clinic_name text,
  city text,
  place_id text,
  
  primary key (id)
);

comment on table public.local_indicators_audits is 'Local Indicators audit results for playground';
comment on column public.local_indicators_audits.url is 'URL of the audited website';
comment on column public.local_indicators_audits.audit_result is 'Full LocalIndicatorsAuditResult JSON data';
comment on column public.local_indicators_audits.clinic_name is 'Clinic name used for the audit';
comment on column public.local_indicators_audits.city is 'City name used for the audit';
comment on column public.local_indicators_audits.place_id is 'Google Place ID if found';

-- Create indexes for faster queries
create index if not exists local_indicators_audits_url_idx on public.local_indicators_audits(url);
create index if not exists local_indicators_audits_created_at_idx on public.local_indicators_audits(created_at desc);

-- Enable RLS on local_indicators_audits
alter table public.local_indicators_audits enable row level security;

-- RLS Policies for local_indicators_audits
-- Since we're using admin client (service role), RLS is bypassed
-- But we still create policies for future use with authenticated users

-- SELECT: Allow all (for playground usage)
create policy local_indicators_audits_select on public.local_indicators_audits
  for select
  using (true);

-- INSERT: Allow all (for playground usage)
create policy local_indicators_audits_insert on public.local_indicators_audits
  for insert
  with check (true);

-- UPDATE: Allow all (for playground usage)
create policy local_indicators_audits_update on public.local_indicators_audits
  for update
  using (true)
  with check (true);

-- DELETE: Allow all (for playground usage)
create policy local_indicators_audits_delete on public.local_indicators_audits
  for delete
  using (true);

-- Grant permissions
-- Service role bypasses RLS, but we grant for completeness
grant select, insert, update, delete on public.local_indicators_audits to service_role;
grant select, insert, update, delete on public.local_indicators_audits to authenticated;
grant select, insert, update, delete on public.local_indicators_audits to anon;

