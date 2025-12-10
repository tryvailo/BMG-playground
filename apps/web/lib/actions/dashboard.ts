'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { Scan, WeeklyStats, Project } from '~/lib/types/domain';
import {
  calculateClinicAIScore,
  calculateVisibilityRate,
  calculateAveragePosition,
  countVisibleServices,
  countTotalServices,
  aggregateCompetitorStats,
} from '~/lib/modules/analytics/calculator';

import {
  DashboardFiltersSchema,
  type DashboardFilters,
  type DashboardMetricsResponse,
} from './dashboard.types';

/*
 * -------------------------------------------------------
 * Server Action Schema
 * -------------------------------------------------------
 */

const GetDashboardMetricsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  filters: DashboardFiltersSchema.optional().default({}),
}) as z.ZodType<{
  projectId: string;
  filters: DashboardFilters;
}>;

type GetDashboardMetricsParams = z.infer<typeof GetDashboardMetricsSchema>;

/*
 * -------------------------------------------------------
 * Server Action Implementation
 * -------------------------------------------------------
 */

/**
 * Get Dashboard Metrics Server Action
 * 
 * Fetches data from scans and weekly_stats tables and calculates
 * metrics using the analytics calculator functions.
 * 
 * @param projectId - UUID of the project
 * @param filters - Optional filters for date range and AI engine
 * @returns Dashboard metrics including KPIs, history, and competitors
 */
