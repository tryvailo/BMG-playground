'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '~/lib/actions/dashboard';
import type { DashboardFilters } from '~/lib/actions/dashboard.types';

interface DashboardData {
  clinicName: string;
  kpis: {
    avgAivScore: number;
    serviceVisibility: number;
    avgPosition: number | null;
    totalServices: number;
    techOptimization?: number;
    contentOptimization?: number;
    eeatSignal?: number;
    localSignal?: number;
  };
  history: Array<{ date: string; score: number }>;
  competitors: Array<{
    name: string;
    x: number;
    y: number;
    z: number;
    isCurrentProject: boolean;
    visibility: number;
    position: number;
    trend: number;
  }>;
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
      try {
        // Fetch real data from server action
        const metrics = await getDashboardMetrics({
          projectId,
          filters,
        });

        if (!metrics) {
          throw new Error('No data returned from server');
        }

        // Transform history data for chart
        const history = metrics.history.map((h: { date: string; score: number }) => ({
          date: h.date,
          score: h.score,
        }));

        // Transform competitor data for scatter chart
        const competitors = metrics.competitors.map((c: { name: string; x: number; y: number; z: number; isCurrentProject: boolean; visibility: number; position: number; trend: number }) => ({
          name: c.name,
          x: c.x, // Average Position
          y: c.y, // ClinicAI Score
          z: c.z, // Size/Importance (number of appearances)
          isCurrentProject: c.isCurrentProject,
          visibility: c.visibility,
          position: c.position,
          trend: c.trend,
        }));

        return {
          clinicName: metrics.clinicName,
          kpis: {
            avgAivScore: metrics.kpis.avgAivScore,
            serviceVisibility: metrics.kpis.serviceVisibility,
            avgPosition: metrics.kpis.avgPosition,
            totalServices: metrics.kpis.totalServices,
            techOptimization: metrics.kpis.techOptimization,
            contentOptimization: metrics.kpis.contentOptimization,
            eeatSignal: metrics.kpis.eeatSignal,
            localSignal: metrics.kpis.localSignal,
          },
          history,
          competitors,
        };
      } catch (error) {
        console.error('[useDashboardData] Error fetching dashboard data:', error);
        // If it's a redirect error (user not authenticated), throw a specific error
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
          throw new Error('Authentication required');
        }
        throw error;
      }
    },
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: !!projectId,
  });
}

