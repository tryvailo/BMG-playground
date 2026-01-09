'use server';

import { z } from 'zod';
import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * Schema for project settings
 */
const _ProjectSettingsSchema = z.object({
  id: z.string().optional(),
  domain: z.string().optional(),
  clinicName: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
});

export type ProjectSettings = z.infer<typeof _ProjectSettingsSchema>;

/**
 * Get current user's project settings
 * Note: This action handles auth internally to avoid redirect on unauthenticated requests
 */
export const getProjectSettings = enhanceAction(
  async (_params: Record<string, never>) => {
    try {
      const supabase = getSupabaseServerClient();

      // Get user manually to avoid redirect on unauthenticated
      let user;
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          console.log('[getProjectSettings] User not authenticated');
          return { success: true, data: null }; // Return success with null data instead of error
        }
        user = authUser;
      } catch (authErr) {
        console.log('[getProjectSettings] Auth check failed:', authErr);
        return { success: true, data: null }; // Return success with null data
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: project, error } = await (supabase as any)
        .from('projects')
        .select('id, domain, name, settings')
        .eq('organization_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[getProjectSettings] Database error:', error);
        // Don't throw - return null data instead
        return { success: true, data: null };
      }

      if (!project) {
        return { success: true, data: null };
      }

      const settings = project.settings || {};

      const result = {
        success: true,
        data: {
          id: project.id,
          domain: project.domain || '',
          clinicName: project.name || '',
          region: settings.region || 'UA',
          city: settings.city || '',
          language: settings.language || 'uk',
        } as ProjectSettings,
      };

      // Ensure result is serializable
      try {
        JSON.stringify(result);
      } catch (serializationError) {
        console.error('[getProjectSettings] Serialization error:', serializationError);
        return { success: true, data: null };
      }

      return result;
    } catch (error) {
      console.error('[getProjectSettings] Unexpected error:', error);
      // Always return a valid response, never throw
      return { success: true, data: null };
    }
  },
  {
    auth: false,
    schema: z.object({}),
  }
);

/**
 * Update current user's project settings
 */
const UpdateProjectSettingsSchema = z.object({
  domain: z.string().optional(),
  clinicName: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
});

export const updateProjectSettings = enhanceAction(
  async (params: ProjectSettings) => {
    try {
      const supabase = getSupabaseServerClient();

      // Get user manually to avoid redirect on unauthenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Get existing project
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingProject, error: fetchError } = await (supabase as any)
        .from('projects')
        .select('id, settings')
        .eq('organization_id', user.id)
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('[updateProjectSettings] Error fetching project:', fetchError);
        return { success: false, error: 'Failed to fetch project' };
      }

      if (!existingProject) {
        return { success: false, error: 'Project not found' };
      }

      // Clean domain if provided
      let cleanDomain = params.domain;
      if (cleanDomain) {
        cleanDomain = cleanDomain
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .toLowerCase()
          .trim();
      }

      // Merge new settings with existing
      const updatedSettings = {
        ...(existingProject.settings || {}),
        region: params.region || existingProject.settings?.region || 'US',
        city: params.city || existingProject.settings?.city || '',
        language: params.language || existingProject.settings?.language || 'en',
      };

      // Update project
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('projects')
        .update({
          domain: cleanDomain || existingProject.domain,
          name: params.clinicName || existingProject.name,
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProject.id);

      if (updateError) {
        console.error('[updateProjectSettings] Error updating project:', updateError);
        return { success: false, error: 'Failed to update project settings' };
      }

      return { success: true };
    } catch (error) {
      console.error('[updateProjectSettings] Unexpected error:', error);
      return { success: false, error: 'Internal server error' };
    }
  },
  {
    auth: false,
    schema: UpdateProjectSettingsSchema,
  }
);
