/*
 * -------------------------------------------------------
 * AI Visibility Platform Schema
 * Migration: Add tables for AI Visibility Platform for medical clinics
 * Tables: projects, services, scans, weekly_stats
 * All tables have RLS policies for multi-tenancy security
 * 
 * PREREQUISITE: This migration assumes that the `public.organizations` 
 * table exists. If it doesn't exist, you need to create it first or
 * modify the foreign key references to point to your existing table
 * (e.g., `public.accounts` if you're using Makerkit's accounts table).
 * 
 * IMPORTANT: You must customize the `kit.user_has_organization_access()`
 * function based on your actual organizations/memberships schema.
 * -------------------------------------------------------
 */

-- Create enum for AI engines
create type ai_engine_type as enum ('openai', 'perplexity', 'claude');

-- Helper function to check if user has access to an organization
-- This function checks if the authenticated user has access to the given organization
-- 
-- IMPORTANT: You need to customize this function based on your actual schema:
-- - If you have a memberships table: uncomment and adjust the memberships check
-- - If organizations.id directly references accounts.id: use the accounts check
-- - If you have a different structure: modify accordingly
create or replace function kit.user_has_organization_access(org_id uuid) returns boolean
language plpgsql
security definer
set search_path = '' as
$$
declare
  user_id uuid;
begin
  user_id := auth.uid();
  
  if user_id is null then
    return false;
  end if;
  
  -- Option 1: If organizations.id directly matches user's account id
  -- (for personal accounts where organization = account)
  if exists (
    select 1
    from public.accounts
    where id = user_id
      and id = org_id
  ) then
    return true;
  end if;
  
  -- Option 2: If you have a memberships/account_members table
  -- Uncomment and adjust based on your schema:
  -- if exists (
  --   select 1
  --   from public.memberships
  --   where user_id = user_id
  --     and organization_id = org_id
  --     and status = 'active' -- or whatever status indicates active membership
  -- ) then
  --   return true;
  -- end if;
  
  -- Option 3: If organizations table has a created_by or owner_id field
  -- Uncomment and adjust:
  -- if exists (
  --   select 1
  --   from public.organizations
  --   where id = org_id
  --     and (created_by = user_id or owner_id = user_id)
  -- ) then
  --   return true;
  -- end if;
  
  return false;
end;
$$;

-- Grant execute permission on the helper function
grant execute on function kit.user_has_organization_access(uuid) to authenticated;

/*
 * -------------------------------------------------------
 * Table: projects
 * Stores clinic projects with domain and settings
 * -------------------------------------------------------
 */
create table if not exists public.projects (
  id uuid not null default extensions.uuid_generate_v4(),
  organization_id uuid not null references public.accounts(id) on delete cascade,
  domain text not null,
  name text not null,
  settings jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

comment on table public.projects is 'Clinic projects for AI visibility tracking';
comment on column public.projects.organization_id is 'Foreign key to organizations table for multi-tenancy';
comment on column public.projects.domain is 'Domain name of the clinic (e.g., clinic.com)';
comment on column public.projects.name is 'Project name';
comment on column public.projects.settings is 'JSONB field for target countries, languages, and other settings';

-- Create index on organization_id for faster lookups
create index if not exists projects_organization_id_idx on public.projects(organization_id);
create index if not exists projects_domain_idx on public.projects(domain);

-- Enable RLS on projects
alter table public.projects enable row level security;

-- RLS Policies for projects
-- SELECT: Users can only see projects from their organization
create policy projects_select on public.projects
  for select
  to authenticated
  using (kit.user_has_organization_access(organization_id));

-- INSERT: Users can only create projects for their organization
create policy projects_insert on public.projects
  for insert
  to authenticated
  with check (kit.user_has_organization_access(organization_id));

-- UPDATE: Users can only update projects from their organization
create policy projects_update on public.projects
  for update
  to authenticated
  using (kit.user_has_organization_access(organization_id))
  with check (kit.user_has_organization_access(organization_id));

-- DELETE: Users can only delete projects from their organization
create policy projects_delete on public.projects
  for delete
  to authenticated
  using (kit.user_has_organization_access(organization_id));

-- Grant permissions
grant select, insert, update, delete on public.projects to authenticated;

/*
 * -------------------------------------------------------
 * Table: services
 * Stores medical services/keywords to track
 * -------------------------------------------------------
 */
create table if not exists public.services (
  id uuid not null default extensions.uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  search_query text not null,
  path text,
  location_city text,
  location_country text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

comment on table public.services is 'Medical services/keywords to track in AI responses';
comment on column public.services.project_id is 'Foreign key to projects table';
comment on column public.services.name is 'Service name (e.g., MRI Scan)';
comment on column public.services.search_query is 'The exact prompt user would ask AI';
comment on column public.services.path is 'Specific URL path for this service (optional)';
comment on column public.services.location_city is 'City location for the service';
comment on column public.services.location_country is 'Country location for the service';

-- Create index on project_id for faster lookups
create index if not exists services_project_id_idx on public.services(project_id);
create index if not exists services_search_query_idx on public.services(search_query);

-- Enable RLS on services
alter table public.services enable row level security;

-- RLS Policies for services
-- SELECT: Users can only see services from projects in their organization
create policy services_select on public.services
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = services.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- INSERT: Users can only create services for projects in their organization
create policy services_insert on public.services
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.projects
      where projects.id = services.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- UPDATE: Users can only update services from projects in their organization
create policy services_update on public.services
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = services.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.projects
      where projects.id = services.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- DELETE: Users can only delete services from projects in their organization
create policy services_delete on public.services
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = services.project_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- Grant permissions
grant select, insert, update, delete on public.services to authenticated;

/*
 * -------------------------------------------------------
 * Table: scans
 * Stores AI scan results for services
 * -------------------------------------------------------
 */
create table if not exists public.scans (
  id uuid not null default extensions.uuid_generate_v4(),
  service_id uuid not null references public.services(id) on delete cascade,
  ai_engine ai_engine_type not null,
  visible boolean not null default false,
  position integer,
  raw_response text,
  analyzed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

comment on table public.scans is 'AI scan results for services';
comment on column public.scans.service_id is 'Foreign key to services table';
comment on column public.scans.ai_engine is 'AI engine used (openai, perplexity, claude)';
comment on column public.scans.visible is 'Whether the service is visible in AI response';
comment on column public.scans.position is 'Position in AI response (nullable)';
comment on column public.scans.raw_response is 'Raw AI response text';
comment on column public.scans.analyzed_at is 'Timestamp when the scan was analyzed';

-- Create indexes for faster queries
create index if not exists scans_service_id_idx on public.scans(service_id);
create index if not exists scans_ai_engine_idx on public.scans(ai_engine);
create index if not exists scans_analyzed_at_idx on public.scans(analyzed_at);
create index if not exists scans_visible_idx on public.scans(visible);

-- Enable RLS on scans
alter table public.scans enable row level security;

-- RLS Policies for scans
-- SELECT: Users can only see scans from services in their organization
create policy scans_select on public.scans
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.services
      join public.projects on projects.id = services.project_id
      where services.id = scans.service_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- INSERT: Users can only create scans for services in their organization
create policy scans_insert on public.scans
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.services
      join public.projects on projects.id = services.project_id
      where services.id = scans.service_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- UPDATE: Users can only update scans from services in their organization
create policy scans_update on public.scans
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.services
      join public.projects on projects.id = services.project_id
      where services.id = scans.service_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.services
      join public.projects on projects.id = services.project_id
      where services.id = scans.service_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- DELETE: Users can only delete scans from services in their organization
create policy scans_delete on public.scans
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.services
      join public.projects on projects.id = services.project_id
      where services.id = scans.service_id
        and kit.user_has_organization_access(projects.organization_id)
    )
  );

-- Grant permissions
grant select, insert, update, delete on public.scans to authenticated;

/*
 * -------------------------------------------------------
 * Table: weekly_stats
 * Stores weekly aggregated statistics for trend charts
 * -------------------------------------------------------
 */
create table if not exists public.weekly_stats (
  id uuid not null default extensions.uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  week_start date not null,
  clinic_ai_score double precision,
  visability_score double precision,
  avg_position double precision,
  tech_score double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id),
  unique (project_id, week_start)
);

