'use client';

import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, Settings } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { TechAuditSection } from '~/components/dashboard/playground/TechAuditSection';
import { DuplicateResultsSection } from '~/components/dashboard/playground/DuplicateResultsSection';
import { NoindexResultsSection } from '~/components/dashboard/playground/NoindexResultsSection';
import { TechAuditColdState } from '~/components/dashboard/audit/TechAuditColdState';
import { runPlaygroundTechAudit, runAIAnalysis, getLatestPlaygroundTechAudit, saveExtendedAuditResults } from '~/lib/actions/tech-audit-playground';
import { getProjectSettings, type ProjectSettings } from '~/lib/actions/project';
import type { EphemeralAuditResult } from '~/lib/modules/audit/ephemeral-audit';
import type { DuplicateAnalysisResult } from '~/lib/utils/duplicate-analyzer';
import type { NoindexAnalysisResult } from '~/lib/modules/audit/utils/noindex-crawler';
import type { TechAuditAnalysis } from '~/lib/modules/audit/utils/tech-audit-analyzer';
import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Response type for duplicate check API
 */
interface DuplicateCheckResponse {
  data: DuplicateAnalysisResult;
  source: 'sitemap' | 'crawl' | 'sitemap+crawl';
  sitemapUrl?: string;
  crawledPages: number;
}

/**
 * LocalStorage Keys - Using global configuration keys (API keys only)
 */
const STORAGE_KEYS = {
  API_KEY_OPENAI: 'configuration_api_key_openai',
  API_KEY_GOOGLE_PAGESPEED: 'configuration_api_key_google_pagespeed',
  API_KEY_FIRECRAWL: 'configuration_api_key_firecrawl',
} as const;

/**
 * Helper functions for localStorage
 */
const getStoredValue = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(key) || '';
  } catch (_error) {
    return '';
  }
};

// setStoredValue removed - not used in this component

/**
 * Technical Audit Page
 */
