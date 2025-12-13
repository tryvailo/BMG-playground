/*
 * -------------------------------------------------------
 * Technical Optimization Module Schema
 * Migration: Add tables for Technical Optimization audits
 * Tables: tech_audits, pages_audit
 * All tables have RLS policies for multi-tenancy security
 * 
 * This migration creates tables to store technical audit results
 * for projects, including file checks, security, speed metrics,
 * and detailed page-level crawl data.
 * -------------------------------------------------------
 */

/*
 * -------------------------------------------------------
 * Table: tech_audits
 * Stores high-level technical audit results for a project run
 * -------------------------------------------------------
 */
create table if not exists public.tech_audits (
  id uuid not null default extensions.uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  
  -- File Checks
  llms_txt_present boolean,
  llms_txt_score integer check (llms_txt_score >= 0 and llms_txt_score <= 100),
  llms_txt_data jsonb default '{}'::jsonb not null,
  robots_txt_present boolean,
  robots_txt_valid boolean,
  sitemap_present boolean,
  
  -- Security & Tech
  https_enabled boolean,
  mobile_friendly boolean,
  
  -- Speed (Aggregated from Homepage)
  desktop_speed_score integer check (desktop_speed_score >= 0 and desktop_speed_score <= 100),
  mobile_speed_score integer check (mobile_speed_score >= 0 and mobile_speed_score <= 100),
  speed_metrics jsonb default '{}'::jsonb not null,
  
  -- Schema Overview
  schema_summary jsonb default '{}'::jsonb not null,
  
  primary key (id)
);

comment on table public.tech_audits is 'High-level technical audit results for projects';
comment on column public.tech_audits.project_id is 'Foreign key to projects table';
comment on column public.tech_audits.status is 'Audit status: running, completed, or failed';
comment on column public.tech_audits.llms_txt_data is 'Analysis details and recommendations for llms.txt file';
comment on column public.tech_audits.speed_metrics is 'Detailed Core Web Vitals: LCP, CLS, etc.';
comment on column public.tech_audits.schema_summary is 'Schema flags: { hasMedicalOrg: true, hasPhysician: false, ... }';

-- Create indexes for faster queries
create index if not exists tech_audits_project_id_idx on public.tech_audits(project_id);
create index if not exists tech_audits_created_at_idx on public.tech_audits(created_at);
create index if not exists tech_audits_status_idx on public.tech_audits(status);

-- Enable RLS on tech_audits
alter table public.tech_audits enable row level security;

-- RLS Policies for tech_audits
-- SELECT: Users can only see audits from projects in their organization
create policy tech_audits_select on public.tech_audits
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = tech_audits.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- INSERT: Users can only create audits for projects in their organization
create policy tech_audits_insert on public.tech_audits
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.projects
      where projects.id = tech_audits.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- UPDATE: Users can only update audits from projects in their organization
create policy tech_audits_update on public.tech_audits
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = tech_audits.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.projects
      where projects.id = tech_audits.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- DELETE: Users can only delete audits from projects in their organization
create policy tech_audits_delete on public.tech_audits
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = tech_audits.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- Grant permissions
grant select, insert, update, delete on public.tech_audits to authenticated;

/*
 * -------------------------------------------------------
 * Table: pages_audit
 * Stores detailed crawl data for individual pages within a specific audit run
 * -------------------------------------------------------
 */
create table if not exists public.pages_audit (
  id uuid not null default extensions.uuid_generate_v4(),
  audit_id uuid not null references public.tech_audits(id) on delete cascade,
  url text not null,
  status_code integer,
  
  -- Meta Tags
  title text,
  title_length integer,
  description text,
  description_length integer,
  canonical_url text,
  is_canonical_match boolean,
  h1 text,
  
  -- Indexing
  meta_robots text,
  is_indexed boolean,
  
  -- Content
  word_count integer,
  lang_attribute text,
  
  -- Issues
  is_duplicate boolean,
  issues jsonb default '[]'::jsonb not null,
  
  primary key (id)
);

comment on table public.pages_audit is 'Detailed page-level audit data for individual pages within an audit run';
comment on column public.pages_audit.audit_id is 'Foreign key to tech_audits table';
comment on column public.pages_audit.url is 'URL of the audited page';
comment on column public.pages_audit.status_code is 'HTTP status code (200, 404, 500, etc.)';
comment on column public.pages_audit.is_canonical_match is 'True if url equals canonical_url';
comment on column public.pages_audit.meta_robots is 'Meta robots tag value (e.g., "noindex, nofollow")';
comment on column public.pages_audit.issues is 'Array of issue strings (e.g., ["Title too long", "Missing Description", "Broken Link"])';

-- Create indexes for faster queries
create index if not exists pages_audit_audit_id_idx on public.pages_audit(audit_id);
create index if not exists pages_audit_url_idx on public.pages_audit(url);
create index if not exists pages_audit_status_code_idx on public.pages_audit(status_code);

-- Enable RLS on pages_audit
alter table public.pages_audit enable row level security;

-- RLS Policies for pages_audit
-- SELECT: Users can only see page audits from audits in their organization
create policy pages_audit_select on public.pages_audit
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tech_audits
      join public.projects on projects.id = tech_audits.project_id
      where tech_audits.id = pages_audit.audit_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- INSERT: Users can only create page audits for audits in their organization
create policy pages_audit_insert on public.pages_audit
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tech_audits
      join public.projects on projects.id = tech_audits.project_id
      where tech_audits.id = pages_audit.audit_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- UPDATE: Users can only update page audits from audits in their organization
create policy pages_audit_update on public.pages_audit
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.tech_audits
      join public.projects on projects.id = tech_audits.project_id
      where tech_audits.id = pages_audit.audit_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.tech_audits
      join public.projects on projects.id = tech_audits.project_id
      where tech_audits.id = pages_audit.audit_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- DELETE: Users can only delete page audits from audits in their organization
create policy pages_audit_delete on public.pages_audit
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.tech_audits
      join public.projects on projects.id = tech_audits.project_id
      where tech_audits.id = pages_audit.audit_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- Grant permissions
grant select, insert, update, delete on public.pages_audit to authenticated;

