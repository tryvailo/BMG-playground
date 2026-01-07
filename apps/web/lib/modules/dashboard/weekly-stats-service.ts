/**
 * Weekly Stats Service
 * Saves and aggregates weekly metrics for dashboard
 */

import { createClient } from '@supabase/supabase-js';
import {
  getServicesByProjectId,
  getAverageVisibilityByProject,
  getAverageAIVScoreByProject,
  countVisibleServices,
} from '../services/service-repository';
import { calculateClinicAIScore } from './metrics-calculator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

/**
 * Weekly stats interface
 */
export interface WeeklyStats {
  id: string;
  project_id: string;
  week_start: string;
  clinic_ai_score?: number;
  visability_score?: number;
  avg_position?: number;
  aiv_score?: number;
  tech_score?: number;
  content_score?: number;
  eeat_score?: number;
  local_score?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Calculate week start date (Monday)
 */
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Calculate average position from services
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateAveragePosition(services: any[]): number {
  if (services.length === 0) return 0;

  const positions = services
    .filter((s) => s.position)
    .map((s) => s.position);

  if (positions.length === 0) return 0;

  const total = positions.reduce((sum, p) => sum + p, 0);
  return Math.round((total / positions.length) * 100) / 100;
}

/**
 * Calculate average AIV score from services
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _calculateAverageAIVScore(services: any[]): number {
  if (services.length === 0) return 0;

  const scores = services
    .filter((s) => s.aiv_score)
    .map((s) => s.aiv_score);

  if (scores.length === 0) return 0;

  const total = scores.reduce((sum, s) => sum + s, 0);
  return Math.round((total / scores.length) * 100) / 100;
}

/**
 * Save weekly stats for a project
 * 
 * Calculates current metrics and saves them to weekly_stats table
 * Called daily by cron job
 */
export async function saveWeeklyStats(projectId: string): Promise<WeeklyStats | null> {
  const supabase = getSupabaseClient();

  try {
    console.log('[WeeklyStats] Saving stats for project:', projectId);

    // Get current week
    const weekStart = getWeekStart();
    const weekStartISO = weekStart.toISOString().split('T')[0];

    // Check if already exists for this week
    const { data: existing, error: checkError } = await supabase
      .from('weekly_stats')
      .select('id')
      .eq('project_id', projectId)
      .eq('week_start', weekStartISO)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[WeeklyStats] Error checking existing stats:', checkError);
    }

    // Get services for project
    const services = await getServicesByProjectId(projectId);
    if (services.length === 0) {
      console.warn('[WeeklyStats] No services found for project:', projectId);
      return null;
    }

    // Calculate metrics
    const visibilityScore = await getAverageVisibilityByProject(projectId);
    const aivScore = await getAverageAIVScoreByProject(projectId);
    const avgPosition = calculateAveragePosition(services);
    const _visibleServicesCount = await countVisibleServices(projectId);

    // Component scores (would be calculated from detailed analysis)
    // For now, using defaults - these would be updated from tech audit, content analysis, etc.
    const techScore = 0; // Calculated from tech_audits
    const contentScore = 0; // Calculated from content analysis
    const eeatScore = 0; // Calculated from E-E-A-T signals
    const localScore = 0; // Calculated from local SEO

    // Calculate ClinicAI Score
    const clinicAIScoreResult = calculateClinicAIScore({
      visibility: visibilityScore,
      techOptimization: techScore,
      contentOptimization: contentScore,
      eeatSignals: eeatScore,
      localSignals: localScore,
    });

    const stats = {
      project_id: projectId,
      week_start: weekStartISO,
      clinic_ai_score: clinicAIScoreResult.score,
      visability_score: visibilityScore,
      avg_position: avgPosition,
      aiv_score: aivScore,
      tech_score: techScore,
      content_score: contentScore,
      eeat_score: eeatScore,
      local_score: localScore,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update or insert
    if (existing) {
      console.log('[WeeklyStats] Updating existing stats for week:', weekStartISO);
      const { data, error } = await supabase
        .from('weekly_stats')
        .update(stats)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[WeeklyStats] Error updating stats:', error);
        return null;
      }

      console.log('[WeeklyStats] ✅ Stats updated:', data?.id);
      return data as WeeklyStats;
    } else {
      console.log('[WeeklyStats] Creating new stats entry for week:', weekStartISO);
      const { data, error } = await supabase
        .from('weekly_stats')
        .insert(stats)
        .select()
        .single();

      if (error) {
        console.error('[WeeklyStats] Error creating stats:', error);
        return null;
      }

      console.log('[WeeklyStats] ✅ Stats created:', data?.id);
      return data as WeeklyStats;
    }
  } catch (error) {
    console.error('[WeeklyStats] Exception in saveWeeklyStats:', error);
    return null;
  }
}

