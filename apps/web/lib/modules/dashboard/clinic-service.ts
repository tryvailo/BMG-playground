/**
 * Clinic Service Helper
 * Fetches clinic/project data from Supabase for dashboard calculations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create clients
export function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

/**
 * Fetches dashboard data for a specific project from Supabase
 */
export async function getProjectDashboardData(projectId: string) {
  const supabase = getSupabaseServerClient();

  try {
    // Fetch latest weekly stats for the project
    const { data: weeklyStats, error: statsError } = await supabase
      .from('weekly_stats')
      .select('*')
      .eq('project_id', projectId)
      .order('week_start', { ascending: false })
      .limit(4); // Get last 4 weeks

    if (statsError) throw statsError;

    // Fetch services for the project
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (servicesError) throw servicesError;

    // Fetch tech audit data
    const { data: techAudit, error: techError } = await supabase
      .from('tech_audits')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (techError && techError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is OK
      throw techError;
    }

    return {
      weeklyStats: weeklyStats || [],
      services: services || [],
      techAudit: techAudit || null,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

/**
 * Fetches dashboard data for current user's project
 */
export async function getUserProjectDashboardData(userId: string) {
  const supabase = getSupabaseServerClient();

  try {
    // First get the user's project
    const { data: userProject, error: projectError } = await supabase
      .from('user_project')
      .select('project_id')
      .eq('user_id', userId)
      .single();

    if (projectError) {
      console.error('Error fetching user project:', projectError);
      return null;
    }

    if (!userProject) {
      return null;
    }

    // Then fetch dashboard data for that project
    return getProjectDashboardData(userProject.project_id);
  } catch (error) {
    console.error('Error in getUserProjectDashboardData:', error);
    throw error;
  }
}

/**
 * Fetches competitors data for a project
 */
export async function getProjectCompetitors(projectId: string) {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('services')
      .select('competitor_urls')
      .eq('project_id', projectId)
      .not('competitor_urls', 'is', null);

    if (error) throw error;

    // Extract unique competitor URLs
    const competitors = new Set<string>();
    data?.forEach((service) => {
      if (service.competitor_urls && Array.isArray(service.competitor_urls)) {
        service.competitor_urls.forEach((url: string) => competitors.add(url));
      }
    });

    return Array.from(competitors);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return [];
  }
}

/**
 * Calculates aggregated metrics from weekly stats
 */
export function aggregateWeeklyStats(
  weeklyStats: Array<{
    aiv_score?: number;
    clinic_ai_score?: number;
    visability_score?: number;
    avg_position?: number;
    tech_score?: number;
    content_score?: number;
    eeat_score?: number;
    local_score?: number;
    week_start: string;
    created_at?: string;
  }>
) {
  if (weeklyStats.length === 0) {
    return {
      currentWeek: null,
      previousWeek: null,
      history: [],
    };
  }

  const currentWeek = weeklyStats[0];
  const previousWeek = weeklyStats[1] || null;

  return {
    currentWeek,
    previousWeek,
    history: weeklyStats.reverse(), // Return in chronological order
  };
}

/**
 * Transforms database services to dashboard services
 */
/**
 * Get dashboard data for export
 */
export async function getDashboardData(projectId: string): Promise<{
  clinicName: string;
  clinicAIScore: number;
  visibility: number;
  techScore: number;
  contentScore: number;
  eeatScore: number;
  localScore: number;
  performanceScore: number;
  competitors: Array<{ name: string; score: number; position: number }>;
} | null> {
  const supabase = getSupabaseServerClient();

  try {
    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, domain')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return null;
    }

    // Fetch latest weekly stats
    const { data: weeklyStats } = await supabase
      .from('weekly_stats')
      .select('*')
      .eq('project_id', projectId)
      .order('week_start', { ascending: false })
      .limit(1)
      .single();

    // Fetch services for visibility calculation
    const { data: services } = await supabase
      .from('services')
      .select('visibility_score')
      .eq('project_id', projectId);

    const avgVisibility = services && services.length > 0
      ? services.reduce((sum, s) => sum + (s.visibility_score || 0), 0) / services.length
      : 0;

    return {
      clinicName: project?.name || 'Medical Clinic',
      clinicAIScore: weeklyStats?.clinic_ai_score || 0,
      visibility: weeklyStats?.visability_score || avgVisibility || 0,
      techScore: weeklyStats?.tech_score || 0,
      contentScore: weeklyStats?.content_score || 0,
      eeatScore: weeklyStats?.eeat_score || 0,
      localScore: weeklyStats?.local_score || 0,
      performanceScore: weeklyStats?.performance_score || 0,
      competitors: [], // Would be fetched from competitor analysis
    };
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    return null;
  }
}

/**
 * Transforms database services to dashboard services
 */
export function transformServices(
  dbServices: Array<{
    id: string;
    service_name: string;
    visibility_score?: number;
    position?: number;
    aiv_score?: number;
    competitor_urls?: string[];
  }>
) {
  return dbServices.map((service) => ({
    id: service.id,
    name: service.service_name,
    visibility: service.visibility_score || 0,
    avgPosition: service.position || 0,
    aivScore: service.aiv_score || 0,
    competitorUrls: service.competitor_urls || [],
  }));
}
