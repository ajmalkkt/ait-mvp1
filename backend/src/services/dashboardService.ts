// backend/src/services/dashboardService.ts
// Dashboard aggregation and metrics queries

import { db } from '../db/connection'

export interface MyItemsDashboard {
  total_items: number
  items_by_status: {
    pending: number
    in_progress: number
    completed: number
  }
  overdue_items: number
  due_today: number
  completion_rate: number
  recent_items: Array<{
    id: string
    title: string
    status: string
    due_date: string | null
    priority: string
  }>
}

export interface TeamDashboard {
  team_id: string
  team_name: string
  total_items: number
  completion_rate: number
  items_by_status: {
    pending: number
    in_progress: number
    completed: number
  }
  active_members: number
  members: Array<{
    member_id: string
    name: string
    item_count: number
    completed_count: number
    completion_rate: number
  }>
  team_velocity: Array<{
    week_start: string
    completed_items: number
  }>
  overdue_items: number
  at_risk_items: number
}

export interface ProjectDashboard {
  project_id: string
  project_name: string
  total_items: number
  completion_rate: number
  items_by_status: {
    pending: number
    in_progress: number
    completed: number
  }
  items_by_priority: {
    critical: number
    high: number
    medium: number
    low: number
  }
  due_this_week: number
  due_this_month: number
  overdue_items: number
  at_risk_items: number
  timeline: Array<{
    date: string
    due_count: number
  }>
}

/**
 * Get user's assigned items dashboard
 * Shows quick overview of items assigned to current user
 */
export async function getMyItemsDashboard(
  userId: string,
  companyId: string
): Promise<MyItemsDashboard> {
  try {
    // Get counts by status
    const statusResult = await db.query(
      `SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM action_items
      WHERE assigned_to = $1 AND company_id = $2`,
      [userId, companyId]
    )

    const statusRow = statusResult.rows[0]
    const totalItems = parseInt(statusRow.total_items)
    const completedItems = parseInt(statusRow.completed)

    // Get overdue items count
    const overdueResult = await db.query(
      `SELECT COUNT(*) as overdue_count
      FROM action_items
      WHERE assigned_to = $1 
        AND company_id = $2 
        AND due_date < NOW() 
        AND status != 'completed'`,
      [userId, companyId]
    )

    // Get due today count
    const todayResult = await db.query(
      `SELECT COUNT(*) as today_count
      FROM action_items
      WHERE assigned_to = $1 
        AND company_id = $2 
        AND DATE(due_date) = DATE(NOW())`,
      [userId, companyId]
    )

    // Get recent items
    const recentResult = await db.query(
      `SELECT id, title, status, due_date, priority
      FROM action_items
      WHERE assigned_to = $1 AND company_id = $2
      ORDER BY updated_at DESC
      LIMIT 5`,
      [userId, companyId]
    )

    return {
      total_items: totalItems,
      items_by_status: {
        pending: parseInt(statusRow.pending),
        in_progress: parseInt(statusRow.in_progress),
        completed: completedItems,
      },
      overdue_items: parseInt(overdueResult.rows[0]?.overdue_count || 0),
      due_today: parseInt(todayResult.rows[0]?.today_count || 0),
      completion_rate: totalItems > 0 ? completedItems / totalItems : 0,
      recent_items: recentResult.rows,
    }
  } catch (error) {
    console.error('Error getting my-items dashboard:', error)
    throw error
  }
}

/**
 * Get team dashboard metrics
 * Shows team overview including member breakdown and velocity
 * Requires team lead or PM role
 */
