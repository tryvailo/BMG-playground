import { NextResponse } from 'next/server';
import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';

import {
  getServiceById,
  updateService,
  deleteService,
  type UpdateServiceInput,
} from '~/lib/modules/services/service-repository';

/**
 * Validation Schemas
 */
const UpdateServiceSchema = z.object({
  serviceName: z.string().min(1).max(255).optional(),
  targetPage: z.string().url().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  visibility_score: z.number().min(0).max(100).optional(),
  position: z.number().min(1).optional(),
  aiv_score: z.number().min(0).optional(),
});

type _UpdateServicePayload = z.infer<typeof UpdateServiceSchema>;

/**
 * GET /api/services/[id]
 * Get a single service
 */
export const GET = enhanceRouteHandler(
  async ({ user, params }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const serviceId = (params?.id as string) || '';

      if (!serviceId) {
        return NextResponse.json(
          { error: 'Service ID is required' },
          { status: 400 },
        );
      }

      const service = await getServiceById(serviceId);

      if (!service) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 },
        );
      }

      return NextResponse.json({
        data: service,
        success: true,
      });
    } catch (error) {
      console.error('[Services API] GET [id] error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch service',
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
 * PUT /api/services/[id]
 * Update a service
 *
 * Body:
 * {
 *   "serviceName": "string (optional)",
 *   "targetPage": "https://... (optional)",
 *   "country": "string (optional)",
 *   "city": "string (optional)",
 *   "visibility_score": number (optional),
 *   "position": number (optional),
 *   "aiv_score": number (optional)
 * }
 */
export const PUT = enhanceRouteHandler(
  async ({ user, request, params }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const serviceId = (params?.id as string) || '';

      if (!serviceId) {
        return NextResponse.json(
          { error: 'Service ID is required' },
          { status: 400 },
        );
      }

      // Check if service exists
      const existing = await getServiceById(serviceId);
      if (!existing) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 },
        );
      }

      const body = await request.json();

      // Validate request body
      const validation = UpdateServiceSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.error.errors,
          },
          { status: 400 },
        );
      }

      const input = validation.data as UpdateServiceInput;

      // Update service
      const service = await updateService(serviceId, input);

      if (!service) {
        return NextResponse.json(
          { error: 'Failed to update service' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        data: service,
        success: true,
      });
    } catch (error) {
      console.error('[Services API] PUT [id] error:', error);
      return NextResponse.json(
        {
          error: 'Failed to update service',
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
 * DELETE /api/services/[id]
 * Delete a service
 */
export const DELETE = enhanceRouteHandler(
  async ({ user, params }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const serviceId = (params?.id as string) || '';

      if (!serviceId) {
        return NextResponse.json(
          { error: 'Service ID is required' },
          { status: 400 },
        );
      }

      // Check if service exists
      const existing = await getServiceById(serviceId);
      if (!existing) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 },
        );
      }

      // Delete service
      const success = await deleteService(serviceId);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to delete service' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Service deleted successfully',
      });
    } catch (error) {
      console.error('[Services API] DELETE [id] error:', error);
      return NextResponse.json(
        {
          error: 'Failed to delete service',
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
