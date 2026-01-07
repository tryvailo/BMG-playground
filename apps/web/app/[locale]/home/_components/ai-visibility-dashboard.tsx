'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardView, type DashboardData } from '~/components/dashboard/DashboardView';
import { useDashboardData } from './hooks/use-dashboard-data';
import { Button } from '@kit/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AIVisibilityDashboardProps {
  projectId?: string;
  filters?: Record<string, unknown>;
}

/**
 * Dashboard Component
 * 
 * Automatically loads dashboard data from the database when the component mounts.
 * Data is fetched from weekly_stats, scans, and related tables.
 * 
 * The dashboard displays:
 * - ClinicAI Score (calculated from Visibility, Tech, Content, E-E-A-T, Local)
 * - Service Visibility
 * - Average Position
 * - Trend chart (ClinicAI Score over time)
 * - Competitor analysis (scatter plot)
 */
export function AIVisibilityDashboard({ projectId, filters }: AIVisibilityDashboardProps = {}) {
  const router = useRouter();
  
  // Automatically load data from database using React Query
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData({
    projectId,
    filters,
  });

  // Check if error is authentication related
  const isAuthError = error instanceof Error && 
    (error.message.includes('Authentication') || 
     error.message.includes('NEXT_REDIRECT') ||
     error.message.includes('unauthorized'));

  // Debug logging
  React.useEffect(() => {
    if (dashboardData) {
      console.log('[Dashboard Component] Data loaded:', {
        avgAivScore: dashboardData.kpis.avgAivScore,
        serviceVisibility: dashboardData.kpis.serviceVisibility,
        historyCount: dashboardData.history.length,
        competitorsCount: dashboardData.competitors.length,
      });
    }
    if (error) {
      console.error('[Dashboard Component] Error:', error);
    }
    if (isLoading) {
      console.log('[Dashboard Component] Loading...');
    }
  }, [dashboardData, error, isLoading]);

  // Transform the data from the hook to match DashboardData format
  const transformedData: DashboardData | null = dashboardData
    ? {
      clinicName: dashboardData.clinicName,
      metrics: {
        clinicAiScore: {
          value: typeof dashboardData.kpis.avgAivScore === 'number'
            ? dashboardData.kpis.avgAivScore
            : Number(dashboardData.kpis.avgAivScore) || 0,
          trend: 0, // TODO: Calculate trend from previous period
        },
        serviceVisibility: {
          value: dashboardData.kpis.serviceVisibility,
          trend: 0, // TODO: Calculate trend from previous period
        },
        avgPosition: {
          value: dashboardData.kpis.avgPosition || 0,
          trend: 0, // TODO: Calculate trend from previous period
        },
        techOptimization: {
          value: dashboardData.kpis.techOptimization || 0,
          trend: 0, // TODO: Calculate trend from previous period
        },
        contentOptimization: {
          value: dashboardData.kpis.contentOptimization || 0,
          trend: 0, // TODO: Calculate trend from previous period
        },
        eeatSignal: {
          value: dashboardData.kpis.eeatSignal || 0,
          trend: 0, // TODO: Calculate trend from previous period
        },
        localSignal: {
          value: dashboardData.kpis.localSignal || 0,
          trend: 0, // TODO: Calculate trend from previous period
        },
      },
      trend: dashboardData.history.map((h) => ({
        date: h.date,
        score: h.score,
      })),
      competitors: dashboardData.competitors.map((c) => ({
        name: c.name,
        x: c.x,
        y: c.y,
        isCurrent: c.isCurrentProject,
        z: c.z,
      })),
    }
    : null;

  return (
    <div className="h-full min-h-full flex flex-col">
      {/* Dashboard View */}
      {isLoading ? (
        <DashboardView
          data={{
            metrics: {
              clinicAiScore: { value: 0, trend: 0 },
              serviceVisibility: { value: 0, trend: 0 },
              avgPosition: { value: 0, trend: 0 },
              techOptimization: { value: 0, trend: 0 },
              contentOptimization: { value: 0, trend: 0 },
              eeatSignal: { value: 0, trend: 0 },
              localSignal: { value: 0, trend: 0 },
            },
            trend: [],
            competitors: [],
          }}
          loading={true}
        />
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isAuthError ? 'Сесія закінчилась' : 'Не вдалося завантажити дані'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {isAuthError 
                ? 'Будь ласка, увійдіть знову для доступу до дашборду.'
                : error instanceof Error ? error.message : 'Невідома помилка'}
            </p>
            <div className="flex gap-3 justify-center">
              {isAuthError ? (
                <Button 
                  onClick={() => router.push('/auth/sign-in')}
                  variant="default"
                >
                  Увійти
                </Button>
              ) : (
                <Button 
                  onClick={() => refetch()}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Спробувати знову
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : transformedData ? (
        <DashboardView data={transformedData} loading={false} />
      ) : (
        <DashboardView
          data={{
            metrics: {
              clinicAiScore: { value: 0, trend: 0 },
              serviceVisibility: { value: 0, trend: 0 },
              avgPosition: { value: 0, trend: 0 },
              techOptimization: { value: 0, trend: 0 },
              contentOptimization: { value: 0, trend: 0 },
              eeatSignal: { value: 0, trend: 0 },
              localSignal: { value: 0, trend: 0 },
            },
            trend: [],
            competitors: [],
          }}
          loading={false}
        />
      )}
    </div>
  );
}

