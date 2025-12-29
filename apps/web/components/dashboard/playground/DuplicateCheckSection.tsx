'use client';

import React, { useState, useTransition } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ChevronDown,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Badge } from '@kit/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';
import type { DuplicateAnalysisResult, DuplicateResult } from '~/lib/utils/duplicate-analyzer';

interface DuplicateCheckSectionProps {
  targetUrl: string;
  apiKeyFirecrawl?: string;
  initialData?: DuplicateAnalysisResult | null;
  initialStatus?: Status;
  initialError?: string | null;
}

type Status = 'idle' | 'scanning' | 'complete' | 'error';

/**
 * Minimal Duplicate Pair Card Component
 * Displays a duplicate pair in a compact, expandable card
 */
interface DuplicatePairCardProps {
  duplicate: DuplicateResult;
}

function DuplicatePairCard({ duplicate }: DuplicatePairCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isHighSimilarity = duplicate.similarity >= 95;

  const getStatusColor = () => {
    if (isHighSimilarity) {
      return 'border-l-red-500 bg-red-50/30 dark:bg-red-950/10';
    }
    return 'border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10';
  };

  const getStatusIcon = () => {
    if (isHighSimilarity) {
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
    return <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
  };

  return (
    <Card className={cn(
      'hover:shadow-sm transition-shadow border-l-4',
      getStatusColor()
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {duplicate.titleA || duplicate.urlA}
                    </span>
                    <span className="text-xs text-muted-foreground">↔</span>
                    <span className="text-sm font-medium text-foreground truncate">
                      {duplicate.titleB || duplicate.urlB}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={isHighSimilarity ? 'destructive' : 'default'}
                  className="font-semibold shrink-0"
                >
                  {duplicate.similarity}%
                </Badge>
                <ChevronDown className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                  isOpen && 'rotate-180'
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-3">
            {/* Page A Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>Page A</span>
              </div>
              <a
                href={duplicate.urlA}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="flex items-start gap-2 p-2 rounded-md hover:bg-accent transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-primary group-hover:underline truncate">
                        {duplicate.titleA || 'Untitled'}
                      </span>
                      <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {duplicate.urlA}
                    </p>
                  </div>
                </div>
              </a>
            </div>

            {/* Page B Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>Page B</span>
              </div>
              <a
                href={duplicate.urlB}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="flex items-start gap-2 p-2 rounded-md hover:bg-accent transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-primary group-hover:underline truncate">
                        {duplicate.titleB || 'Untitled'}
                      </span>
                      <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {duplicate.urlB}
                    </p>
                  </div>
                </div>
              </a>
            </div>

            {/* Similarity Info */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Similarity Score:
                </span>
                <span className={cn(
                  'font-semibold',
                  isHighSimilarity ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                )}>
                  {duplicate.similarity}% match
                </span>
              </div>
              {isHighSimilarity && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  ⚠️ High similarity detected. Consider consolidating or rewriting content.
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function DuplicateCheckSection({ 
  targetUrl, 
  apiKeyFirecrawl,
  initialData = null,
  initialStatus = 'idle',
  initialError = null,
}: DuplicateCheckSectionProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [data, setData] = useState<DuplicateAnalysisResult | null>(initialData);
  const [error, setError] = useState<string | null>(initialError);
  const [, startTransition] = useTransition();

  // Update state when initial props change
  React.useEffect(() => {
    if (initialData !== undefined) {
      setData(initialData);
    }
    if (initialStatus !== undefined) {
      setStatus(initialStatus);
    }
    if (initialError !== undefined) {
      setError(initialError);
    }
  }, [initialData, initialStatus, initialError]);

  const handleStartScan = () => {
    if (!targetUrl || !targetUrl.trim()) {
      setError('Please provide a valid URL');
      setStatus('error');
      return;
    }

    console.log('[DuplicateCheckSection] Starting deep scan for:', targetUrl);
    setStatus('scanning');
    setError(null);
    setData(null);

    startTransition(async () => {
      try {
        const requestBody = {
          url: targetUrl.trim(),
          limit: 50,
          apiKeyFirecrawl: apiKeyFirecrawl?.trim(),
        };
        
        console.log('[DuplicateCheckSection] Sending request to /api/duplicate-check:', {
          url: requestBody.url,
          limit: requestBody.limit,
          hasApiKey: !!requestBody.apiKeyFirecrawl,
        });

        const response = await fetch('/api/duplicate-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('[DuplicateCheckSection] Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
          setError(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          setStatus('error');
          return;
        }

        const result = await response.json();
        console.log('[DuplicateCheckSection] Response data:', result);

        if (result.success) {
          console.log('[DuplicateCheckSection] Scan completed successfully. Found:', result.data.duplicatesFound, 'duplicates');
          setData(result.data);
          setStatus('complete');
        } else {
          console.error('[DuplicateCheckSection] Scan failed:', result.error);
          setError(result.error || 'An error occurred while scanning for duplicates');
          setStatus('error');
        }
      } catch (err) {
        console.error('[DuplicateCheckSection] Request error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        setStatus('error');
      }
    });
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Deep Content Analysis
        </CardTitle>
        <CardDescription>
          Scans up to 50 internal pages to find content duplicates (SEO Penalty Risk). Adjustable limit: 10-100 pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Idle State */}
        {status === 'idle' && (
          <div className="space-y-4">
            <Button
              onClick={handleStartScan}
              disabled={!targetUrl || !targetUrl.trim()}
              className="w-full sm:w-auto"
              size="lg"
            >
              <Search className="mr-2 h-4 w-4" />
              Start Deep Scan (30-60s)
            </Button>
            <p className="text-sm text-muted-foreground">
              ⏱️ Requires waiting. The scan will crawl your website and analyze content similarity.
            </p>
          </div>
        )}

        {/* Scanning State */}
        {status === 'scanning' && (
          <div className="space-y-4">
            <Button disabled className="w-full sm:w-auto" size="lg">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </Button>
            <div className="space-y-2">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="absolute h-full w-full animate-pulse bg-primary/30" />
              </div>
              <p className="text-sm text-muted-foreground">
                Crawling site structure & analyzing content...
              </p>
            </div>
          </div>
        )}

        {/* Complete State - No Duplicates */}
        {status === 'complete' && data && data.duplicatesFound === 0 && (
          <div className="space-y-4">
            <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="text-emerald-800 dark:text-emerald-300">
                No Duplicates Found
              </AlertTitle>
              <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                Great! No duplicate content found in the scanned sample of {data.pagesScanned} pages.
              </AlertDescription>
            </Alert>

            <div className="rounded-md bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pages Scanned:</span>
                <span className="font-semibold text-foreground">
                  {data.pagesScanned}
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                setStatus('idle');
                setData(null);
                setError(null);
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Run Another Scan
            </Button>
          </div>
        )}

        {/* Complete State - Duplicates Found */}
        {status === 'complete' && data && data.duplicatesFound > 0 && (
          <div className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-300">
                Duplicate Content Detected
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                Found {data.duplicatesFound} duplicate pair{data.duplicatesFound !== 1 ? 's' : ''} in{' '}
                {data.pagesScanned} scanned pages. This can negatively impact SEO rankings.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Duplicate Pairs ({data.duplicatesFound}):
              </h4>
              <div className="space-y-2">
                {data.results.map((duplicate, index) => (
                  <DuplicatePairCard key={`${duplicate.urlA}-${duplicate.urlB}-${index}`} duplicate={duplicate} />
                ))}
              </div>
            </div>

            <Button
              onClick={() => {
                setStatus('idle');
                setData(null);
                setError(null);
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Run Another Scan
            </Button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Scan Failed</AlertTitle>
              <AlertDescription>
                {error || 'An error occurred while scanning for duplicates.'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => {
                setStatus('idle');
                setError(null);
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

