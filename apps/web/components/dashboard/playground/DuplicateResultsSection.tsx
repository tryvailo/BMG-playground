'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@kit/ui/card';

const HORIZON = {
  primary: '#4318FF',
  success: '#01B574',
  warning: '#FFB547',
  error: '#EE5D50',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
};

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Badge } from '@kit/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';
import type { DuplicateAnalysisResult, DuplicateResult } from '~/lib/utils/duplicate-analyzer';

interface DuplicateResultsSectionProps {
  data: DuplicateAnalysisResult | null;
  isLoading?: boolean;
  source?: 'sitemap' | 'crawl' | 'sitemap+crawl';
  sitemapUrl?: string;
}

function DuplicatePairCard({ duplicate }: { duplicate: DuplicateResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const isHighSimilarity = duplicate.similarity >= 95;

  return (
    <Card className={cn(
      'hover:shadow-xl transition-all duration-300 border-none rounded-[16px] border-l-4 overflow-hidden',
      isHighSimilarity 
        ? 'border-l-red-500 bg-red-50/30 dark:bg-red-950/10'
        : 'border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10'
    )}
      style={{ boxShadow: HORIZON.shadow }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isHighSimilarity ? (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                )}
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
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Page A</div>
              <a href={duplicate.urlA} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="flex items-start gap-2 p-2 rounded-md hover:bg-accent transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-primary group-hover:underline truncate">
                        {duplicate.titleA || 'Untitled'}
                      </span>
                      <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{duplicate.urlA}</p>
                  </div>
                </div>
              </a>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Page B</div>
              <a href={duplicate.urlB} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="flex items-start gap-2 p-2 rounded-md hover:bg-accent transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-primary group-hover:underline truncate">
                        {duplicate.titleB || 'Untitled'}
                      </span>
                      <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{duplicate.urlB}</p>
                  </div>
                </div>
              </a>
            </div>
            {isHighSimilarity && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-red-600 dark:text-red-400">
                  ⚠️ High similarity detected. Consider consolidating or rewriting content.
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function SourceBadge({ source, sitemapUrl }: { source?: string; sitemapUrl?: string }) {
  if (!source) return null;
  
  const sourceLabels: Record<string, { label: string; color: string }> = {
    'sitemap': { label: 'Sitemap', color: HORIZON.success },
    'crawl': { label: 'Crawl', color: HORIZON.primary },
    'sitemap+crawl': { label: 'Sitemap + Crawl', color: HORIZON.warning },
  };
  
  const config = sourceLabels[source] || { label: source, color: HORIZON.primary };
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge 
        variant="outline" 
        className="font-medium"
        style={{ borderColor: config.color, color: config.color }}
      >
        📄 {config.label}
      </Badge>
      {sitemapUrl && (
        <a 
          href={sitemapUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          <span className="hidden sm:inline">View Sitemap</span>
        </a>
      )}
    </div>
  );
}

export function DuplicateResultsSection({ data, isLoading, source, sitemapUrl }: DuplicateResultsSectionProps) {
  if (!data && !isLoading) return null;

  return (
    <Card className="border-none rounded-[20px] transition-all duration-300 shadow-none" style={{ boxShadow: HORIZON.shadow }}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[#1B2559]">Duplicate Content Analysis</CardTitle>
            <CardDescription className="text-[#A3AED0]">
              Internal content duplication risks and SEO penalty factors.
            </CardDescription>
          </div>
          <SourceBadge source={source} sitemapUrl={sitemapUrl} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="animate-pulse h-4 w-48 bg-slate-200 rounded mb-2"></div>
            <div className="animate-pulse h-3 w-32 bg-slate-100 rounded"></div>
          </div>
        ) : data && data.duplicatesFound === 0 ? (
          <Alert className="border-none rounded-xl" style={{ backgroundColor: `${HORIZON.success}10` }}>
            <CheckCircle2 className="h-5 w-5" style={{ color: HORIZON.success }} />
            <AlertTitle className="font-bold" style={{ color: HORIZON.success }}>
              No Duplicates Found
            </AlertTitle>
            <AlertDescription className="font-medium" style={{ color: HORIZON.success }}>
              No duplicate content found in {data.pagesScanned} scanned pages.
            </AlertDescription>
          </Alert>
        ) : data && data.duplicatesFound > 0 ? (
          <>
            <Alert className="border-none rounded-xl" style={{ backgroundColor: `${HORIZON.warning}10` }}>
              <AlertTriangle className="h-5 w-5" style={{ color: HORIZON.warning }} />
              <AlertTitle className="font-bold" style={{ color: HORIZON.warning }}>
                Duplicate Content Detected
              </AlertTitle>
              <AlertDescription className="font-medium" style={{ color: HORIZON.warning }}>
                Found {data.duplicatesFound} duplicate pair{data.duplicatesFound !== 1 ? 's' : ''} in {data.pagesScanned} pages.
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
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
