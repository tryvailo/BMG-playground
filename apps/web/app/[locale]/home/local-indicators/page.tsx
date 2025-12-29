'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, MapPin } from 'lucide-react';

import { PageBody } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { LocalIndicatorsSection } from '~/components/features/playground/LocalIndicatorsSection';
import { performLocalIndicatorsAudit, getLatestLocalIndicatorsAudit } from '~/lib/actions/local-indicators-audit';
import type { LocalIndicatorsAuditResult } from '~/lib/server/services/local/types';

/**
 * LocalStorage Keys - Using global configuration keys
 */
const STORAGE_KEYS = {
  DOMAIN: 'configuration_domain',
  CITY: 'configuration_city',
  CLINIC_NAME: 'configuration_clinic_name',
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
  const resultsRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false); // Prevent multiple simultaneous loads

  // Function to load audit data
  const loadAuditData = React.useCallback(async (skipLoadingState = false, forceReload = false) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current && !forceReload) {
      console.log('[Local Indicators] Load already in progress, skipping');
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
        // Only clear state if we don't have existing data (to prevent clearing after successful load)
        // This prevents data from disappearing after initial load
        setResult((prevResult) => {
          if (prevResult === null) {
            return null; // Already null, no change needed
          }
          // Keep existing data if we have it, don't clear
          console.log('[Local Indicators] Keeping existing data, not clearing');
          return prevResult;
        });
        // Only clear auditDate if we're clearing result
        setAuditDate((prevDate) => {
          // Keep existing date if we have previous result
          return prevDate;
        });
      }
    } catch (error) {
      console.error('[Local Indicators] Error fetching audit data:', error);
      // Don't clear existing data on error
    } finally {
      isLoadingRef.current = false;
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    setIsMounted(true);
    loadAuditData();
  }, [loadAuditData]);

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

    // Get configuration values
    const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
    const city = getStoredValue(STORAGE_KEYS.CITY);
    const clinicName = getStoredValue(STORAGE_KEYS.CLINIC_NAME);
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
    <PageBody>
      <div className="flex-1 flex flex-col space-y-8 p-4 lg:p-8 min-h-screen" style={{ backgroundColor: '#F4F7FE' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#1B2559' }}>
              Локальні показники
            </h1>
            <p className="text-sm mt-1" style={{ color: '#A3AED0' }}>
              Відстежуйте та аналізуйте свої локальні показники в пошуку
            </p>
          </div>
        </div>

        <Card className="border-none bg-white rounded-[20px] overflow-hidden transition-all duration-300 shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#4318FF15]">
                    <MapPin className="h-5 w-5 text-[#4318FF]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#1B2559]">Local SEO Analysis</h2>
                </div>
                <p className="text-sm text-[#A3AED0] max-w-md">Запустіть глибокий аудит вашого Google Business Profile та локальної видимості.</p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-3">
                {auditDate && (
                  <p className="text-xs font-medium text-[#A3AED0]">
                    Останній аудит: {new Date(auditDate).toLocaleString('uk-UA')}
                  </p>
                )}
                <Button
                  onClick={handleRunAudit}
                  disabled={isPending || !isMounted || !getStoredValue(STORAGE_KEYS.DOMAIN)}
                  className="w-full lg:w-auto bg-[#4318FF] hover:bg-[#4318FF]/90 text-white rounded-xl px-8 h-12 font-bold transition-all duration-200 shadow-[0_4px_12px_rgba(67,24,255,0.2)]"
                >
                  <If condition={isPending}>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  </If>
                  {isPending ? 'Запуск аудиту...' : 'Запустити аналіз'}
                </Button>
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
          ) : result ? (
            <LocalIndicatorsSection result={result} />
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Run a local indicators audit to see results here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageBody>
  );
}
