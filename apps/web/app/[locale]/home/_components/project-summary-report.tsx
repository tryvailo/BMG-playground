'use client';

import React, { useState } from 'react';
import { Skeleton } from '@kit/ui/skeleton';
import { AIVisibilityDashboard } from './ai-visibility-dashboard';
import { DashboardFilters } from './dashboard-filters';
import type { DashboardFilters as DashboardFiltersType } from '~/lib/actions/dashboard.types';

// Default date range: last 30 days
function getDefaultDateRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to };
}

export function ProjectSummaryReport() {
  // Use default project ID for the main dashboard
  // In the future, this could be selected from a list of projects
  const projectId = 'demo';

  // Initialize filters with default values
  const [filters, setFilters] = useState<DashboardFiltersType>(() => {
    const dateRange = getDefaultDateRange();
    return {
      dateRange,
      aiEngine: 'all',
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Project Summary Report
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Comprehensive analysis of your project's visibility and performance
        </p>
      </div>

      {/* Filters */}
      <DashboardFilters filters={filters} onFiltersChange={setFilters} />
      
      {/* Dashboard Content */}
      <AIVisibilityDashboard projectId={projectId} filters={filters} />
    </div>
  );
}