export default function TechAuditPage() {
  const [result, setResult] = useState<EphemeralAuditResult | null>(null);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateAnalysisResult | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<'sitemap' | 'crawl' | 'sitemap+crawl' | undefined>(undefined);
  const [duplicateSitemapUrl, setDuplicateSitemapUrl] = useState<string | undefined>(undefined);
  const [noindexResult, setNoindexResult] = useState<NoindexAnalysisResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<TechAuditAnalysis | null>(null);
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDeepAnalysisPending, setIsDeepAnalysisPending] = useState(false);
  const [isAiAnalysisPending, setIsAiAnalysisPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false); // Prevent multiple simultaneous loads
  const timeoutRef = useRef<NodeJS.Timeout[]>([]); // Store timeout IDs for cleanup

  // Load project settings from database
  const loadProjectSettings = useCallback(async () => {
    try {
      const result = await getProjectSettings({});
      if (result.success && result.data) {
        setProjectSettings(result.data);
        return result.data;
      }
    } catch (error) {
      console.error('[Technical Audit] Error loading project settings:', error);
    }
    return null;
  }, []);

  // Function to load audit data - no dependencies to avoid infinite loops
  const loadAuditData = useCallback(async (skipLoadingState = false, forceReload = false, settings?: ProjectSettings | null) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current && !forceReload) {
      console.log('[Technical Audit] Load already in progress, skipping');
      return;
    }

    const domain = settings?.domain;
    if (!domain) {
      if (!skipLoadingState) {
        setIsLoading(false);
      }
      return;
    }

    isLoadingRef.current = true;

    if (!skipLoadingState) {
      setIsLoading(true);
    }

    const normalizedUrl = domain.trim().startsWith('http')
      ? domain.trim()
      : `https://${domain.trim()}`;

    console.log('[Technical Audit] Fetching audit for normalized URL:', normalizedUrl);

    try {
      const latestAudit = await getLatestPlaygroundTechAudit({ url: normalizedUrl });

      console.log('[Technical Audit] Fetch result:', {
        hasAudit: !!latestAudit,
        hasResult: !!latestAudit?.result,
        hasDuplicate: !!latestAudit?.duplicateResult,
        hasNoindex: !!latestAudit?.noindexResult,
        hasAiAnalysis: !!latestAudit?.aiAnalysis,
        createdAt: latestAudit?.createdAt,
      });

      if (latestAudit && latestAudit.result) {
        console.log('[Technical Audit] Setting audit result in state');
        setResult(latestAudit.result);
        setAuditDate(latestAudit.createdAt);
        
        // Load extended results if available
        if (latestAudit.duplicateResult) {
          setDuplicateResult(latestAudit.duplicateResult);
        }
        if (latestAudit.noindexResult) {
          setNoindexResult(latestAudit.noindexResult);
        }
        if (latestAudit.aiAnalysis) {
          setAiAnalysis(latestAudit.aiAnalysis);
        }
      } else {
        console.log('[Technical Audit] No audit found in database');
        setResult((prevResult) => {
          if (prevResult === null) {
            return null;
          }
          console.log('[Technical Audit] Keeping existing data, not clearing');
          return prevResult;
        });
        setAuditDate((prevDate) => prevDate);
      }
    } catch (error) {
      console.error('[Technical Audit] Error fetching audit data:', error);
    } finally {
      isLoadingRef.current = false;
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch on mount - only runs once
  React.useEffect(() => {
    setIsMounted(true);
    let mounted = true;
    
    const initializeData = async () => {
      const settings = await loadProjectSettings();
      if (mounted && settings) {
        await loadAuditData(false, false, settings);
      } else if (mounted) {
        setIsLoading(false);
      }
    };
    initializeData();
    
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      timeoutRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutRef.current = [];
    };
  }, []);

  const handleRunAudit = async () => {
    setIsPending(true);
    setIsDeepAnalysisPending(true);
    setIsAiAnalysisPending(false);
    // Don't clear current result - keep it visible while new audit is running
    setDuplicateResult(null);
    setNoindexResult(null);
    setAiAnalysis(null);

    // Get domain from project settings (loaded from DB)
    const domain = projectSettings?.domain;
    // Get API keys from localStorage (not stored in DB for security)
    const apiKeyOpenAI = getStoredValue(STORAGE_KEYS.API_KEY_OPENAI);
    const apiKeyGooglePageSpeed = getStoredValue(STORAGE_KEYS.API_KEY_GOOGLE_PAGESPEED);
    const apiKeyFirecrawl = getStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL);

    if (!domain) {
      toast.error('Please configure your domain in the Configuration page first.');
      setIsPending(false);
      setIsDeepAnalysisPending(false);
      return;
    }

    // Scroll smoothly to results area
    const scrollTimeout = setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    timeoutRef.current.push(scrollTimeout);

    // Normalize domain to URL
    let normalizedUrl = domain.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      // Run technical audit and optionally deep content analysis
      const auditPromise: Promise<EphemeralAuditResult> = runPlaygroundTechAudit({
        domain: domain,
        apiKeyOpenAI: apiKeyOpenAI || undefined,
        apiKeyGooglePageSpeed: apiKeyGooglePageSpeed || undefined,
      });

      // Add deep content analysis (will use env var if form key is not provided)
      // If env var is also missing, the API will return an error which we'll handle gracefully
      // Now returns extended response with source info (sitemap/crawl)
      const duplicatePromise: Promise<DuplicateCheckResponse | null> =
        fetch('/api/duplicate-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: normalizedUrl,
            limit: 100, // Increased limit for better coverage with sitemap
            apiKeyFirecrawl: apiKeyFirecrawl?.trim() || undefined,
            useSitemap: true, // Enable sitemap-first approach
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}`, code: undefined }));
            const errorMessage = errorData.error || `HTTP ${response.status}`;
            const errorCode = errorData.code;

            // If error is about missing API key, payment required, or no pages found - return null to skip gracefully
            if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key') || errorCode === 'MISSING_API_KEY') {
              return null;
            }
            if (errorMessage.includes('Payment required') || errorMessage.includes('subscription') || errorCode === 'FIRECRAWL_PAYMENT_REQUIRED') {
              return null;
            }
            if (errorMessage.includes('No pages') || errorMessage.includes('no crawlable') || errorMessage.includes('no sitemap')) {
              console.warn('[Duplicate Check] No pages found for analysis:', errorMessage);
              return null;
            }
            throw new Error(errorMessage);
          }
          const result = await response.json();
          if (!result.success) {
            const errorMessage = result.error || 'Deep analysis failed';
            const errorCode = result.code;

            // If error is about missing API key, payment required, or no pages found - return null to skip gracefully
            if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key') || errorCode === 'MISSING_API_KEY') {
              return null;
            }
            if (errorMessage.includes('Payment required') || errorMessage.includes('subscription') || errorCode === 'FIRECRAWL_PAYMENT_REQUIRED') {
              return null;
            }
            if (errorMessage.includes('No pages') || errorMessage.includes('no crawlable') || errorMessage.includes('no sitemap')) {
              console.warn('[Duplicate Check] No pages found for analysis:', errorMessage);
              return null;
            }
            throw new Error(errorMessage);
          }
          // Return full response with source info
          return {
            data: result.data,
            source: result.source,
            sitemapUrl: result.sitemapUrl,
            crawledPages: result.crawledPages,
          };
        }).catch((error) => {
          // If error is about missing API key, payment required, or no pages found - return null to skip gracefully
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key') || errorMessage.includes('MISSING_API_KEY')) {
            return null;
          }
          if (errorMessage.includes('Payment required') || errorMessage.includes('subscription') || errorMessage.includes('FIRECRAWL_PAYMENT_REQUIRED')) {
            return null;
          }
          if (errorMessage.includes('No pages') || errorMessage.includes('no crawlable') || errorMessage.includes('no sitemap')) {
            console.warn('[Duplicate Check] No pages found for analysis:', errorMessage);
            return null;
          }
          throw error;
        });

      // Noindex pages analysis
      const noindexPromise: Promise<NoindexAnalysisResult | null> =
        fetch('/api/noindex-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: normalizedUrl,
            maxPages: 50,
          }),
        }).then(async (response) => {
          if (!response.ok) {
            console.warn('[Noindex Check] HTTP error:', response.status);
            return null;
          }
          const result = await response.json();
          if (!result.success) {
            console.warn('[Noindex Check] Analysis failed:', result.error);
            return null;
          }
          return result.data;
        }).catch((error) => {
          console.warn('[Noindex Check] Error:', error);
          return null;
        });

      const promises: [Promise<EphemeralAuditResult>, Promise<DuplicateCheckResponse | null>, Promise<NoindexAnalysisResult | null>] = [
        auditPromise,
        duplicatePromise,
        noindexPromise,
      ];

      const results = await Promise.allSettled(promises);
      const auditResult = results[0];
      const duplicateAnalysisResult = results[1] as PromiseSettledResult<DuplicateCheckResponse | null>;
      const noindexAnalysisResult = results[2];

      // Handle technical audit result
      if (auditResult && auditResult.status === 'fulfilled') {
        // Results are already saved to database by runPlaygroundTechAudit
        setResult(auditResult.value);
        setAuditDate(new Date().toISOString());
        toast.success('Technical audit completed successfully!');
      } else if (auditResult && auditResult.status === 'rejected' && 'reason' in auditResult) {
        console.error('[Technical Audit] Error:', auditResult.reason);
        const errorMessage = auditResult.reason instanceof Error ? auditResult.reason.message : 'Unknown error occurred';

        if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
          toast.error('Invalid API keys. Please check your API keys.');
        } else {
          toast.error(`Technical Audit failed: ${errorMessage}`);
        }
      }

      // Handle deep content analysis result
      let finalDuplicateResult: DuplicateAnalysisResult | null = null;
      if (duplicateAnalysisResult && duplicateAnalysisResult.status === 'fulfilled' && 'value' in duplicateAnalysisResult) {
        if (duplicateAnalysisResult.value === null) {
          toast.info('Deep Content Analysis skipped: Firecrawl API key not provided');
        } else {
          const response = duplicateAnalysisResult.value;
          finalDuplicateResult = response.data;
          setDuplicateResult(finalDuplicateResult);
          setDuplicateSource(response.source);
          setDuplicateSitemapUrl(response.sitemapUrl);
          const sourceLabel = response.source === 'sitemap' ? 'via sitemap' : response.source === 'sitemap+crawl' ? 'via sitemap + crawl' : 'via crawl';
          toast.success(`Deep content analysis completed (${response.crawledPages} pages ${sourceLabel})!`);
        }
      } else if (duplicateAnalysisResult && duplicateAnalysisResult.status === 'rejected' && 'reason' in duplicateAnalysisResult) {
        console.error('[Deep Content Analysis] Error:', duplicateAnalysisResult.reason);
        const errorMessage = duplicateAnalysisResult.reason instanceof Error ? duplicateAnalysisResult.reason.message : 'Unknown error occurred';

        if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key') || errorMessage.includes('MISSING_API_KEY')) {
          toast.info('Deep Content Analysis skipped: Firecrawl API key not provided');
        } else if (errorMessage.includes('Payment required') || errorMessage.includes('subscription')) {
          toast.warning('Deep Content Analysis skipped: Firecrawl subscription required');
        } else {
          toast.error(`Deep Content Analysis failed: ${errorMessage}`);
        }
      }

      // Handle noindex analysis result
      let finalNoindexResult: NoindexAnalysisResult | null = null;
      if (noindexAnalysisResult && noindexAnalysisResult.status === 'fulfilled' && 'value' in noindexAnalysisResult) {
        if (noindexAnalysisResult.value) {
          finalNoindexResult = noindexAnalysisResult.value;
          setNoindexResult(finalNoindexResult);
          console.log('[Noindex Check] Analysis completed:', finalNoindexResult.noindexCount, 'pages found');
        }
      }

      // Run AI analysis if technical audit succeeded and OpenAI key is available
      let finalAiAnalysis: TechAuditAnalysis | null = null;
      if (auditResult && auditResult.status === 'fulfilled' && 'value' in auditResult && apiKeyOpenAI?.trim()) {
        setIsAiAnalysisPending(true);
        try {
          const aiResult = await runAIAnalysis({
            audit: auditResult.value,
            apiKeyOpenAI: apiKeyOpenAI.trim(),
            duplicateAnalysis: finalDuplicateResult,
          });
          finalAiAnalysis = aiResult;
          setAiAnalysis(finalAiAnalysis);
          toast.success('AI analysis completed!');
        } catch (error) {
          console.error('[AI Analysis] Error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          toast.error(`AI Analysis failed: ${errorMessage}`);
        } finally {
          setIsAiAnalysisPending(false);
        }
      }

      // Save extended results to database (duplicate, noindex, AI analysis)
      if (auditResult && auditResult.status === 'fulfilled' && (finalDuplicateResult || finalNoindexResult || finalAiAnalysis)) {
        try {
          await saveExtendedAuditResults({
            url: normalizedUrl,
            duplicateResult: finalDuplicateResult,
            noindexResult: finalNoindexResult,
            aiAnalysis: finalAiAnalysis,
          });
          console.log('[Technical Audit] Extended results saved to database');
        } catch (saveError) {
          console.error('[Technical Audit] Failed to save extended results:', saveError);
        }
      }
    } catch (error) {
      console.error('[Technical Audit] Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to run audits: ${errorMessage}`);
    } finally {
      setIsPending(false);
      setIsDeepAnalysisPending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8">
      <TechAuditHorizon
        result={result}
        duplicateResult={duplicateResult}
        duplicateSource={duplicateSource}
        duplicateSitemapUrl={duplicateSitemapUrl}
        noindexResult={noindexResult}
        aiAnalysis={aiAnalysis}
        auditDate={auditDate}
        isLoading={isLoading}
        isPending={isPending}
        isDeepAnalysisPending={isDeepAnalysisPending}
        isAiAnalysisPending={isAiAnalysisPending}
        isMounted={isMounted}
        projectSettings={projectSettings}
        onRunAudit={handleRunAudit}
        resultsRef={resultsRef}
        getStoredValue={getStoredValue}
        storageKeys={STORAGE_KEYS}
      />
    </div>
  );
}