/**
 * Save weekly stats for all projects
 * Used by cron job (runs bi-weekly - every 2 weeks on Monday)
 */
export async function saveWeeklyStatsForAllProjects(): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    console.log('[WeeklyStats] Fetching all projects...');

    // Get all projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1000);

    if (error) {
      console.error('[WeeklyStats] Error fetching projects:', error);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('[WeeklyStats] No projects found');
      return;
    }

    console.log('[WeeklyStats] Processing', projects.length, 'projects');

    // Save stats for each project
    let successCount = 0;
    let failureCount = 0;

    for (const project of projects) {
      const result = await saveWeeklyStats(project.id);
      if (result) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log('[WeeklyStats] ✅ Completed:', {
      success: successCount,
      failed: failureCount,
      total: projects.length,
    });
  } catch (error) {
    console.error('[WeeklyStats] Exception in saveWeeklyStatsForAllProjects:', error);
  }
}

/**
 * Get weekly stats history for a project
 */
export async function getWeeklyStatsHistory(
  projectId: string,
  weeks: number = 12,
): Promise<WeeklyStats[]> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('weekly_stats')
      .select('*')
      .eq('project_id', projectId)
      .order('week_start', { ascending: false })
      .limit(weeks);

    if (error) {
      console.error('[WeeklyStats] Error fetching history:', error);
      return [];
    }

    return (data || []) as WeeklyStats[];
  } catch (error) {
    console.error('[WeeklyStats] Exception in getWeeklyStatsHistory:', error);
    return [];
  }
}

/**
 * Calculate week-over-week change
 */
export function calculateWeekOverWeekChange(
  currentWeek: WeeklyStats,
  previousWeek: WeeklyStats | null,
): {
  clinicAIScoreChange: number;
  visibilityChange: number;
  positionChange: number;
} {
  return {
    clinicAIScoreChange: previousWeek
      ? (currentWeek.clinic_ai_score || 0) - (previousWeek.clinic_ai_score || 0)
      : 0,
    visibilityChange: previousWeek
      ? (currentWeek.visability_score || 0) - (previousWeek.visability_score || 0)
      : 0,
    positionChange: previousWeek
      ? (previousWeek.avg_position || 0) - (currentWeek.avg_position || 0)
      : 0,
  };
}

/**
 * Get trend for a metric
 */
export function calculateTrend(
  current: number,
  previous: number,
  isInverseMetric: boolean = false,
): {
  direction: 'up' | 'down' | 'stable';
  change: number;
  isPositive: boolean;
} {
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  let direction: 'up' | 'down' | 'stable';
  let isPositive: boolean;

  if (Math.abs(changePercent) < 1) {
    direction = 'stable';
    isPositive = true;
  } else if (change > 0) {
    direction = 'up';
    isPositive = !isInverseMetric; // For inverse metrics (position), up = bad
  } else {
    direction = 'down';
    isPositive = isInverseMetric; // For inverse metrics, down = good
  }

  return {
    direction,
    change: Math.round(changePercent * 100) / 100,
    isPositive,
  };
}
