'use client';

import React from 'react';
import { useRouter } from '~/lib/navigation';
import { LayoutDashboard, Eye, Search, Activity, FileText, BarChart3, Play } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@kit/ui/tabs';

import { AIVisibilityDashboard } from './ai-visibility-dashboard';
import { VisibilityMonitor } from './visibility-monitor';
import { KeywordExplorer } from './keyword-explorer';
import { TechAudit } from './tech-audit';
import { Reports } from './reports';
import { ProjectSummaryReport } from './project-summary-report';

export function DashboardTabs() {
  const router = useRouter();

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-7 mb-6 bg-slate-100 p-1 rounded-lg">
        <TabsTrigger 
          value="dashboard" 
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <LayoutDashboard size={18} />
          <span className="hidden sm:inline">Dashboard</span>
        </TabsTrigger>
        <TabsTrigger 
          value="monitor"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <Eye size={18} />
          <span className="hidden sm:inline">Monitor</span>
        </TabsTrigger>
        <TabsTrigger 
          value="explorer"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <Search size={18} />
          <span className="hidden sm:inline">Explorer</span>
        </TabsTrigger>
        <TabsTrigger 
          value="audit"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <Activity size={18} />
          <span className="hidden sm:inline">Audit</span>
        </TabsTrigger>
        <TabsTrigger 
          value="reports"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <FileText size={18} />
          <span className="hidden sm:inline">Reports</span>
        </TabsTrigger>
        <TabsTrigger 
          value="summary"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <BarChart3 size={18} />
          <span className="hidden sm:inline">Summary</span>
        </TabsTrigger>
        <button
          type="button"
          onClick={() => router.push('/dashboard/playground')}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-white hover:text-emerald-600 transition-colors"
        >
          <Play size={18} />
          <span className="hidden sm:inline">Playground</span>
        </button>
      </TabsList>

      <TabsContent value="dashboard" className="mt-0">
        <AIVisibilityDashboard />
      </TabsContent>

      <TabsContent value="monitor" className="mt-0">
        <VisibilityMonitor />
      </TabsContent>

      <TabsContent value="explorer" className="mt-0">
        <KeywordExplorer />
      </TabsContent>

      <TabsContent value="audit" className="mt-0">
        <TechAudit />
      </TabsContent>

      <TabsContent value="reports" className="mt-0">
        <Reports />
      </TabsContent>

      <TabsContent value="summary" className="mt-0">
        <ProjectSummaryReport />
      </TabsContent>
    </Tabs>
  );
}

