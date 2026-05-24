import client from 'prom-client';

client.collectDefaultMetrics();

export const requestCounter = new client.Counter({
  name: 'req_total',
  help: 'Total HTTP requests',
  labelNames: ['route', 'method', 'status'],
});

export const requestDurationMs = new client.Histogram({
  name: 'req_duration_ms',
  help: 'Request duration in milliseconds',
  labelNames: ['route', 'method', 'status'],
  buckets: [25, 50, 100, 250, 500, 750, 1000, 1500, 3000],
});

export const unhandledExceptionCounter = new client.Counter({
  name: 'unhandled_exception_total',
  help: 'Unhandled exception count',
});

export async function metricsText(): Promise<string> {
  return client.register.metrics();
}
