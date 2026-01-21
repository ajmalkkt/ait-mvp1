// backend/src/middleware/error.ts
// Global error handling middleware

import { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export class AppError extends Error implements ApiError {
  constructor(
    public statusCode: number = 500,
    message: string = 'Internal server error',
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = err as ApiError
  const statusCode = error.statusCode || 500
  const code = (error.code || 'INTERNAL_ERROR') as string
  const message = error.message || 'Internal server error'

  // Log error
  console.error({
    timestamp: new Date().toISOString(),
    statusCode,
    code,
    message,
    stack: error.stack,
    path: req.path,
    method: req.method
  })

  // Send error response
  res.status(statusCode).json({
    error: {
      code,
      message,
      statusCode
    }
  })
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404
    }
  })
}
