/*
 * -------------------------------------------------------
 * Ukraine Cities Table
 * Migration: Add table for Ukrainian cities from medical centers data
 * Table: ukraine_cities
 * Date: 2025-01-28
 * 
 * This migration creates a table to store Ukrainian cities
 * extracted from the medical_centers_ukraine_200plus.xlsx file
 * -------------------------------------------------------
 */

/*
 * -------------------------------------------------------
 * Table: ukraine_cities
 * Stores cities in Ukraine for onboarding city selection
 * -------------------------------------------------------
 */
create table if not exists public.ukraine_cities (
  id uuid not null default extensions.uuid_generate_v4(),
  name text not null,
  country_code text not null default 'UA',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id),
  unique (name, country_code)
);

comment on table public.ukraine_cities is 'Ukrainian cities for onboarding city selection';
comment on column public.ukraine_cities.name is 'City name';
comment on column public.ukraine_cities.country_code is 'ISO country code (UA for Ukraine)';
comment on column public.ukraine_cities.created_at is 'Timestamp when the city was added';

-- Create index for faster lookups
create index if not exists ukraine_cities_country_code_idx on public.ukraine_cities(country_code);
create index if not exists ukraine_cities_name_idx on public.ukraine_cities(name);

-- Enable RLS on the table
alter table "public"."ukraine_cities"
    enable row level security;

-- Allow public read access to cities (needed for onboarding)
create policy ukraine_cities_read on public.ukraine_cities
    for select
    using (true);

