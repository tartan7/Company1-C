import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AppError } from '../lib/errors';
import { simulateUpstreamCall } from '../lib/upstream';

const orderSchema = z.object({
  userId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().int().positive().max(20),
  mode: z.enum(['ok', 'timeout', 'dberror', 'dbconflict', 'panic']).optional(),
});

export const lunchRoute: FastifyPluginAsync = async (app) => {
  app.post('/lunch/orders', async (request) => {
    const parsed = orderSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'BAD_REQUEST', 'Invalid request payload', {
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const payload = parsed.data;

    if (payload.mode === 'panic') {
      throw new Error('simulated panic');
    }

    if (payload.mode === 'dberror') {
      throw new AppError(503, 'DB_UNAVAILABLE', 'Database temporarily unavailable');
    }

    if (payload.mode === 'dbconflict') {
      throw new AppError(409, 'DB_CONFLICT', 'Duplicate order conflict');
    }

    if (payload.mode === 'timeout') {
      try {
        await simulateUpstreamCall('timeout');
      } catch {
        throw new AppError(503, 'UPSTREAM_TIMEOUT', 'Upstream dependency timeout');
      }
    }

    return {
      orderId: `ord_${Date.now()}`,
      accepted: true,
    };
  });
};
