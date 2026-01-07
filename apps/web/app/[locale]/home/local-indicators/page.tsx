'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { LocalIndicatorsSection } from '~/components/features/playground/LocalIndicatorsSection';
import { LocalIndicatorsColdState } from '~/components/dashboard/audit/LocalIndicatorsColdState';
import { performLocalIndicatorsAudit, getLatestLocalIndicatorsAudit } from '~/lib/actions/local-indicators-audit';
import { getProjectSettings, type ProjectSettings } from '~/lib/actions/project';
import type { LocalIndicatorsAuditResult } from '~/lib/server/services/local/types';

/**
 * LocalStorage Keys - For API keys only (not stored in DB)
 */
const STORAGE_KEYS = {
  GOOGLE_PLACES_API_KEY: 'configuration_api_key_google_places',
  FIRECRAWL_API_KEY: 'configuration_api_key_firecrawl',
  GOOGLE_CUSTOM_SEARCH_API_KEY: 'configuration_api_key_google_custom_search',
  GOOGLE_CUSTOM_SEARCH_ENGINE_ID: 'configuration_google_custom_search_engine_id',
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

/**
 * Local Indicators Page
 */
export default function LocalIndicatorsPage() {
  const [result, setResult] = useState<LocalIndicatorsAuditResult | null>(null);
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false); // Prevent multiple simultaneous loads

  // Load project settings from database
  const loadProjectSettings = useCallback(async () => {
    try {
      const result = await getProjectSettings({});
      if (result.success && result.data) {
        setProjectSettings(result.data);
        return result.data;
      }
    } catch (error) {
      console.error('[Local Indicators] Error loading project settings:', error);
    }
    return null;
  }, []);

  // Function to load audit data - no dependencies to avoid infinite loops
  const loadAuditData = useCallback(async (skipLoadingState = false, forceReload = false, settings?: ProjectSettings | null) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current && !forceReload) {
      console.log('[Local Indicators] Load already in progress, skipping');
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

    console.log('[Local Indicators] Fetching audit for normalized URL:', normalizedUrl);

    try {
      const latestAudit = await getLatestLocalIndicatorsAudit({ url: normalizedUrl });

      console.log('[Local Indicators] Fetch result:', {
        hasAudit: !!latestAudit,
        hasResult: !!latestAudit?.result,
        createdAt: latestAudit?.createdAt,
      });

      if (latestAudit && latestAudit.result) {
        console.log('[Local Indicators] Setting audit result in state');
        setResult(latestAudit.result);
        setAuditDate(latestAudit.createdAt);
      } else {
        console.log('[Local Indicators] No audit found in database');
        setResult((prevResult) => prevResult);
        setAuditDate((prevDate) => prevDate);
      }
    } catch (error) {
      console.error('[Local Indicators] Error fetching audit data:', error);
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

  // Reload data when page becomes visible (user returns to tab)
  // Only reload if we don't have data or if it's been a while since last load
  useEffect(() => {
    let lastLoadTime = 0;
    const MIN_RELOAD_INTERVAL = 3000; // Don't reload more than once per 3 seconds
    let isInitialMount = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Skip reload on initial mount (handled by mount effect)
        if (isInitialMount) {
          isInitialMount = false;
          return;
        }

        const timeSinceLastLoad = Date.now() - lastLoadTime;
        if (timeSinceLastLoad > MIN_RELOAD_INTERVAL) {
          console.log('[Local Indicators] Page became visible, checking for updates');
          lastLoadTime = Date.now();
          // Only reload if we don't have data
          if (!result) {
            console.log('[Local Indicators] No data, loading...');
            loadAuditData();
          } else {
            console.log('[Local Indicators] Data exists, skipping reload');
          }
        }
      }
    };

    const handleFocus = () => {
      // Skip reload on initial mount
      if (isInitialMount) {
        isInitialMount = false;
        return;
      }

      const timeSinceLastLoad = Date.now() - lastLoadTime;
      if (timeSinceLastLoad > MIN_RELOAD_INTERVAL) {
        console.log('[Local Indicators] Window focused, checking for updates');
        lastLoadTime = Date.now();
        // Only reload if we don't have data
        if (!result) {
          console.log('[Local Indicators] No data, loading...');
          loadAuditData();
        } else {
          console.log('[Local Indicators] Data exists, skipping reload');
        }
      }
    };

    // Set initial mount flag after a short delay to allow mount effect to complete
    setTimeout(() => {
      isInitialMount = false;
    }, 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadAuditData, result]);

  const handleRunAudit = async () => {
    setIsPending(true);
    // Don't clear current result - keep it visible while new audit is running

    // Get project settings from state (loaded from DB)
    const domain = projectSettings?.domain;
    const city = projectSettings?.city;
    const clinicName = projectSettings?.clinicName;

    // Get API keys from localStorage (not stored in DB for security)
    const googlePlacesApiKeyRaw = getStoredValue(STORAGE_KEYS.GOOGLE_PLACES_API_KEY);
    const firecrawlApiKeyRaw = getStoredValue(STORAGE_KEYS.FIRECRAWL_API_KEY);
    const googleCustomSearchApiKeyRaw = getStoredValue(STORAGE_KEYS.GOOGLE_CUSTOM_SEARCH_API_KEY);
    const googleCustomSearchEngineIdRaw = getStoredValue(STORAGE_KEYS.GOOGLE_CUSTOM_SEARCH_ENGINE_ID);

    // Normalize API keys (trim and check if not empty)
    const googlePlacesApiKey = googlePlacesApiKeyRaw?.trim() || undefined;
    const firecrawlApiKey = firecrawlApiKeyRaw?.trim() || undefined;
    const googleCustomSearchApiKey = googleCustomSearchApiKeyRaw?.trim() || undefined;
    const googleCustomSearchEngineId = googleCustomSearchEngineIdRaw?.trim() || undefined;

    // Log API key status for debugging
    console.log('[Local Indicators] API Keys status:', {
      googlePlaces: googlePlacesApiKey ? 'Set' : 'Missing',
      firecrawl: firecrawlApiKey ? 'Set' : 'Missing',
      googleCustomSearch: googleCustomSearchApiKey ? 'Set' : 'Missing',
      googleCustomSearchEngineId: googleCustomSearchEngineId ? 'Set' : 'Missing',
      clinicName: clinicName || 'Not set',
      city: city || 'Not set',
    });

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
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const auditResult = await performLocalIndicatorsAudit({
        url: normalizedUrl,
        placeId: undefined,
        googleApiKey: googlePlacesApiKey?.trim() || undefined,
        city: city?.trim() || undefined,
        clinicName: clinicName?.trim() || undefined,
        firecrawlApiKey: firecrawlApiKey?.trim() || undefined,
        googleCustomSearchApiKey: googleCustomSearchApiKey?.trim() || undefined,
        googleCustomSearchEngineId: googleCustomSearchEngineId?.trim() || undefined,
      });

      // Update results only after successful completion
      // Results are already saved to database by performLocalIndicatorsAudit
      setResult(auditResult);
      setAuditDate(new Date().toISOString());
      toast.success('Local Indicators audit completed successfully!');

      // Refresh data from database to ensure consistency
      // Small delay to ensure database write is complete
      setTimeout(() => {
        loadAuditData();
      }, 1000);
    } catch (error) {
      console.error('[Local Indicators] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Check for API key errors
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        toast.error('Invalid API keys. Please check your API keys.');
      } else {
        toast.error(`Failed to run Local Indicators audit: ${errorMessage}`);
      }
      // Don't clear result on error - keep previous results visible
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8">
      <LocalIndicatorsHorizon
        result={result}
        auditDate={auditDate}
        isLoading={isLoading}
        isPending={isPending}
        isMounted={isMounted}
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
  shadowSm: '0 4px 12px rgba(112, 144, 176, 0.1)',
};

interface LocalIndicatorsHorizonProps {
  result: LocalIndicatorsAuditResult | null;
  auditDate: string | null;
  isLoading: boolean;
  isPending: boolean;
  isMounted: boolean;
  projectSettings: ProjectSettings | null;
  onRunAudit: () => void;
  resultsRef: React.RefObject<HTMLDivElement | null>;
}

function LocalIndicatorsHorizon({
  result,
  auditDate,
  isLoading: _isLoading,
  isPending,
  isMounted,
  projectSettings,
  onRunAudit,
  resultsRef,
}: LocalIndicatorsHorizonProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: HORIZON.textPrimary }}>
            Локальні показники
          </h1>
          <p className="text-sm mt-1" style={{ color: HORIZON.textSecondary }}>
            Відстежуйте та аналізуйте свої локальні показники в пошуку
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
            {isPending ? 'Запуск аудиту...' : 'Запустити аналіз'}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div ref={resultsRef} className="space-y-6">
        {result ? (
          <LocalIndicatorsSection result={result} />
        ) : (
          <Card
            className="border-none bg-white rounded-[20px] overflow-hidden"
            style={{ boxShadow: HORIZON.shadow }}
          >
            <CardContent className="p-6">
              <LocalIndicatorsColdState
                isRunning={isPending}
                progress={isPending ? 30 : 0}
                currentStep={isPending ? 'Аналізуємо локальну присутність та оптимізацію...' : undefined}
                onRunAudit={onRunAudit}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
