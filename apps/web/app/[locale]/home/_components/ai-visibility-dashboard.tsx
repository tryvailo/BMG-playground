'use client';

import React from 'react';
import { Skeleton } from '@kit/ui/skeleton';

import { useDashboardData } from './hooks/use-dashboard-data';
import type { DashboardFilters } from '~/lib/actions/dashboard.types';
import { DashboardView, type DashboardData } from '~/components/dashboard/DashboardView';

interface AIVisibilityDashboardProps {
  projectId?: string;
  filters?: DashboardFilters;
}

export function AIVisibilityDashboard({ projectId, filters }: AIVisibilityDashboardProps = {}) {
  const { data, isLoading, error } = useDashboardData({ projectId, filters });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-72 w-full" />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load dashboard data. Please try again later.
      </div>
    );
  }

  if (!data.kpis || !data.history || !data.competitors) {
    return (
      <div className="p-6 text-center text-red-600">
        Invalid dashboard data structure.
      </div>
    );
  }

  const { kpis, history, competitors } = data;

  // Transform data to DashboardView format
  const dashboardData: DashboardData = {
    kpi: {
      score: kpis.avgAivScore.value,
      visibility: kpis.serviceVisibility.value,
      avgPosition: kpis.avgPosition.value > 0 ? kpis.avgPosition.value : null,
      trackedServices: kpis.totalServices.value,
    },
    trend: history.map((h: { date: string; score: number }) => ({
      date: h.date,
      score: h.score,
    })),
    competitors: competitors.map((c: { name: string; x: number; y: number; z: number; isCurrentProject: boolean }) => ({
      name: c.name,
      x: c.x,
      y: c.y,
      isCurrent: c.isCurrentProject,
      z: c.z, // Size/Importance (number of appearances)
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back! Here's your AI visibility performance.</p>
      </div>

      <DashboardView data={dashboardData} />
    </div>
  );
}

