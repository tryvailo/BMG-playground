'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, Settings } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { TechAuditSection } from '~/components/dashboard/playground/TechAuditSection';
import { DuplicateCheckSection } from '~/components/dashboard/playground/DuplicateCheckSection';
import { runPlaygroundTechAudit, runAIAnalysis, getLatestPlaygroundTechAudit } from '~/lib/actions/tech-audit-playground';
import type { EphemeralAuditResult } from '~/lib/modules/audit/ephemeral-audit';
import type { DuplicateAnalysisResult } from '~/lib/utils/duplicate-analyzer';
import type { TechAuditAnalysis } from '~/lib/modules/audit/utils/tech-audit-analyzer';
import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * LocalStorage Keys - Using global configuration keys
 */
const STORAGE_KEYS = {
  DOMAIN: 'configuration_domain',
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
  } catch {
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
  const [aiAnalysis, setAiAnalysis] = useState<TechAuditAnalysis | null>(null);
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDeepAnalysisPending, setIsDeepAnalysisPending] = useState(false);
  const [isAiAnalysisPending, setIsAiAnalysisPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false); // Prevent multiple simultaneous loads
  const timeoutRef = useRef<NodeJS.Timeout[]>([]); // Store timeout IDs for cleanup

  // Function to load audit data
  const loadAuditData = React.useCallback(async (skipLoadingState = false, forceReload = false) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current && !forceReload) {
      console.log('[Technical Audit] Load already in progress, skipping');
      return;
    }

    const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
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
        createdAt: latestAudit?.createdAt,
      });
      
      if (latestAudit && latestAudit.result) {
        console.log('[Technical Audit] Setting audit result in state');
        setResult(latestAudit.result);
        setAuditDate(latestAudit.createdAt);
      } else {
        console.log('[Technical Audit] No audit found in database');
        setResult((prevResult) => {
          if (prevResult === null) {
            return null;
          }
          console.log('[Technical Audit] Keeping existing data, not clearing');
          return prevResult;
        });
        setAuditDate((prevDate) => {
          // Keep existing date if we have previous result
          return prevDate;
        });
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

  // Initial fetch on mount
  React.useEffect(() => {
    setIsMounted(true);
    loadAuditData();
  }, [loadAuditData]);

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
    setAiAnalysis(null);

    // Get configuration values
    const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
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
      const duplicatePromise: Promise<DuplicateAnalysisResult | null> =
        fetch('/api/duplicate-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: normalizedUrl,
            limit: 50,
            apiKeyFirecrawl: apiKeyFirecrawl?.trim() || undefined,
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}`, code: undefined }));
            const errorMessage = errorData.error || `HTTP ${response.status}`;
            const errorCode = errorData.code;
            
            // If error is about missing API key or payment required, return null to indicate skip
            if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key') || errorCode === 'MISSING_API_KEY') {
              return null;
            }
            if (errorMessage.includes('Payment required') || errorMessage.includes('subscription') || errorCode === 'FIRECRAWL_PAYMENT_REQUIRED') {
              return null;
            }
            throw new Error(errorMessage);
          }
          const result = await response.json();
          if (!result.success) {
            const errorMessage = result.error || 'Deep analysis failed';
            const errorCode = result.code;
            
            // If error is about missing API key or payment required, return null to indicate skip
            if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key') || errorCode === 'MISSING_API_KEY') {
              return null;
            }
            if (errorMessage.includes('Payment required') || errorMessage.includes('subscription') || errorCode === 'FIRECRAWL_PAYMENT_REQUIRED') {
              return null;
            }
            throw new Error(errorMessage);
          }
          return result.data;
        }).catch((error) => {
          // If error is about missing API key or payment required, return null to indicate skip
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key') || errorMessage.includes('MISSING_API_KEY')) {
            return null;
          }
          if (errorMessage.includes('Payment required') || errorMessage.includes('subscription') || errorMessage.includes('FIRECRAWL_PAYMENT_REQUIRED')) {
            return null;
          }
          throw error;
        });

      const promises: [Promise<EphemeralAuditResult>, Promise<DuplicateAnalysisResult | null>] = [
        auditPromise,
        duplicatePromise,
      ];

      const results = await Promise.allSettled(promises);
      const auditResult = results[0] as PromiseSettledResult<EphemeralAuditResult>;
      const duplicateAnalysisResult = results[1] as PromiseSettledResult<DuplicateAnalysisResult | null>;

      // Handle technical audit result
      if (auditResult && auditResult.status === 'fulfilled' && 'value' in auditResult) {
        // Results are already saved to database by runPlaygroundTechAudit
        setResult(auditResult.value as EphemeralAuditResult);
        setAuditDate(new Date().toISOString());
        toast.success('Technical audit completed successfully!');
        
        // Refresh data from database to ensure consistency
        // Small delay to ensure database write is complete
        const refreshTimeout = setTimeout(() => {
          loadAuditData();
        }, 1000);
        timeoutRef.current.push(refreshTimeout);
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
      if (duplicateAnalysisResult && duplicateAnalysisResult.status === 'fulfilled' && 'value' in duplicateAnalysisResult) {
        if (duplicateAnalysisResult.value === null) {
          // Analysis was skipped due to missing API key
          toast.info('Deep Content Analysis skipped: Firecrawl API key not provided');
        } else {
          setDuplicateResult(duplicateAnalysisResult.value as DuplicateAnalysisResult);
          toast.success('Deep content analysis completed successfully!');
        }
      } else if (duplicateAnalysisResult && duplicateAnalysisResult.status === 'rejected' && 'reason' in duplicateAnalysisResult) {
        console.error('[Deep Content Analysis] Error:', duplicateAnalysisResult.reason);
        const errorMessage = duplicateAnalysisResult.reason instanceof Error ? duplicateAnalysisResult.reason.message : 'Unknown error occurred';
        
        // Check if error is about missing API key
        if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key') || errorMessage.includes('MISSING_API_KEY')) {
          toast.info('Deep Content Analysis skipped: Firecrawl API key is required. Please provide it in the form or set FIRECRAWL_API_KEY in environment variables.');
        } else if (errorMessage.includes('Payment required') || errorMessage.includes('subscription') || errorMessage.includes('FIRECRAWL_PAYMENT_REQUIRED')) {
          toast.warning('Deep Content Analysis skipped: Firecrawl API subscription required. Please check your Firecrawl account or provide a valid API key.');
        } else {
          toast.error(`Deep Content Analysis failed: ${errorMessage}`);
        }
      }

      // Run AI analysis if technical audit succeeded and OpenAI key is available
      if (auditResult && auditResult.status === 'fulfilled' && 'value' in auditResult && apiKeyOpenAI?.trim()) {
        setIsAiAnalysisPending(true);
        try {
          const duplicateData = duplicateAnalysisResult && duplicateAnalysisResult.status === 'fulfilled' && 'value' in duplicateAnalysisResult ? duplicateAnalysisResult.value : null;
          const aiResult = await runAIAnalysis({
            audit: auditResult.value,
            apiKeyOpenAI: apiKeyOpenAI.trim(),
            duplicateAnalysis: duplicateData,
          });
          setAiAnalysis(aiResult);
          toast.success('AI analysis completed successfully!');
        } catch (error) {
          console.error('[AI Analysis] Error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          toast.error(`AI Analysis failed: ${errorMessage}`);
        } finally {
          setIsAiAnalysisPending(false);
        }
      }

      // Show overall success if at least one succeeded
      if ((auditResult && auditResult.status === 'fulfilled' && 'value' in auditResult) || (duplicateAnalysisResult && duplicateAnalysisResult.status === 'fulfilled' && 'value' in duplicateAnalysisResult)) {
        if (auditResult && auditResult.status === 'fulfilled' && 'value' in auditResult && duplicateAnalysisResult && duplicateAnalysisResult.status === 'fulfilled' && 'value' in duplicateAnalysisResult) {
          toast.success('All audits completed successfully!');
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
    <div className="flex-1 flex flex-col space-y-8 p-4 lg:p-8 bg-background">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Technical Audit <span className="text-primary NOT-italic">2026</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Comprehensive technical SEO and performance analysis.
          </p>
        </div>
      </div>

      <Card className="border-none bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(15,23,42,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] group">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Domain and API keys are configured in the Configuration page.
              </p>
              
              {auditDate && (
                <p className="text-xs text-muted-foreground mb-4">
                  Last audit: {new Date(auditDate).toLocaleString()}
                </p>
              )}

              <Button
                onClick={handleRunAudit}
                disabled={isPending || isDeepAnalysisPending || !isMounted || !getStoredValue(STORAGE_KEYS.DOMAIN)}
                className="w-full lg:w-auto"
              >
                <If condition={isPending || isDeepAnalysisPending}>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                </If>
                Run Technical Audit & Deep Analysis
              </Button>
              
              {isPending && result && (
                <p className="text-xs text-muted-foreground mt-2">
                  Updating results... Previous data is still visible.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div ref={resultsRef} className="space-y-6 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
              <p className="text-sm">Loading audit results...</p>
            </div>
          </div>
        ) : (result || duplicateResult || isPending || isDeepAnalysisPending) ? (
          <>
            {result && <TechAuditSection data={result} />}
            {(duplicateResult || isDeepAnalysisPending) && (() => {
              const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
              const normalizedUrl = domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : '';
              return (
                <DuplicateCheckSection
                  targetUrl={normalizedUrl}
                  apiKeyFirecrawl={getStoredValue(STORAGE_KEYS.API_KEY_FIRECRAWL) || undefined}
                  initialData={duplicateResult}
                  initialStatus={duplicateResult ? 'complete' : isDeepAnalysisPending ? 'scanning' : 'idle'}
                  initialError={null}
                />
              );
            })()}

            {/* AI Analysis Summary */}
            {(aiAnalysis || isAiAnalysisPending) && (
              <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 text-xl font-black italic">
                    <Info className="h-6 w-6 text-blue-600" />
                    AI-Powered Technical Audit Analysis
                    {isAiAnalysisPending && (
                      <Loader2 className="h-5 w-5 animate-spin ml-2" />
                    )}
                  </CardTitle>
                </CardHeader>
                {isAiAnalysisPending ? (
                  <CardContent>
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
                        <p className="text-sm text-slate-600">Analyzing audit results with AI...</p>
                      </div>
                    </div>
                  </CardContent>
                ) : aiAnalysis ? (
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 mb-2">
                        Summary
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {aiAnalysis.summary}
                      </p>
                    </div>

                    {aiAnalysis.criticalIssues.length > 0 && (
                      <div>
                        <h4 className="text-base font-bold text-red-700 mb-2 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          Critical Issues ({aiAnalysis.criticalIssues.length})
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.criticalIssues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-red-600 mt-0.5 flex-shrink-0">⚠️</span>
                              <span className="text-slate-700">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiAnalysis.priorityRecommendations.length > 0 && (
                      <div>
                        <h4 className="text-base font-bold text-orange-700 mb-2 flex items-center gap-2">
                          <Settings className="h-5 w-5 text-orange-600" />
                          Priority Recommendations ({aiAnalysis.priorityRecommendations.length})
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.priorityRecommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-orange-600 mt-0.5 flex-shrink-0">•</span>
                              <span className="text-slate-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiAnalysis.strengths.length > 0 && (
                      <div>
                        <h4 className="text-base font-bold text-emerald-700 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          Strengths ({aiAnalysis.strengths.length})
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-emerald-600 mt-0.5 flex-shrink-0">✓</span>
                              <span className="text-slate-700">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiAnalysis.quickWins.length > 0 && (
                      <div>
                        <h4 className="text-base font-bold text-blue-700 mb-2 flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-600" />
                          Quick Wins ({aiAnalysis.quickWins.length})
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.quickWins.map((win, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-blue-600 mt-0.5 flex-shrink-0">⚡</span>
                              <span className="text-slate-700">{win}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                ) : null}
              </Card>
            )}

            {(isPending || isDeepAnalysisPending) && !result && !duplicateResult && (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                  <p className="text-sm font-medium">Running technical audit and deep content analysis...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">Run a technical audit to see results here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

