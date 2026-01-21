// backend/src/services/actionItemService.ts
// Action item business logic and database operations

import { query, transaction } from '../db/connection.js'
import { v4 as uuidv4 } from 'uuid'

export interface ActionItemInput {
  project_id: string
  team_id?: string
  meeting_id?: string
  title: string
  description?: string
  owner_id: string
  priority: 'high' | 'medium' | 'low'
  due_date: string
}

export interface ActionItem extends ActionItemInput {
  id: string
  company_id: string
  status: 'open' | 'in_progress' | 'completed' | 'closed' | 'on_hold' | 'overdue'
  completed_date?: string
  version: number
  created_at: string
  updated_at: string
  archived_at?: string
}

export interface ActionItemDetail extends ActionItem {
  owner?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  project?: {
    id: string
    name: string
  }
  team?: {
    id: string
    name: string
  }
}

export async function createActionItem(
  companyId: string,
  data: ActionItemInput
): Promise<ActionItem> {
  const id = uuidv4()
  const now = new Date().toISOString()

  const result = await query(
    `INSERT INTO action_items (
      id, company_id, project_id, team_id, meeting_id, 
      owner_id, title, description, priority, status, due_date,
      version, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      id,
      companyId,
      data.project_id,
      data.team_id || null,
      data.meeting_id || null,
      data.owner_id,
      data.title,
      data.description || null,
      data.priority,
      'open',
      data.due_date,
      1,
      now,
      now
    ]
  )

  return result.rows[0]
}

export async function getActionItem(
  companyId: string,
  itemId: string
): Promise<ActionItemDetail | null> {
  const result = await query(
    `SELECT 
      ai.*,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'first_name', u.first_name,
        'last_name', u.last_name
      ) as owner,
      json_build_object(
        'id', p.id,
        'name', p.name
      ) as project,
      json_build_object(
        'id', t.id,
        'name', t.name
      ) as team
    FROM action_items ai
    LEFT JOIN users u ON ai.owner_id = u.id
    LEFT JOIN projects p ON ai.project_id = p.id
    LEFT JOIN teams t ON ai.team_id = t.id
    WHERE ai.id = $1 AND ai.company_id = $2 AND ai.archived_at IS NULL`,
    [itemId, companyId]
  )

  return result.rows[0] || null
}

export interface ListOptions {
  page?: number
  pageSize?: number
  status?: string
  owner_id?: string
  priority?: string
  project_id?: string
  team_id?: string
  due_date_from?: string
  due_date_to?: string
}

export async function listActionItems(
  companyId: string,
  options: ListOptions = {}
): Promise<{ items: ActionItem[]; total: number }> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 25, 100)
  const offset = (page - 1) * pageSize

  let sql = `SELECT ai.* FROM action_items ai WHERE ai.company_id = $1 AND ai.archived_at IS NULL`
  const params: any[] = [companyId]
  let paramIndex = 2

  // Build filter conditions
  if (options.status) {
    sql += ` AND ai.status = $${paramIndex++}`
    params.push(options.status)
  }
  if (options.owner_id) {
    sql += ` AND ai.owner_id = $${paramIndex++}`
    params.push(options.owner_id)
  }
  if (options.priority) {
    sql += ` AND ai.priority = $${paramIndex++}`
    params.push(options.priority)
  }
  if (options.project_id) {
    sql += ` AND ai.project_id = $${paramIndex++}`
    params.push(options.project_id)
  }
  if (options.team_id) {
    sql += ` AND ai.team_id = $${paramIndex++}`
    params.push(options.team_id)
  }
  if (options.due_date_from) {
    sql += ` AND ai.due_date >= $${paramIndex++}`
    params.push(options.due_date_from)
  }
  if (options.due_date_to) {
    sql += ` AND ai.due_date <= $${paramIndex++}`
    params.push(options.due_date_to)
  }

  // Count total
  const countResult = await query(
    `SELECT COUNT(*) as count FROM action_items ai WHERE ai.company_id = $1 AND ai.archived_at IS NULL`,
    [companyId]
  )
  const total = parseInt(countResult.rows[0].count, 10)

  // Get paginated results
  const orderAndLimit = ` ORDER BY ai.due_date ASC, ai.created_at DESC LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`
  params.push(pageSize, offset)

  const result = await query(sql + orderAndLimit, params)
  return { items: result.rows, total }
}

export async function updateActionItem(
  companyId: string,
  itemId: string,
  data: Partial<ActionItemInput>,
  version: number
): Promise<ActionItem | null> {
  const now = new Date().toISOString()
  const updates: string[] = []
  const values: any[] = [companyId, itemId, version]
  let paramIndex = 4

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(data.title)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (data.owner_id !== undefined) {
    updates.push(`owner_id = $${paramIndex++}`)
    values.push(data.owner_id)
  }
  if (data.priority !== undefined) {
    updates.push(`priority = $${paramIndex++}`)
    values.push(data.priority)
  }
  if (data.due_date !== undefined) {
    updates.push(`due_date = $${paramIndex++}`)
    values.push(data.due_date)
  }

  if (updates.length === 0) {
    return getActionItem(companyId, itemId)
  }

  updates.push(`version = version + 1`)
  updates.push(`updated_at = $${paramIndex++}`)
  values.push(now)

  const result = await query(
    `UPDATE action_items 
    SET ${updates.join(', ')}
    WHERE id = $2 AND company_id = $1 AND version = $3 AND archived_at IS NULL
    RETURNING *`,
    values
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

export async function changeActionItemStatus(
  companyId: string,
  itemId: string,
  newStatus: string,
  version: number
): Promise<ActionItem | null> {
  const now = new Date().toISOString()
  const completedDate = newStatus === 'completed' ? now : null

  const result = await query(
    `UPDATE action_items 
    SET status = $1, 
        completed_date = $2,
        version = version + 1,
        updated_at = $3
    WHERE id = $4 AND company_id = $5 AND version = $6 AND archived_at IS NULL
    RETURNING *`,
    [newStatus, completedDate, now, itemId, companyId, version]
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

export async function getActionItemHistory(
  companyId: string,
  itemId: string
): Promise<any[]> {
  const result = await query(
    `SELECT * FROM audit_logs 
    WHERE entity_type = 'action_item' AND entity_id = $1
    AND company_id = $2
    ORDER BY created_at DESC`,
    [itemId, companyId]
  )

  return result.rows
}

export async function archiveActionItem(
  companyId: string,
  itemId: string
): Promise<ActionItem | null> {
  const now = new Date().toISOString()

  const result = await query(
    `UPDATE action_items 
    SET archived_at = $1
    WHERE id = $2 AND company_id = $3 AND archived_at IS NULL
    RETURNING *`,
    [now, itemId, companyId]
  )

  return result.rows[0] || null
}
