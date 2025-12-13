'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';

import { PageBody } from '@kit/ui/page';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { If } from '@kit/ui/if';

import { ContentAuditSection } from '~/components/features/playground/ContentAuditSection';
import { performContentAudit } from '~/lib/actions/content-audit';
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
 * Content Optimization Page
 */
export default function ContentOptimizationPage() {
  const [result, setResult] = useState<ContentAuditResult | null>(null);
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
      const auditResult = await performContentAudit({
        url: normalizedUrl,
      });

      setResult(auditResult);
      toast.success('Content Optimization audit completed successfully!');
    } catch (error) {
      console.error('[Content Optimization] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to run Content Optimization audit: ${errorMessage}`);
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
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Content Optimization</CardTitle>
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
                Analyze Content
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-h-[400px]">
            {result ? (
              <ContentAuditSection
                defaultUrl={(() => {
                  const domain = getStoredValue(STORAGE_KEYS.DOMAIN);
                  return domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : '';
                })()}
                result={result}
              />
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Run a content optimization audit to see results here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageBody>
  );
}

