// backend/src/middleware/rbac.ts
// Role-Based Access Control middleware

import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'

// Role hierarchy and permissions
const rolePermissions: Record<string, string[]> = {
  system_admin: ['*'],
  project_manager: ['view_all', 'create_items', 'manage_project', 'escalate'],
  team_lead: ['view_team', 'create_items', 'manage_team'],
  owner: ['view_own', 'update_own', 'comment'],
  participant: ['view_own', 'create_items'],
  viewer: ['view_own']
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = req.userRole || 'viewer'

    // System admin can do anything
    if (userRole === 'system_admin') {
      next()
      return
    }

    // Check if user has required role
    if (!roles.includes(userRole)) {
      res.status(403).json({ error: `Forbidden: requires role ${roles.join(' or ')}` })
      return
    }

    next()
  }
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userRole = req.userRole || 'viewer'
    const permissions = rolePermissions[userRole] || []

    if (permissions.includes('*') || permissions.includes(permission)) {
      next()
      return
    }

    res.status(403).json({ error: `Forbidden: requires permission ${permission}` })
  }
}

// RBAC information helper
export function getRolePermissions(role: string): string[] {
  return rolePermissions[role] || []
}
