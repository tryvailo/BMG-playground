import { NextResponse } from 'next/server';
import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';

import {
  getServicesByProjectId,
  createService,
  type CreateServiceInput,
} from '~/lib/modules/services/service-repository';

/**
 * Validation Schemas
 */
const CreateServiceSchema = z.object({
  projectId: z.string().min(1, 'Project ID required'),
  serviceName: z.string().min(1, 'Service name required').max(255),
  targetPage: z.string().url('Invalid URL'),
  country: z.string().optional(),
  city: z.string().optional(),
});

type _CreateServicePayload = z.infer<typeof CreateServiceSchema>;

/**
 * GET /api/services
 * Get all services for a project
 *
 * Query params:
 * - projectId: Project UUID (required)
 */
export const GET = enhanceRouteHandler(
  async ({ user, request }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get('projectId');

      if (!projectId) {
        return NextResponse.json(
          { error: 'projectId query parameter required' },
          { status: 400 },
        );
      }

      const services = await getServicesByProjectId(projectId);

      return NextResponse.json({
        data: services,
        count: services.length,
        success: true,
      });
    } catch (error) {
      console.error('[Services API] GET error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch services',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      );
    }
  },
  {
    auth: true,
  },
);

/**
 * POST /api/services
 * Create a new service
 *
 * Body:
 * {
 *   "projectId": "uuid",
 *   "serviceName": "string",
 *   "targetPage": "https://...",
 *   "country": "string (optional)",
 *   "city": "string (optional)"
 * }
 */
export const POST = enhanceRouteHandler(
  async ({ user, request }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = await request.json();

      // Validate request body
      const validation = CreateServiceSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.error.errors,
          },
          { status: 400 },
        );
      }

      const input = validation.data as CreateServiceInput;

      // Create service
      const service = await createService(input);

      if (!service) {
        return NextResponse.json(
          { error: 'Failed to create service' },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          data: service,
          success: true,
        },
        { status: 201 },
      );
    } catch (error) {
      console.error('[Services API] POST error:', error);
      return NextResponse.json(
        {
          error: 'Failed to create service',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      );
    }
  },
  {
    auth: true,
  },
);
