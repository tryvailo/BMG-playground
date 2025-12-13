'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';

import { PageBody } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { EEATAuditSection } from '~/components/features/playground/EEATAuditSection';
import { runEEATAudit } from '~/lib/actions/eeat-audit';
import type { EEATAuditResult } from '~/lib/server/services/eeat/types';

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
 * E-E-A-T Assessment Page
 */
export default function EEATAssessmentPage() {
  const [result, setResult] = useState<EEATAuditResult | null>(null);
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
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const auditResult = await runEEATAudit({
        url: normalizedUrl,
        multiPage: false,
        filterType: 'all',
        maxPages: 50,
      });

      setResult(auditResult);
      toast.success('E-E-A-T Assessment completed successfully!');
    } catch (error) {
      console.error('[E-E-A-T Assessment] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to run E-E-A-T Assessment: ${errorMessage}`);
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
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">E-E-A-T Assessment</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Domain is configured in the Configuration page.
              </p>
              <Button
                onClick={handleRunAudit}
                disabled={isPending || !isMounted || !getStoredValue(STORAGE_KEYS.DOMAIN)}
                className="w-full lg:w-auto"
              >
                <If condition={isPending}>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                </If>
                Start Assessment
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-h-[400px]">
            {result ? (
              <EEATAuditSection
                defaultUrl={(() => {
                  const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
                  return domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : '';
                })()}
                result={result}
              />
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Run an E-E-A-T assessment to see results here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageBody>
  );
}

