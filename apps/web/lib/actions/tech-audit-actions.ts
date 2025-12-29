'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { runFullTechAudit } from '~/lib/modules/audit/tech-audit-service';
import type { TechAudit } from '~/lib/modules/audit/tech-audit-service';

/*
 * -------------------------------------------------------
 * Server Action Schemas
 * -------------------------------------------------------
 */

const GetLatestProjectAuditSchema = z.object({
  projectId: z.string().uuid('Project ID must be a valid UUID'),
});

const TriggerTechAuditSchema = z.object({
  projectId: z.string().uuid('Project ID must be a valid UUID'),
});

/*
 * -------------------------------------------------------
 * Server Actions
 * -------------------------------------------------------
 */

/**
 * Get the most recent technical audit for a project
 * 
 * @param projectId - UUID of the project
 * @returns The latest TechAudit record or null if none exists
 */
export const getLatestProjectAudit = enhanceAction(
  async (params: z.infer<typeof GetLatestProjectAuditSchema>) => {
    const { projectId } = params;
    const supabase = getSupabaseServerClient();

    // Note: Using type assertion because tech_audits table is not in the generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('tech_audits')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch audit: ${error.message}`);
    }

    return (data as TechAudit | null) ?? null;
  },
  {
    schema: GetLatestProjectAuditSchema,
  },
);

/**
 * Trigger a technical audit for a project
 * 
 * This function:
 * 1. Checks if there's already a 'running' audit (prevents double-clicks)
 * 2. If not, starts the audit process asynchronously
 * 3. Revalidates the audit page path
 * 4. Returns immediately with success message
 * 
 * Note: The audit runs in the background and may take time (PageSpeed API calls).
 * The audit status will be updated in the database as it progresses.
 * 
 * @param projectId - UUID of the project to audit
 * @returns Success response with message
 */
export const triggerTechAudit = enhanceAction(
  async (params: z.infer<typeof TriggerTechAuditSchema>) => {
    const { projectId } = params;
    const supabase = getSupabaseServerClient();

    // Check if there's already a running audit for this project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: runningAudit, error: checkError } = await (supabase as any)
      .from('tech_audits')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('status', 'running')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Failed to check for running audit: ${checkError.message}`);
    }

    if (runningAudit) {
      return {
        success: false,
        message: 'An audit is already running for this project. Please wait for it to complete.',
      };
    }

    // Start the audit process asynchronously (fire and forget)
    // We don't await it to avoid timeout issues, but we handle errors
    runFullTechAudit(projectId)
      .then(() => {
        // Audit completed successfully
        console.log(`[TechAudit] Audit completed for project ${projectId}`);
      })
      .catch((error) => {
        // Audit failed - error is already handled in runFullTechAudit
        // (it updates the status to 'failed' in the database)
        console.error(`[TechAudit] Audit failed for project ${projectId}:`, error);
      });

    // Revalidate the audit page path
    // Note: Adjust the path pattern based on your actual route structure
    revalidatePath(`/dashboard/projects/${projectId}/audit`);
    revalidatePath(`/dashboard/projects/[projectId]/audit`, 'page');

    return {
      success: true,
      message: 'Audit started successfully. Results will be available shortly.',
    };
  },
  {
    schema: TriggerTechAuditSchema,
  },
);

