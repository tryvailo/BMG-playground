/**
 * UI Constants for Technical Audit Component
 * Standardized thresholds, benchmarks, and scoring logic
 */

export type MetricStatus = 'good' | 'warning' | 'bad' | 'neutral';

/**
 * Unified score thresholds for all metrics
 * All metrics use consistent boundaries: >= 90 (good), >= 50 (warning), < 50 (bad)
 */
export const SCORE_THRESHOLDS = {
  GOOD: 90,
  WARNING: 50,
  BAD: 0,
} as const;

/**
 * Determine status from numeric score
 */
export function getScoreStatus(score: number | null | undefined): MetricStatus {
  if (score === null || score === undefined) return 'neutral';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'good';
  if (score >= SCORE_THRESHOLDS.WARNING) return 'warning';
  return 'bad';
}

/**
 * Title Analysis Thresholds
 */
export const TITLE_THRESHOLDS = {
  MIN_LENGTH: 50,
  MAX_LENGTH: 60,
  OPTIMAL_LENGTH: 60, // For display purposes
  FALLBACK_LENGTH_MIN: 30,
  FALLBACK_LENGTH_MAX: 65,
} as const;

/**
 * Description Analysis Thresholds
 * Standardized: 150-160 characters (was: 120-165)
 */
export const DESCRIPTION_THRESHOLDS = {
  MIN_LENGTH: 150,
  MAX_LENGTH: 160,
  MIN_FOR_FALLBACK: 150,
  MAX_FOR_FALLBACK: 160,
} as const;

/**
 * Speed Score Thresholds
 * Desktop and Mobile use same thresholds
 */
export const SPEED_THRESHOLDS = {
  GOOD: 90,
  WARNING: 50,
  BAD: 0,
} as const;

/**
 * Core Web Vitals Thresholds (milliseconds for time metrics)
 */
export const CORE_WEB_VITALS = {
  LCP: {
    GOOD: 2500, // 2.5s
    NEEDS_IMPROVEMENT: 4000, // 4s
  },
  FCP: {
    GOOD: 1800, // 1.8s
    NEEDS_IMPROVEMENT: 3000, // 3s
  },
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25,
  },
  TBT: {
    GOOD: 200, // 200ms
    NEEDS_IMPROVEMENT: 600, // 600ms
  },
  TTFB: {
    GOOD: 600, // 600ms
    NEEDS_IMPROVEMENT: 1800, // 1.8s
  },
  SI: {
    GOOD: 3400, // 3.4s
    NEEDS_IMPROVEMENT: 5800, // 5.8s
  },
} as const;

/**
 * Lighthouse Categories Thresholds
 */
export const LIGHTHOUSE_THRESHOLDS = {
  GOOD: 90,
  WARNING: 50,
  BAD: 0,
} as const;

/**
 * External Links Thresholds
 */
export const EXTERNAL_LINKS_THRESHOLDS = {
  DOFOLLOW_MIN: 70, // Minimum percentage
  DOFOLLOW_MAX: 85, // Maximum percentage
  DOFOLLOW_OPTIMAL_RANGE: { min: 70, max: 85 },
} as const;

/**
 * Default Benchmarks for KPI Cards
 */
export const KPI_BENCHMARKS = {
  ai: 75,
  compliance: 100,
  schema: 75,
  seo: 80,
  performance: 90,
} as const;

/**
 * Category Score Weights (for weighted calculation)
 */
export const CATEGORY_WEIGHTS = {
  performance: 0.25,
  seo: 0.25,
  schema: 0.20,
  compliance: 0.20,
  ai: 0.10,
} as const;

/**
 * Get status for external links dofollow percentage
 */
export function getDoFollowStatus(percentage: number | null | undefined): MetricStatus {
  if (percentage === null || percentage === undefined) return 'neutral';
  const min = EXTERNAL_LINKS_THRESHOLDS.DOFOLLOW_MIN;
  const max = EXTERNAL_LINKS_THRESHOLDS.DOFOLLOW_MAX;
  if (percentage >= min && percentage <= max) return 'good';
  if (percentage >= min - 10 && percentage <= max + 10) return 'warning';
  return 'bad';
}

/**
 * Get Core Web Vital status
 */
export function getCoreWebVitalStatus(
  metric: 'LCP' | 'FCP' | 'CLS' | 'TBT' | 'TTFB' | 'SI',
  value: number | null | undefined,
): MetricStatus {
  if (value === null || value === undefined) return 'neutral';
  
  const thresholds = CORE_WEB_VITALS[metric];
  if (value <= thresholds.GOOD) return 'good';
  if (value <= thresholds.NEEDS_IMPROVEMENT) return 'warning';
  return 'bad';
}

/**
 * Get Lighthouse category status
 */
export function getLighthouseStatus(score: number | null | undefined): MetricStatus {
  if (score === null || score === undefined) return 'neutral';
  if (score >= LIGHTHOUSE_THRESHOLDS.GOOD) return 'good';
  if (score >= LIGHTHOUSE_THRESHOLDS.WARNING) return 'warning';
  return 'bad';
}

/**
 * Determine if a value is optimal length
 */
export function isOptimalTitleLength(length: number | null | undefined): boolean {
  if (!length) return false;
  return length >= TITLE_THRESHOLDS.MIN_LENGTH && length <= TITLE_THRESHOLDS.MAX_LENGTH;
}

/**
 * Determine if a value is optimal description length
 */
export function isOptimalDescriptionLength(length: number | null | undefined): boolean {
  if (!length) return false;
  return length >= DESCRIPTION_THRESHOLDS.MIN_LENGTH && length <= DESCRIPTION_THRESHOLDS.MAX_LENGTH;
}

/**
 * Format metric status for display
 */
export function formatStatusBadge(status: MetricStatus): {
  text: string;
  emoji: string;
} {
  switch (status) {
    case 'good':
      return { text: 'Good', emoji: '✓' };
    case 'warning':
      return { text: 'Needs Improvement', emoji: '⚠' };
    case 'bad':
      return { text: 'Poor', emoji: '✗' };
    case 'neutral':
      return { text: 'N/A', emoji: '—' };
  }
}
