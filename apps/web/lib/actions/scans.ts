'use server';

import { z } from 'zod';
import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { CreateScanSchema, type Scan } from '~/lib/types/domain';

/*
 * -------------------------------------------------------
 * Server Action Schemas
 * -------------------------------------------------------
 */

const GetServiceScansSchema = z.object({
    serviceId: z.string().uuid('Service ID must be a valid UUID'),
    limit: z.number().int().min(1).max(100).optional().default(10),
});

const GetLatestScansSchema = z.object({
    projectId: z.string().uuid('Project ID must be a valid UUID'),
});

/*
 * -------------------------------------------------------
 * Server Actions
 * -------------------------------------------------------
 */

/**
 * Save a new scan result
 */
export const saveScanResult = enhanceAction(
    async (params: unknown) => {
        const supabase = getSupabaseServerClient();
        const typedParams = params as { service_id: string; ai_engine: string; visible: boolean; position?: number; raw_response?: unknown; analyzed_at?: string };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('scans')
            .insert({
                service_id: typedParams.service_id,
                ai_engine: typedParams.ai_engine,
                visible: typedParams.visible,
                position: typedParams.position || null,
                raw_response: typedParams.raw_response || null,
                analyzed_at: typedParams.analyzed_at || new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to save scan result: ${error.message}`);
        }

        return data as Scan;
    },
    {
        schema: CreateScanSchema,
    },
);

/**
 * Get historical scans for a service
 */
export const getServiceScans = enhanceAction(
    async (params: unknown) => {
        const { serviceId, limit } = params as { serviceId: string; limit: number };
        const supabase = getSupabaseServerClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('scans')
            .select('*')
            .eq('service_id', serviceId)
            .order('analyzed_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to fetch service scans: ${error.message}`);
        }

        return data as Scan[];
    },
    {
        schema: GetServiceScansSchema,
    },
);

/**
 * Get latest scans for all services in a project
 */
export const getLatestScans = enhanceAction(
    async (params: z.infer<typeof GetLatestScansSchema>) => {
        const { projectId } = params;
        const supabase = getSupabaseServerClient();

        // This is a more complex query to get only the latest scan for each service
        // We can use distinct on for this in Supabase/PostgreSQL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('scans')
            .select(`
        *,
        services!inner(project_id)
      `)
            .eq('services.project_id', projectId)
            .order('service_id')
            .order('analyzed_at', { ascending: false });

        // Note: To truly get "distinct on" we might need a raw query or secondary processing
        // since Supabase JS client doesn't support distinct on directly in select.
        if (error) {
            throw new Error(`Failed to fetch latest scans: ${error.message}`);
        }

        // Process to keep only the latest scan per service
        const latestScansMap = new Map<string, Scan>();
        (data || []).forEach((scan: unknown) => {
            const typedScan = scan as Scan & { service_id: string };
            if (!latestScansMap.has(typedScan.service_id)) {
                latestScansMap.set(typedScan.service_id, typedScan);
            }
        });

        return Array.from(latestScansMap.values());
    },
    {
        schema: GetLatestScansSchema,
    },
);
