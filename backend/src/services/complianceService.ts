// backend/src/services/complianceService.ts
// Compliance reporting

import db from '../db'
import logger from '../utils/logger'
import auditLogService from './auditLogService'

export interface ComplianceReport {
  report_id: string
  company_id: string
  generated_at: string
  period: { start: string; end: string }
  summary: {
    total_actions: number
    total_users: number
    total_errors: number
    error_rate: number
  }
  by_action: Record<string, number>
  by_resource: Record<string, number>
  by_user: Record<string, { actions: number; last_activity: string }>
  access_patterns: {
    most_active_users: Array<{ user_id: string; action_count: number }>
    most_modified_resources: Array<{ resource_id: string; modification_count: number }>
  }
  data_changes: {
    creates: number
    updates: number
    deletes: number
  }
  risk_indicators: {
    failed_attempts: number
    bulk_operations: number
    unusual_activity: string[]
  }
}

export interface UserActivityReport {
  user_id: string
  company_id: string
  period: { start: string; end: string }
  total_actions: number
  actions_by_type: Record<string, number>
  resources_accessed: Record<string, number>
  errors: number
  last_activity: string
  login_sessions?: number
  data_accessed?: Record<string, any>
}

/**
 * Generate compliance report for date range
 */
export async function generateComplianceReport(
  companyId: string,
  dateRange: { start: string; end: string }
): Promise<ComplianceReport> {
  try {
    const reportId = require('uuid').v4()
    const now = new Date().toISOString()

    // Get activity summary
    const summary = await auditLogService.getActivitySummary(companyId, dateRange)

    // Get detailed metrics
    const result = await db.query(
      `
      SELECT
        action,
        resource_type,
        user_id,
        status,
        COUNT(*) as count,
        MAX(created_at) as last_activity
      FROM audit_logs
      WHERE company_id = $1
        AND created_at >= $2
        AND created_at <= $3
      GROUP BY action, resource_type, user_id, status
      ORDER BY count DESC
      `,
      [companyId, dateRange.start, dateRange.end]
    )

    const rows = result.rows

    // Build user activity map
    const userActivity: Record<string, { actions: number; last_activity: string }> = {}
    rows.forEach((row: any) => {
      if (row.user_id) {
        if (!userActivity[row.user_id]) {
          userActivity[row.user_id] = { actions: 0, last_activity: row.last_activity }
        }
        userActivity[row.user_id].actions += parseInt(row.count, 10)
        if (row.last_activity > userActivity[row.user_id].last_activity) {
          userActivity[row.user_id].last_activity = row.last_activity
        }
      }
    })

    // Find most active users
    const mostActiveUsers = Object.entries(userActivity)
      .map(([userId, data]) => ({
        user_id: userId,
        action_count: data.actions
      }))
      .sort((a, b) => b.action_count - a.action_count)
      .slice(0, 10)

    // Find most modified resources
    const resourceModifications: Record<string, number> = {}
    rows.forEach((row: any) => {
      if (row.resource_type) {
        resourceModifications[row.resource_type] =
          (resourceModifications[row.resource_type] || 0) + parseInt(row.count, 10)
      }
    })

    const mostModifiedResources = Object.entries(resourceModifications)
      .map(([resourceId, count]) => ({
        resource_id: resourceId,
        modification_count: count
      }))
      .sort((a, b) => b.modification_count - a.modification_count)
      .slice(0, 10)

    // Count by change type
    const changeTypes = { creates: 0, updates: 0, deletes: 0 }
    rows.forEach((row: any) => {
      if (row.action === 'create') changeTypes.creates += parseInt(row.count, 10)
      if (row.action === 'update') changeTypes.updates += parseInt(row.count, 10)
      if (row.action === 'delete') changeTypes.deletes += parseInt(row.count, 10)
    })

    // Calculate error rate
    const errorRate = summary.total_actions > 0 ? (summary.errors / summary.total_actions) * 100 : 0

    // Check for risk indicators
    const riskIndicators = {
      failed_attempts: summary.errors,
      bulk_operations: 0,
      unusual_activity: [] as string[]
    }

    // Add risk warnings
    if (errorRate > 5) {
      riskIndicators.unusual_activity.push(`High error rate: ${errorRate.toFixed(2)}%`)
    }
    if (summary.errors > 50) {
      riskIndicators.unusual_activity.push(`Significant number of errors: ${summary.errors}`)
    }

    const report: ComplianceReport = {
      report_id: reportId,
      company_id: companyId,
      generated_at: now,
      period: dateRange,
      summary: {
        total_actions: summary.total_actions,
        total_users: Object.keys(userActivity).length,
        total_errors: summary.errors,
        error_rate: parseFloat(errorRate.toFixed(2))
      },
      by_action: summary.by_action,
      by_resource: summary.by_resource,
      by_user: userActivity,
      access_patterns: {
        most_active_users: mostActiveUsers,
        most_modified_resources: mostModifiedResources
      },
      data_changes: changeTypes,
      risk_indicators: riskIndicators
    }

    logger.info(`[Compliance] Generated compliance report ${reportId}`)
    return report
  } catch (error) {
    logger.error('Error generating compliance report:', error)
    throw error
  }
}

