// backend/src/services/notificationService.ts
// Notification business logic and database operations

import { query } from '../db/connection.js'
import { v4 as uuidv4 } from 'uuid'

export interface NotificationInput {
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  action_item_id?: string
  project_id?: string
  team_id?: string
  metadata?: Record<string, any>
}

export interface Notification extends NotificationInput {
  id: string
  company_id: string
  is_read: boolean
  created_at: string
  read_at?: string
}

export async function createNotification(
  companyId: string,
  data: NotificationInput
): Promise<Notification> {
  const id = uuidv4()
  const now = new Date().toISOString()

  const result = await query(
    `INSERT INTO notifications (
      id, company_id, user_id, title, message, type,
      action_item_id, project_id, team_id, metadata,
      is_read, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      id,
      companyId,
      data.user_id,
      data.title,
      data.message,
      data.type,
      data.action_item_id || null,
      data.project_id || null,
      data.team_id || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      false,
      now
    ]
  )

  return result.rows[0]
}

export interface ListOptions {
  page?: number
  pageSize?: number
  is_read?: boolean
  type?: string
}

export async function listNotifications(
  companyId: string,
  userId: string,
  options: ListOptions = {}
): Promise<{ items: Notification[]; total: number; unread: number }> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 25, 100)
  const offset = (page - 1) * pageSize

  let sql = `SELECT * FROM notifications 
             WHERE company_id = $1 AND user_id = $2`
  const params: any[] = [companyId, userId]
  let paramIndex = 3

  if (options.is_read !== undefined) {
    sql += ` AND is_read = $${paramIndex++}`
    params.push(options.is_read)
  }

  if (options.type) {
    sql += ` AND type = $${paramIndex++}`
    params.push(options.type)
  }

  // Count totals
  const countSql = sql.replace(/SELECT \*/, 'SELECT COUNT(*) as count')
  const countResult = await query(countSql, params)
  const total = parseInt(countResult.rows[0].count, 10)

  // Count unread
  const unreadSql = `SELECT COUNT(*) as count FROM notifications 
                     WHERE company_id = $1 AND user_id = $2 AND is_read = FALSE`
  const unreadResult = await query(unreadSql, [companyId, userId])
  const unread = parseInt(unreadResult.rows[0].count, 10)

  // Get paginated results
  const orderAndLimit = ` ORDER BY created_at DESC LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`
  params.push(pageSize, offset)

  const result = await query(sql + orderAndLimit, params)
  return { items: result.rows, total, unread }
}

export async function getNotification(
  companyId: string,
  notificationId: string
): Promise<Notification | null> {
  const result = await query(
    `SELECT * FROM notifications 
     WHERE id = $1 AND company_id = $2`,
    [notificationId, companyId]
  )

  return result.rows[0] || null
}

export async function markAsRead(
  companyId: string,
  notificationId: string
): Promise<Notification | null> {
  const now = new Date().toISOString()

  const result = await query(
    `UPDATE notifications 
    SET is_read = TRUE, read_at = $1
    WHERE id = $2 AND company_id = $3 AND is_read = FALSE
    RETURNING *`,
    [now, notificationId, companyId]
  )

  return result.rows[0] || null
}

export async function markAllAsRead(
  companyId: string,
  userId: string
): Promise<number> {
  const now = new Date().toISOString()

  const result = await query(
    `UPDATE notifications 
    SET is_read = TRUE, read_at = $1
    WHERE company_id = $2 AND user_id = $3 AND is_read = FALSE
    RETURNING id`,
    [now, companyId, userId]
  )

  return result.rows.length
}

export async function deleteNotification(
  companyId: string,
  notificationId: string
): Promise<boolean> {
  const result = await query(
    `DELETE FROM notifications 
    WHERE id = $1 AND company_id = $2
    RETURNING id`,
    [notificationId, companyId]
  )

  return result.rows.length > 0
}

export async function deleteOldNotifications(
  companyId: string,
  daysOld: number = 30
): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await query(
    `DELETE FROM notifications 
    WHERE company_id = $1 
      AND is_read = TRUE 
      AND created_at < $2
    RETURNING id`,
    [companyId, cutoffDate.toISOString()]
  )

  return result.rows.length
}

// Batch notification creation for multiple users
export async function createBulkNotifications(
  companyId: string,
  userIds: string[],
  data: Omit<NotificationInput, 'user_id'>
): Promise<Notification[]> {
  if (userIds.length === 0) return []

  const now = new Date().toISOString()
  const ids = userIds.map(() => uuidv4())

  const values = ids
    .map((id, idx) => [
      id,
      companyId,
      userIds[idx],
      data.title,
      data.message,
      data.type,
      data.action_item_id || null,
      data.project_id || null,
      data.team_id || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      false,
      now
    ])
    .flat()

  const placeholders = ids
    .map((_, idx) => {
      const offset = idx * 12 + 1
      return `($${offset},$${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},$${offset + 9},$${offset + 10},$${offset + 11})`
    })
    .join(',')

  const result = await query(
    `INSERT INTO notifications (
      id, company_id, user_id, title, message, type,
      action_item_id, project_id, team_id, metadata,
      is_read, created_at
    ) VALUES ${placeholders}
    RETURNING *`,
    values
  )

  return result.rows
}
