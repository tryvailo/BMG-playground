import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';

import { calculateClinicAIScore } from '~/lib/modules/dashboard/metrics-calculator';
import { getUserProjectDashboardData, aggregateWeeklyStats } from '~/lib/modules/dashboard/clinic-service';
import { generateMockHistory, MOCK_COMPETITORS, pieData } from '../../[locale]/home/_components/dashboard-data';

/**
 * GET /api/dashboard
 * Returns dashboard data including KPIs, history, competitors, etc.
 * 
 * Query params:
 * - projectId (optional): specific project ID, defaults to user's project
 */
export const GET = enhanceRouteHandler(
  async ({ user, request }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Get project query param or use user's default project
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get('projectId');

      // Fetch real dashboard data from Supabase
      let dashboardData = null;
      if (projectId) {
        const { getProjectDashboardData } = await import('~/lib/modules/dashboard/clinic-service');
        dashboardData = await getProjectDashboardData(projectId);
      } else {
        dashboardData = await getUserProjectDashboardData(user.id);
      }

      // If no data found, return fallback with mock data
      if (!dashboardData) {
        return NextResponse.json({
          kpis: {
            avgAivScore: { value: 0, change: 0, isPositive: false },
            visibleKeywords: { value: 0, change: 0, isPositive: false },
            avgPosition: { value: 0, change: 0, isPositive: false },
            competitorGap: { value: 0, change: 0, isPositive: false },
            clinicAIScore: { value: 0, change: 0, isPositive: false },
          },
          history: generateMockHistory(),
          competitors: MOCK_COMPETITORS,
          coverageType: pieData,
          message: 'No project data found',
        });
      }

      // Aggregate weekly stats
      const statsAggregation = aggregateWeeklyStats(dashboardData.weeklyStats);
      const currentWeekStats = statsAggregation.currentWeek;

      // Calculate metrics from current and previous week
      const metrics = {
        avgAIVScore: { value: 0, change: 0, isPositive: false },
        visibleKeywords: { value: 0, change: 0, isPositive: false },
        avgPosition: { value: 0, change: 0, isPositive: false },
        competitorGap: { value: 0, change: 0, isPositive: false },
        clinicAIScore: { value: 0, change: 0, isPositive: false },
      };

      // If we have weekly stats, use them
      if (currentWeekStats) {
        const previousWeekStats = statsAggregation.previousWeek;

        metrics.avgAIVScore = {
          value: currentWeekStats.aiv_score || 0,
          change: previousWeekStats
            ? Number((currentWeekStats.aiv_score || 0) - (previousWeekStats.aiv_score || 0))
            : 0,
          isPositive: !previousWeekStats || (currentWeekStats.aiv_score || 0) >= (previousWeekStats.aiv_score || 0),
        };

        metrics.visibleKeywords = {
          value: Math.round((currentWeekStats.visability_score || 0) * 10) / 10,
          change: previousWeekStats
            ? Math.round((currentWeekStats.visability_score || 0) - (previousWeekStats.visability_score || 0))
            : 0,
          isPositive: !previousWeekStats || (currentWeekStats.visability_score || 0) >= (previousWeekStats.visability_score || 0),
        };

        metrics.avgPosition = {
          value: currentWeekStats.avg_position || 0,
          change: previousWeekStats
            ? Math.round(((previousWeekStats.avg_position || 0) - (currentWeekStats.avg_position || 0)) * 100) / 100
            : 0,
          isPositive: !previousWeekStats || (currentWeekStats.avg_position || 0) <= (previousWeekStats.avg_position || 0),
        };

        // Calculate ClinicAI Score
        const clinicAIScore = calculateClinicAIScore({
          visibility: currentWeekStats.visability_score || 0,
          techOptimization: currentWeekStats.tech_score || 0,
          contentOptimization: currentWeekStats.content_score || 0,
          eeatSignals: currentWeekStats.eeat_score || 0,
          localSignals: currentWeekStats.local_score || 0,
        });

        metrics.clinicAIScore = {
          value: clinicAIScore.score,
          change: previousWeekStats && currentWeekStats.clinic_ai_score && previousWeekStats.clinic_ai_score
            ? Math.round((clinicAIScore.score - previousWeekStats.clinic_ai_score) * 100) / 100
            : 0,
          isPositive: !previousWeekStats || clinicAIScore.score >= (previousWeekStats.clinic_ai_score || 0),
        };

        // Competitor gap (simplified)
        metrics.competitorGap = {
          value: Math.max(0, 100 - metrics.avgAIVScore.value),
          change: 0,
          isPositive: true,
        };
      }

      // Prepare history for charting
      const chartHistory = statsAggregation.history.map((stat) => ({
        date: new Date(stat.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        aivScore: stat.aiv_score || 0,
        clinicScore: stat.clinic_ai_score || 0,
        visibility: stat.visability_score || 0,
        position: stat.avg_position || 0,
      }));

      const response = {
        kpis: {
          avgAivScore: metrics.avgAIVScore,
          visibleKeywords: metrics.visibleKeywords,
          avgPosition: metrics.avgPosition,
          competitorGap: metrics.competitorGap,
          clinicAIScore: metrics.clinicAIScore,
        },
        history: chartHistory.length > 0 ? chartHistory : generateMockHistory(),
        competitors: MOCK_COMPETITORS, // TODO: Fetch from services data
        coverageType: pieData, // TODO: Calculate from services
        lastUpdated: currentWeekStats?.created_at || new Date().toISOString(),
        projectId: projectId || 'default',
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Dashboard API error:', error);
      
      // Return fallback data on error
      return NextResponse.json({
        kpis: {
          avgAivScore: { value: 0, change: 0, isPositive: false },
          visibleKeywords: { value: 0, change: 0, isPositive: false },
          avgPosition: { value: 0, change: 0, isPositive: false },
          competitorGap: { value: 0, change: 0, isPositive: false },
          clinicAIScore: { value: 0, change: 0, isPositive: false },
        },
        history: generateMockHistory(),
        competitors: MOCK_COMPETITORS,
        coverageType: pieData,
        error: 'Failed to fetch dashboard data',
      });
    }
  },
  {
    auth: true,
  },
);