const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  secondary: '#A3AED0',
  success: '#01B574',
  successLight: '#01B57415',
  warning: '#FFB547',
  warningLight: '#FFB54715',
  error: '#EE5D50',
  errorLight: '#EE5D5015',
  info: '#2B77E5',
  infoLight: '#2B77E515',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
  background: '#F4F7FE',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
  shadowSm: '0 4px 12px rgba(112, 144, 176, 0.1)',
};

interface TechAuditHorizonProps {
  result: EphemeralAuditResult | null;
  duplicateResult: DuplicateAnalysisResult | null;
  duplicateSource?: 'sitemap' | 'crawl' | 'sitemap+crawl';
  duplicateSitemapUrl?: string;
  noindexResult: NoindexAnalysisResult | null;
  aiAnalysis: TechAuditAnalysis | null;
  auditDate: string | null;
  isLoading: boolean;
  isPending: boolean;
  isDeepAnalysisPending: boolean;
  isAiAnalysisPending: boolean;
  isMounted: boolean;
  projectSettings: ProjectSettings | null;
  onRunAudit: () => void;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  getStoredValue: (key: string) => string;
  storageKeys: typeof STORAGE_KEYS;
}

function TechAuditHorizon({
  result,
  duplicateResult,
  duplicateSource,
  duplicateSitemapUrl,
  noindexResult,
  aiAnalysis,
  auditDate,
  isLoading: _isLoading,
  isPending,
  isDeepAnalysisPending,
  isAiAnalysisPending,
  isMounted,
  projectSettings,
  onRunAudit,
  resultsRef,
  getStoredValue: _getStoredValue,
  storageKeys: _storageKeys,
}: TechAuditHorizonProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: HORIZON.textPrimary }}>
            Технічний аудит
          </h1>
          <p className="text-sm mt-1" style={{ color: HORIZON.textSecondary }}>
            Глибокий аналіз технічної оптимізації та продуктивності сайту
          </p>
        </div>
        <div className="flex items-center gap-3">
          {auditDate && (
            <p className="text-xs font-medium" style={{ color: HORIZON.textSecondary }}>
              Останній аудит: {new Date(auditDate).toLocaleString('uk-UA')}
            </p>
          )}
          <Button
            onClick={onRunAudit}
            disabled={isPending || isDeepAnalysisPending || !isMounted || !projectSettings?.domain}
            className="bg-[#4318FF] hover:bg-[#4318FF]/90 text-white rounded-xl px-6 h-10 font-bold transition-all duration-200"
            style={{ boxShadow: '0 4px 12px rgba(67,24,255,0.2)' }}
          >
            <If condition={isPending || isDeepAnalysisPending}>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            </If>
            {isPending || isDeepAnalysisPending ? 'Запуск аналізу...' : 'Запустити аналіз'}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div ref={resultsRef} className="space-y-6">
        {(result || duplicateResult || noindexResult) ? (
          <>
            {result && <TechAuditSection data={result} />}
            
            {/* Duplicate Content Analysis - only show when data exists */}
            {duplicateResult && (
              <DuplicateResultsSection 
                data={duplicateResult} 
                isLoading={false}
                source={duplicateSource}
                sitemapUrl={duplicateSitemapUrl}
              />
            )}

            {/* Noindex Pages Analysis - only show when data exists */}
            {noindexResult && (
              <NoindexResultsSection 
                data={noindexResult} 
                isLoading={false} 
              />
            )}

            {/* AI Analysis Summary */}
            {(aiAnalysis || isAiAnalysisPending) && (
              <Card
                className="border-none bg-white rounded-[20px] overflow-hidden"
                style={{ boxShadow: HORIZON.shadow }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: HORIZON.infoLight }}
                    >
                      <Info className="h-5 w-5" style={{ color: HORIZON.info }} />
                    </div>
                    <span className="text-lg font-bold" style={{ color: HORIZON.textPrimary }}>
                      AI-Powered Technical Audit Analysis
                    </span>
                    {isAiAnalysisPending && (
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: HORIZON.primary }} />
                    )}
                  </CardTitle>
                </CardHeader>
                {isAiAnalysisPending ? (
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" style={{ color: HORIZON.primary }} />
                        <p className="text-sm font-medium" style={{ color: HORIZON.textSecondary }}>
                          Аналіз результатів аудиту за допомогою AI...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                ) : aiAnalysis ? (
                  <CardContent className="space-y-6 pt-2">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: HORIZON.textSecondary }}>
                        Summary
                      </h4>
                      <p className="text-sm leading-relaxed" style={{ color: HORIZON.textPrimary }}>
                        {aiAnalysis.summary}
                      </p>
                    </div>

                    {aiAnalysis.criticalIssues.length > 0 && (
                      <div
                        className="p-4 rounded-[16px]"
                        style={{ backgroundColor: HORIZON.errorLight }}
                      >
                        <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: HORIZON.error }}>
                          <AlertCircle className="h-4 w-4" />
                          Critical Issues ({aiAnalysis.criticalIssues.length})
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.criticalIssues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="mt-0.5 flex-shrink-0" style={{ color: HORIZON.error }}>•</span>
                              <span style={{ color: HORIZON.textPrimary }}>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiAnalysis.priorityRecommendations.length > 0 && (
                      <div
                        className="p-4 rounded-[16px]"
                        style={{ backgroundColor: HORIZON.warningLight }}
                      >
                        <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: HORIZON.warning }}>
                          <Settings className="h-4 w-4" />
                          Priority Recommendations ({aiAnalysis.priorityRecommendations.length})
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.priorityRecommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="mt-0.5 flex-shrink-0" style={{ color: HORIZON.warning }}>•</span>
                              <span style={{ color: HORIZON.textPrimary }}>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiAnalysis.strengths.length > 0 && (
                      <div
                        className="p-4 rounded-[16px]"
                        style={{ backgroundColor: HORIZON.successLight }}
                      >
                        <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: HORIZON.success }}>
                          <CheckCircle2 className="h-4 w-4" />
                          Strengths ({aiAnalysis.strengths.length})
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="mt-0.5 flex-shrink-0" style={{ color: HORIZON.success }}>✓</span>
                              <span style={{ color: HORIZON.textPrimary }}>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiAnalysis.quickWins.length > 0 && (
                      <div
                        className="p-4 rounded-[16px]"
                        style={{ backgroundColor: HORIZON.infoLight }}
                      >
                        <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: HORIZON.info }}>
                          <Info className="h-4 w-4" />
                          Quick Wins ({aiAnalysis.quickWins.length})
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.quickWins.map((win, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="mt-0.5 flex-shrink-0" style={{ color: HORIZON.info }}>⚡</span>
                              <span style={{ color: HORIZON.textPrimary }}>{win}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                ) : null}
              </Card>
            )}
          </>
        ) : (
          <Card
            className="border-none bg-white rounded-[20px] overflow-hidden"
            style={{ boxShadow: HORIZON.shadow }}
          >
            <CardContent className="p-6">
              <TechAuditColdState
                isRunning={isPending || isDeepAnalysisPending}
                progress={isDeepAnalysisPending ? 60 : (isPending ? 30 : 0)}
                currentStep={isDeepAnalysisPending 
                  ? 'Глибокий AI-аналіз контенту...' 
                  : isPending 
                  ? 'Перевірка технічних показників...'
                  : undefined}
                onRunAudit={onRunAudit}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

