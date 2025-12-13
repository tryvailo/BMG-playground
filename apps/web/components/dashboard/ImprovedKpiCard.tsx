/**
 * Improved KPI Card Component
 * 
 * This is an example of an improved KPI card that follows Makerkit design system:
 * - Uses Card components from Makerkit
 * - Uses design tokens instead of hardcoded colors
 * - Supports loading states
 * - Better dark mode support
 * - Smooth animations and transitions
 */

'use client';

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Skeleton } from '@kit/ui/skeleton';
import { cn } from '@kit/ui/utils';
import { getMetricColorVariant, type MetricColorVariant } from '~/lib/design/metric-colors';

export interface ImprovedKpiCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
  variant?: MetricColorVariant;
  description?: string;
  note?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Improved KPI Card with proper design system integration
 */
export function ImprovedKpiCard({
  title,
  value,
  trend,
  icon: Icon,
  variant = 'primary',
  description,
  note,
  loading = false,
  className,
}: ImprovedKpiCardProps) {
  const colors = getMetricColorVariant(variant);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = trend !== undefined && trend >= 0;
  const trendAbs = trend !== undefined ? Math.abs(trend) : 0;
  const trendDisplay =
    trend !== undefined && trendAbs > 0
      ? `${isPositive ? '+' : ''}${trend.toFixed(1)}%`
      : null;

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md hover:border-primary/20',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trendDisplay && (
          <div className="flex items-center mt-4 text-xs">
            {isPositive ? (
              <ArrowUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-400 mr-1" />
            )}
            <span
              className={cn(
                'font-medium',
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {trendDisplay}
            </span>
            <span className="text-muted-foreground ml-2">vs last month</span>
          </div>
        )}
        {note && !trendDisplay && (
          <p className="text-xs text-muted-foreground mt-2">{note}</p>
        )}
      </CardContent>
    </Card>
  );
}


