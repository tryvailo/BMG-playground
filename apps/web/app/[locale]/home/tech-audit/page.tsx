'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, Settings } from 'lucide-react';

import { PageBody } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { TechAuditSection } from '~/components/dashboard/playground/TechAuditSection';
import { DuplicateCheckSection } from '~/components/dashboard/playground/DuplicateCheckSection';
import { runPlaygroundTechAudit, runAIAnalysis } from '~/lib/actions/tech-audit-playground';
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

const setStoredValue = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Technical Audit Page
 */
export default function TechAuditPage() {
  const [result, setResult] = useState<EphemeralAuditResult | null>(null);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateAnalysisResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<TechAuditAnalysis | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDeepAnalysisPending, setIsDeepAnalysisPending] = useState(false);
  const [isAiAnalysisPending, setIsAiAnalysisPending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load configuration values from localStorage on mount
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRunAudit = async () => {
    setIsPending(true);
    setIsDeepAnalysisPending(true);
    setIsAiAnalysisPending(false);
    setResult(null);
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
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Normalize domain to URL
    let normalizedUrl = domain.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      // Run technical audit and optionally deep content analysis
      const promises: Promise<any>[] = [
        runPlaygroundTechAudit({
          domain: domain,
          apiKeyOpenAI: apiKeyOpenAI || undefined,
          apiKeyGooglePageSpeed: apiKeyGooglePageSpeed || undefined,
        }),
      ];

      // Add deep content analysis (will use env var if form key is not provided)
      // If env var is also missing, the API will return an error which we'll handle gracefully
      promises.push(
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
            const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
            const errorMessage = errorData.error || `HTTP ${response.status}`;
            
            // If error is about missing API key, return null to indicate skip
            if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key')) {
              return null;
            }
            throw new Error(errorMessage);
          }
          const result = await response.json();
          if (!result.success) {
            const errorMessage = result.error || 'Deep analysis failed';
            // If error is about missing API key, return null to indicate skip
            if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key')) {
              return null;
            }
            throw new Error(errorMessage);
          }
          return result.data;
        }).catch((error) => {
          // If error is about missing API key, return null to indicate skip
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key')) {
            return null;
          }
          throw error;
        })
      );

      const [auditResult, duplicateAnalysisResult] = await Promise.allSettled(promises);

      // Handle technical audit result
      if (auditResult.status === 'fulfilled') {
        setResult(auditResult.value);
        toast.success('Technical audit completed successfully!');
      } else {
        console.error('[Technical Audit] Error:', auditResult.reason);
        const errorMessage = auditResult.reason instanceof Error ? auditResult.reason.message : 'Unknown error occurred';
        
        if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
          toast.error('Invalid API keys. Please check your API keys.');
        } else {
          toast.error(`Technical Audit failed: ${errorMessage}`);
        }
      }

      // Handle deep content analysis result
      if (duplicateAnalysisResult.status === 'fulfilled') {
        if (duplicateAnalysisResult.value === null) {
          // Analysis was skipped due to missing API key
          toast.info('Deep Content Analysis skipped: Firecrawl API key not provided');
        } else {
          setDuplicateResult(duplicateAnalysisResult.value);
          toast.success('Deep content analysis completed successfully!');
        }
      } else {
        console.error('[Deep Content Analysis] Error:', duplicateAnalysisResult.reason);
        const errorMessage = duplicateAnalysisResult.reason instanceof Error ? duplicateAnalysisResult.reason.message : 'Unknown error occurred';
        
        // Check if error is about missing API key
        if (errorMessage.includes('FIRECRAWL_API_KEY') || errorMessage.includes('API key')) {
          toast.info('Deep Content Analysis skipped: Firecrawl API key is required. Please provide it in the form or set FIRECRAWL_API_KEY in environment variables.');
        } else {
          toast.error(`Deep Content Analysis failed: ${errorMessage}`);
        }
      }

      // Run AI analysis if technical audit succeeded and OpenAI key is available
      if (auditResult.status === 'fulfilled' && apiKeyOpenAI?.trim()) {
        setIsAiAnalysisPending(true);
        try {
          const duplicateData = duplicateAnalysisResult.status === 'fulfilled' ? duplicateAnalysisResult.value : null;
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
      if (auditResult.status === 'fulfilled' || duplicateAnalysisResult.status === 'fulfilled') {
        if (auditResult.status === 'fulfilled' && duplicateAnalysisResult.status === 'fulfilled') {
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
    <PageBody>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full min-h-full">
        <div className="flex flex-col space-y-6 h-full min-h-full">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Technical Audit</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Domain and API keys are configured in the Configuration page.
              </p>
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
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-h-[400px]">
            {(result || duplicateResult || isPending || isDeepAnalysisPending) ? (
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
                  <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xl">
                        <Info className="h-6 w-6" />
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
                            <p className="text-sm text-muted-foreground">Analyzing audit results with AI...</p>
                          </div>
                        </div>
                      </CardContent>
                    ) : aiAnalysis ? (
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="text-base font-semibold text-foreground mb-2">
                            Summary
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {aiAnalysis.summary}
                          </p>
                        </div>

                        {aiAnalysis.criticalIssues.length > 0 && (
                          <div>
                            <h4 className="text-base font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                              <AlertCircle className="h-5 w-5" />
                              Critical Issues ({aiAnalysis.criticalIssues.length})
                            </h4>
                            <ul className="space-y-2">
                              {aiAnalysis.criticalIssues.map((issue, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0">⚠️</span>
                                  <span className="text-foreground">{issue}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiAnalysis.priorityRecommendations.length > 0 && (
                          <div>
                            <h4 className="text-base font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                              <Settings className="h-5 w-5" />
                              Priority Recommendations ({aiAnalysis.priorityRecommendations.length})
                            </h4>
                            <ul className="space-y-2">
                              {aiAnalysis.priorityRecommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0">•</span>
                                  <span className="text-foreground">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiAnalysis.strengths.length > 0 && (
                          <div>
                            <h4 className="text-base font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              Strengths ({aiAnalysis.strengths.length})
                            </h4>
                            <ul className="space-y-2">
                              {aiAnalysis.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                                  <span className="text-foreground">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiAnalysis.quickWins.length > 0 && (
                          <div>
                            <h4 className="text-base font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                              <Info className="h-5 w-5" />
                              Quick Wins ({aiAnalysis.quickWins.length})
                            </h4>
                            <ul className="space-y-2">
                              {aiAnalysis.quickWins.map((win, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">⚡</span>
                                  <span className="text-foreground">{win}</span>
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
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                      <p className="text-sm">Running technical audit and deep content analysis...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Run a technical audit to see results here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageBody>
  );
}

