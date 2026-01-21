// backend/src/middleware/auditMiddleware.ts
// Auto-logging of all requests

import { Request, Response, NextFunction } from 'express'
import auditLogService from '../services/auditLogService'
import logger from '../utils/logger'

declare global {
  namespace Express {
    interface Request {
      audit?: {
        action: 'create' | 'update' | 'delete' | 'read'
        resourceType: string
        resourceId?: string
        resourceName?: string
        changes?: Record<string, any>
      }
    }
  }
}

/**
 * Audit middleware - captures and logs all requests
 */
export function auditMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original response.json
    const originalJson = res.json.bind(res)

    // Track response status and body
    let responseBody: any = null
    let statusCode = 200

    res.json = function (body: any) {
      responseBody = body
      return originalJson(body)
    }

    // Capture status code
    const originalStatus = res.status.bind(res)
    res.status = function (code: number) {
      statusCode = code
      return originalStatus(code)
    }

    // Wait for response to finish
    res.on('finish', async () => {
      try {
        // Skip health checks
        if (req.path === '/health' || req.path.includes('/health')) {
          return
        }

        // Determine action from method
        let action: 'create' | 'update' | 'delete' | 'read'
        if (req.method === 'POST') action = 'create'
        else if (req.method === 'PUT' || req.method === 'PATCH') action = 'update'
        else if (req.method === 'DELETE') action = 'delete'
        else action = 'read'

        // Extract resource info from path
        const pathParts = req.path.split('/')
        const resourceType = pathParts[3] || 'unknown' // /api/v1/{resource}

        // Get user info from request
        const userId = (req as any).user?.id || 'unknown'
        const companyId = (req as any).user?.company_id || 'unknown'

        // Extract IP address
        const ipAddress =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
          req.socket.remoteAddress ||
          'unknown'

        // Get user agent
        const userAgent = req.headers['user-agent'] || ''

        // Log the request
        if (userId !== 'unknown' && companyId !== 'unknown') {
          const auditData = req.audit || {}

          // Determine success/error
          const status = statusCode >= 200 && statusCode < 300 ? 'success' : 'error'
          const errorMessage = status === 'error' ? `HTTP ${statusCode}` : undefined

          await auditLogService.logAction(
            companyId,
            userId,
            action,
            auditData.resourceType || resourceType.replace(/s$/, ''), // plurals to singular
            {
              resourceId: auditData.resourceId,
              resourceName: auditData.resourceName,
              changes: auditData.changes,
              ipAddress,
              userAgent,
              status,
              errorMessage,
              metadata: {
                method: req.method,
                path: req.path,
                statusCode
              }
            }
          )
        }
      } catch (error) {
        logger.error('Error in audit middleware:', error)
        // Don't throw - let response continue
      }
    })

    next()
  }
}

export default auditMiddleware
