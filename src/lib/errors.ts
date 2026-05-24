export type AppErrorCode =
  | 'BAD_REQUEST'
  | 'UPSTREAM_TIMEOUT'
  | 'DB_UNAVAILABLE'
  | 'DB_CONFLICT'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  statusCode: number;
  code: AppErrorCode;
  details?: Record<string, unknown>;

  constructor(statusCode: number, code: AppErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