comment on table public.weekly_stats is 'Weekly aggregated statistics for trend charts';
comment on column public.weekly_stats.project_id is 'Foreign key to projects table';
comment on column public.weekly_stats.week_start is 'Start date of the week (Monday)';
comment on column public.weekly_stats.clinic_ai_score is 'Clinic AI visibility score';
comment on column public.weekly_stats.visability_score is 'Overall visibility score';
comment on column public.weekly_stats.avg_position is 'Average position in AI responses';
comment on column public.weekly_stats.tech_score is 'Technical SEO score';

-- Create indexes for faster queries
create index if not exists weekly_stats_project_id_idx on public.weekly_stats(project_id);
create index if not exists weekly_stats_week_start_idx on public.weekly_stats(week_start);
create index if not exists weekly_stats_project_week_idx on public.weekly_stats(project_id, week_start);

-- Enable RLS on weekly_stats
alter table public.weekly_stats enable row level security;

-- RLS Policies for weekly_stats
-- SELECT: Users can only see stats from projects in their organization
create policy weekly_stats_select on public.weekly_stats
  for select
  to authenticated
  using (kit.user_has_organization_access((select organization_id from public.projects where id = weekly_stats.project_id)));

-- INSERT: Users can only create stats for projects in their organization
create policy weekly_stats_insert on public.weekly_stats
  for insert
  to authenticated
  with check (kit.user_has_organization_access((select organization_id from public.projects where id = weekly_stats.project_id)));

-- UPDATE: Users can only update stats from projects in their organization
create policy weekly_stats_update on public.weekly_stats
  for update
  to authenticated
  using (kit.user_has_organization_access((select organization_id from public.projects where id = weekly_stats.project_id)))
  with check (kit.user_has_organization_access((select organization_id from public.projects where id = weekly_stats.project_id)));

-- DELETE: Users can only delete stats from projects in their organization
create policy weekly_stats_delete on public.weekly_stats
  for delete
  to authenticated
  using (kit.user_has_organization_access((select organization_id from public.projects where id = weekly_stats.project_id)));

-- Grant permissions
grant select, insert, update, delete on public.weekly_stats to authenticated;

-- Create trigger to update updated_at timestamp
create or replace function kit.update_updated_at_column() returns trigger
language plpgsql
set search_path = '' as
$$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Apply updated_at trigger to all tables
create trigger update_projects_updated_at
  before update on public.projects
  for each row
  execute function kit.update_updated_at_column();

create trigger update_services_updated_at
  before update on public.services
  for each row
  execute function kit.update_updated_at_column();

create trigger update_weekly_stats_updated_at
  before update on public.weekly_stats
  for each row
  execute function kit.update_updated_at_column();