/**
 * Generate user activity report
 */
export async function generateUserActivityReport(
  companyId: string,
  userId: string,
  dateRange: { start: string; end: string }
): Promise<UserActivityReport> {
  try {
    const result = await db.query(
      `
      SELECT
        action,
        resource_type,
        status,
        COUNT(*) as count,
        MAX(created_at) as last_activity
      FROM audit_logs
      WHERE company_id = $1
        AND user_id = $2
        AND created_at >= $3
        AND created_at <= $4
      GROUP BY action, resource_type, status
      `,
      [companyId, userId, dateRange.start, dateRange.end]
    )

    const rows = result.rows
    const actionsByType: Record<string, number> = {}
    const resourcesAccessed: Record<string, number> = {}
    let totalActions = 0
    let errors = 0
    let lastActivity = ''

    rows.forEach((row: any) => {
      const count = parseInt(row.count, 10)
      totalActions += count
      actionsByType[row.action] = (actionsByType[row.action] || 0) + count
      resourcesAccessed[row.resource_type] = (resourcesAccessed[row.resource_type] || 0) + count

      if (row.status === 'error') {
        errors += count
      }

      if (row.last_activity > lastActivity) {
        lastActivity = row.last_activity
      }
    })

    return {
      user_id: userId,
      company_id: companyId,
      period: dateRange,
      total_actions: totalActions,
      actions_by_type: actionsByType,
      resources_accessed: resourcesAccessed,
      errors,
      last_activity: lastActivity
    }
  } catch (error) {
    logger.error('Error generating user activity report:', error)
    throw error
  }
}

/**
 * Generate data access report
 */
export async function generateAccessReport(
  companyId: string,
  dateRange: { start: string; end: string }
): Promise<{
  company_id: string
  period: { start: string; end: string }
  users_with_access: number
  resources_accessed: Record<string, number>
  failed_access_attempts: number
  suspicious_patterns: string[]
}> {
  try {
    const result = await db.query(
      `
      SELECT DISTINCT user_id FROM audit_logs
      WHERE company_id = $1
        AND created_at >= $2
        AND created_at <= $3
      `,
      [companyId, dateRange.start, dateRange.end]
    )

    const usersWithAccess = result.rows.length

    // Get resource access counts
    const resourceResult = await db.query(
      `
      SELECT resource_type, COUNT(*) as count
      FROM audit_logs
      WHERE company_id = $1
        AND created_at >= $2
        AND created_at <= $3
      GROUP BY resource_type
      `,
      [companyId, dateRange.start, dateRange.end]
    )

    const resourcesAccessed: Record<string, number> = {}
    resourceResult.rows.forEach((row: any) => {
      resourcesAccessed[row.resource_type] = parseInt(row.count, 10)
    })

    // Get failed access attempts
    const failedResult = await db.query(
      `
      SELECT COUNT(*) as count FROM audit_logs
      WHERE company_id = $1
        AND status = 'error'
        AND created_at >= $2
        AND created_at <= $3
      `,
      [companyId, dateRange.start, dateRange.end]
    )

    const failedAttempts = parseInt(failedResult.rows[0].count, 10)

    return {
      company_id: companyId,
      period: dateRange,
      users_with_access: usersWithAccess,
      resources_accessed: resourcesAccessed,
      failed_access_attempts: failedAttempts,
      suspicious_patterns: []
    }
  } catch (error) {
    logger.error('Error generating access report:', error)
    throw error
  }
}

export default {
  generateComplianceReport,
  generateUserActivityReport,
  generateAccessReport
}
