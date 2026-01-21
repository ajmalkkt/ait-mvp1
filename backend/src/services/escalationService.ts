// backend/src/services/escalationService.ts
// Escalation rules and automation

import { query } from '../db/connection.js'
import { createBulkNotifications } from './notificationService.js'

export interface EscalationRule {
  condition: 'overdue' | 'due_soon' | 'status_change' | 'custom'
  threshold?: number // days overdue or until due
  action: 'notify_owner' | 'notify_project_manager' | 'notify_team' | 'escalate_priority'
  priority_escalation?: 'low' | 'medium' | 'high'
}

const DEFAULT_RULES: Record<string, EscalationRule> = {
  overdue_1_day: {
    condition: 'overdue',
    threshold: 1,
    action: 'notify_owner'
  },
  overdue_3_days: {
    condition: 'overdue',
    threshold: 3,
    action: 'notify_project_manager'
  },
  due_tomorrow: {
    condition: 'due_soon',
    threshold: 1,
    action: 'notify_owner'
  },
  due_3_days: {
    condition: 'due_soon',
    threshold: 3,
    action: 'notify_team'
  }
}

export async function getOverdueActionItems(companyId: string) {
  const today = new Date().toISOString().split('T')[0]

  const result = await query(
    `SELECT 
      ai.*,
      CAST(JULIANDAY(?) - JULIANDAY(ai.due_date) AS INTEGER) as days_overdue,
      u.email as owner_email,
      p.pm_id as pm_id,
      p.id as project_id
    FROM action_items ai
    LEFT JOIN users u ON ai.owner_id = u.id
    LEFT JOIN projects p ON ai.project_id = p.id
    WHERE ai.company_id = $1 
      AND ai.status != 'closed'
      AND ai.status != 'completed'
      AND ai.due_date < ?
      AND ai.archived_at IS NULL
    ORDER BY ai.due_date ASC`,
    [companyId, today, today]
  )

  return result.rows
}

export async function getDueActionItems(companyId: string, daysAhead: number = 7) {
  const today = new Date()
  const future = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  const todayStr = today.toISOString().split('T')[0]
  const futureStr = future.toISOString().split('T')[0]

  const result = await query(
    `SELECT 
      ai.*,
      CAST(JULIANDAY(ai.due_date) - JULIANDAY(?) AS INTEGER) as days_until_due,
      u.email as owner_email,
      p.pm_id as pm_id,
      p.id as project_id,
      (SELECT ARRAY_AGG(utm.user_id) FROM user_team_members utm 
       WHERE utm.team_id = ai.team_id) as team_member_ids
    FROM action_items ai
    LEFT JOIN users u ON ai.owner_id = u.id
    LEFT JOIN projects p ON ai.project_id = p.id
    WHERE ai.company_id = $1 
      AND ai.status NOT IN ('closed', 'completed')
      AND ai.due_date >= ? AND ai.due_date <= ?
      AND ai.archived_at IS NULL
    ORDER BY ai.due_date ASC`,
    [companyId, todayStr, todayStr, futureStr]
  )

  return result.rows
}

export async function escalateOverdueItems(companyId: string) {
  const overdueItems = await getOverdueActionItems(companyId)
  const escalationLog: { item_id: string; rule: string; action: string }[] = []

  for (const item of overdueItems) {
    // 1-day overdue: notify owner
    if (item.days_overdue >= 1 && item.owner_email) {
      await createBulkNotifications(companyId, [item.owner_id], {
        title: `Action Item Overdue: ${item.title}`,
        message: `Your action item "${item.title}" is ${item.days_overdue} day(s) overdue. Due date was ${item.due_date}.`,
        type: 'warning',
        action_item_id: item.id,
        metadata: { days_overdue: item.days_overdue }
      })
      escalationLog.push({ item_id: item.id, rule: 'overdue_1_day', action: 'notify_owner' })
    }

    // 3-days overdue: notify PM
    if (item.days_overdue >= 3 && item.pm_id) {
      await createBulkNotifications(companyId, [item.pm_id], {
        title: `Project Issue: Item "${item.title}" is Overdue`,
        message: `Action item "${item.title}" (owner: ${item.owner_email}) is ${item.days_overdue} day(s) overdue.`,
        type: 'error',
        action_item_id: item.id,
        project_id: item.project_id,
        metadata: { days_overdue: item.days_overdue, owner_email: item.owner_email }
      })
      escalationLog.push({ item_id: item.id, rule: 'overdue_3_days', action: 'notify_pm' })
    }

    // Mark as overdue in database if not already
    if (item.status !== 'overdue') {
      await query(
        `UPDATE action_items SET status = 'overdue' WHERE id = $1`,
        [item.id]
      )
    }
  }

  return escalationLog
}

export async function escalateDueItems(companyId: string) {
  const dueItems = await getDueActionItems(companyId, 7)
  const escalationLog: { item_id: string; rule: string; action: string }[] = []

  for (const item of dueItems) {
    // Due tomorrow: notify owner
    if (item.days_until_due === 1 && item.owner_id) {
      await createBulkNotifications(companyId, [item.owner_id], {
        title: `Action Item Due Tomorrow: ${item.title}`,
        message: `"${item.title}" is due tomorrow (${item.due_date})`,
        type: 'info',
        action_item_id: item.id,
        metadata: { days_until_due: item.days_until_due }
      })
      escalationLog.push({ item_id: item.id, rule: 'due_tomorrow', action: 'notify_owner' })
    }

    // Due in 3-7 days: notify team
    if (item.days_until_due >= 3 && item.days_until_due <= 7 && item.team_member_ids?.length) {
      await createBulkNotifications(companyId, item.team_member_ids, {
        title: `Upcoming: "${item.title}" due in ${item.days_until_due} days`,
        message: `Team action item "${item.title}" is due on ${item.due_date}`,
        type: 'info',
        action_item_id: item.id,
        metadata: { days_until_due: item.days_until_due }
      })
      escalationLog.push({ item_id: item.id, rule: 'due_3_days', action: 'notify_team' })
    }
  }

  return escalationLog
}

export async function runDailyEscalations(companyId: string) {
  const overdueLog = await escalateOverdueItems(companyId)
  const dueLog = await escalateDueItems(companyId)

  return {
    overdue_escalations: overdueLog.length,
    due_escalations: dueLog.length,
    total: overdueLog.length + dueLog.length,
    timestamp: new Date().toISOString()
  }
}
