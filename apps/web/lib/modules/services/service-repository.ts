/**
 * Service Repository
 * Database access layer for services
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

/**
 * Service interface
 */
export interface Service {
  id: string;
  project_id: string;
  service_name: string;
  target_page: string;
  country?: string;
  city?: string;
  visibility_score?: number;
  position?: number;
  aiv_score?: number;
  competitor_urls?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Create service input
 */
export interface CreateServiceInput {
  projectId: string;
  serviceName: string;
  targetPage: string;
  country?: string;
  city?: string;
}

/**
 * Update service input
 */
export interface UpdateServiceInput {
  serviceName?: string;
  targetPage?: string;
  country?: string;
  city?: string;
  visibility_score?: number;
  position?: number;
  aiv_score?: number;
}

/**
 * Get all services for a project
 */
export async function getServicesByProjectId(projectId: string): Promise<Service[]> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Services] Error fetching services:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[Services] Exception in getServicesByProjectId:', error);
    return [];
  }
}

/**
 * Get single service by ID
 */
export async function getServiceById(serviceId: string): Promise<Service | null> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[Services] Error fetching service:', error);
      throw error;
    }

    return data as Service;
  } catch (error) {
    console.error('[Services] Exception in getServiceById:', error);
    return null;
  }
}

/**
 * Create new service
 */
export async function createService(input: CreateServiceInput): Promise<Service | null> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('services')
      .insert({
        project_id: input.projectId,
        service_name: input.serviceName,
        target_page: input.targetPage,
        country: input.country || null,
        city: input.city || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Services] Error creating service:', error);
      throw error;
    }

    console.log('[Services] ✅ Service created:', data.id);
    return data as Service;
  } catch (error) {
    console.error('[Services] Exception in createService:', error);
    return null;
  }
}

/**
 * Update service
 */
export async function updateService(
  serviceId: string,
  input: UpdateServiceInput,
): Promise<Service | null> {
  const supabase = getSupabaseClient();

  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.serviceName !== undefined) updateData.service_name = input.serviceName;
    if (input.targetPage !== undefined) updateData.target_page = input.targetPage;
    if (input.country !== undefined) updateData.country = input.country;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.visibility_score !== undefined) updateData.visibility_score = input.visibility_score;
    if (input.position !== undefined) updateData.position = input.position;
    if (input.aiv_score !== undefined) updateData.aiv_score = input.aiv_score;

    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      console.error('[Services] Error updating service:', error);
      throw error;
    }

    console.log('[Services] ✅ Service updated:', serviceId);
    return data as Service;
  } catch (error) {
    console.error('[Services] Exception in updateService:', error);
    return null;
  }
}

/**
 * Delete service
 */
export async function deleteService(serviceId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase.from('services').delete().eq('id', serviceId);

    if (error) {
      console.error('[Services] Error deleting service:', error);
      throw error;
    }

    console.log('[Services] ✅ Service deleted:', serviceId);
    return true;
  } catch (error) {
    console.error('[Services] Exception in deleteService:', error);
    return false;
  }
}

/**
 * Bulk update service scores
 */
export async function updateServiceScores(
  serviceId: string,
  scores: {
    visibility_score?: number;
    position?: number;
    aiv_score?: number;
  },
): Promise<Service | null> {
  return updateService(serviceId, scores);
}

/**
 * Get services with low visibility
 */
export async function getServicesWithLowVisibility(
  projectId: string,
  threshold: number = 50,
): Promise<Service[]> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('project_id', projectId)
      .lt('visibility_score', threshold)
      .order('visibility_score', { ascending: true });

    if (error) {
      console.error('[Services] Error fetching low visibility services:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[Services] Exception in getServicesWithLowVisibility:', error);
    return [];
  }
}

/**
 * Get services with high AIV score
 */
export async function getServicesWithHighAIVScore(
  projectId: string,
  threshold: number = 70,
): Promise<Service[]> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('project_id', projectId)
      .gte('aiv_score', threshold)
      .order('aiv_score', { ascending: false });

    if (error) {
      console.error('[Services] Error fetching high AIV score services:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[Services] Exception in getServicesWithHighAIVScore:', error);
    return [];
  }
}

/**
 * Calculate average visibility for project
 */
export async function getAverageVisibilityByProject(projectId: string): Promise<number> {
  const services = await getServicesByProjectId(projectId);

  if (services.length === 0) return 0;

  const total = services.reduce((sum, s) => sum + (s.visibility_score || 0), 0);
  return Math.round((total / services.length) * 100) / 100;
}

/**
 * Calculate average AIV score for project
 */
export async function getAverageAIVScoreByProject(projectId: string): Promise<number> {
  const services = await getServicesByProjectId(projectId);

  if (services.length === 0) return 0;

  const total = services.reduce((sum, s) => sum + (s.aiv_score || 0), 0);
  return Math.round((total / services.length) * 100) / 100;
}

/**
 * Count visible services
 */
export async function countVisibleServices(projectId: string): Promise<number> {
  const services = await getServicesByProjectId(projectId);
  return services.filter((s) => (s.visibility_score || 0) > 0).length;
}