export async function getTeamDashboard(
  teamId: string,
  companyId: string
): Promise<TeamDashboard> {
  try {
    // Get team info
    const teamResult = await db.query(
      `SELECT id, name FROM teams WHERE id = $1 AND company_id = $2`,
      [teamId, companyId]
    )

    if (teamResult.rows.length === 0) {
      throw new Error('Team not found')
    }

    const team = teamResult.rows[0]

    // Get item counts by status
    const statusResult = await db.query(
      `SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM action_items
      WHERE team_id = $1 AND company_id = $2`,
      [teamId, companyId]
    )

    const statusRow = statusResult.rows[0]
    const totalItems = parseInt(statusRow.total_items)
    const completedItems = parseInt(statusRow.completed)

    // Get member breakdown
    const membersResult = await db.query(
      `SELECT 
        u.id as member_id,
        u.name,
        COUNT(ai.id) as item_count,
        COUNT(CASE WHEN ai.status = 'completed' THEN 1 END) as completed_count
      FROM users u
      LEFT JOIN action_items ai ON u.id = ai.assigned_to AND ai.team_id = $1
      WHERE u.company_id = $2 
        AND u.id IN (SELECT user_id FROM team_members WHERE team_id = $1)
      GROUP BY u.id, u.name
      ORDER BY item_count DESC`,
      [teamId, companyId]
    )

    const members = membersResult.rows.map((row) => ({
      member_id: row.member_id,
      name: row.name,
      item_count: parseInt(row.item_count),
      completed_count: parseInt(row.completed_count),
      completion_rate:
        parseInt(row.item_count) > 0
          ? parseInt(row.completed_count) / parseInt(row.item_count)
          : 0,
    }))

    // Get team velocity (items completed per week)
    const velocityResult = await db.query(
      `SELECT 
        DATE_TRUNC('week', completed_at) as week_start,
        COUNT(*) as completed_items
      FROM action_items
      WHERE team_id = $1 AND company_id = $2 AND status = 'completed'
      GROUP BY DATE_TRUNC('week', completed_at)
      ORDER BY week_start DESC
      LIMIT 8`,
      [teamId, companyId]
    )

    // Get overdue and at-risk items
    const riskResult = await db.query(
      `SELECT 
        COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue,
        COUNT(CASE WHEN due_date <= NOW() + INTERVAL '3 days' AND status IN ('pending', 'in_progress') THEN 1 END) as at_risk
      FROM action_items
      WHERE team_id = $1 AND company_id = $2`,
      [teamId, companyId]
    )

    const riskRow = riskResult.rows[0]

    return {
      team_id: teamId,
      team_name: team.name,
      total_items: totalItems,
      completion_rate: totalItems > 0 ? completedItems / totalItems : 0,
      items_by_status: {
        pending: parseInt(statusRow.pending),
        in_progress: parseInt(statusRow.in_progress),
        completed: completedItems,
      },
      active_members: members.length,
      members,
      team_velocity: velocityResult.rows.map((row) => ({
        week_start: row.week_start,
        completed_items: parseInt(row.completed_items),
      })),
      overdue_items: parseInt(riskRow.overdue),
      at_risk_items: parseInt(riskRow.at_risk),
    }
  } catch (error) {
    console.error('Error getting team dashboard:', error)
    throw error
  }
}

/**
 * Get project dashboard metrics
 * Shows project overview including status and timeline
 * Requires PM role
 */
export async function getProjectDashboard(
  projectId: string,
  companyId: string
): Promise<ProjectDashboard> {
  try {
    // Get project info
    const projectResult = await db.query(
      `SELECT id, name FROM projects WHERE id = $1 AND company_id = $2`,
      [projectId, companyId]
    )

    if (projectResult.rows.length === 0) {
      throw new Error('Project not found')
    }

    const project = projectResult.rows[0]

    // Get item counts by status
    const statusResult = await db.query(
      `SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM action_items
      WHERE project_id = $1 AND company_id = $2`,
      [projectId, companyId]
    )

    const statusRow = statusResult.rows[0]
    const totalItems = parseInt(statusRow.total_items)
    const completedItems = parseInt(statusRow.completed)

    // Get item counts by priority
    const priorityResult = await db.query(
      `SELECT 
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low
      FROM action_items
      WHERE project_id = $1 AND company_id = $2`,
      [projectId, companyId]
    )

    const priorityRow = priorityResult.rows[0]

    // Get items due this week and month
    const timelineResult = await db.query(
      `SELECT 
        COUNT(CASE WHEN due_date >= NOW() AND due_date < NOW() + INTERVAL '7 days' THEN 1 END) as this_week,
        COUNT(CASE WHEN due_date >= NOW() AND due_date < NOW() + INTERVAL '30 days' THEN 1 END) as this_month
      FROM action_items
      WHERE project_id = $1 AND company_id = $2`,
      [projectId, companyId]
    )

    const timelineRow = timelineResult.rows[0]

    // Get overdue and at-risk items
    const riskResult = await db.query(
      `SELECT 
        COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue,
        COUNT(CASE WHEN due_date <= NOW() + INTERVAL '3 days' AND status IN ('pending', 'in_progress') THEN 1 END) as at_risk
      FROM action_items
      WHERE project_id = $1 AND company_id = $2`,
      [projectId, companyId]
    )

    const riskRow = riskResult.rows[0]

    // Get timeline data (items due by day)
    const dueDateResult = await db.query(
      `SELECT 
        DATE(due_date) as due_date,
        COUNT(*) as due_count
      FROM action_items
      WHERE project_id = $1 
        AND company_id = $2 
        AND due_date >= NOW()
        AND status != 'completed'
      GROUP BY DATE(due_date)
      ORDER BY due_date ASC
      LIMIT 30`,
      [projectId, companyId]
    )

    return {
      project_id: projectId,
      project_name: project.name,
      total_items: totalItems,
      completion_rate: totalItems > 0 ? completedItems / totalItems : 0,
      items_by_status: {
        pending: parseInt(statusRow.pending),
        in_progress: parseInt(statusRow.in_progress),
        completed: completedItems,
      },
      items_by_priority: {
        critical: parseInt(priorityRow.critical),
        high: parseInt(priorityRow.high),
        medium: parseInt(priorityRow.medium),
        low: parseInt(priorityRow.low),
      },
      due_this_week: parseInt(timelineRow.this_week),
      due_this_month: parseInt(timelineRow.this_month),
      overdue_items: parseInt(riskRow.overdue),
      at_risk_items: parseInt(riskRow.at_risk),
      timeline: dueDateResult.rows.map((row) => ({
        date: row.due_date,
        due_count: parseInt(row.due_count),
      })),
    }
  } catch (error) {
    console.error('Error getting project dashboard:', error)
    throw error
  }
}
