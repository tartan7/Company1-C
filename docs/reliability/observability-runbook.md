# Reliability and Observability Runbook

## Key signals
- Request rate: `req_total`
- Error rate: filter status `5xx` / `4xx`
- Latency: `req_duration_ms` p95/p99
- Crash signal: `unhandled_exception_total`

## Suggested dashboard panels
- Throughput by route/method
- 4xx/5xx ratio
- P95/P99 latency by route
- Unhandled exceptions over time

## Suggested log queries
- Error volume by route:
  - `level=error | group by route,error_code`
- Internal failures:
  - `error_code=INTERNAL_ERROR`
- Request trace:
  - `correlation_id=<id>`

## Alert thresholds (draft)
- P95 latency > 750ms for 10m: warning
- P95 latency > 1500ms for 5m: critical
- 5xx ratio > 2% for 10m: warning
- 5xx ratio > 5% for 5m: critical
- `unhandled_exception_total` increase > 5/5m: critical

## Incident response flow
1. Confirm impact window and affected routes.
2. Check recent deploy/config changes.
3. Inspect 5xx and INTERNAL_ERROR logs with correlation ids.
4. Mitigate (rollback, feature flag, traffic reduction).
5. Post 15-minute updates until stable.
6. Record RCA and follow-up tasks.