export const getDashboardMetrics = enhanceAction(
  async (params: GetDashboardMetricsParams) => {
    const { projectId, filters } = params;

    try {
      const supabase = getSupabaseServerClient();

      // Step 1: Fetch project to get domain
      // Note: Using 'as any' because projects table is not in the generated Supabase types yet
      const { data: project, error: projectError } = await (supabase as any)
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      // If project not found or error, return empty data instead of throwing
      if (projectError || !project) {
        console.warn('[Dashboard] Project not found:', projectId, projectError?.message);
        return {
          kpis: {
            avgAivScore: 0,
            serviceVisibility: 0,
            avgPosition: null,
            totalServices: 0,
          },
          history: [],
          competitors: [],
        } satisfies DashboardMetricsResponse;
      }

      const projectData = project as Project;

      // Step 2: Build query for scans
      // First, get all services for this project
      // Note: Using 'as any' because services table is not in the generated Supabase types yet
      const { data: servicesData, error: servicesError } = await (supabase as any)
        .from('services')
        .select('id')
        .eq('project_id', projectId);

      if (servicesError) {
        console.error('[Dashboard] Failed to fetch services:', servicesError);
        throw new Error(`Failed to fetch services: ${servicesError.message}`);
      }

      const serviceIds = (servicesData || []).map((s: { id: string }) => s.id);

      if (serviceIds.length === 0) {
        // No services found, return empty data
        return {
          kpis: {
            avgAivScore: 0,
            serviceVisibility: 0,
            avgPosition: null,
            totalServices: 0,
          },
          history: [],
          competitors: [],
        } satisfies DashboardMetricsResponse;
      }

      // Now fetch scans for these services
      // Note: Using 'as any' because scans table is not in the generated Supabase types yet
      let scansQuery = (supabase as any)
        .from('scans')
        .select('*')
        .in('service_id', serviceIds);

      // Apply date range filter if provided
      if (filters.dateRange) {
        scansQuery = scansQuery
          .gte('analyzed_at', filters.dateRange.from.toISOString())
          .lte('analyzed_at', filters.dateRange.to.toISOString());
      }

      // Apply AI engine filter if not 'all'
      if (filters.aiEngine && filters.aiEngine !== 'all') {
        scansQuery = scansQuery.eq('ai_engine', filters.aiEngine);
      }

      const { data: scansData, error: scansError } = await scansQuery;

      if (scansError) {
        console.error('[Dashboard] Failed to fetch scans:', scansError);
        throw new Error(`Failed to fetch scans: ${scansError.message}`);
      }

      const scans = (scansData || []) as Scan[];

      // Step 3: Fetch weekly stats for history chart
      // Note: Using 'as any' because weekly_stats table is not in the generated Supabase types yet
      let weeklyStatsQuery = (supabase as any)
        .from('weekly_stats')
        .select('*')
        .eq('project_id', projectId)
        .order('week_start', { ascending: true });

      // Apply date range filter if provided
      if (filters.dateRange) {
        weeklyStatsQuery = weeklyStatsQuery
          .gte('week_start', filters.dateRange.from.toISOString().split('T')[0])
          .lte('week_start', filters.dateRange.to.toISOString().split('T')[0]);
      }

      const { data: weeklyStatsData, error: weeklyStatsError } = await weeklyStatsQuery;

      if (weeklyStatsError) {
        console.error('[Dashboard] Failed to fetch weekly stats:', weeklyStatsError);
        // Continue without weekly stats if error
      }

      const weeklyStats = (weeklyStatsData || []) as WeeklyStats[];

      // Step 4: Calculate KPIs
      // Get unique service IDs from scans
      const uniqueServiceIds = new Set(scans.map((s) => s.service_id));
      const totalServices = uniqueServiceIds.size;

      // Count visible services
      const visibleServices = countVisibleServices(scans);

      // Calculate visibility rate
      const serviceVisibility = calculateVisibilityRate(totalServices, visibleServices);

      // Calculate average position
      const avgPosition = calculateAveragePosition(scans);

      // Get latest weekly stats for ClinicAI Score
      // If we have weekly stats, use the latest clinic_ai_score
      // Otherwise, calculate from scans
      let avgAivScore = 0;

      if (weeklyStats.length > 0) {
        // Use the most recent weekly stats
        const latestStats = weeklyStats[weeklyStats.length - 1]!;
        avgAivScore = latestStats.clinic_ai_score || 0;
      } else {
        // Calculate from scans if no weekly stats available
        // For now, use a simplified calculation based on visibility rate and position
        const visibilityScore = serviceVisibility;
        const positionScore = avgPosition ? Math.max(0, 100 - avgPosition * 10) : 0;
        avgAivScore = visibilityScore * 0.6 + positionScore * 0.4;
      }

      // Step 5: Build history data from weekly stats
      const history: HistoryDataPoint[] = weeklyStats.map((stat) => ({
        date: stat.week_start,
        score: stat.clinic_ai_score || 0,
      }));

      // If no weekly stats, create empty history or use scans data
      if (history.length === 0 && scans.length > 0) {
        // Group scans by week and calculate scores
        const scansByWeek = new Map<string, Scan[]>();

        for (const scan of scans) {
          const scanDate = new Date(scan.analyzed_at);
          const weekStart = getWeekStart(scanDate);
          const weekKey = weekStart.toISOString().split('T')[0] || '';

          if (weekKey && !scansByWeek.has(weekKey)) {
            scansByWeek.set(weekKey, []);
          }
          if (weekKey) {
            scansByWeek.get(weekKey)!.push(scan);
          }
        }

        // Calculate score for each week
        for (const [weekKey, weekScans] of scansByWeek.entries()) {
          const weekTotalServices = new Set(weekScans.map((s) => s.service_id)).size;
          const weekVisibleServices = countVisibleServices(weekScans);
          const weekVisibilityRate = calculateVisibilityRate(weekTotalServices, weekVisibleServices);
          const weekAvgPosition = calculateAveragePosition(weekScans);
          const weekPositionScore = weekAvgPosition ? Math.max(0, 100 - weekAvgPosition * 10) : 0;
          const weekScore = weekVisibilityRate * 0.6 + weekPositionScore * 0.4;

          history.push({
            date: weekKey,
            score: Math.round(weekScore * 10) / 10,
          });
        }

        // Sort by date
        history.sort((a, b) => a.date.localeCompare(b.date));
      }

      // Step 6: Calculate competitor data using aggregateCompetitorStats
      const competitorPoints = aggregateCompetitorStats(scans, projectData.domain || '');

      // Transform to the required format
      const competitors: CompetitorDataPoint[] = competitorPoints.map((point) => ({
        name: point.domain,
        x: point.avgPosition || 0,
        y: point.aiScore,
        z: point.mentions || 0,
        isCurrentProject: point.isClient,
      }));

      // Step 7: Build response
      const response: DashboardMetricsResponse = {
        kpis: {
          avgAivScore: Math.round(avgAivScore * 10) / 10,
          serviceVisibility: Math.round(serviceVisibility * 10) / 10,
          avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
          totalServices,
        },
        history,
        competitors,
      };

      return response;
    } catch (error) {
      console.error('[Dashboard] Error fetching dashboard metrics:', error);

      // Return empty/default data on error
      return {
        kpis: {
          avgAivScore: 0,
          serviceVisibility: 0,
          avgPosition: null,
          totalServices: 0,
        },
        history: [],
        competitors: [],
      } satisfies DashboardMetricsResponse;
    }
  },
  {
    schema: GetDashboardMetricsSchema,
    auth: true,
  },
);

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

