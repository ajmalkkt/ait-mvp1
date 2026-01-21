// backend/src/services/reportService.ts
// Report generation and analysis

import { db } from '../db/connection'

export interface CompletionReport {
  report_id: string
  company_id: string
  report_type: 'completion'
  generated_at: string
  period: { start: string; end: string }
  summary: {
    total_items: number
    completed_items: number
    closed_items: number
    completion_rate: number // percentage 0-100
    average_days_to_completion: number
  }
  by_status: Array<{
    status: string
    count: number
    percentage: number
  }>
  by_team: Array<{
    team_id: string
    team_name: string
    total: number
    completed: number
    completion_rate: number
  }>
  by_priority: Array<{
    priority: string
    total: number
    completed: number
  }>
}

export interface ProductivityReport {
  report_id: string
  company_id: string
  report_type: 'productivity'
  generated_at: string
  period: { start: string; end: string }
  summary: {
    total_items_created: number
    total_items_completed: number
    average_turnaround_time_days: number
  }
  members: Array<{
    member_id: string
    member_name: string
    items_created: number
    items_completed: number
    completion_rate: number
    average_days_to_completion: number
  }>
  top_performers: Array<{
    member_id: string
    member_name: string
    items_completed: number
    rank: number
  }>
}

export interface OverdueReport {
  report_id: string
  company_id: string
  report_type: 'overdue'
  generated_at: string
  period: { start: string; end: string }
  summary: {
    total_overdue: number
    critical_overdue: number
    high_overdue: number
    oldest_overdue_days: number
  }
  by_owner: Array<{
    owner_id: string
    owner_name: string
    overdue_count: number
    oldest_due_days: number
  }>
  by_priority: Array<{
    priority: string
    overdue_count: number
  }>
  by_team: Array<{
    team_id: string
    team_name: string
    overdue_count: number
  }>
  items: Array<{
    id: string
    title: string
    due_date: string
    days_overdue: number
    priority: string
    owner_name: string
  }>
}

/**
 * Generate completion report
 * Shows overall completion metrics across company
 */
export async function generateCompletionReport(
  companyId: string,
  filters: {
    start_date?: string
    end_date?: string
  }
): Promise<CompletionReport> {
  try {
    const startDate = filters.start_date || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = filters.end_date || new Date().toISOString().split('T')[0]
    const reportId = `report_${Date.now()}`

    // Get summary stats
    const summaryResult = await db.query(
      `SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN status IN ('completed', 'closed') THEN 1 END) as completed_items,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_items,
        EXTRACT(EPOCH FROM AVG(
          CASE WHEN status IN ('completed', 'closed') 
          THEN completed_at - created_at 
          END
        )) / 86400 as avg_days_to_completion
      FROM action_items
      WHERE company_id = $1 
        AND created_at >= $2::date 
        AND created_at <= $3::date + INTERVAL '1 day'`,
      [companyId, startDate, endDate]
    )

    const summaryRow = summaryResult.rows[0]
    const totalItems = parseInt(summaryRow.total_items)
    const completedItems = parseInt(summaryRow.completed_items)

    // Get by status breakdown
    const statusResult = await db.query(
      `SELECT 
        status,
        COUNT(*) as count
      FROM action_items
      WHERE company_id = $1 
        AND created_at >= $2::date 
        AND created_at <= $3::date + INTERVAL '1 day'
      GROUP BY status`,
      [companyId, startDate, endDate]
    )

    const byStatus = statusResult.rows.map((row) => ({
      status: row.status,
      count: parseInt(row.count),
      percentage: totalItems > 0 ? (parseInt(row.count) / totalItems) * 100 : 0,
    }))

    // Get by team breakdown
    const teamResult = await db.query(
      `SELECT 
        t.id as team_id,
        t.name as team_name,
        COUNT(ai.id) as total,
        COUNT(CASE WHEN ai.status IN ('completed', 'closed') THEN 1 END) as completed
      FROM teams t
      LEFT JOIN action_items ai ON t.id = ai.team_id AND ai.company_id = $1
        AND ai.created_at >= $2::date 
        AND ai.created_at <= $3::date + INTERVAL '1 day'
      WHERE t.company_id = $1
      GROUP BY t.id, t.name
      ORDER BY total DESC`,
      [companyId, startDate, endDate]
    )

    const byTeam = teamResult.rows.map((row) => {
      const total = parseInt(row.total)
      return {
        team_id: row.team_id,
        team_name: row.team_name,
        total,
        completed: parseInt(row.completed),
        completion_rate: total > 0 ? parseInt(row.completed) / total : 0,
      }
    })

    // Get by priority
    const priorityResult = await db.query(
      `SELECT 
        priority,
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('completed', 'closed') THEN 1 END) as completed
      FROM action_items
      WHERE company_id = $1 
        AND created_at >= $2::date 
        AND created_at <= $3::date + INTERVAL '1 day'
      GROUP BY priority`,
      [companyId, startDate, endDate]
    )

    const byPriority = priorityResult.rows.map((row) => ({
      priority: row.priority,
      total: parseInt(row.total),
      completed: parseInt(row.completed),
    }))

    return {
      report_id: reportId,
      company_id: companyId,
      report_type: 'completion',
      generated_at: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      summary: {
        total_items: totalItems,
        completed_items: completedItems,
        closed_items: parseInt(summaryRow.closed_items),
        completion_rate: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
        average_days_to_completion: parseFloat(summaryRow.avg_days_to_completion) || 0,
      },
      by_status: byStatus,
      by_team: byTeam,
      by_priority: byPriority,
    }
  } catch (error) {
    console.error('Error generating completion report:', error)
    throw error
  }
}

