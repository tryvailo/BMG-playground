'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Play, Circle, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { DashboardView, type DashboardData } from '~/components/dashboard/DashboardView';
import { ScanProgress } from '~/components/dashboard/playground/ScanProgress';
import { ServiceAnalysisDetail } from '~/components/dashboard/playground/ServiceAnalysisDetail';
import { DuplicateCheckSection } from '~/components/dashboard/playground/DuplicateCheckSection';
import { runLiveDashboardTest, type ServiceAnalysisData } from '~/lib/actions/playground-test';

/*
 * -------------------------------------------------------
 * Form Schema
 * -------------------------------------------------------
 */

// Schema will be created dynamically with translations
// Type will be inferred from the schema inside the component
type PlaygroundFormValues = {
  apiKeyOpenAI: string;
  apiKeyPerplexity: string;
  apiKeyGooglePageSpeed?: string;
  apiKeyFirecrawl?: string;
  domain: string;
  city: string;
  query: string;
};

/*
 * -------------------------------------------------------
 * Empty Dashboard Data
 * -------------------------------------------------------
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

/*
 * -------------------------------------------------------
 * Playground Page Component
 * -------------------------------------------------------
 */

// LocalStorage keys
const STORAGE_KEYS = {
  API_KEY_OPENAI: 'playground_api_key_openai',
  API_KEY_PERPLEXITY: 'playground_api_key_perplexity',
  API_KEY_GOOGLE_PAGESPEED: 'playground_api_key_google_pagespeed',
  API_KEY_FIRECRAWL: 'playground_api_key_firecrawl',
  DOMAIN: 'playground_domain',
  CITY: 'playground_city',
} as const;

// Helper functions for localStorage
const getStoredValue = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};

const setStoredValue = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore localStorage errors
  }
};

