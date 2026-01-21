// backend/src/services/changeHistoryService.ts
// Track and retrieve change history

import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import logger from '../utils/logger'

export interface ChangeHistoryEntry {
  id: string
  company_id: string
  resource_type: string
  resource_id: string
  resource_name?: string
  change_type: 'create' | 'update' | 'delete'
  changed_by: string
  changed_at: string
  previous_values?: Record<string, any>
  current_values?: Record<string, any>
  fields_changed?: string[]
  description?: string
}

export interface TimelineEvent {
  id: string
  change_type: 'create' | 'update' | 'delete'
  changed_at: string
  changed_by: string
  fields: string[]
  description?: string
  changes?: Record<string, { old: any; new: any }>
}

/**
 * Track a change in the system
 */
export async function trackChange(
  companyId: string,
  resourceType: string,
  resourceId: string,
  changeType: 'create' | 'update' | 'delete',
  changedBy: string,
  options: {
    resourceName?: string
    previousValues?: Record<string, any>
    currentValues?: Record<string, any>
    fieldsChanged?: string[]
    description?: string
  } = {}
): Promise<ChangeHistoryEntry> {
  try {
    const id = uuidv4()
    const now = new Date().toISOString()

    const result = await db.query(
      `
      INSERT INTO change_history (
        id, company_id, resource_type, resource_id, resource_name,
        change_type, changed_by, changed_at, previous_values, current_values,
        fields_changed, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
      `,
      [
        id,
        companyId,
        resourceType,
        resourceId,
        options.resourceName || null,
        changeType,
        changedBy,
        now,
        options.previousValues ? JSON.stringify(options.previousValues) : null,
        options.currentValues ? JSON.stringify(options.currentValues) : null,
        options.fieldsChanged || null,
        options.description || null
      ]
    )

    const row = result.rows[0]
    logger.debug(`[ChangeHistory] ${changeType} on ${resourceType}:${resourceId}`)

    return {
      id: row.id,
      company_id: row.company_id,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      resource_name: row.resource_name,
      change_type: row.change_type,
      changed_by: row.changed_by,
      changed_at: row.changed_at,
      previous_values: row.previous_values ? JSON.parse(row.previous_values) : undefined,
      current_values: row.current_values ? JSON.parse(row.current_values) : undefined,
      fields_changed: row.fields_changed || undefined,
      description: row.description
    }
  } catch (error) {
    logger.error('Error tracking change:', error)
    throw error
  }
}

/**
 * Get change history for a resource
 */
export async function getChangeHistory(
  companyId: string,
  resourceId: string,
  resourceType?: string,
  limit: number = 50
): Promise<ChangeHistoryEntry[]> {
  try {
    let query = `
      SELECT * FROM change_history
      WHERE company_id = $1 AND resource_id = $2
    `
    const params: any[] = [companyId, resourceId]

    if (resourceType) {
      query += ` AND resource_type = $3`
      params.push(resourceType)
    }

    query += ` ORDER BY changed_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await db.query(query, params)

    return result.rows.map((row: any) => ({
      id: row.id,
      company_id: row.company_id,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      resource_name: row.resource_name,
      change_type: row.change_type,
      changed_by: row.changed_by,
      changed_at: row.changed_at,
      previous_values: row.previous_values ? JSON.parse(row.previous_values) : undefined,
      current_values: row.current_values ? JSON.parse(row.current_values) : undefined,
      fields_changed: row.fields_changed || undefined,
      description: row.description
    }))
  } catch (error) {
    logger.error('Error fetching change history:', error)
    throw error
  }
}

/**
 * Get resource timeline with user info
 */
export async function getResourceTimeline(
  companyId: string,
  resourceId: string,
  resourceType?: string
): Promise<TimelineEvent[]> {
  try {
    const changes = await getChangeHistory(companyId, resourceId, resourceType)

    return changes.map(change => ({
      id: change.id,
      change_type: change.change_type,
      changed_at: change.changed_at,
      changed_by: change.changed_by,
      fields: change.fields_changed || [],
      description: change.description,
      changes: buildChangesMap(change.previous_values, change.current_values)
    }))
  } catch (error) {
    logger.error('Error fetching resource timeline:', error)
    throw error
  }
}

/**
 * Get all changes since a date
 */
export async function getChangesSince(
  companyId: string,
  date: string,
  resourceType?: string,
  limit: number = 100
): Promise<ChangeHistoryEntry[]> {
  try {
    let query = `
      SELECT * FROM change_history
      WHERE company_id = $1 AND changed_at >= $2
    `
    const params: any[] = [companyId, date]

    if (resourceType) {
      query += ` AND resource_type = $3`
      params.push(resourceType)
    }

    query += ` ORDER BY changed_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await db.query(query, params)

    return result.rows.map((row: any) => ({
      id: row.id,
      company_id: row.company_id,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      resource_name: row.resource_name,
      change_type: row.change_type,
      changed_by: row.changed_by,
      changed_at: row.changed_at,
      previous_values: row.previous_values ? JSON.parse(row.previous_values) : undefined,
      current_values: row.current_values ? JSON.parse(row.current_values) : undefined,
      fields_changed: row.fields_changed || undefined,
      description: row.description
    }))
  } catch (error) {
    logger.error('Error fetching changes since date:', error)
    throw error
  }
}

/**
 * Helper: Build changes map from before/after values
 */
function buildChangesMap(
  previous?: Record<string, any>,
  current?: Record<string, any>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {}

  if (!previous || !current) return changes

  // Find changed fields
  const allFields = new Set([...Object.keys(previous), ...Object.keys(current)])

  allFields.forEach(field => {
    const oldValue = previous[field]
    const newValue = current[field]

    if (oldValue !== newValue) {
      changes[field] = { old: oldValue, new: newValue }
    }
  })

  return changes
}

/**
 * Delete old change history (retention policy)
 */
export async function deleteOldChanges(
  companyId: string,
  daysOld: number = 365
): Promise<number> {
  try {
    const date = new Date()
    date.setDate(date.getDate() - daysOld)

    const result = await db.query(
      `
      DELETE FROM change_history
      WHERE company_id = $1 AND changed_at < $2
      `,
      [companyId, date.toISOString()]
    )

    const deleted = result.rowCount || 0
    logger.info(`[ChangeHistory] Deleted ${deleted} old change records`)

    return deleted
  } catch (error) {
    logger.error('Error deleting old changes:', error)
    throw error
  }
}

export default {
  trackChange,
  getChangeHistory,
  getResourceTimeline,
  getChangesSince,
  deleteOldChanges
}
