/**
 * RecommendationsPanel Component
 * Week 5: AI-powered recommendations display
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Skeleton } from '@kit/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@kit/ui/accordion';
import {
  Eye,
  Settings,
  FileText,
  Code,
  MapPin,
  Zap,
  Info,
  Sparkles,
  RefreshCw,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { Recommendation } from '~/lib/modules/ai/recommendation-generator';

interface RecommendationsPanelProps {
  projectId: string;
  recommendations?: Recommendation[];
  summary?: string;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  visibility: <Eye className="h-4 w-4" />,
  technical: <Settings className="h-4 w-4" />,
  content: <FileText className="h-4 w-4" />,
  schema: <Code className="h-4 w-4" />,
  local: <MapPin className="h-4 w-4" />,
  performance: <Zap className="h-4 w-4" />,
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const priorityBadgeVariants: Record<string, 'destructive' | 'warning' | 'secondary'> = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
};

export function RecommendationsPanel({
  projectId: _projectId,
  recommendations = [],
  summary,
  loading = false,
  error,
  onRefresh,
}: RecommendationsPanelProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Recommendations</CardTitle>
          </div>
          <CardDescription>Generating personalized recommendations...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>AI Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Recommendations</CardTitle>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No recommendations yet. Click &quot;Generate&quot; to get AI-powered insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highPriority = recommendations.filter((r) => r.priority === 'high');
  const mediumPriority = recommendations.filter((r) => r.priority === 'medium');
  const lowPriority = recommendations.filter((r) => r.priority === 'low');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Recommendations</CardTitle>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
        {summary && (
          <CardDescription className="mt-2 text-sm leading-relaxed">
            {summary}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {/* Priority Summary */}
        <div className="flex gap-4 mb-6">
          {highPriority.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{highPriority.length}</Badge>
              <span className="text-sm text-muted-foreground">High Priority</span>
            </div>
          )}
          {mediumPriority.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="warning">{mediumPriority.length}</Badge>
              <span className="text-sm text-muted-foreground">Medium</span>
            </div>
          )}
          {lowPriority.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{lowPriority.length}</Badge>
              <span className="text-sm text-muted-foreground">Low</span>
            </div>
          )}
        </div>

        {/* Recommendations List */}
        <Accordion
          type="multiple"
          value={expandedItems}
          onValueChange={setExpandedItems}
          className="space-y-3"
        >
          {recommendations.map((rec) => (
            <AccordionItem
              key={rec.id}
              value={rec.id}
              className={`border rounded-lg px-4 ${priorityColors[rec.priority]}`}
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0">
                    {categoryIcons[rec.category] || <Info className="h-4 w-4" />}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">{rec.title}</div>
                    <div className="text-xs text-muted-foreground capitalize mt-1">
                      {rec.category} • {rec.effort} effort
                    </div>
                  </div>
                  <Badge variant={priorityBadgeVariants[rec.priority]} className="flex-shrink-0">
                    {rec.priority}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-4">
                  {/* Description */}
                  <p className="text-sm">{rec.description}</p>

                  {/* Impact */}
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 mt-0.5 text-amber-500" />
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Expected Impact:
                      </span>
                      <p className="text-sm">{rec.impact}</p>
                    </div>
                  </div>

                  {/* Steps */}
                  {rec.steps && rec.steps.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Implementation Steps:
                      </span>
                      <ul className="mt-2 space-y-2">
                        {rec.steps.map((step, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
