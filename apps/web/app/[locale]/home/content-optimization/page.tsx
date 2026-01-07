'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';

import { ContentAuditSection } from '~/components/features/playground/ContentAuditSection';
import { ContentOptimizationColdState } from '~/components/dashboard/audit/ContentOptimizationColdState';
import { performContentAudit, getLatestContentAudit } from '~/lib/actions/content-audit';
import { getProjectSettings, type ProjectSettings } from '~/lib/actions/project';
import type { ContentAuditResult } from '~/lib/server/services/content/types';

/**
 * Content Optimization Page
 */
export default function ContentOptimizationPage() {
  const [result, setResult] = useState<ContentAuditResult | null>(null);
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [_isMounted, setIsMounted] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout[]>([]);

  // Load project settings from database
  const loadProjectSettings = useCallback(async () => {
    try {
      const result = await getProjectSettings({});
      if (result.success && result.data) {
        setProjectSettings(result.data);
        return result.data;
      }
    } catch (error) {
      console.error('[Content Optimization] Error loading project settings:', error);
    }
    return null;
  }, []);

  // Function to load audit data - no dependencies to avoid infinite loops
  const loadAuditData = useCallback(async (skipLoadingState = false, forceReload = false, settings?: ProjectSettings | null) => {
    if (isLoadingRef.current && !forceReload) {
      console.log('[Content Optimization] Load already in progress, skipping');
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
        setResult((prevResult) => prevResult);
        setAuditDate((prevDate) => prevDate);
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

  // Initial fetch on mount - only runs once
  useEffect(() => {
    setIsMounted(true);
    let mounted = true;
    
    const init = async () => {
      const settings = await loadProjectSettings();
      if (mounted && settings) {
        await loadAuditData(false, false, settings);
      } else if (mounted) {
        setIsLoading(false);
      }
    };
    init();
    
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunAudit = async () => {
    setIsPending(true);

    const domain = projectSettings?.domain;

    if (!domain) {
      toast.error('Please configure your domain in the Configuration page first.');
      setIsPending(false);
      return;
    }

    let normalizedUrl = domain.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const scrollTimeout = setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    timeoutRef.current.push(scrollTimeout);

    try {
      const auditResult = await performContentAudit({
        url: normalizedUrl,
      });

      setResult(auditResult);
      setAuditDate(new Date().toISOString());
      toast.success('Content Optimization audit completed successfully!');

      const refreshTimeout = setTimeout(() => {
        loadAuditData();
      }, 1000);
      timeoutRef.current.push(refreshTimeout);
    } catch (error) {
      console.error('[Content Optimization] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to run Content Optimization audit: ${errorMessage}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8">
      <ContentOptimizationHorizon
        result={result}
        auditDate={auditDate}
        isLoading={isLoading}
        isPending={isPending}
        projectSettings={projectSettings}
        onRunAudit={handleRunAudit}
        resultsRef={resultsRef}
      />
    </div>
  );
}

const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  secondary: '#A3AED0',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
  background: '#F4F7FE',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
};

interface ContentOptimizationHorizonProps {
  result: ContentAuditResult | null;
  auditDate: string | null;
  isLoading: boolean;
  isPending: boolean;
  projectSettings: ProjectSettings | null;
  onRunAudit: () => void;
  resultsRef: React.RefObject<HTMLDivElement | null>;
}

function ContentOptimizationHorizon({
  result,
  auditDate,
  isLoading,
  isPending,
  projectSettings,
  onRunAudit,
  resultsRef,
}: ContentOptimizationHorizonProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: HORIZON.textPrimary }}>
            Оптимізація контенту
          </h1>
          <p className="text-sm mt-1" style={{ color: HORIZON.textSecondary }}>
            Комплексний аналіз структури та якості контенту
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
            disabled={isPending || isLoading || !projectSettings?.domain}
            className="bg-[#4318FF] hover:bg-[#4318FF]/90 text-white rounded-xl px-6 h-10 font-bold transition-all duration-200"
            style={{ boxShadow: '0 4px 12px rgba(67,24,255,0.2)' }}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Запуск аналізу...
              </>
            ) : (
              'Запустити аналіз'
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div ref={resultsRef} className="space-y-6">
        {result ? (
          <ContentAuditSection result={result} />
        ) : (
          <Card
            className="border-none bg-white rounded-[20px] overflow-hidden"
            style={{ boxShadow: HORIZON.shadow }}
          >
            <CardContent className="p-6">
              <ContentOptimizationColdState
                isRunning={isPending}
                progress={isPending ? 30 : 0}
                currentStep={isPending ? 'Аналізуємо структуру та якість контенту...' : undefined}
                onRunAudit={onRunAudit}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
