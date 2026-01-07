/*
 * -------------------------------------------------------
 * Seed Dashboard Data for 2025
 * Migration: This migration is now a NO-OP
 * 
 * Demo data is now created automatically by the trigger
 * in 20251226_auto_create_user_project_trigger.sql
 * 
 * This file is kept for migration history compatibility.
 * -------------------------------------------------------
 */

-- NO-OP: Demo data is created automatically when accounts are created
-- See: 20251226_auto_create_user_project_trigger.sql

DO $$
BEGIN
  RAISE NOTICE 'Seed migration skipped - demo data is created automatically by account trigger';
END $$;
