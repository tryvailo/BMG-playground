/*
 * -------------------------------------------------------
 * Playground Audit Tables Schema
 * Migration: Add tables for playground audit results
 * Tables: playground_tech_audits, content_audits, eeat_audits
 * 
 * This migration creates tables to store audit results
 * for playground usage (no project_id required).
 * -------------------------------------------------------
 */

/*
 * -------------------------------------------------------
 * Table: playground_tech_audits
 * Stores Technical Audit results from playground
 * -------------------------------------------------------
 */
create table if not exists public.playground_tech_audits (
  id uuid not null default extensions.uuid_generate_v4(),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Audit results (stored as JSONB for flexibility)
  audit_result jsonb not null,
  
  -- Optional metadata
  domain text,
  
  primary key (id)
);

comment on table public.playground_tech_audits is 'Technical Audit results for playground';
comment on column public.playground_tech_audits.url is 'URL of the audited website';
comment on column public.playground_tech_audits.audit_result is 'Full EphemeralAuditResult JSON data';
comment on column public.playground_tech_audits.domain is 'Domain used for the audit';

-- Create indexes for faster queries
create index if not exists playground_tech_audits_url_idx on public.playground_tech_audits(url);
create index if not exists playground_tech_audits_created_at_idx on public.playground_tech_audits(created_at desc);

-- Enable RLS on playground_tech_audits
alter table public.playground_tech_audits enable row level security;

-- RLS Policies for playground_tech_audits
-- SELECT: Allow all (for playground usage)
create policy playground_tech_audits_select on public.playground_tech_audits
  for select
  using (true);

-- INSERT: Allow all (for playground usage)
create policy playground_tech_audits_insert on public.playground_tech_audits
  for insert
  with check (true);

-- UPDATE: Allow all (for playground usage)
create policy playground_tech_audits_update on public.playground_tech_audits
  for update
  using (true)
  with check (true);

-- DELETE: Allow all (for playground usage)
create policy playground_tech_audits_delete on public.playground_tech_audits
  for delete
  using (true);

-- Grant permissions
grant select, insert, update, delete on public.playground_tech_audits to service_role;
grant select, insert, update, delete on public.playground_tech_audits to authenticated;
grant select, insert, update, delete on public.playground_tech_audits to anon;

/*
 * -------------------------------------------------------
 * Table: content_audits
 * Stores Content Optimization audit results
 * -------------------------------------------------------
 */
create table if not exists public.content_audits (
  id uuid not null default extensions.uuid_generate_v4(),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Audit results (stored as JSONB for flexibility)
  audit_result jsonb not null,
  
  primary key (id)
);

comment on table public.content_audits is 'Content Optimization audit results for playground';
comment on column public.content_audits.url is 'URL of the audited website';
comment on column public.content_audits.audit_result is 'Full ContentAuditResult JSON data';

-- Create indexes for faster queries
create index if not exists content_audits_url_idx on public.content_audits(url);
create index if not exists content_audits_created_at_idx on public.content_audits(created_at desc);

-- Enable RLS on content_audits
alter table public.content_audits enable row level security;

-- RLS Policies for content_audits
-- SELECT: Allow all (for playground usage)
create policy content_audits_select on public.content_audits
  for select
  using (true);

-- INSERT: Allow all (for playground usage)
create policy content_audits_insert on public.content_audits
  for insert
  with check (true);

-- UPDATE: Allow all (for playground usage)
create policy content_audits_update on public.content_audits
  for update
  using (true)
  with check (true);

-- DELETE: Allow all (for playground usage)
create policy content_audits_delete on public.content_audits
  for delete
  using (true);

-- Grant permissions
grant select, insert, update, delete on public.content_audits to service_role;
grant select, insert, update, delete on public.content_audits to authenticated;
grant select, insert, update, delete on public.content_audits to anon;

/*
 * -------------------------------------------------------
 * Table: eeat_audits
 * Stores E-E-A-T Assessment audit results
 * -------------------------------------------------------
 */
create table if not exists public.eeat_audits (
  id uuid not null default extensions.uuid_generate_v4(),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Audit results (stored as JSONB for flexibility)
  audit_result jsonb not null,
  
  -- Optional metadata
  multi_page boolean default false,
  filter_type text,
  max_pages integer,
  
  primary key (id)
);

comment on table public.eeat_audits is 'E-E-A-T Assessment audit results for playground';
comment on column public.eeat_audits.url is 'URL of the audited website';
comment on column public.eeat_audits.audit_result is 'Full EEATAuditResult JSON data';
comment on column public.eeat_audits.multi_page is 'Whether multi-page analysis was used';
comment on column public.eeat_audits.filter_type is 'Filter type used for multi-page analysis';
comment on column public.eeat_audits.max_pages is 'Maximum pages analyzed';

-- Create indexes for faster queries
create index if not exists eeat_audits_url_idx on public.eeat_audits(url);
create index if not exists eeat_audits_created_at_idx on public.eeat_audits(created_at desc);

-- Enable RLS on eeat_audits
alter table public.eeat_audits enable row level security;

-- RLS Policies for eeat_audits
-- SELECT: Allow all (for playground usage)
create policy eeat_audits_select on public.eeat_audits
  for select
  using (true);

-- INSERT: Allow all (for playground usage)
create policy eeat_audits_insert on public.eeat_audits
  for insert
  with check (true);

-- UPDATE: Allow all (for playground usage)
create policy eeat_audits_update on public.eeat_audits
  for update
  using (true)
  with check (true);

-- DELETE: Allow all (for playground usage)
create policy eeat_audits_delete on public.eeat_audits
  for delete
  using (true);

-- Grant permissions
grant select, insert, update, delete on public.eeat_audits to service_role;
grant select, insert, update, delete on public.eeat_audits to authenticated;
grant select, insert, update, delete on public.eeat_audits to anon;



