'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { EEATAuditSection } from '~/components/features/playground/EEATAuditSection';
import { EEATColdState } from '~/components/dashboard/audit/EEATColdState';
import { runEEATAudit, getLatestEEATAudit } from '~/lib/actions/eeat-audit';
import { getProjectSettings, type ProjectSettings } from '~/lib/actions/project';
import type { EEATAuditResult } from '~/lib/server/services/eeat/types';

/**
 * E-E-A-T Assessment Page
 */
export default function EEATAssessmentPage() {
  const [result, setResult] = useState<EEATAuditResult | null>(null);
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
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
      console.error('[E-E-A-T Assessment] Error loading project settings:', error);
    }
    return null;
  }, []);

  // Function to load audit data - no dependencies to avoid infinite loops
  const loadAuditData = useCallback(async (skipLoadingState = false, forceReload = false, settings?: ProjectSettings | null) => {
    if (isLoadingRef.current && !forceReload) {
      console.log('[E-E-A-T Assessment] Load already in progress, skipping');
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

    console.log('[E-E-A-T Assessment] Fetching audit for normalized URL:', normalizedUrl);

    try {
      const latestAudit = await getLatestEEATAudit({ url: normalizedUrl });

      console.log('[E-E-A-T Assessment] Fetch result:', {
        hasAudit: !!latestAudit,
        hasResult: !!latestAudit?.result,
        createdAt: latestAudit?.createdAt,
      });

      if (latestAudit && latestAudit.result) {
        console.log('[E-E-A-T Assessment] Setting audit result in state');
        setResult(latestAudit.result);
        setAuditDate(latestAudit.createdAt);
      } else {
        console.log('[E-E-A-T Assessment] No audit found in database');
        setResult((prevResult) => prevResult);
        setAuditDate((prevDate) => prevDate);
      }
    } catch (error) {
      console.error('[E-E-A-T Assessment] Error fetching audit data:', error);
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutRef.current = [];
    };
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
      const auditResult = await runEEATAudit({
        url: normalizedUrl,
        multiPage: false,
        filterType: 'all',
        maxPages: 50,
      });

      setResult(auditResult);
      setAuditDate(new Date().toISOString());
      toast.success('E-E-A-T Assessment completed successfully!');

      const refreshTimeout = setTimeout(() => {
        loadAuditData();
      }, 1000);
      timeoutRef.current.push(refreshTimeout);
    } catch (error) {
      console.error('[E-E-A-T Assessment] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to run E-E-A-T Assessment: ${errorMessage}`);
    } finally {
      setIsPending(false);
    }
  };

  const normalizedDomain = projectSettings?.domain
    ? (projectSettings.domain.startsWith('http') ? projectSettings.domain : `https://${projectSettings.domain}`)
    : '';

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8">
      <EEATAssessmentHorizon
        result={result}
        auditDate={auditDate}
        isLoading={isLoading}
        isPending={isPending}
        isMounted={isMounted}
        projectSettings={projectSettings}
        normalizedDomain={normalizedDomain}
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

interface EEATAssessmentHorizonProps {
  result: EEATAuditResult | null;
  auditDate: string | null;
  isLoading: boolean;
  isPending: boolean;
  isMounted: boolean;
  projectSettings: ProjectSettings | null;
  normalizedDomain: string;
  onRunAudit: () => void;
  resultsRef: React.RefObject<HTMLDivElement | null>;
}

function EEATAssessmentHorizon({
  result,
  auditDate,
  isLoading: _isLoading,
  isPending,
  isMounted,
  projectSettings,
  normalizedDomain,
  onRunAudit,
  resultsRef,
}: EEATAssessmentHorizonProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: HORIZON.textPrimary }}>
            E-E-A-T Аналіз
          </h1>
          <p className="text-sm mt-1" style={{ color: HORIZON.textSecondary }}>
            Оцінка досвіду, експертності та авторитетності контенту
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
            disabled={isPending || !isMounted || !projectSettings?.domain}
            className="bg-[#4318FF] hover:bg-[#4318FF]/90 text-white rounded-xl px-6 h-10 font-bold transition-all duration-200"
            style={{ boxShadow: '0 4px 12px rgba(67,24,255,0.2)' }}
          >
            <If condition={isPending}>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            </If>
            {isPending ? 'Запуск аналізу...' : 'Запустити аналіз'}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div ref={resultsRef} className="space-y-6">
        {result ? (
          <EEATAuditSection
            defaultUrl={normalizedDomain}
            result={result}
          />
        ) : (
          <Card
            className="border-none bg-white rounded-[20px] overflow-hidden"
            style={{ boxShadow: HORIZON.shadow }}
          >
            <CardContent className="p-6">
              <EEATColdState
                isRunning={isPending}
                progress={isPending ? 30 : 0}
                currentStep={isPending ? 'Аналізуємо досвід, експертність та авторитетність...' : undefined}
                onRunAudit={onRunAudit}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
