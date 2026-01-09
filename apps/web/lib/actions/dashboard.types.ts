import { z } from 'zod';

/*
 * -------------------------------------------------------
 * Dashboard Filters Schema
 * -------------------------------------------------------
 */

export const DashboardFiltersSchema = z.object({
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional(),
  aiEngine: z.enum(['all', 'openai', 'perplexity', 'claude']).optional(),
  serviceId: z.string().optional(),
});

export type DashboardFilters = z.infer<typeof DashboardFiltersSchema>;

/*
 * -------------------------------------------------------
 * Dashboard Metrics Response Types
 * -------------------------------------------------------
 */

export interface DashboardKPIs {
  avgAivScore: number; // ClinicAI Score (0-100)
  serviceVisibility: number; // Percentage of visible services
  avgPosition: number | null; // Average rank of visible services
  totalServices: number; // Total number of tracked services
  // Breakdown metrics for second row
  techOptimization: number; // Tech Score (0-100)
  contentOptimization: number; // Content Score (0-100)
  eeatSignal: number; // E-E-A-T Score (0-100, scaled from 1-10)
  localSignal: number; // Local Score (0-100, scaled from 1-10)
}

export interface HistoryDataPoint {
  date: string; // ISO date string
  score: number; // ClinicAI Score
}

export interface CompetitorDataPoint {
  name: string; // Domain name
  x: number; // Average Position (for scatter x)
  y: number; // ClinicAI Score (for scatter y)
  z: number; // Size/Importance (number of appearances)
  isCurrentProject: boolean; // Whether this is the current project's domain
  visibility: number; // Percentage (0-100)
  position: number; // Average rank
  trend: number; // Change % over time
}

export interface DashboardMetricsResponse {
  clinicName: string;
  kpis: DashboardKPIs;
  history: HistoryDataPoint[];
  competitors: CompetitorDataPoint[];
}

