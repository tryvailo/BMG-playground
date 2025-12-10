'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '~/lib/actions/dashboard';
import type { DashboardMetricsResponse, DashboardFilters } from '~/lib/actions/dashboard.types';

import type { DashboardData as DashboardViewData } from '~/components/dashboard/DashboardView';

interface DashboardData {
  kpis: {
    avgAivScore: { value: number; change: number; isPositive: boolean };
    serviceVisibility: { value: number; change: number; isPositive: boolean };
    avgPosition: { value: number; change: number; isPositive: boolean };
    totalServices: { value: number; change: number; isPositive: boolean };
  };
  history: Array<{ date: string; score: number }>;
  competitors: Array<{ name: string; x: number; y: number; z: number; isCurrentProject: boolean }>;
}


interface UseDashboardDataParams {
  projectId?: string;
  filters?: DashboardFilters;
}

export function useDashboardData(params?: UseDashboardDataParams) {
  const projectId = params?.projectId || 'demo'; // Default to 'demo' for now
  const filters = params?.filters || {};

  return useQuery<DashboardData>({
    queryKey: ['dashboard', projectId, filters],
    queryFn: async () => {
      // Fetch real data from server action
      const metrics = await getDashboardMetrics({
        projectId,
        filters,
      });

      // Calculate trend data (comparing with previous period)
      // For now, we'll use mock trend data until we have historical comparison
      const previousPeriod = {
        avgAivScore: metrics.kpis.avgAivScore * 0.95, // Simulate 5% decrease
        serviceVisibility: metrics.kpis.serviceVisibility * 0.98,
        avgPosition: metrics.kpis.avgPosition ? metrics.kpis.avgPosition * 1.05 : null,
        totalServices: metrics.kpis.totalServices - 2,
      };

      // Transform history data for chart
      // Keep original date for proper formatting in chart
      const history = metrics.history.map((h: { date: string; score: number }) => ({
        date: h.date, // Keep ISO date string for formatting
        score: h.score,
      }));

      // Transform competitor data for scatter chart
      // Keep full structure with x, y, z, isCurrentProject
      const competitors = metrics.competitors.map((c: { name: string; x: number; y: number; z: number; isCurrentProject: boolean }) => ({
        name: c.name,
        x: c.x, // Average Position
        y: c.y, // ClinicAI Score
        z: c.z, // Size/Importance (number of appearances)
        isCurrentProject: c.isCurrentProject,
      }));

      return {
        kpis: {
          avgAivScore: {
            value: metrics.kpis.avgAivScore,
            change: metrics.kpis.avgAivScore - previousPeriod.avgAivScore,
            isPositive: metrics.kpis.avgAivScore > previousPeriod.avgAivScore,
          },
          serviceVisibility: {
            value: metrics.kpis.serviceVisibility,
            change: metrics.kpis.serviceVisibility - previousPeriod.serviceVisibility,
            isPositive: metrics.kpis.serviceVisibility > previousPeriod.serviceVisibility,
          },
          avgPosition: {
            value: metrics.kpis.avgPosition || 0,
            change: metrics.kpis.avgPosition && previousPeriod.avgPosition
              ? metrics.kpis.avgPosition - previousPeriod.avgPosition
              : 0,
            // For position: lower is better, so negative change is positive
            isPositive: metrics.kpis.avgPosition && previousPeriod.avgPosition
              ? metrics.kpis.avgPosition < previousPeriod.avgPosition
              : false,
          },
          totalServices: {
            value: metrics.kpis.totalServices,
            change: metrics.kpis.totalServices - previousPeriod.totalServices,
            isPositive: metrics.kpis.totalServices > previousPeriod.totalServices,
          },
        },
        history,
        competitors,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!projectId,
  });
}

