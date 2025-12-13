'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, MapPin } from 'lucide-react';

import { PageBody } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { LocalIndicatorsSection } from '~/components/features/playground/LocalIndicatorsSection';
import { performLocalIndicatorsAudit } from '~/lib/actions/local-indicators-audit';
import type { LocalIndicatorsAuditResult } from '~/lib/server/services/local/types';

/**
 * LocalStorage Keys - Using global configuration keys
 */
const STORAGE_KEYS = {
  DOMAIN: 'configuration_domain',
  CITY: 'configuration_city',
  GOOGLE_PLACES_API_KEY: 'configuration_api_key_google_places', // Use Google Places API key from Configuration
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
 * Local Indicators Page
 */
export default function LocalIndicatorsPage() {
  const [result, setResult] = useState<LocalIndicatorsAuditResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load configuration values from localStorage on mount
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRunAudit = async () => {
    setIsPending(true);
    setResult(null);

    // Get configuration values
    const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
    const city = getStoredValue(STORAGE_KEYS.CITY);
    const googlePlacesApiKey = getStoredValue(STORAGE_KEYS.GOOGLE_PLACES_API_KEY);

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
        placeId: undefined, // Place ID removed - can be added to Configuration if needed
        googleApiKey: googlePlacesApiKey?.trim() || undefined,
        city: city?.trim() || undefined,
      });

      setResult(auditResult);
      toast.success('Local Indicators audit completed successfully!');
    } catch (error) {
      console.error('[Local Indicators] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check for API key errors
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        toast.error('Invalid API keys. Please check your API keys.');
      } else {
        toast.error(`Failed to run Local Indicators audit: ${errorMessage}`);
      }
      setResult(null);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <PageBody>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full min-h-full">
        <div className="flex flex-col space-y-6 h-full min-h-full">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Local Indicators</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Domain, city, and API keys are configured in the Configuration page.
                </p>

                <Button
                  onClick={handleRunAudit}
                  disabled={isPending || !isMounted || !getStoredValue(STORAGE_KEYS.DOMAIN)}
                  className="w-full lg:w-auto"
                >
                  <If condition={isPending}>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  </If>
                  Run Local Indicators Audit
                </Button>
              </div>
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-h-[400px]">
            {result ? (
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
      </div>
    </PageBody>
  );
}


