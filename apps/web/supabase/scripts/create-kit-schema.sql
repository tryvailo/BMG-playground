/*
 * -------------------------------------------------------
 * Create kit schema if it doesn't exist
 * This is required for migrations that use kit.* functions
 * -------------------------------------------------------
 */

-- Create kit schema if it doesn't exist
create schema if not exists kit;

-- Grant usage on schema kit to authenticated and service_role
grant usage on schema kit to authenticated;
grant usage on schema kit to service_role;

-- Create unaccent extension in kit schema if it doesn't exist
create extension if not exists "unaccent" schema kit;

