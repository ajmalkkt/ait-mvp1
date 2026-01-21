// backend/src/middleware/auth.ts
// JWT authentication middleware

import { Request, Response, NextFunction } from 'express'
import { verifyJWT, extractToken } from '../auth/supabase.js'

export interface AuthRequest extends Request {
  userId?: string
  companyId?: string
  userRole?: string
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  // Extract and verify token
  const token = extractToken(authHeader)
  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const claims = verifyJWT(token)
  if (!claims) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  // Extract user info from claims
  req.userId = claims.sub || claims.user_id
  req.companyId = claims.company_id
  req.userRole = claims.role || 'viewer'

  if (!req.userId || !req.companyId) {
    res.status(401).json({ error: 'Invalid token claims' })
    return
  }

  next()
}

// Optional auth - don't fail if missing token, just set userId to undefined
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    next()
    return
  }

  const token = extractToken(authHeader)
  if (!token) {
    next()
    return
  }

  const claims = verifyJWT(token)
  if (claims) {
    req.userId = claims.sub || claims.user_id
    req.companyId = claims.company_id
    req.userRole = claims.role || 'viewer'
  }

  next()
}
