/**
 * Metric Colors Configuration
 * 
 * Centralized color system for metrics and KPIs
 * Uses design tokens that work with both light and dark themes
 */

import { cn } from '@kit/ui/utils';

export const metricColors = {
  primary: {
    bg: 'bg-primary/10 dark:bg-primary/20',
    text: 'text-primary',
    border: 'border-primary/20 dark:border-primary/30',
    icon: 'text-primary',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    text: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
    icon: 'text-cyan-600 dark:text-cyan-400',
  },
} as const;

export type MetricColorVariant = keyof typeof metricColors;

export function getMetricColorVariant(variant: MetricColorVariant) {
  return metricColors[variant];
}

/**
 * Get color classes for a metric variant
 */
export function getMetricColorClasses(variant: MetricColorVariant) {
  const colors = getMetricColorVariant(variant);
  return {
    container: cn(colors.bg, colors.border),
    text: colors.text,
    icon: colors.icon,
  };
}


