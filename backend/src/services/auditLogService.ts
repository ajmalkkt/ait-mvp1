// backend/src/services/auditLogService.ts
// Audit logging service

import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import logger from '../utils/logger'

export interface AuditLogEntry {
  id: string
  company_id: string
  user_id: string
  action: 'create' | 'update' | 'delete' | 'read'
  resource_type: string
  resource_id?: string
  resource_name?: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
  status: 'success' | 'error'
  error_message?: string
  created_at: string
  metadata?: Record<string, any>
}

export interface AuditFilter {
  action?: string
  resource_type?: string
  user_id?: string
  start_date?: string
  end_date?: string
  page?: number
  pageSize?: number
}

export interface ActivitySummary {
  total_actions: number
  by_action: Record<string, number>
  by_resource: Record<string, number>
  by_user: Record<string, number>
  errors: number
  date_range: { start: string; end: string }
}

/**
 * Log an audit action
 */
export async function logAction(
  companyId: string,
  userId: string,
  action: 'create' | 'update' | 'delete' | 'read',
  resourceType: string,
  options: {
    resourceId?: string
    resourceName?: string
    changes?: Record<string, any>
    ipAddress?: string
    userAgent?: string
    status?: 'success' | 'error'
    errorMessage?: string
    metadata?: Record<string, any>
  } = {}
): Promise<AuditLogEntry> {
  try {
    const id = uuidv4()
    const now = new Date().toISOString()

    const result = await db.query(
      `
      INSERT INTO audit_logs (
        id, company_id, user_id, action, resource_type,
        resource_id, resource_name, changes, ip_address, user_agent,
        status, error_message, created_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
      `,
      [
        id,
        companyId,
        userId,
        action,
        resourceType,
        options.resourceId || null,
        options.resourceName || null,
        options.changes ? JSON.stringify(options.changes) : null,
        options.ipAddress || null,
        options.userAgent || null,
        options.status || 'success',
        options.errorMessage || null,
        now,
        options.metadata ? JSON.stringify(options.metadata) : null
      ]
    )

    const log = result.rows[0]
    logger.debug(`[AuditLog] ${action} on ${resourceType}`, {
      logId: id,
      user: userId,
      resource: options.resourceId
    })

    return {
      id: log.id,
      company_id: log.company_id,
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      resource_name: log.resource_name,
      changes: log.changes ? JSON.parse(log.changes) : undefined,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      status: log.status,
      error_message: log.error_message,
      created_at: log.created_at,
      metadata: log.metadata ? JSON.parse(log.metadata) : undefined
    }
  } catch (error) {
    logger.error('Error logging audit action:', error)
    throw error
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(
  companyId: string,
  filters: AuditFilter = {}
): Promise<{
  data: AuditLogEntry[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}> {
  try {
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const offset = (page - 1) * pageSize

    let query = `
      SELECT * FROM audit_logs
      WHERE company_id = $1
    `
    const params: any[] = [companyId]
    let paramIndex = 2

    if (filters.action) {
      query += ` AND action = $${paramIndex}`
      params.push(filters.action)
      paramIndex++
    }

    if (filters.resource_type) {
      query += ` AND resource_type = $${paramIndex}`
      params.push(filters.resource_type)
      paramIndex++
    }

    if (filters.user_id) {
      query += ` AND user_id = $${paramIndex}`
      params.push(filters.user_id)
      paramIndex++
    }

    if (filters.start_date) {
      query += ` AND created_at >= $${paramIndex}`
      params.push(filters.start_date)
      paramIndex++
    }

    if (filters.end_date) {
      query += ` AND created_at <= $${paramIndex}`
      params.push(filters.end_date)
      paramIndex++
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM audit_logs WHERE company_id = $1${
        filters.action ? ` AND action = $2` : ''
      }`,
      params.slice(0, paramIndex)
    )
    const total = parseInt(countResult.rows[0].total, 10)

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(pageSize, offset)

    const result = await db.query(query, params)

    return {
      data: result.rows.map((row: any) => ({
        id: row.id,
        company_id: row.company_id,
        user_id: row.user_id,
        action: row.action,
        resource_type: row.resource_type,
        resource_id: row.resource_id,
        resource_name: row.resource_name,
        changes: row.changes ? JSON.parse(row.changes) : undefined,
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        status: row.status,
        error_message: row.error_message,
        created_at: row.created_at,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      })),
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    }
  } catch (error) {
    logger.error('Error fetching audit logs:', error)
    throw error
  }
}

/**
 * Get single audit log
 */
export async function getAuditLog(
  companyId: string,
  logId: string
): Promise<AuditLogEntry> {
  try {
    const result = await db.query(
      `SELECT * FROM audit_logs WHERE id = $1 AND company_id = $2`,
      [logId, companyId]
    )

    if (result.rows.length === 0) {
      throw new Error('Audit log not found')
    }

    const row = result.rows[0]
    return {
      id: row.id,
      company_id: row.company_id,
      user_id: row.user_id,
      action: row.action,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      resource_name: row.resource_name,
      changes: row.changes ? JSON.parse(row.changes) : undefined,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      status: row.status,
      error_message: row.error_message,
      created_at: row.created_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }
  } catch (error) {
    logger.error('Error fetching audit log:', error)
    throw error
  }
}

/**
 * Get activity summary for date range
 */
export async function getActivitySummary(
  companyId: string,
  dateRange: { start: string; end: string }
): Promise<ActivitySummary> {
  try {
    const result = await db.query(
      `
      SELECT
        COUNT(*) as total_actions,
        action,
        resource_type,
        user_id,
        status
      FROM audit_logs
      WHERE company_id = $1
        AND created_at >= $2
        AND created_at <= $3
      GROUP BY action, resource_type, user_id, status
      `,
      [companyId, dateRange.start, dateRange.end]
    )

    const rows = result.rows
    const summary: ActivitySummary = {
      total_actions: rows.reduce((sum: number, row: any) => sum + parseInt(row.total_actions, 10), 0),
      by_action: {},
      by_resource: {},
      by_user: {},
      errors: 0,
      date_range: dateRange
    }

    rows.forEach((row: any) => {
      const count = parseInt(row.total_actions, 10)

      summary.by_action[row.action] = (summary.by_action[row.action] || 0) + count
      summary.by_resource[row.resource_type] = (summary.by_resource[row.resource_type] || 0) + count

      if (row.user_id) {
        summary.by_user[row.user_id] = (summary.by_user[row.user_id] || 0) + count
      }

      if (row.status === 'error') {
        summary.errors += count
      }
    })

    return summary
  } catch (error) {
    logger.error('Error calculating activity summary:', error)
    throw error
  }
}

/**
 * Delete old audit logs (retention policy)
 */
export async function deleteOldAuditLogs(
  companyId: string,
  daysOld: number = 365
): Promise<number> {
  try {
    const date = new Date()
    date.setDate(date.getDate() - daysOld)

    const result = await db.query(
      `
      DELETE FROM audit_logs
      WHERE company_id = $1 AND created_at < $2
      `,
      [companyId, date.toISOString()]
    )

    const deleted = result.rowCount || 0
    logger.info(`[AuditLog] Deleted ${deleted} old audit logs for company ${companyId}`)

    return deleted
  } catch (error) {
    logger.error('Error deleting old audit logs:', error)
    throw error
  }
}

export default {
  logAction,
  getAuditLogs,
  getAuditLog,
  getActivitySummary,
  deleteOldAuditLogs
}
