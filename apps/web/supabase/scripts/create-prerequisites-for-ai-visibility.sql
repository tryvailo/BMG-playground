/*
 * -------------------------------------------------------
 * Prerequisites for 20251129_add_ai_visibility.sql
 * This script creates the minimal required schema and tables
 * needed before applying the AI Visibility migration
 * -------------------------------------------------------
 */

-- 1. Create kit schema if it doesn't exist
create schema if not exists kit;

-- Grant usage on kit schema to authenticated users
grant usage on schema kit to authenticated;
grant usage on schema kit to service_role;

-- 2. Create public.accounts table if it doesn't exist
-- This is the minimal structure needed for the AI Visibility migration
create table if not exists public.accounts (
    id uuid unique not null default extensions.uuid_generate_v4(),
    name varchar(255) not null,
    email varchar(320) unique,
    updated_at timestamp with time zone,
    created_at timestamp with time zone,
    created_by uuid references auth.users,
    updated_by uuid references auth.users,
    picture_url varchar(1000),
    public_data jsonb default '{}'::jsonb not null,
    primary key (id)
);

-- Enable RLS on accounts table
alter table public.accounts enable row level security;

-- Basic RLS policies for accounts (minimal for AI Visibility migration)
-- SELECT: Users can read their own accounts
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'accounts' 
        and policyname = 'accounts_read'
    ) then
        create policy accounts_read on public.accounts
            for select
            to authenticated
            using ((select auth.uid()) = id);
    end if;
end $$;

-- UPDATE: Users can update their own accounts
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'accounts' 
        and policyname = 'accounts_update'
    ) then
        create policy accounts_update on public.accounts
            for update
            to authenticated
            using ((select auth.uid()) = id)
            with check ((select auth.uid()) = id);
    end if;
end $$;

-- Grant basic permissions
grant select, insert, update on public.accounts to authenticated;

-- 3. Ensure uuid extension exists (required for uuid_generate_v4())
-- In Supabase, this is usually already set up, but we ensure it exists
-- The function extensions.uuid_generate_v4() should be available
-- If not, you may need to run: create extension if not exists "uuid-ossp" with schema extensions;

comment on table public.accounts is 'Accounts table - prerequisite for AI Visibility migration';