export default function PlaygroundPage() {
  const t = useTranslations('Playground');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [serviceAnalysis, setServiceAnalysis] = useState<ServiceAnalysisData | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [isPending, setIsPending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Create schema with translations using useMemo to avoid recreating on every render
  const PlaygroundFormSchema = useMemo(() => z.object({
    apiKeyOpenAI: z.string().min(1, t('validation.openAiApiKeyRequired')),
    apiKeyPerplexity: z.string().min(1, t('validation.perplexityApiKeyRequired')),
    apiKeyGooglePageSpeed: z.string().optional(),
    apiKeyFirecrawl: z.string().optional(),
    domain: z.string().min(1, t('validation.domainRequired')).regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, t('validation.domainInvalid')),
    city: z.string().min(1, t('validation.cityRequired')),
    query: z.string().min(1, t('validation.keywordQueryRequired')),
  }), [t]);

  // Initialize form - will be updated from localStorage in useEffect
  const form = useForm<PlaygroundFormValues>({
    resolver: zodResolver(PlaygroundFormSchema),
    defaultValues: {
      apiKeyOpenAI: '',
      apiKeyPerplexity: '',
      apiKeyGooglePageSpeed: '',
      apiKeyFirecrawl: '',
      domain: '',
      city: '',
      query: '',
    },
  });

  // Load saved values from localStorage on mount (sync with form)
  useEffect(() => {
    setIsMounted(true);
    
    // Only load from localStorage on client side
    if (typeof window === 'undefined') return;

    const savedOpenAI = getStoredValue(STORAGE_KEYS.API_KEY_OPENAI);
    const savedPerplexity = getStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY);
    const savedGooglePageSpeed = getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED);
    const savedFirecrawl = getStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL);
    const savedDomain = getStoredValue(STORAGE_KEYS.DOMAIN);
    const savedCity = getStoredValue(STORAGE_KEYS.CITY);

    // Reset form with saved values (including empty strings)
    form.reset({
      apiKeyOpenAI: savedOpenAI || '',
      apiKeyPerplexity: savedPerplexity || '',
      apiKeyGooglePageSpeed: savedGooglePageSpeed || '',
      apiKeyFirecrawl: savedFirecrawl || '',
      domain: savedDomain || '',
      city: savedCity || '',
      query: '', // Always start with empty query
    }, {
      keepDefaultValues: false, // Override defaults with saved values
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save values to localStorage when form values change (debounced)
  useEffect(() => {
    if (!isMounted) return; // Don't save on initial mount
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    const subscription = form.watch((values) => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce saves to avoid too many localStorage writes
      timeoutId = setTimeout(() => {
        setStoredValue(STORAGE_KEYS.API_KEY_OPENAI, values.apiKeyOpenAI || '');
        setStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY, values.apiKeyPerplexity || '');
        setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED, values.apiKeyGooglePageSpeed || '');
        setStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL, values.apiKeyFirecrawl || '');
        setStoredValue(STORAGE_KEYS.DOMAIN, values.domain || '');
        setStoredValue(STORAGE_KEYS.CITY, values.city || '');
      }, 500); // 500ms debounce
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [form, isMounted]);

  const onSubmit = async (values: PlaygroundFormValues) => {
    setIsPending(true);
    setDashboardData(null);
    setServiceAnalysis(null);

    // Save values to localStorage (always save, even if empty)
    setStoredValue(STORAGE_KEYS.API_KEY_OPENAI, values.apiKeyOpenAI || '');
    setStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY, values.apiKeyPerplexity || '');
    setStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED, values.apiKeyGooglePageSpeed || '');
    setStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL, values.apiKeyFirecrawl || '');
    setStoredValue(STORAGE_KEYS.DOMAIN, values.domain || '');
    setStoredValue(STORAGE_KEYS.CITY, values.city || '');

    // Scroll smoothly to results area
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const result = await runLiveDashboardTest({
        apiKeyOpenAI: values.apiKeyOpenAI,
        apiKeyPerplexity: values.apiKeyPerplexity,
        apiKeyGooglePageSpeed: values.apiKeyGooglePageSpeed,
        apiKeyFirecrawl: values.apiKeyFirecrawl,
        domain: values.domain,
        query: values.query,
        city: values.city,
      });

      // Extract DashboardData and ServiceAnalysisData
      const { serviceAnalysis: analysis, ...dashboard } = result;
      setDashboardData(dashboard);
      setServiceAnalysis(analysis);
      setCurrentDomain(values.domain);
      toast.success(t('simulationCompleted'));
    } catch (error) {
      console.error('[Playground] Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check for API key errors
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        toast.error(t('invalidApiKeys'));
      } else {
        toast.error(t('failedToRunSimulation', { errorMessage }));
      }

      // Set empty data to show "Not Visible" state
      setDashboardData(emptyDashboardData);
      setServiceAnalysis(null);
    } finally {
      setIsPending(false);
    }
  };



  // Separate handler for E-E-A-T audit

  // Debug: Check localStorage on mount
  useEffect(() => {
    if (isMounted) {
      const keys = {
        openai: getStoredValue(STORAGE_KEYS.API_KEY_OPENAI),
        perplexity: getStoredValue(STORAGE_KEYS.API_KEY_PERPLEXITY),
        googlePageSpeed: getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED),
        firecrawl: getStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL),
        domain: getStoredValue(STORAGE_KEYS.DOMAIN),
        city: getStoredValue(STORAGE_KEYS.CITY),
      };
      console.log('🔑 Saved keys in localStorage:', {
        'OpenAI': keys.openai ? `${keys.openai.substring(0, 10)}...` : '❌ Not saved',
        'Perplexity': keys.perplexity ? `${keys.perplexity.substring(0, 10)}...` : '❌ Not saved',
        'Google PageSpeed': keys.googlePageSpeed ? `${keys.googlePageSpeed.substring(0, 10)}...` : '❌ Not saved',
        'Firecrawl': keys.firecrawl ? `${keys.firecrawl.substring(0, 10)}...` : '❌ Not saved',
        'Domain': keys.domain || '❌ Not saved',
        'City': keys.city || '❌ Not saved',
      });
    }
  }, [isMounted]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl h-full min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t('title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          {t('description')}
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('configuration')}</CardTitle>
          <CardDescription>
            {t('configurationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* OpenAI API Key */}
                <FormField
                  control={form.control}
                  name="apiKeyOpenAI"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('openAiApiKey')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="sk-..."
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('openAiApiKeyDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Perplexity API Key */}
                <FormField
                  control={form.control}
                  name="apiKeyPerplexity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('perplexityApiKey')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="pplx-..."
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('perplexityApiKeyDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Google PageSpeed API Key */}
                <FormField
                  control={form.control}
                  name="apiKeyGooglePageSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google PageSpeed API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="AIzaSy..."
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Used for performance audits. Falls back to environment variable if not provided.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Firecrawl API Key */}
                <FormField
                  control={form.control}
                  name="apiKeyFirecrawl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firecrawl API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="fc-..."
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Used for web crawling and content extraction. Falls back to environment variable if not provided.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Domain */}
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('projectDomain')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="mayoclinic.org"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('projectDomainDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('locationCity')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="New York"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('locationCityDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Query */}
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('keywordQuery')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Best cardiologist"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('keywordQueryDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending || !form.watch('domain')?.trim()}
                  size="lg"
                  className="w-full sm:w-auto min-w-[220px] order-4 sm:order-1"
                  title={!form.watch('domain')?.trim() ? 'Please enter a domain first' : 'Run technical audit for the domain'}
                >
                </Button>
                <Button 
                  type="submit" 
                  disabled={isPending} 
                  size="lg"
                  className="w-full sm:w-auto order-1 sm:order-4"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('runningSimulation')}
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {t('simulateDashboard')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>


      {/* Dashboard Preview */}
      <div ref={resultsRef} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('dashboardPreview')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            {dashboardData
              ? t('simulatedDashboardView')
              : isPending
                ? t('runningLiveAudit')
                : t('runSimulationToSee')}
          </p>
        </div>

        {/* Render Logic */}
        {isPending ? (
          // Show ScanProgress when pending
          <div className="flex justify-center items-center min-h-[400px]">
            <Card className="w-full max-w-md border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('liveAuditInProgress')}
                </CardTitle>
                <CardDescription>
                  {t('runningComprehensiveAnalysis')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScanProgress isFinished={false} />
              </CardContent>
            </Card>
          </div>
        ) : dashboardData ? (
          // Show DashboardView when data is present
          <>
            {/* Simulation Banner */}
            <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium">
                  <Circle className="h-4 w-4 fill-current" />
                  <span>{t('simulationPreview')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard View */}
            <DashboardView data={dashboardData} />

            {/* Separator */}
            {serviceAnalysis && (
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-slate-950 px-4 text-slate-500 dark:text-slate-400">
                    {t('serviceAnalysis')}
                  </span>
                </div>
              </div>
            )}

            {/* Service Analysis Detail */}
            {serviceAnalysis && (
              <ServiceAnalysisDetail
                data={serviceAnalysis}
                domain={currentDomain}
                targetPage={currentDomain ? `https://${currentDomain}` : undefined}
                country="UA"
              />
            )}

            {/* Tech Audit Section - Can be shown independently */}



          </>
        ) : null}





        {/* Show placeholder only if no data and no pending operations */}
        {!dashboardData && !isPending && (
          // Show placeholder in initial state
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-slate-400">
                <p className="text-lg mb-2">{t('readyToSimulate')}</p>
                <p className="text-sm">
                  {t('fillInConfiguration')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Audits Section */}
        {dashboardData && (
          <>
            {/* Separator with "Advanced Audits" header */}
            <div className="relative my-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-slate-950 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                  Advanced Audits
                </span>
              </div>
            </div>

            {/* Duplicate Check Section */}
            {(() => {
              // Normalize URL: ensure it starts with http:// or https://
              const domainValue = form.watch('domain')?.trim() || '';
              let normalizedUrl = domainValue;
              
              if (normalizedUrl && !normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
                normalizedUrl = `https://${normalizedUrl}`;
              }

              return normalizedUrl ? (
                <DuplicateCheckSection 
                  targetUrl={normalizedUrl}
                  apiKeyFirecrawl={form.watch('apiKeyFirecrawl')}
                />
              ) : null;
            })()}
          </>
        )}
      </div>
    </div>
  );
}

