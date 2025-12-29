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
  aggregateCompetitorStats,
  type ClinicAIScoreInputs,
} from '~/lib/modules/analytics/calculator';

import {
  DashboardFiltersSchema,
  type DashboardFilters,
  type DashboardMetricsResponse,
  type HistoryDataPoint,
  type CompetitorDataPoint,
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
  async (params: GetDashboardMetricsParams, user) => {
    const { projectId, filters } = params;

    try {
      const supabase = getSupabaseServerClient();

      // Step 1: Fetch project to get domain
      // Note: Using 'as any' because projects table is not in the generated Supabase types yet
      
      let project: Project | null = null;
      let projectError: Error | null = null;
      
      // Always try to find user's project first if user is authenticated
      if (user?.sub) {
        console.log('[Dashboard] Looking for user project, user ID:', user.sub);
        
        // Try to find user's first project
        const { data: userProjects, error: userProjectsError } = await (supabase as unknown as { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { limit: (count: number) => Promise<{ data: unknown; error: unknown }> } } } } })
          .from('projects')
          .select('*')
          .eq('organization_id', user.sub)
          .limit(1);
        
        if (userProjectsError) {
          console.warn('[Dashboard] Error fetching user projects:', userProjectsError);
        }
        
        if (userProjects && userProjects.length > 0) {
          // Use user's project
          project = userProjects[0];
          if (project) {
            console.log('[Dashboard] ✅ Using user project:', project.id, project.domain);
          }
        } else {
          // User has no project - create one
          console.log('[Dashboard] ⚠️ User has no projects, creating one...');
          try {
            // Ensure account exists first
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: accountCheck } = await (supabase as any)
              .from('accounts')
              .select('id')
              .eq('id', user.sub)
              .single();
            
            if (!accountCheck) {
              console.log('[Dashboard] Account does not exist, creating...');
              // Account should be created by trigger, but if not, create it
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error: accountError } = await (supabase as any)
                .from('accounts')
                .insert({
                  id: user.sub,
                  name: user.email?.split('@')[0] || 'User',
                  email: user.email,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              
              if (accountError) {
                console.error('[Dashboard] Error creating account:', accountError);
              }
            }
            
            // Call the function to ensure user has a project
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: projectIdResult, error: rpcError } = await (supabase as any)
              .rpc('ensure_user_has_project', { account_id: user.sub });
            
            if (rpcError) {
              console.error('[Dashboard] Error calling ensure_user_has_project:', rpcError);
            } else {
              console.log('[Dashboard] ensure_user_has_project returned project_id:', projectIdResult);
            }
            
            // Try to fetch the project again
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: retryProject, error: retryError } = await (supabase as any)
              .from('projects')
              .select('*')
              .eq('organization_id', user.sub)
              .limit(1)
              .single();
            
            if (retryProject && !retryError) {
              project = retryProject;
              if (project) {
                console.log('[Dashboard] ✅ Found project after ensuring:', project.id, project.domain);
              }
            } else {
              console.error('[Dashboard] Still no project after ensuring:', retryError);
              // Fallback to demo project
              if (projectId === 'demo') {
                const { data: demoProject } = await (supabase as any)
                  .from('projects')
                  .select('*')
                  .eq('domain', 'demo-clinic.com')
                  .single();
                if (demoProject) {
                  project = demoProject;
                  console.log('[Dashboard] Using demo project as fallback');
                }
              }
            }
          } catch (error) {
            console.error('[Dashboard] Exception while ensuring project:', error);
            // Fallback to demo project
            if (projectId === 'demo') {
              const { data: demoProject } = await (supabase as any)
                .from('projects')
                .select('*')
                .eq('domain', 'demo-clinic.com')
                .single();
              if (demoProject) {
                project = demoProject;
                console.log('[Dashboard] Using demo project as fallback after error');
              }
            }
          }
        }
      } else if (projectId === 'demo') {
        // No user, use demo project
        const { data: demoProject } = await (supabase as any)
          .from('projects')
          .select('*')
          .eq('domain', 'demo-clinic.com')
          .single();
        if (demoProject) {
          project = demoProject;
          console.log('[Dashboard] No user context, using demo project');
        }
      } else {
        // Search by UUID
        const { data: foundProject, error: foundError } = await (supabase as any)
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        project = foundProject;
        projectError = foundError;
      }

      // If project still not found or error, return empty data instead of throwing
      if (projectError || !project) {
        console.warn('[Dashboard] ❌ Project not found:', projectId);
        console.warn('[Dashboard] Error:', projectError?.message);
        console.warn('[Dashboard] User:', user?.sub || 'no user');
        return {
          kpis: {
            avgAivScore: 0,
            serviceVisibility: 0,
            avgPosition: null,
            totalServices: 0,
            techOptimization: 0,
            contentOptimization: 0,
            eeatSignal: 0,
            localSignal: 0,
          },
          history: [],
          competitors: [],
        } satisfies DashboardMetricsResponse;
      }

      const projectData = project as Project;
      if (!projectData) {
        return {
          kpis: {
            avgAivScore: 0,
            serviceVisibility: 0,
            avgPosition: null,
            totalServices: 0,
            techOptimization: 0,
            contentOptimization: 0,
            eeatSignal: 0,
            localSignal: 0,
          },
          history: [],
          competitors: [],
        } satisfies DashboardMetricsResponse;
      }

      const actualProjectId = projectData.id; // Use the actual UUID from database

      console.log('[Dashboard] Fetching metrics for project:', projectId, '->', actualProjectId, 'domain:', projectData.domain);

      // Step 2: Fetch weekly stats FIRST (this is the primary data source for dashboard)
      // Note: Using 'as any' because weekly_stats table is not in the generated Supabase types yet
      let weeklyStatsQuery = (supabase as any)
        .from('weekly_stats')
        .select('*')
        .eq('project_id', actualProjectId)
        .order('week_start', { ascending: true });

      // Apply date range filter if provided
      if (filters.dateRange) {
        weeklyStatsQuery = weeklyStatsQuery
          .gte('week_start', filters.dateRange.from.toISOString().split('T')[0])
          .lte('week_start', filters.dateRange.to.toISOString().split('T')[0]);
      }

      const { data: weeklyStatsData, error: weeklyStatsError } = await weeklyStatsQuery;

      if (weeklyStatsError) {
        console.error('[Dashboard] ❌ Failed to fetch weekly stats:', weeklyStatsError);
        // Continue without weekly stats if error
      }

      const weeklyStats = (weeklyStatsData || []) as WeeklyStats[];
      
      if (weeklyStats.length === 0) {
        console.warn('[Dashboard] ⚠️ No weekly_stats found for project:', actualProjectId);
        console.warn('[Dashboard] Project domain:', projectData.domain);
        console.warn('[Dashboard] Project ID:', actualProjectId);
        console.warn('[Dashboard] User ID:', user?.sub || 'no user');
        
        // Try to create data if user exists
        if (user?.sub) {
          console.log('[Dashboard] Attempting to ensure project has data for user:', user.sub);
          try {
            const { data: ensureResult, error: ensureError } = await (supabase as any)
              .rpc('ensure_user_has_project', { account_id: user.sub });
            
            if (ensureError) {
              console.error('[Dashboard] Error ensuring project:', ensureError);
            } else {
              console.log('[Dashboard] ensure_user_has_project result:', ensureResult);
              
              // Fetch again
              const { data: retryStats } = await (supabase as any)
                .from('weekly_stats')
                .select('*')
                .eq('project_id', actualProjectId)
                .order('week_start', { ascending: true });
              
              if (retryStats && retryStats.length > 0) {
                weeklyStats.push(...(retryStats as WeeklyStats[]));
                console.log('[Dashboard] ✅ Found', weeklyStats.length, 'weekly_stats after ensuring');
              }
            }
          } catch (ensureErr) {
            console.error('[Dashboard] Exception ensuring project:', ensureErr);
          }
        }
      }

      console.log('[Dashboard] Found', weeklyStats.length, 'weekly_stats records for project', actualProjectId);
      
      // Debug: Log first and last record to verify data
      if (weeklyStats.length > 0) {
        const first = weeklyStats[0]!;
        const last = weeklyStats[weeklyStats.length - 1]!;
        console.log('[Dashboard] First record:', {
          week_start: first.week_start,
          visability_score: first.visability_score,
          tech_score: first.tech_score,
          content_score: first.content_score,
          eeat_score: first.eeat_score,
          local_score: first.local_score,
          clinic_ai_score: first.clinic_ai_score,
        });
        console.log('[Dashboard] Last record:', {
          week_start: last.week_start,
          visability_score: last.visability_score,
          tech_score: last.tech_score,
          content_score: last.content_score,
          eeat_score: last.eeat_score,
          local_score: last.local_score,
          clinic_ai_score: last.clinic_ai_score,
        });
      }

      // Step 3: Fetch scans for competitor analysis (optional - not required for basic dashboard)
      // Note: Using 'as any' because services table is not in the generated Supabase types yet
      const { data: servicesData, error: servicesError } = await (supabase as any)
        .from('services')
        .select('id')
        .eq('project_id', actualProjectId);

      const serviceIds = servicesError ? [] : (servicesData || []).map((s: { id: string }) => s.id);
      const scans: Scan[] = [];

      // Only fetch scans if we have services
      if (serviceIds.length > 0) {
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

        if (!scansError && scansData) {
          scans.push(...(scansData as Scan[]));
        }
      }

      // Step 4: Calculate KPIs from weekly_stats (primary source) or scans (fallback)
      let totalServices = 0;
      let serviceVisibility = 0;
      let avgPosition: number | null = null;

      // If we have weekly_stats, use them as primary source
      if (weeklyStats.length > 0) {
        const latestStats = weeklyStats[weeklyStats.length - 1]!;
        // Use values from weekly_stats - they should always be present
        serviceVisibility = latestStats.visability_score ?? 0;
        avgPosition = latestStats.avg_position ?? null;
        // For totalServices, try to get from scans, otherwise use a default
        totalServices = new Set(scans.map((s) => s.service_id)).size || serviceIds.length || 10; // Default to 10 if no services
      } else if (scans.length > 0) {
        // Fallback to scans if no weekly_stats
        const uniqueServiceIds = new Set(scans.map((s) => s.service_id));
        totalServices = uniqueServiceIds.size;
        const visibleServices = countVisibleServices(scans);
        serviceVisibility = calculateVisibilityRate(totalServices, visibleServices);
        avgPosition = calculateAveragePosition(scans);
      } else {
        // No data available
        totalServices = serviceIds.length;
        serviceVisibility = 0;
        avgPosition = null;
      }

      // Get latest weekly stats for all component scores
      // If we have weekly stats, use the latest values
      // Otherwise, calculate from available data
      let avgAivScore = 0;
      let techScore = 0;
      let contentScore = 0;
      let eeatScore = 0;
      let localScore = 0;

      if (weeklyStats.length > 0) {
        // Use the most recent weekly stats
        const latestStats = weeklyStats[weeklyStats.length - 1]!;
        
        console.log('[Dashboard] Using latest weekly_stats from', latestStats.week_start, {
          visibility: latestStats.visability_score,
          tech: latestStats.tech_score,
          content: latestStats.content_score,
          eeat: latestStats.eeat_score,
          local: latestStats.local_score,
          clinic_ai_score: latestStats.clinic_ai_score,
        });
        
        // Get component scores from weekly_stats (use stored values, they should be non-null)
        techScore = latestStats.tech_score ?? 0;
        contentScore = latestStats.content_score ?? 0;
        eeatScore = latestStats.eeat_score ?? 0;
        localScore = latestStats.local_score ?? 0;
        
        // Use visibility from weekly_stats (already set above, but ensure it's used)
        serviceVisibility = latestStats.visability_score ?? serviceVisibility;
        
        // Use avg_position from weekly_stats (already set above, but ensure it's used)
        avgPosition = latestStats.avg_position ?? avgPosition;
        
        // Calculate ClinicAI Score using the full formula
        // Formula: 0.25*Visibility + 0.2*Tech + 0.2*Content + 0.15*E-E-A-T + 0.1*Local
        // Use the stored clinic_ai_score if available (calculated by trigger), otherwise calculate
        if (latestStats.clinic_ai_score !== null && latestStats.clinic_ai_score > 0) {
          // Use the pre-calculated score from database (more reliable)
          avgAivScore = latestStats.clinic_ai_score;
          console.log('[Dashboard] Using stored clinic_ai_score from DB:', avgAivScore);
        } else {
          // Calculate if not stored (shouldn't happen if trigger works)
          const visibilityScore = latestStats.visability_score ?? serviceVisibility;
          
          const scoreInputs: ClinicAIScoreInputs = {
            visibility: visibilityScore,
            tech: techScore,
            content: contentScore,
            eeat: eeatScore,
            local: localScore,
          };
          
          avgAivScore = calculateClinicAIScore(scoreInputs);
          console.log('[Dashboard] Calculated ClinicAI Score:', avgAivScore, 'from inputs:', scoreInputs);
        }
        
      } else {
        // Calculate from scans if no weekly stats available
        // For now, use a simplified calculation based on visibility rate and position
        const visibilityScore = serviceVisibility;
        const positionScore = avgPosition ? Math.max(0, 100 - avgPosition * 10) : 0;
        avgAivScore = visibilityScore * 0.6 + positionScore * 0.4;
        
        // Component scores default to 0 if no weekly stats
        techScore = 0;
        contentScore = 0;
        eeatScore = 0;
        localScore = 0;
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
      let competitorPoints = aggregateCompetitorStats(scans, projectData.domain || '');

      // If no competitors from scans, generate mock competitors based on weekly_stats
      if (competitorPoints.length === 0 && weeklyStats.length > 0) {
        console.log('[Dashboard] No competitors from scans, generating mock competitors based on weekly_stats');
        
        const latestStats = weeklyStats[weeklyStats.length - 1]!;
        const currentScore = latestStats.clinic_ai_score || avgAivScore;
        const currentPosition = latestStats.avg_position || avgPosition || 5.0;
        
        // Generate 8 mock competitors with varying scores and positions
        const mockCompetitors = [
          { name: 'competitor-1.com', score: currentScore + 5, position: currentPosition - 1.5, mentions: 45 },
          { name: 'competitor-2.com', score: currentScore + 2, position: currentPosition - 0.8, mentions: 38 },
          { name: 'competitor-3.com', score: currentScore - 3, position: currentPosition + 1.2, mentions: 32 },
          { name: 'competitor-4.com', score: currentScore - 8, position: currentPosition + 2.5, mentions: 28 },
          { name: 'competitor-5.com', score: currentScore + 8, position: currentPosition - 2.0, mentions: 42 },
          { name: 'competitor-6.com', score: currentScore - 5, position: currentPosition + 1.8, mentions: 25 },
          { name: 'competitor-7.com', score: currentScore + 3, position: currentPosition - 1.0, mentions: 35 },
          { name: 'competitor-8.com', score: currentScore - 2, position: currentPosition + 0.5, mentions: 30 },
        ];
        
        competitorPoints = mockCompetitors.map((comp) => ({
          domain: comp.name,
          avgPosition: Math.max(1, Math.min(10, comp.position)),
          aiScore: Math.max(0, Math.min(100, comp.score)),
          isClient: false,
          mentions: comp.mentions,
        }));
        
        // Add current project as a competitor point
        competitorPoints.push({
          domain: projectData.domain || 'current-project.com',
          avgPosition: currentPosition,
          aiScore: currentScore,
          isClient: true,
          mentions: 50,
        });
        
        // Sort by AI score (descending)
        competitorPoints.sort((a, b) => b.aiScore - a.aiScore);
      }

      // Transform to the required format
      const competitors: CompetitorDataPoint[] = competitorPoints.map((point) => ({
        name: point.domain,
        x: point.avgPosition || 0,
        y: point.aiScore,
        z: point.mentions || 0,
        isCurrentProject: point.isClient,
      }));

      // Step 7: Build response
      // Ensure all values are non-zero if we have weekly stats
      if (weeklyStats.length > 0) {
        // Validate that we have non-zero values
        if (avgAivScore === 0 || serviceVisibility === 0 || techScore === 0 || 
            contentScore === 0 || eeatScore === 0 || localScore === 0) {
          console.warn('[Dashboard] ⚠️ WARNING: Some values are zero despite having weekly_stats!', {
            avgAivScore,
            serviceVisibility,
            techScore,
            contentScore,
            eeatScore,
            localScore,
            latestStats: weeklyStats[weeklyStats.length - 1],
          });
        }
      }
      
      console.log('[Dashboard] Building response:', {
        avgAivScore,
        serviceVisibility,
        avgPosition,
        techScore,
        contentScore,
        eeatScore,
        localScore,
        historyCount: history.length,
        competitorsCount: competitors.length,
      });

      const response: DashboardMetricsResponse = {
        kpis: {
          avgAivScore: Math.round(avgAivScore * 10) / 10,
          serviceVisibility: Math.round(serviceVisibility * 10) / 10,
          avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
          totalServices,
          techOptimization: Math.round(techScore * 10) / 10,
          contentOptimization: Math.round(contentScore * 10) / 10,
          eeatSignal: Math.round(eeatScore * 10) / 10,
          localSignal: Math.round(localScore * 10) / 10,
        },
        history,
        competitors,
      };

      console.log('[Dashboard] ✅ Response built successfully:', {
        avgAivScore: response.kpis.avgAivScore,
        serviceVisibility: response.kpis.serviceVisibility,
        techOptimization: response.kpis.techOptimization,
        contentOptimization: response.kpis.contentOptimization,
        eeatSignal: response.kpis.eeatSignal,
        localSignal: response.kpis.localSignal,
        historyCount: response.history.length,
      });
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
          techOptimization: 0,
          contentOptimization: 0,
          eeatSignal: 0,
          localSignal: 0,
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