/**
 * Generate productivity report
 * Shows metrics by team member including items created and completed
 */
export async function generateProductivityReport(
  companyId: string,
  filters: {
    start_date?: string
    end_date?: string
    team_id?: string
  }
): Promise<ProductivityReport> {
  try {
    const startDate = filters.start_date || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = filters.end_date || new Date().toISOString().split('T')[0]
    const reportId = `report_${Date.now()}`

    // Get overall summary
    const summaryResult = await db.query(
      `SELECT 
        COUNT(*) as total_items_created,
        COUNT(CASE WHEN status IN ('completed', 'closed') THEN 1 END) as total_completed,
        EXTRACT(EPOCH FROM AVG(
          CASE WHEN status IN ('completed', 'closed') 
          THEN completed_at - created_at 
          END
        )) / 86400 as avg_days_to_completion
      FROM action_items
      WHERE company_id = $1 
        AND created_at >= $2::date 
        AND created_at <= $3::date + INTERVAL '1 day'`,
      [companyId, startDate, endDate]
    )

    const summaryRow = summaryResult.rows[0]

    // Get per-member breakdown
    const membersResult = await db.query(
      `SELECT 
        u.id as member_id,
        u.name as member_name,
        COUNT(ai.id) as items_created,
        COUNT(CASE WHEN ai.status IN ('completed', 'closed') THEN 1 END) as items_completed,
        EXTRACT(EPOCH FROM AVG(
          CASE WHEN ai.status IN ('completed', 'closed') 
          THEN ai.completed_at - ai.created_at 
          END
        )) / 86400 as avg_days_to_completion
      FROM users u
      LEFT JOIN action_items ai ON u.id = ai.created_by 
        AND ai.company_id = $1
        AND ai.created_at >= $2::date 
        AND ai.created_at <= $3::date + INTERVAL '1 day'
      WHERE u.company_id = $1
      GROUP BY u.id, u.name
      ORDER BY items_created DESC`,
      [companyId, startDate, endDate]
    )

    const members = membersResult.rows
      .filter((row) => parseInt(row.items_created) > 0)
      .map((row) => {
        const created = parseInt(row.items_created)
        const completed = parseInt(row.items_completed)
        return {
          member_id: row.member_id,
          member_name: row.member_name,
          items_created: created,
          items_completed: completed,
          completion_rate: created > 0 ? completed / created : 0,
          average_days_to_completion: parseFloat(row.avg_days_to_completion) || 0,
        }
      })

    // Get top performers
    const topPerformers = members
      .sort((a, b) => b.items_completed - a.items_completed)
      .slice(0, 5)
      .map((member, index) => ({
        member_id: member.member_id,
        member_name: member.member_name,
        items_completed: member.items_completed,
        rank: index + 1,
      }))

    return {
      report_id: reportId,
      company_id: companyId,
      report_type: 'productivity',
      generated_at: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      summary: {
        total_items_created: parseInt(summaryRow.total_items_created),
        total_items_completed: parseInt(summaryRow.total_completed),
        average_turnaround_time_days: parseFloat(summaryRow.avg_days_to_completion) || 0,
      },
      members,
      top_performers: topPerformers,
    }
  } catch (error) {
    console.error('Error generating productivity report:', error)
    throw error
  }
}

