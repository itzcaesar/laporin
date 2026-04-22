// ── apps/api/src/middleware/errorHandler.ts ──
// Standardized error handling middleware

import type { Context } from 'hono'
import type { StatusCode } from 'hono/utils/http-status'

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string
  details?: unknown
  code?: string
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: StatusCode = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Error handler middleware
 * Catches all errors and returns standardized error responses
 */
export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err)

  if (err instanceof AppError) {
    return c.json<ErrorResponse>(
      {
        error: err.message,
        code: err.code,
        details: err.details,
      },
      err.statusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500 | 503
    )
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return c.json<ErrorResponse>(
      {
        error: 'Database error',
        code: 'DATABASE_ERROR',
      },
      500
    )
  }

  // Handle validation errors
  if (err.name === 'ZodError') {
    return c.json<ErrorResponse>(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: err,
      },
      400
    )
  }

  // Default error response
  return c.json<ErrorResponse>(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    500
  )
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export function asyncHandler<T>(
  fn: (c: Context) => Promise<T>
): (c: Context) => Promise<T | Response> {
  return async (c: Context) => {
    try {
      return await fn(c)
    } catch (error) {
      return errorHandler(error as Error, c)
    }
  }
}

/**
 * Common error creators
 */
export const errors = {
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  unauthorized: (message = 'Unauthorized') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden') =>
    new AppError(message, 403, 'FORBIDDEN'),

  badRequest: (message: string, details?: unknown) =>
    new AppError(message, 400, 'BAD_REQUEST', details),

  conflict: (message: string) =>
    new AppError(message, 409, 'CONFLICT'),

  internal: (message = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (message: string) =>
    new AppError(message, 503, 'SERVICE_UNAVAILABLE'),
}

/**
 * Safe error logger
 * Logs errors without exposing sensitive information
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error(`[${context}] Error:`, {
    message: errorMessage,
    stack: errorStack,
    ...metadata,
  })
}
