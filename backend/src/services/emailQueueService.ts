// backend/src/services/emailQueueService.ts
// Email queue management for asynchronous sending

import { query } from '../db/connection.js'
import { v4 as uuidv4 } from 'uuid'

export interface EmailQueueInput {
  recipient_email: string
  subject: string
  body: string
  template?: string
  template_data?: Record<string, any>
  related_entity_type?: 'action_item' | 'project' | 'team' | 'notification'
  related_entity_id?: string
}

export interface EmailQueueItem extends EmailQueueInput {
  id: string
  company_id: string
  status: 'pending' | 'sent' | 'failed' | 'retrying'
  attempts: number
  max_attempts: number
  next_retry_at?: string
  sent_at?: string
  failed_at?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export async function enqueueEmail(
  companyId: string,
  data: EmailQueueInput
): Promise<EmailQueueItem> {
  const id = uuidv4()
  const now = new Date().toISOString()

  const result = await query(
    `INSERT INTO notifications_queue (
      id, company_id, recipient_email, subject, body,
      template, template_data, related_entity_type, related_entity_id,
      status, attempts, max_attempts, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      id,
      companyId,
      data.recipient_email,
      data.subject,
      data.body,
      data.template || null,
      data.template_data ? JSON.stringify(data.template_data) : null,
      data.related_entity_type || null,
      data.related_entity_id || null,
      'pending',
      0,
      3,
      now,
      now
    ]
  )

  return result.rows[0]
}

export async function getPendingEmails(limit: number = 50): Promise<EmailQueueItem[]> {
  const now = new Date().toISOString()

  const result = await query(
    `SELECT * FROM notifications_queue 
    WHERE status IN ('pending', 'retrying') 
      AND (next_retry_at IS NULL OR next_retry_at < $1)
    ORDER BY created_at ASC
    LIMIT $2`,
    [now, limit]
  )

  return result.rows
}

export async function markEmailSent(
  emailId: string
): Promise<EmailQueueItem | null> {
  const now = new Date().toISOString()

  const result = await query(
    `UPDATE notifications_queue 
    SET status = 'sent', sent_at = $1, updated_at = $1, attempts = attempts + 1
    WHERE id = $2
    RETURNING *`,
    [now, emailId]
  )

  return result.rows[0] || null
}

export async function markEmailFailed(
  emailId: string,
  error: string
): Promise<EmailQueueItem | null> {
  const now = new Date().toISOString()

  // Get current attempt count
  const getResult = await query(
    `SELECT attempts, max_attempts FROM notifications_queue WHERE id = $1`,
    [emailId]
  )

  if (getResult.rows.length === 0) return null

  const { attempts, max_attempts } = getResult.rows[0]
  const newAttempts = attempts + 1
  const isFinal = newAttempts >= max_attempts

  if (isFinal) {
    const result = await query(
      `UPDATE notifications_queue 
      SET status = 'failed', failed_at = $1, updated_at = $1,
          error_message = $2, attempts = $3
      WHERE id = $4
      RETURNING *`,
      [now, error, newAttempts, emailId]
    )
    return result.rows[0] || null
  } else {
    // Retry with exponential backoff: 1min, 5min, 30min
    const backoffMs = [60000, 300000, 1800000][attempts] || 1800000
    const nextRetry = new Date(Date.now() + backoffMs).toISOString()

    const result = await query(
      `UPDATE notifications_queue 
      SET status = 'retrying', next_retry_at = $1, updated_at = $2,
          error_message = $3, attempts = $4
      WHERE id = $5
      RETURNING *`,
      [nextRetry, now, error, newAttempts, emailId]
    )
    return result.rows[0] || null
  }
}

export async function getEmailQueueStats(companyId: string) {
  const result = await query(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status = 'retrying') as retrying,
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
    FROM notifications_queue
    WHERE company_id = $1`,
    [companyId]
  )

  return result.rows[0]
}

export async function cleanupOldEmails(companyId: string, daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await query(
    `DELETE FROM notifications_queue 
    WHERE company_id = $1 
      AND status = 'sent' 
      AND created_at < $2
    RETURNING id`,
    [companyId, cutoffDate.toISOString()]
  )

  return result.rows.length
}