/**
 * Generate overdue report
 * Shows overdue items with risk analysis
 */
export async function generateOverdueReport(
  companyId: string,
  filters: {
    start_date?: string
    end_date?: string
  }
): Promise<OverdueReport> {
  try {
    const reportId = `report_${Date.now()}`

    // Get overall summary
    const summaryResult = await db.query(
      `SELECT 
        COUNT(*) as total_overdue,
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_overdue,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_overdue,
        EXTRACT(EPOCH FROM MAX(NOW() - due_date)) / 86400 as oldest_overdue_days
      FROM action_items
      WHERE company_id = $1 
        AND due_date < NOW() 
        AND status != 'completed'`,
      [companyId]
    )

    const summaryRow = summaryResult.rows[0]

    // Get by owner
    const ownerResult = await db.query(
      `SELECT 
        u.id as owner_id,
        u.name as owner_name,
        COUNT(ai.id) as overdue_count,
        EXTRACT(EPOCH FROM MAX(NOW() - ai.due_date)) / 86400 as oldest_due_days
      FROM users u
      LEFT JOIN action_items ai ON u.id = ai.assigned_to 
        AND ai.company_id = $1
        AND ai.due_date < NOW() 
        AND ai.status != 'completed'
      WHERE u.company_id = $1
      GROUP BY u.id, u.name
      HAVING COUNT(ai.id) > 0
      ORDER BY overdue_count DESC`,
      [companyId]
    )

    const byOwner = ownerResult.rows.map((row) => ({
      owner_id: row.owner_id,
      owner_name: row.owner_name,
      overdue_count: parseInt(row.overdue_count),
      oldest_due_days: Math.ceil(parseFloat(row.oldest_due_days) || 0),
    }))

    // Get by priority
    const priorityResult = await db.query(
      `SELECT 
        priority,
        COUNT(*) as overdue_count
      FROM action_items
      WHERE company_id = $1 
        AND due_date < NOW() 
        AND status != 'completed'
      GROUP BY priority`,
      [companyId]
    )

    const byPriority = priorityResult.rows.map((row) => ({
      priority: row.priority,
      overdue_count: parseInt(row.overdue_count),
    }))

    // Get by team
    const teamResult = await db.query(
      `SELECT 
        t.id as team_id,
        t.name as team_name,
        COUNT(ai.id) as overdue_count
      FROM teams t
      LEFT JOIN action_items ai ON t.id = ai.team_id 
        AND ai.company_id = $1
        AND ai.due_date < NOW() 
        AND ai.status != 'completed'
      WHERE t.company_id = $1
      GROUP BY t.id, t.name
      HAVING COUNT(ai.id) > 0
      ORDER BY overdue_count DESC`,
      [companyId]
    )

    const byTeam = teamResult.rows.map((row) => ({
      team_id: row.team_id,
      team_name: row.team_name,
      overdue_count: parseInt(row.overdue_count),
    }))

    // Get list of overdue items (most overdue first)
    const itemsResult = await db.query(
      `SELECT 
        ai.id,
        ai.title,
        ai.due_date,
        ai.priority,
        u.name as owner_name,
        EXTRACT(EPOCH FROM (NOW() - ai.due_date)) / 86400 as days_overdue
      FROM action_items ai
      LEFT JOIN users u ON ai.assigned_to = u.id
      WHERE ai.company_id = $1 
        AND ai.due_date < NOW() 
        AND ai.status != 'completed'
      ORDER BY days_overdue DESC
      LIMIT 100`,
      [companyId]
    )

    const items = itemsResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      due_date: row.due_date,
      days_overdue: Math.ceil(parseFloat(row.days_overdue) || 0),
      priority: row.priority,
      owner_name: row.owner_name || 'Unassigned',
    }))

    return {
      report_id: reportId,
      company_id: companyId,
      report_type: 'overdue',
      generated_at: new Date().toISOString(),
      period: { start: 'all', end: 'today' },
      summary: {
        total_overdue: parseInt(summaryRow.total_overdue),
        critical_overdue: parseInt(summaryRow.critical_overdue),
        high_overdue: parseInt(summaryRow.high_overdue),
        oldest_overdue_days: Math.ceil(parseFloat(summaryRow.oldest_overdue_days) || 0),
      },
      by_owner: byOwner,
      by_priority: byPriority,
      by_team: byTeam,
      items,
    }
  } catch (error) {
    console.error('Error generating overdue report:', error)
    throw error
  }
}
