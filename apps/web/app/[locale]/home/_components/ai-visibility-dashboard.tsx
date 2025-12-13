'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, Circle, Play } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { DashboardView, type DashboardData } from '~/components/dashboard/DashboardView';
import { runLiveDashboardTest } from '~/lib/actions/playground-test';

/**
 * LocalStorage Keys - Using global configuration keys
 */
const STORAGE_KEYS = {
  API_KEY_OPENAI: 'configuration_api_key_openai',
  API_KEY_PERPLEXITY: 'configuration_api_key_perplexity',
  API_KEY_GOOGLE_PAGESPEED: 'configuration_api_key_google_pagespeed',
  API_KEY_FIRECRAWL: 'configuration_api_key_firecrawl',
  DOMAIN: 'configuration_domain',
  CITY: 'configuration_city',
  CLINIC_NAME: 'configuration_clinic_name',
} as const;

/**
 * Helper functions for localStorage
 */
const getStoredValue = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};


/**
 * Empty Dashboard Data
 */
const emptyDashboardData: DashboardData = {
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
};

interface AIVisibilityDashboardProps {
  projectId?: string;
  filters?: any;
}

export function AIVisibilityDashboard({ projectId, filters }: AIVisibilityDashboardProps = {}) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isPending, setIsPending] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGeneratePreview = async () => {
    setIsPending(true);
    setDashboardData(null);

    // Get configuration values from localStorage
    const apiKeyOpenAI = getStoredValue(STORAGE_KEYS.API_KEY_OPENAI);
    const apiKeyPerplexity = getStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY);
    const apiKeyGooglePageSpeed = getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED);
    const apiKeyFirecrawl = getStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL);
    const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
    const city = getStoredValue(STORAGE_KEYS.CITY);
    const clinicName = getStoredValue(STORAGE_KEYS.CLINIC_NAME);

    // Validate required configuration
    if (!apiKeyOpenAI || !apiKeyPerplexity) {
      toast.error('Please configure your API keys in the Configuration page first.');
      setIsPending(false);
      return;
    }

    if (!domain || !city) {
      toast.error('Please configure your domain and city in the Configuration page first.');
      setIsPending(false);
      return;
    }

    // Generate query from configuration fields
    // Use clinicName if available, otherwise use domain name
    const query = clinicName?.trim() || domain?.trim() || '';

    if (!query) {
      toast.error('Please configure your clinic name or domain in the Configuration page first.');
      setIsPending(false);
      return;
    }

    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const result = await runLiveDashboardTest({
        apiKeyOpenAI,
        apiKeyPerplexity,
        apiKeyGooglePageSpeed: apiKeyGooglePageSpeed || undefined,
        apiKeyFirecrawl: apiKeyFirecrawl || undefined,
        domain,
        query,
        city,
      });

      // Extract DashboardData (ignore serviceAnalysis as it's only for services section)
      const { serviceAnalysis: _, ...dashboard } = result;
      setDashboardData(dashboard);
      toast.success('Dashboard preview generated successfully!');
    } catch (error) {
      console.error('[Dashboard Preview] Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check for API key errors
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        toast.error('Invalid API keys. Please check your API keys.');
      } else {
        toast.error(`Failed to generate dashboard preview: ${errorMessage}`);
      }

      // Set empty data to show "Not Visible" state
      setDashboardData(emptyDashboardData);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6 h-full min-h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Preview</h1>
        <p className="text-muted-foreground">
          Test your AI visibility with a live query and see the dashboard preview. Configure your API keys and clinic information in the Configuration page.
        </p>
      </div>

      {/* Generate Button Card */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Preview</CardTitle>
          <CardDescription>
            Generate a dashboard preview using your configuration settings. All parameters are taken from the Configuration page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGeneratePreview}
            disabled={isPending}
            className="w-full lg:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Preview...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Dashboard Preview
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div ref={resultsRef} className="space-y-6">
        {dashboardData ? (
          <>
            {/* Simulation Banner */}
            <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
                  <Circle className="h-4 w-4 fill-current" />
                  <span>Simulated dashboard view based on your test query</span>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard View */}
            <DashboardView data={dashboardData} />
          </>
        ) : isPending ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
              <p className="text-sm">Generating dashboard preview...</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

