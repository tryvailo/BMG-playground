'use server';

import { z } from 'zod';
import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { CreateServiceSchema, UpdateServiceSchema, type CreateServiceInput } from '~/lib/types/domain';

/*
 * -------------------------------------------------------
 * Server Action Schemas
 * -------------------------------------------------------
 */

const GetServicesSchema = z.object({
  projectId: z.string().uuid('Project ID must be a valid UUID'),
});

const CreateServiceActionSchema = CreateServiceSchema;

const UpdateServiceActionSchema = z.object({
  id: z.string().uuid('Service ID must be a valid UUID'),
  data: UpdateServiceSchema,
});

const DeleteServiceSchema = z.object({
  id: z.string().uuid('Service ID must be a valid UUID'),
});

const _CalculateAllServicesSchema = z.object({
  projectId: z.string().uuid('Project ID must be a valid UUID'),
  apiKeyOpenAI: z.string().min(1, 'OpenAI API key is required'),
  apiKeyPerplexity: z.string().min(1, 'Perplexity API key is required'),
});

/*
 * -------------------------------------------------------
 * Service Interface
 * -------------------------------------------------------
 */

export interface Service {
  id: string;
  project_id: string;
  name: string;
  search_query: string;
  path: string | null;
  location_city: string | null;
  location_country: string | null;
  created_at: string;
  updated_at: string;
}

/*
 * -------------------------------------------------------
 * Server Actions
 * -------------------------------------------------------
 */

/**
 * Get all services for a project
 */
export const getServices = enhanceAction(
  async (params: z.infer<typeof GetServicesSchema>) => {
    const { projectId } = params;
    const supabase = getSupabaseServerClient();

    // Note: Using type assertion because services table is not in the generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('services')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch services: ${error.message}`);
    }

    return data as Service[];
  },
  {
    schema: GetServicesSchema,
  },
);

/**
 * Create a new service
 */
export const createService = enhanceAction(
  async (params: CreateServiceInput) => {
    const supabase = getSupabaseServerClient();

    // Note: Using type assertion because services table is not in the generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('services')
      .insert({
        project_id: params.project_id,
        name: params.name,
        search_query: params.search_query,
        path: params.path || null,
        location_city: params.location_city || null,
        location_country: params.location_country || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create service: ${error.message}`);
    }

    return data as Service;
  },
  {
    schema: CreateServiceActionSchema,
  },
);

/**
 * Update a service
 */
export const updateService = enhanceAction(
  async (params: z.infer<typeof UpdateServiceActionSchema>) => {
    const { id, data } = params;
    const supabase = getSupabaseServerClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.search_query !== undefined) updateData.search_query = data.search_query;
    if (data.path !== undefined) updateData.path = data.path;
    if (data.location_city !== undefined) updateData.location_city = data.location_city;
    if (data.location_country !== undefined) updateData.location_country = data.location_country;

    // Note: Using type assertion because services table is not in the generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedService, error } = await (supabase as any)
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update service: ${error.message}`);
    }

    return updatedService as Service;
  },
  {
    schema: UpdateServiceActionSchema,
  },
);

/**
 * Delete a service
 */
export const deleteService = enhanceAction(
  async (params: z.infer<typeof DeleteServiceSchema>) => {
    const { id } = params;
    const supabase = getSupabaseServerClient();

    // Note: Using type assertion because services table is not in the generated Supabase types yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete service: ${error.message}`);
    }

    return { success: true };
  },
  {
    schema: DeleteServiceSchema,
  },
);

