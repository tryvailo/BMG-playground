/**
 * MetaTagsCard Component
 * Week 4, Days 1-2: Display meta tags analysis
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import {
  MetaAnalysisResult,
  getMetaTagBadgeVariant,
  getMetaTagStatus,
  formatMetaContent,
} from '~/lib/modules/audit/meta-analyzer';

export interface MetaTagsCardProps {
  analysis: MetaAnalysisResult;
  isLoading?: boolean;
}

export function MetaTagsCard({ analysis, isLoading = false }: MetaTagsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meta Tags & SEO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Meta Tags & SEO</CardTitle>
            <CardDescription>Page-level optimization</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold">{analysis.score}</div>
              <div className="text-xs text-muted-foreground">SEO Score</div>
            </div>
            <Badge variant={analysis.score >= 80 ? 'success' : analysis.score >= 50 ? 'warning' : 'destructive'}>
              {analysis.score >= 80 ? 'Excellent' : analysis.score >= 50 ? 'Good' : 'Needs Work'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Issues Summary */}
        {(analysis.criticalIssues > 0 || analysis.warningIssues > 0) && (
          <div className="bg-muted p-3 rounded-lg flex items-start gap-2">
            <div className="flex-1">
              {analysis.criticalIssues > 0 && (
                <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {analysis.criticalIssues} critical issue{analysis.criticalIssues > 1 ? 's' : ''}
                </div>
              )}
              {analysis.warningIssues > 0 && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {analysis.warningIssues} warning{analysis.warningIssues > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meta Tags */}
        <div className="space-y-3">
          {/* Title */}
          <MetaTagRow
            tag={analysis.title}
            label="Page Title"
            lengthHint="30-60 chars"
          />

          {/* Description */}
          <MetaTagRow
            tag={analysis.description}
            label="Meta Description"
            lengthHint="120-160 chars"
          />

          {/* Canonical */}
          <MetaTagRow
            tag={analysis.canonical}
            label="Canonical URL"
          />

          {/* Charset */}
          <MetaTagRow
            tag={analysis.charset}
            label="Charset"
          />

          {/* Viewport */}
          <MetaTagRow
            tag={analysis.viewport}
            label="Viewport"
          />

          {/* OG Tags */}
          <div className="border-t pt-3">
            <div className="text-sm font-medium mb-2">Social Media</div>
            <div className="space-y-2">
              <MetaTagRow
                tag={analysis.ogTitle}
                label="OG Title"
                compact
              />
              <MetaTagRow
                tag={analysis.ogDescription}
                label="OG Description"
                compact
              />
              <MetaTagRow
                tag={analysis.ogImage}
                label="OG Image"
                compact
              />
              <MetaTagRow
                tag={analysis.twitterCard}
                label="Twitter Card"
                compact
              />
            </div>
          </div>

          {/* Robots */}
          <div className="border-t pt-3">
            <MetaTagRow
              tag={analysis.robots}
              label="Robots"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * MetaTagRow Component
 */
interface MetaTagRowProps {
  tag: {
    content: string;
    present: boolean;
    optimal: boolean;
    recommendation?: string;
  };
  label: string;
  lengthHint?: string;
  compact?: boolean;
}

function MetaTagRow({ tag, label, lengthHint, compact = false }: MetaTagRowProps) {
  const status = getMetaTagStatus(tag.optimal, tag.present);
  const variant = getMetaTagBadgeVariant(tag.optimal, tag.present);

  return (
    <div className={`flex items-start justify-between ${!compact ? 'pb-3 border-b last:border-b-0' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{label}</span>
          <Badge variant={variant} className="text-xs">
            {status}
          </Badge>
          {tag.optimal && <CheckCircle className="w-4 h-4 text-green-600" />}
        </div>
        {tag.content && (
          <div className="text-xs text-muted-foreground">
            {formatMetaContent(tag.content)}
            {lengthHint && <span className="ml-2">({tag.content.length} chars)</span>}
          </div>
        )}
        {tag.recommendation && !tag.optimal && (
          <div className="text-xs text-amber-600 mt-1">💡 {tag.recommendation}</div>
        )}
      </div>
    </div>
  );
}
