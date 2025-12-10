/**
 * Content Optimization Audit Types and Schemas
 * 
 * This file defines the Zod schemas for content audit results.
 * It is intentionally NOT a 'use server' file to allow
 * type imports in both server and client contexts.
 */

import { z } from 'zod';

/**
 * Structure analysis schema
 * Contains information about page architecture and content structure
 */
const StructureSchema = z.object({
  has_department_pages: z.boolean(),
  has_service_pages: z.boolean(),
  has_doctor_pages: z.boolean(),
  has_blog: z.boolean(),
  architecture_score: z.number().min(0).max(100),
});

/**
 * Text quality analysis schema
 * Measures content uniqueness and wateriness
 */
const TextQualitySchema = z.object({
  uniqueness_score: z.number().min(0).max(100),
  wateriness_score: z.number().min(0).max(100),
});

/**
 * Authority signals schema
 * Tracks trust and authority indicators
 */
const AuthoritySchema = z.object({
  authority_links_count: z.number().int().nonnegative(),
  has_valid_address: z.boolean(),
  has_valid_phone: z.boolean(),
  faq_count: z.number().int().nonnegative(),
});

/**
 * Content Audit Result Schema
 * Main schema for content optimization audit results
 */
export const ContentAuditResultSchema = z.object({
  structure: StructureSchema,
  text_quality: TextQualitySchema,
  authority: AuthoritySchema,
  recommendations: z.array(z.string()),
});

/**
 * Type inference from Zod schema
 */
export type ContentAuditResult = z.infer<typeof ContentAuditResultSchema>;
export type Structure = z.infer<typeof StructureSchema>;
export type TextQuality = z.infer<typeof TextQualitySchema>;
export type Authority = z.infer<typeof AuthoritySchema>;

