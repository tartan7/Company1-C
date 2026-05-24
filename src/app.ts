import Fastify from 'fastify';
import { healthRoute } from './routes/health';
import { lunchRoute } from './routes/lunch';
import { AppError, isAppError } from './lib/errors';
import { logger } from './lib/logger';
import { metricsText, requestCounter, requestDurationMs, unhandledExceptionCounter } from './lib/metrics';

export function buildApp() {
  const app = Fastify({ loggerInstance: logger });

  app.addHook('onRequest', async (request) => {
    const requestId = request.id;
    const headerCorrelationId = request.headers['x-correlation-id'];
    const correlationId = typeof headerCorrelationId === 'string' ? headerCorrelationId : requestId;
    request.headers['x-correlation-id'] = correlationId;
  });

  app.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions.url || request.url;
    const status = String(reply.statusCode);
    const durationMs = reply.elapsedTime;

    requestCounter.inc({ route, method: request.method, status });
    requestDurationMs.observe({ route, method: request.method, status }, durationMs);
  });

  app.get('/metrics', async (_request, reply) => {
    const body = await metricsText();
    reply.header('content-type', 'text/plain; version=0.0.4');
    return body;
  });

  app.register(healthRoute);
  app.register(lunchRoute);

  app.setErrorHandler((error: unknown, request, reply) => {
    const correlationId = String(request.headers['x-correlation-id'] || request.id);

    if (isAppError(error)) {
      request.log.error(
        {
          request_id: request.id,
          correlation_id: correlationId,
          route: request.routeOptions.url || request.url,
          http_status: error.statusCode,
          error_code: error.code,
        },
        error.message,
      );

      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        correlationId,
      });
    }

    unhandledExceptionCounter.inc();

    request.log.error(
      {
        err: error,
        request_id: request.id,
        correlation_id: correlationId,
        route: request.routeOptions.url || request.url,
        http_status: 500,
        error_code: 'INTERNAL_ERROR',
      },
      'Unhandled exception',
    );

    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      correlationId,
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  return app;
}
