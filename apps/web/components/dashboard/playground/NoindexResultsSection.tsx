'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  XCircle,
  EyeOff,
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
import type { NoindexAnalysisResult, NoindexPage } from '~/lib/modules/audit/utils/noindex-crawler';

interface NoindexResultsSectionProps {
  data: NoindexAnalysisResult | null;
  isLoading?: boolean;
}

function NoindexPageCard({ page }: { page: NoindexPage }) {
  const [isOpen, setIsOpen] = useState(false);

  const getSourceLabel = () => {
    switch (page.source) {
      case 'meta': return 'Meta Tag';
      case 'header': return 'X-Robots-Tag';
      case 'both': return 'Meta + Header';
    }
  };

  return (
    <Card className={cn(
      'hover:shadow-xl transition-all duration-300 border-none rounded-[16px] border-l-4 overflow-hidden',
      'border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10'
    )}
      style={{ boxShadow: HORIZON.shadow }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <EyeOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate block">
                    {page.url}
                  </span>
                </div>
                <Badge variant="outline" className="shrink-0 bg-orange-100 text-orange-800 border-orange-200">
                  {getSourceLabel()}
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
            <a href={page.url} target="_blank" rel="noopener noreferrer" className="block group">
              <div className="flex items-start gap-2 p-2 rounded-md hover:bg-accent transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-primary group-hover:underline truncate">
                      Відкрити сторінку
                    </span>
                    <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{page.url}</p>
                </div>
              </div>
            </a>
            {(page.metaRobots || page.xRobotsTag) && (
              <div className="pt-2 border-t border-border space-y-2">
                {page.metaRobots && (
                  <div className="flex items-start justify-between text-xs">
                    <span className="text-muted-foreground">Meta Robots:</span>
                    <code className="font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                      {page.metaRobots}
                    </code>
                  </div>
                )}
                {page.xRobotsTag && (
                  <div className="flex items-start justify-between text-xs">
                    <span className="text-muted-foreground">X-Robots-Tag:</span>
                    <code className="font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                      {page.xRobotsTag}
                    </code>
                  </div>
                )}
              </div>
            )}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-orange-600 dark:text-orange-400">
                ⚠️ Ця сторінка є в sitemap.xml, але має noindex. Видаліть її з sitemap або зніміть noindex.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function getScoreColor(score: number) {
  if (score >= 80) return HORIZON.success;
  if (score >= 50) return HORIZON.warning;
  return HORIZON.error;
}

export function NoindexResultsSection({ data, isLoading }: NoindexResultsSectionProps) {
  if (!data && !isLoading) return null;

  return (
    <Card className="border-none rounded-[20px] transition-all duration-300 shadow-none" style={{ boxShadow: HORIZON.shadow }}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#1B2559]">Noindex Pages Analysis</CardTitle>
        <CardDescription className="text-[#A3AED0]">
          Pages with noindex directive that are in sitemap.xml
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="animate-pulse h-4 w-48 bg-slate-200 rounded mb-2"></div>
            <div className="animate-pulse h-3 w-32 bg-slate-100 rounded"></div>
          </div>
        ) : data && data.noindexCount === 0 ? (
          <Alert className="border-none rounded-xl" style={{ backgroundColor: `${HORIZON.success}10` }}>
            <CheckCircle2 className="h-5 w-5" style={{ color: HORIZON.success }} />
            <AlertTitle className="font-bold" style={{ color: HORIZON.success }}>
              No Issues Found
            </AlertTitle>
            <AlertDescription className="font-medium" style={{ color: HORIZON.success }}>
              No noindex pages found in sitemap.xml. Checked {data.totalPagesChecked} pages.
            </AlertDescription>
          </Alert>
        ) : data && data.noindexCount > 0 ? (
          <>
            <Alert className="border-none rounded-xl" style={{ backgroundColor: `${HORIZON.warning}10` }}>
              <AlertTriangle className="h-5 w-5" style={{ color: HORIZON.warning }} />
              <AlertTitle className="font-bold" style={{ color: HORIZON.warning }}>
                Noindex Pages in Sitemap
              </AlertTitle>
              <AlertDescription className="font-medium" style={{ color: HORIZON.warning }}>
                Found {data.noindexCount} noindex pages in sitemap.xml ({data.noindexPercent}%).
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-muted p-4">
                <div className="text-sm text-muted-foreground mb-1">Перевірено</div>
                <div className="text-2xl font-bold text-foreground">{data.totalPagesChecked}</div>
              </div>
              <div className="rounded-md p-4" style={{ backgroundColor: `${getScoreColor(data.score)}10` }}>
                <div className="text-sm text-muted-foreground mb-1">Score</div>
                <div className="text-2xl font-bold" style={{ color: getScoreColor(data.score) }}>
                  {data.score}/100
                </div>
              </div>
            </div>

            {data.issues.length > 0 && (
              <div className="rounded-md bg-orange-50 dark:bg-orange-950/20 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200">Проблеми:</h4>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                  {data.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Сторінки з noindex ({data.noindexCount}):
              </h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {data.noindexPages.map((page, index) => (
                  <NoindexPageCard key={`${page.url}-${index}`} page={page} />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
