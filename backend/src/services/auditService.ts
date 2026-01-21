// backend/src/services/auditService.ts
// Audit logging for compliance and history tracking

import { query } from '../db/connection.js'
import { v4 as uuidv4 } from 'uuid'

export interface AuditLogEntry {
  id: string
  company_id: string
  entity_type: string
  entity_id: string
  action_type: string
  old_value?: any
  new_value?: any
  user_id?: string
  created_at: string
}

export async function logChange(
  companyId: string,
  entityType: string,
  entityId: string,
  actionType: string,
  oldValue: any = null,
  newValue: any = null,
  userId?: string
): Promise<AuditLogEntry> {
  const id = uuidv4()
  const now = new Date().toISOString()

  const result = await query(
    `INSERT INTO audit_logs (
      id, company_id, entity_type, entity_id, action_type,
      old_value, new_value, user_id, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      id,
      companyId,
      entityType,
      entityId,
      actionType,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      userId || null,
      now
    ]
  )

  return result.rows[0]
}

export async function getEntityHistory(
  companyId: string,
  entityType: string,
  entityId: string
): Promise<AuditLogEntry[]> {
  const result = await query(
    `SELECT * FROM audit_logs 
    WHERE company_id = $1 AND entity_type = $2 AND entity_id = $3
    ORDER BY created_at DESC`,
    [companyId, entityType, entityId]
  )

  return result.rows
}

export async function getCompanyAuditLogs(
  companyId: string,
  options: { page?: number; pageSize?: number; entityType?: string } = {}
): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 25, 100)
  const offset = (page - 1) * pageSize

  let sql = `SELECT * FROM audit_logs WHERE company_id = $1`
  const params: any[] = [companyId]
  let paramIndex = 2

  if (options.entityType) {
    sql += ` AND entity_type = $${paramIndex++}`
    params.push(options.entityType)
  }

  // Count total
  const countResult = await query(
    `SELECT COUNT(*) as count FROM audit_logs WHERE company_id = $1`,
    [companyId]
  )
  const total = parseInt(countResult.rows[0].count, 10)

  // Get paginated results
  const result = await query(
    `${sql} ORDER BY created_at DESC LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
    [...params, pageSize, offset]
  )

  return { logs: result.rows, total }
}

// Helper to log action item creation
export async function logActionItemCreated(
  companyId: string,
  itemId: string,
  itemData: any,
  userId?: string
): Promise<void> {
  await logChange(
    companyId,
    'action_item',
    itemId,
    'created',
    null,
    { title: itemData.title, status: 'open', owner_id: itemData.owner_id },
    userId
  )
}

// Helper to log action item status change
export async function logActionItemStatusChange(
  companyId: string,
  itemId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string
): Promise<void> {
  await logChange(
    companyId,
    'action_item',
    itemId,
    'status_changed',
    { status: oldStatus },
    { status: newStatus },
    userId
  )
}

// Helper to log action item owner change
export async function logActionItemOwnerChange(
  companyId: string,
  itemId: string,
  oldOwnerId: string,
  newOwnerId: string,
  userId?: string
): Promise<void> {
  await logChange(
    companyId,
    'action_item',
    itemId,
    'owner_changed',
    { owner_id: oldOwnerId },
    { owner_id: newOwnerId },
    userId
  )
}

// Helper to log action item completion
export async function logActionItemCompleted(
  companyId: string,
  itemId: string,
  completedDate: string,
  userId?: string
): Promise<void> {
  await logChange(
    companyId,
    'action_item',
    itemId,
    'completed',
    { status: 'in_progress' },
    { status: 'completed', completed_date: completedDate },
    userId
  )
}
