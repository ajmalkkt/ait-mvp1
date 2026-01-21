// backend/src/middleware/company.ts
// Company isolation middleware - enforce company_id from JWT

import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'

export function companyMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const companyId = req.companyId
  const userId = req.userId

  if (!companyId || !userId) {
    res.status(401).json({ error: 'Missing company or user context' })
    return
  }

  // Store in request for later use
  req.companyId = companyId

  next()
}

// Validate that request data belongs to user's company
export function validateCompanyOwnership(field: string = 'company_id') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const bodyCompanyId = req.body?.[field]
    const queryCompanyId = req.query?.[field]
    const requestCompanyId = bodyCompanyId || queryCompanyId

    if (requestCompanyId && requestCompanyId !== req.companyId) {
      res.status(403).json({ error: 'Forbidden: company_id mismatch' })
      return
    }

    // Ensure company_id is set in body for inserts
    if (req.method === 'POST' && !req.body[field]) {
      req.body[field] = req.companyId
    }

    next()
  }
}
