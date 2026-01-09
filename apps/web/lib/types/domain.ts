import { z } from 'zod';

/*
 * -------------------------------------------------------
 * AI Engine Enum
 * -------------------------------------------------------
 */
export type AIEngine = 'openai' | 'perplexity' | 'claude';

export const AIEngineSchema = z.enum(['openai', 'perplexity', 'claude']);

/*
 * -------------------------------------------------------
 * Project Settings Type
 * -------------------------------------------------------
 */
export interface ProjectSettings {
  targetCountries?: string[];
  targetLanguages?: string[];
  [key: string]: unknown;
}

/*
 * -------------------------------------------------------
 * Database Table Interfaces
 * -------------------------------------------------------
 */

/**
 * Project - Clinic project for AI visibility tracking
 */
export interface Project {
  id: string;
  organization_id: string;
  domain: string;
  name: string;
  settings: ProjectSettings;
  created_at: string;
  updated_at: string;
}

/**
 * Service - Medical service/keyword to track in AI responses
 */
export interface Service {
  id: string;
  project_id: string;
  name: string;
  search_query: string;
  path: string | null;
  location_city: string | null;
  location_country: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Scan - AI scan result for a service
 */
export interface Scan {
  id: string;
  service_id: string;
  ai_engine: AIEngine;
  visible: boolean;
  position: number | null;
  raw_response: string | null;
  analyzed_at: string;
  created_at: string;
}

/**
 * WeeklyStats - Weekly aggregated statistics for trend charts
 */
export interface WeeklyStats {
  id: string;
  project_id: string;
  week_start: string; // ISO date string
  clinic_ai_score: number | null;
  visability_score: number | null;
  avg_position: number | null;
  tech_score: number | null;
  content_score: number | null; // Content Optimization Score (0-100)
  eeat_score: number | null; // E-E-A-T Score (0-100)
  local_score: number | null; // Local Indicators Score (0-100)
  created_at: string;
  updated_at: string;
}

/*
 * -------------------------------------------------------
 * Domain-Specific Types
 * -------------------------------------------------------
 */

/**
 * ServiceResult - Result of scanning a service across AI engines
 */
export interface ServiceResult {
  serviceId: string;
  serviceName: string;
  searchQuery: string;
  visible: boolean;
  position: number | null;
  aiEngine: AIEngine;
  analyzedAt: string;
  rawResponse?: string | null;
  location?: {
    city: string | null;
    country: string | null;
  };
}

/**
 * DashboardSummary - Summary statistics for the dashboard
 */
export interface DashboardSummary {
  clinicAiScore: number;
  visibilityRate: number; // Percentage of visible services
  avgPosition: number | null; // Average position across all visible services
  trackedServices: number; // Total number of services being tracked
  totalScans: number; // Total number of scans performed
  lastScanDate?: string | null; // Date of the most recent scan
}

/**
 * CompetitorPoint - Competitor data point for scatter/trend charts
 */
export interface CompetitorPoint {
  domain: string;
  avgPosition: number | null;
  aiScore: number; // Calculated AI visibility score
  isClient: boolean; // Whether this is the client's own domain
  mentions?: number; // Number of mentions in AI responses
  visibility?: number; // Visibility percentage (0-100)
  trend?: number; // Percentage change compared to previous period
}

/*
 * -------------------------------------------------------
 * Zod Schemas for Validation
 * -------------------------------------------------------
 */

/**
 * Schema for creating a new Project
 */
export const CreateProjectSchema = z.object({
  organization_id: z.string().uuid('Organization ID must be a valid UUID'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(255, 'Domain must be less than 255 characters')
    .regex(
      /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i,
      'Domain must be a valid domain name (e.g., clinic.com)',
    ),
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be less than 255 characters'),
  settings: z
    .object({
      targetCountries: z.array(z.string()).optional(),
      targetLanguages: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional()
    .default({}),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

/**
 * Schema for updating a Project
 */
export const UpdateProjectSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(255, 'Domain must be less than 255 characters')
    .regex(
      /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i,
      'Domain must be a valid domain name (e.g., clinic.com)',
    )
    .optional(),
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must be less than 255 characters')
    .optional(),
  settings: z
    .object({
      targetCountries: z.array(z.string()).optional(),
      targetLanguages: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

/**
 * Schema for creating a new Service
 */
export const CreateServiceSchema = z.object({
  project_id: z.string().uuid('Project ID must be a valid UUID'),
  name: z
    .string()
    .min(1, 'Service name is required')
    .max(255, 'Service name must be less than 255 characters'),
  search_query: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query must be less than 500 characters'),
  path: z
    .string()
    .max(500, 'Path must be less than 500 characters')
    .optional()
    .nullable(),
  location_city: z
    .string()
    .max(100, 'City name must be less than 100 characters')
    .optional()
    .nullable(),
  location_country: z
    .string()
    .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)')
    .optional()
    .nullable(),
});

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

/**
 * Schema for updating a Service
 */
export const UpdateServiceSchema = z.object({
  name: z
    .string()
    .min(1, 'Service name is required')
    .max(255, 'Service name must be less than 255 characters')
    .optional(),
  search_query: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query must be less than 500 characters')
    .optional(),
  path: z
    .string()
    .max(500, 'Path must be less than 500 characters')
    .optional()
    .nullable(),
  location_city: z
    .string()
    .max(100, 'City name must be less than 100 characters')
    .optional()
    .nullable(),
  location_country: z
    .string()
    .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)')
    .optional()
    .nullable(),
});

export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;

/**
 * Schema for creating a new Scan
 */
export const CreateScanSchema = z.object({
  service_id: z.string().uuid('Service ID must be a valid UUID'),
  ai_engine: AIEngineSchema,
  visible: z.boolean().default(false),
  position: z.number().int().positive().nullable().optional(),
  raw_response: z.string().nullable().optional(),
  analyzed_at: z.string().datetime().optional(), // ISO datetime string
});

export type CreateScanInput = z.infer<typeof CreateScanSchema>;

/**
 * Schema for creating/updating WeeklyStats
 */
export const CreateWeeklyStatsSchema = z.object({
  project_id: z.string().uuid('Project ID must be a valid UUID'),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Week start must be in YYYY-MM-DD format'),
  clinic_ai_score: z.number().min(0).max(100).nullable().optional(),
  visability_score: z.number().min(0).max(100).nullable().optional(),
  avg_position: z.number().min(1).nullable().optional(),
  tech_score: z.number().min(0).max(100).nullable().optional(),
  content_score: z.number().min(0).max(100).nullable().optional(),
  eeat_score: z.number().min(0).max(100).nullable().optional(),
  local_score: z.number().min(0).max(100).nullable().optional(),
});

export type CreateWeeklyStatsInput = z.infer<typeof CreateWeeklyStatsSchema>;

/*
 * -------------------------------------------------------
 * Service Table Row Interface
 * -------------------------------------------------------
 */

/**
 * ServiceTableRow - Data structure for the services visibility analysis table
 */
export interface ServiceTableRow {
  serviceName: string; // Послуга (e.g., "Heart Ultrasound")
  targetPage: string; // Сторінка (The input URL provided by user)
  country: string; // Країна (e.g., "UA")
  city: string; // Місто (e.g., "Kyiv")
  isVisible: boolean; // Відімість (In UI: "Present" / "Not Present")
  foundUrl: string | null; // URL (The URL actually found in AI response)
  position: number | null; // Позиція (Rank, e.g., 2. If null, display "-")
  totalResults: number; // Всього результатів (e.g., 5)
  aivScore: number; // AIV score (0-100)
  competitors: string[]; // Конкуренти (List of names)
  competitorUrls: string[]; // URL конкурентів (List of links)
}

/*
 * -------------------------------------------------------
 * Helper Types
 * -------------------------------------------------------
 */

/**
 * Project with related services count
 */
export interface ProjectWithServicesCount extends Project {
  services_count?: number;
}

/**
 * Service with latest scan result
 */
export interface ServiceWithLatestScan extends Service {
  latest_scan?: Scan | null;
}

/**
 * Service with scan results for all AI engines
 */
export interface ServiceWithScans extends Service {
  scans: Scan[];
}

/**
 * Project with aggregated statistics
 */
export interface ProjectWithStats extends Project {
  stats?: {
    total_services: number;
    visible_services: number;
    avg_position: number | null;
    last_scan_date: string | null;
  };
}

