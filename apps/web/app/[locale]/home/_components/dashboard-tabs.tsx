'use client';

import React from 'react';
import { useRouter } from '~/lib/navigation';
import { LayoutDashboard, Search, FileText, Palette } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@kit/ui/tabs';

import { AIVisibilityDashboard } from './ai-visibility-dashboard';
import { KeywordExplorer } from './keyword-explorer';
import { Reports } from './reports';
import { DesignShowcase } from './design-showcase';

export function DashboardTabs() {
  return (
    <Tabs defaultValue="dashboard" className="w-full h-full min-h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted p-1 rounded-lg">
        <TabsTrigger 
          value="dashboard" 
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <LayoutDashboard size={18} />
          <span className="hidden sm:inline">Dashboard</span>
        </TabsTrigger>
        <TabsTrigger 
          value="explorer"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <Search size={18} />
          <span className="hidden sm:inline">Explorer</span>
        </TabsTrigger>
        <TabsTrigger 
          value="reports"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <FileText size={18} />
          <span className="hidden sm:inline">Reports</span>
        </TabsTrigger>
        <TabsTrigger 
          value="design"
          className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
        >
          <Palette size={18} />
          <span className="hidden sm:inline">Design</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="mt-0 flex-1 flex flex-col min-h-0">
        <AIVisibilityDashboard />
      </TabsContent>

      <TabsContent value="explorer" className="mt-0 flex-1 flex flex-col min-h-0">
        <KeywordExplorer />
      </TabsContent>

      <TabsContent value="reports" className="mt-0 flex-1 flex flex-col min-h-0">
        <Reports />
      </TabsContent>

      <TabsContent value="design" className="mt-0 flex-1 flex flex-col min-h-0">
        <DesignShowcase />
      </TabsContent>
    </Tabs>
  );
}

