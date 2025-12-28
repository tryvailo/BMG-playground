'use client';

import React from 'react';
import { DashboardView, type DashboardData } from '~/components/dashboard/DashboardView';
import { useDashboardData } from './hooks/use-dashboard-data';

interface AIVisibilityDashboardProps {
  projectId?: string;
  filters?: any;
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
  // Automatically load data from database using React Query
  const { data: dashboardData, isLoading, error } = useDashboardData({
    projectId,
    filters,
  });

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
        metrics: {
          clinicAiScore: {
            value: dashboardData.kpis.avgAivScore,
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
    <div className="space-y-6 h-full min-h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your AI visibility metrics and performance over time. Data is automatically loaded from your project scans and audits.
        </p>
      </div>

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
        <div className="flex items-center justify-center py-12 text-destructive">
          <div className="text-center">
            <p className="text-sm font-medium">Failed to load dashboard data</p>
            <p className="text-xs text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
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

