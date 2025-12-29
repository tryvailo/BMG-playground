'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { ContentAuditSection } from '~/components/features/playground/ContentAuditSection';
import { performContentAudit, getLatestContentAudit } from '~/lib/actions/content-audit';
import type { ContentAuditResult } from '~/lib/server/services/content/types';

/**
 * LocalStorage Keys - Using global configuration keys
 */
const STORAGE_KEYS = {
  DOMAIN: 'configuration_domain',
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
 * Content Optimization Page
 */
export default function ContentOptimizationPage() {
  const [result, setResult] = useState<ContentAuditResult | null>(null);
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false); // Prevent multiple simultaneous loads
  const timeoutRef = useRef<NodeJS.Timeout[]>([]); // Store timeout IDs for cleanup

  // Function to load audit data
  const loadAuditData = React.useCallback(async (skipLoadingState = false, forceReload = false) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current && !forceReload) {
      console.log('[Content Optimization] Load already in progress, skipping');
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

    console.log('[Content Optimization] Fetching audit for normalized URL:', normalizedUrl);

    try {
      const latestAudit = await getLatestContentAudit({ url: normalizedUrl });

      console.log('[Content Optimization] Fetch result:', {
        hasAudit: !!latestAudit,
        hasResult: !!latestAudit?.result,
        createdAt: latestAudit?.createdAt,
      });

      if (latestAudit && latestAudit.result) {
        console.log('[Content Optimization] Setting audit result in state');
        setResult(latestAudit.result);
        setAuditDate(latestAudit.createdAt);
      } else {
        console.log('[Content Optimization] No audit found in database');
        setResult((prevResult) => {
          if (prevResult === null) {
            return null;
          }
          console.log('[Content Optimization] Keeping existing data, not clearing');
          return prevResult;
        });
        setAuditDate((prevDate) => {
          // Keep existing date if we have previous result
          return prevDate;
        });
      }
    } catch (error) {
      console.error('[Content Optimization] Error fetching audit data:', error);
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

  const handleRunAudit = async () => {
    setIsPending(true);
    // Don't clear current result - keep it visible while new audit is running

    // Get domain from Configuration
    const domain = getStoredValue(STORAGE_KEYS.DOMAIN);

    if (!domain) {
      toast.error('Please configure your domain in the Configuration page first.');
      setIsPending(false);
      return;
    }

    // Normalize domain to URL
    let normalizedUrl = domain.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Scroll smoothly to results area
    const scrollTimeout = setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    timeoutRef.current.push(scrollTimeout);

    try {
      const auditResult = await performContentAudit({
        url: normalizedUrl,
      });

      // Update results only after successful completion
      // Results are already saved to database by performContentAudit
      setResult(auditResult);
      setAuditDate(new Date().toISOString());
      toast.success('Content Optimization audit completed successfully!');

      // Refresh data from database to ensure consistency
      // Small delay to ensure database write is complete
      const refreshTimeout = setTimeout(() => {
        loadAuditData();
      }, 1000);
      timeoutRef.current.push(refreshTimeout);
    } catch (error) {
      console.error('[Content Optimization] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to run Content Optimization audit: ${errorMessage}`);
      // Don't clear result on error - keep previous results visible
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-8 p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F4F7FE' }}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1B2559' }}>
            Оптимізація контенту
          </h1>
          <p className="text-sm mt-1" style={{ color: '#A3AED0' }}>
            Комплексний аналіз структури та якості контенту
          </p>
        </div>
      </div>

      <Card className="border-none bg-white rounded-[20px] shadow-[0_18px_40px_rgba(112,144,176,0.12)] overflow-hidden transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#1B2559]">Content Analysis & Optimization</h2>
              <p className="text-sm text-[#A3AED0]">Run a deep AI analysis of your content quality and hierarchy.</p>
            </div>
            <div className="flex flex-col items-end">
              {auditDate && (
                <p className="text-xs text-[#A3AED0] mb-2 font-medium">
                  Last audit: {new Date(auditDate).toLocaleString()}
                </p>
              )}
              <Button
                onClick={handleRunAudit}
                disabled={isPending || !isMounted || !getStoredValue(STORAGE_KEYS.DOMAIN)}
                className="w-full lg:w-auto bg-[#4318FF] hover:bg-[#4318FF]/90 text-white rounded-xl px-8"
              >
                <If condition={isPending}>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                </If>
                Run New Analysis
              </Button>
            </div>
          </div>
          {isPending && result && (
            <p className="text-xs text-[#A3AED0] mt-3 animate-pulse text-center">
              Updating results... Previous data is still visible.
            </p>
          )}
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
        ) : result ? (
          <ContentAuditSection
            defaultUrl={(() => {
              const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
              return domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : '';
            })()}
            result={result}
          />
        ) : (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">Run a content optimization audit to see results here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

